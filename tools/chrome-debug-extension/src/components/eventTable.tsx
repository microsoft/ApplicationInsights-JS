// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import React from "react";
import { DynamicValueConverter, IColumn, IConfiguration } from "../configuration/IConfiguration";
import { applyConverter, getDynamicFieldValue } from "../dataSources/dataHelpers";
import { IDataEvent } from "../dataSources/IDataEvent";
import { EventTypeIcon } from "./eventTypeIcon";

interface IEventTableProps {
    dataEvents: IDataEvent[];
    configuration: IConfiguration;
    selectedIndex: number | undefined;
    onRowClickHandler: (target: EventTarget & HTMLTableRowElement) => void;
}

export const EventTable = (props: IEventTableProps): React.ReactElement<IEventTableProps> => {
    // Not state because we want these to be per-render
    const deltaColumnsPreviousValues = new Map<number, number | undefined>();
    let lastSessionNumber: string | undefined = undefined;

    const onKeyPress = (event: React.KeyboardEvent<HTMLTableRowElement>): void => {
        if (event.key === "Enter") {
            props.onRowClickHandler(event.currentTarget);
        }
    }

    const getCellForDeltaColumn = (
        rowIndex: number,
        columnIndex: number,
        currentValue: number | undefined,
        converter: DynamicValueConverter,
        className: string
    ): JSX.Element => {
        const previousValue = deltaColumnsPreviousValues.get(columnIndex);
        let numberToDisplay: number | undefined = undefined;

        if (previousValue && currentValue) {
            numberToDisplay = currentValue - previousValue;
        }
        deltaColumnsPreviousValues.set(columnIndex, currentValue);

        return (
            <td key={`Row_${rowIndex}_Td_${columnIndex}`} className={className}>
                {applyConverter(numberToDisplay ? numberToDisplay.toString() : undefined, converter)}
            </td>
        );
    };

    return (
        <div className='eventTableDiv'>
            <table className='eventTable'>
                <thead>
                    <tr key='Header_Row'>
                        <th key='Header_-1'>&nbsp;</th>
                        {
                            // Render the column headers based on the configuration
                            props.configuration.columnsToDisplay.map((columnToDisplay: IColumn, index: number) => {
                                return <th key={`Header_${index}`}>{columnToDisplay.header}</th>;
                            })
                        }
                    </tr>
                </thead>
                <tbody>
                    {props.dataEvents.map((dataEvent: IDataEvent, rowIndex: number) => {
                        const isNewSession =
                            lastSessionNumber !== undefined && dataEvent.sessionNumber !== lastSessionNumber;
                        const tdClassName = isNewSession ? "newSessionRow" : "";

                        // Don't remember any column previous values between sessions
                        if (isNewSession) {
                            deltaColumnsPreviousValues.clear();
                        }

                        // Build up the row's cells based on the configuration
                        const cells = new Array<JSX.Element>();
                        props.configuration.columnsToDisplay.map((columnToDisplay: IColumn, columnIndex: number) => {
                            switch (columnToDisplay.type) {
                                case "SessionNumber":
                                    {
                                        cells.push(<td key={`Row_${rowIndex}_Td_${columnIndex}`} className={tdClassName}>{dataEvent.sessionNumber}</td>);
                                    }
                                    break;
                                case "NumberDelta":
                                    {
                                        const currentStringValue = getDynamicFieldValue(
                                            dataEvent,
                                            columnToDisplay.prioritizedFieldNames
                                        );
                                        const currentValue = currentStringValue
                                            ? Number.parseInt(currentStringValue, 10)
                                            : undefined;

                                        cells.push(getCellForDeltaColumn(rowIndex, columnIndex, currentValue, "TruncateWithDigitGrouping", tdClassName));
                                    }
                                    break;
                                case "TimeDelta":
                                    {
                                        const currentStringValue = getDynamicFieldValue(
                                            dataEvent,
                                            columnToDisplay.prioritizedFieldNames);
                                        const currentValue = currentStringValue ? Date.parse(currentStringValue) : undefined;

                                        cells.push(getCellForDeltaColumn(rowIndex, columnIndex, currentValue, "NumberToWholeMilliseconds", tdClassName));
                                    }
                                    break;
                                case "NormalData":
                                default: {
                                    cells.push(
                                        <td key={`Row_${rowIndex}_Td_${columnIndex}`} className={tdClassName}>
                                            {getDynamicFieldValue(dataEvent, columnToDisplay.prioritizedFieldNames)}
                                        </td>
                                    );
                                }
                            }
                        });

                        // Determine the CSS classname to use for the row
                        const rowClassName = rowIndex === props.selectedIndex ? "selected" : "";
                        lastSessionNumber = dataEvent.sessionNumber;

                        // Render the row
                        return (
                            <tr
                                key={`Row_${rowIndex}`}
                                item-data={rowIndex}
                                className={rowClassName}
                                onClick={(event: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => props.onRowClickHandler(event.currentTarget)}
                                onKeyPress={onKeyPress}
                                tabIndex={0}
                            >
                                <td key={`Row_${rowIndex}_Td_-1`} className={tdClassName}>
                                    <EventTypeIcon eventType={dataEvent.type} suppress={["appLogic"]} />
                                </td>
                                {cells}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
