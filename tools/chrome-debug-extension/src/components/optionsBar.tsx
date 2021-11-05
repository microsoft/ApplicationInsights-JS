// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import React from "react";
import { ICounts } from "../dataSources/dataHelpers";
import { DataEventType } from "../dataSources/IDataEvent";
import { EventTypeFilter } from "./eventTypeFilter";
import { IFilterSettings } from "./IFilterSettings";

interface IOptionsBarProps {
    filterSettings: IFilterSettings;
    onFilterSettingsChanged: (newFilterSettings: IFilterSettings) => void;
    counts: ICounts;
    onClear: () => void;
    onSave: () => void;
    onShowConfigurationSelection: () => void;
}

export const OptionsBar = (props: IOptionsBarProps): React.ReactElement<IOptionsBarProps> => {
    function handleFilterTextOnChange(e: React.ChangeEvent<HTMLInputElement>): void {
        const newConfiguration = {
            ...props.filterSettings,
            filterText: e.currentTarget.value
        };
        props.onFilterSettingsChanged(newConfiguration);
    }

    function onFilterChanged(newEventTypeFilter: DataEventType | undefined): void {
        const newConfiguration = {
            ...props.filterSettings,
            filterByType: newEventTypeFilter
        };
        props.onFilterSettingsChanged(newConfiguration);
    }

    function onShowCondensedDetailsChanged(): void {
        const newFilterSettings = {
            ...props.filterSettings,
            showCondensedDetails: !props.filterSettings.showCondensedDetails
        };
        props.onFilterSettingsChanged(newFilterSettings);
    }

    return (
        <div className='optionsBarDiv'>
            <input
                type='search'
                className='inputBox'
                placeholder='Filter...'
                value={props.filterSettings.filterText}
                onChange={handleFilterTextOnChange}
            />
            <EventTypeFilter
                currentEventTypeFilter={props.filterSettings.filterByType}
                onEventTypeFilterChanged={onFilterChanged}
                counts={props.counts}
            />
            <input
                type='checkbox'
                id='condenseDetailsButton'
                checked={props.filterSettings.showCondensedDetails}
                className='condenseDetailsButton verticallyCenteredFlexItem'
                onChange={onShowCondensedDetailsChanged}
            />
            <label htmlFor='condenseDetailsButton' className='checkBoxLabel verticallyCenteredFlexItem'>
                Condense details
            </label>
            <button onClick={props.onSave} title='Save' className='saveButton'>
                <img src='../images/save.png' alt='Save' className='verticallyCenteredFlexItem' />
            </button>
            <button onClick={props.onClear} title='Clear all' className='clearButton'>
                <img src='../images/clear.png' alt='Clear all' className='verticallyCenteredFlexItem' />
            </button>
            <button
                onClick={props.onShowConfigurationSelection}
                title='Configuration'
                className='showConfigurationSelectionButton'
            >
                <img src='../images/settings.png' alt='Settings' className='verticallyCenteredFlexItem' />
            </button>
        </div>
    );
};
