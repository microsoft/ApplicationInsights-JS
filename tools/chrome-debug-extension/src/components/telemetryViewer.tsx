// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as React from "react";
import { IConfiguration } from "../configuration/IConfiguration";
import { getCondensedDetails } from "../dataSources/dataHelpers";
import { IDataEvent } from "../dataSources/IDataEvent";
import { Session } from "../session";
import { EventDetails } from "./eventDetails";
import { EventTable } from "./eventTable";
import { IFilterSettings } from "./IFilterSettings";
import { OptionsBar } from "./optionsBar";
import { SplitPanel } from "./splitPanel";
import { doAwait } from "@nevware21/ts-async";

interface ITelemetryViewerProps {
    session: Session;
    onShowConfigurationSelection: () => void;
}

const filterSettingsCacheKey = "filterSettingsCacheKey";

function getDefaultFilterSettings(configuration: IConfiguration): IFilterSettings {
    return {
        filterText: "",
        filterContent: true,
        filterByType: undefined,
        showCondensedDetails: false,
        listenNetwork: configuration.defaultNetworkCaptureValue !== undefined ? configuration.defaultNetworkCaptureValue : true,
        listenSdk: configuration.defaultSDKCaptureValue !== undefined ? configuration.defaultSDKCaptureValue : true
    };
}

export const TelemetryViewer = (props: ITelemetryViewerProps): React.ReactElement<ITelemetryViewerProps> => {
    const [filteredEventData, setFilteredEventData] = React.useState<IDataEvent[]>([]);
    const [filterSettings, setFilterSettings] = React.useState<IFilterSettings>(getDefaultFilterSettings(props.session.configuration));
    const [selectedIndex, setSelectedIndex] = React.useState<number | undefined>(undefined);
    const [isDraggingOver, setIsDraggingOver] = React.useState<boolean>(false);

    const handleNewFilterSettings = (newFilterSettings: IFilterSettings): void => {
        try {
            chrome.storage.local.set({ [filterSettingsCacheKey]: JSON.stringify(newFilterSettings) });
        } catch {
            // Default is OK
        }

        setFilterSettings(newFilterSettings);
    };

    const handleOnRowClickFromEventTable = (target: EventTarget & HTMLTableRowElement): void => {
        const itemData = target.getAttribute("item-data");
        const newSelectedIndex: number | undefined = itemData ? parseInt(itemData, 10) : undefined;

        setSelectedIndex(newSelectedIndex);
    };

    const handleClear = (): void => {
        // tslint:disable-next-line:no-any
        props.session.clear();
        setSelectedIndex(undefined);
    };

    const handleSave = (): void => {
        props.session.save();
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
        // Prevent default behavior (Prevent file from being opened)
        event.preventDefault();

        setIsDraggingOver(false);

        if (event.dataTransfer.items) {
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < event.dataTransfer.items.length; i++) {
                if (event.dataTransfer.items[i].kind === "file") {
                    const file = event.dataTransfer.items[i].getAsFile();
                    if (file && file.type === "application/json") {
                        handleImport(file);
                        return;
                    }
                }
            }
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
        setIsDraggingOver(true);
        event.preventDefault();
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>): void => {
        setIsDraggingOver(false);
    };

    const handleImport = (file: File): Promise<void> => {
        return file.text().then((stringData: string) => {
            if (props.session.load(stringData)) {
                setSelectedIndex(undefined);
            }
        });
    };

    const onFilteredDataChanged = (filterSettings: IFilterSettings): void => {
        setFilteredEventData(props.session.filteredData);
        if (filterSettings.filterText && props.session.filteredData.length > 0) {
            // Reselect the first element
            setSelectedIndex(0);
        }
    };

    React.useEffect(() => {
        try {
            doAwait(chrome.storage.local.get([filterSettingsCacheKey]), (json: any) => {
                if (json && json[filterSettingsCacheKey]) {
                    // Make sure we have any defaults set
                    let settings: IFilterSettings = {
                        ...getDefaultFilterSettings(props.session.configuration),
                        ...(JSON.parse(json[filterSettingsCacheKey]))
                    };
    
                    setFilterSettings(settings);
                } else {
                    // Default is OK
                    setFilterSettings(getDefaultFilterSettings(props.session.configuration));
                }
            });
        } catch {
            // Default is OK
        }

        props.session.onFilteredDataChanged = onFilteredDataChanged;
        onFilteredDataChanged(filterSettings);

        return () => {
            props.session.onFilteredDataChanged = undefined;
        };
    }, []);

    React.useEffect(() => {
        props.session.filterSettings = filterSettings;
    }, [filterSettings]);

    const detailsData =
        selectedIndex !== undefined && filteredEventData !== undefined && selectedIndex < filteredEventData.length
            ? filterSettings.showCondensedDetails
                ? getCondensedDetails(filteredEventData[selectedIndex], props.session.configuration)
                : filteredEventData[selectedIndex].data                 // The raw event data
            : undefined;

    return (
        <div className='rootDiv'>
            <div className='headerDiv'>
                <OptionsBar
                    filterSettings={filterSettings}
                    onFilterSettingsChanged={handleNewFilterSettings}
                    counts={props.session.counts}
                    onClear={handleClear}
                    onSave={handleSave}
                    onShowConfigurationSelection={props.onShowConfigurationSelection}
                />
            </div>
            <div
                className='contentDiv'
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <SplitPanel
                    top={
                        <EventTable
                            configuration={props.session.configuration}
                            filterSettings={filterSettings}
                            dataEvents={filteredEventData}
                            selectedIndex={selectedIndex}
                            onRowClickHandler={handleOnRowClickFromEventTable}
                        />
                    }
                    bottom={<EventDetails data={detailsData} filterSettings={filterSettings} />}
                />
                {isDraggingOver ? (
                    <div className='dragTarget'>
                        <div className='dragTargetText'>Drop telemetry recordings here</div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};
