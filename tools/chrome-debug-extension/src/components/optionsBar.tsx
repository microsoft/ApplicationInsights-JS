// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
        const newFilterSettings: IFilterSettings = {
            ...props.filterSettings,
            showCondensedDetails: !props.filterSettings.showCondensedDetails
        };
        props.onFilterSettingsChanged(newFilterSettings);
    }

    function onListenNetworkChanged(): void {
        const newFilterSettings: IFilterSettings = {
            ...props.filterSettings,
            listenNetwork: !props.filterSettings.listenNetwork
        };
        props.onFilterSettingsChanged(newFilterSettings);
    }

    function onListenSdkChanged(): void {
        const newFilterSettings: IFilterSettings = {
            ...props.filterSettings,
            listenSdk: !props.filterSettings.listenSdk
        };
        props.onFilterSettingsChanged(newFilterSettings);
    }

    function onFilterContentChanged(): void {
        const newFilterSettings: IFilterSettings = {
            ...props.filterSettings,
            filterContent: !props.filterSettings.filterContent
        };
        props.onFilterSettingsChanged(newFilterSettings);
    }

    return (
        <div className='optionsBarDiv'>
            <span className='verticallyCenteredFlexItem'>
                <input
                    type='search'
                    className='inputBox'
                    placeholder='Filter...'
                    value={props.filterSettings.filterText}
                    onChange={handleFilterTextOnChange}
                />
            </span>
            <span className='verticallyCenteredFlexItem' title="Include Content when filtering">
                <input
                    type='checkbox'
                    id='filterContentButton'
                    checked={props.filterSettings.filterContent}
                    className='filterContentButton'
                    onChange={onFilterContentChanged}
                    aria-label="Include Content when filtering"
                />
                <label htmlFor='filterContentButton' className='checkBoxLabel'>
                    Content
                </label>
            </span>
            <span>
                <EventTypeFilter
                    currentEventTypeFilter={props.filterSettings.filterByType}
                    onEventTypeFilterChanged={onFilterChanged}
                    counts={props.counts}
                />
            </span>
            <span className='verticallyCenteredFlexItem' title="Exclude common fields in the details pane">
                <input
                    type='checkbox'
                    id='condenseDetailsButton'
                    checked={props.filterSettings.showCondensedDetails}
                    className='condenseDetailsButton'
                    onChange={onShowCondensedDetailsChanged}
                />
                <label htmlFor='condenseDetailsButton' className='checkBoxLabel'>
                    Condense details
                </label>
            </span>
            <span className='verticallyCenteredFlexItem captureTypes'>
                <span className='verticallyCenteredFlexItem' aria-label="Capture network requests" title="Capture network requests">
                    <input
                        type='checkbox'
                        id='listenNetworkButton'
                        checked={props.filterSettings.listenNetwork}
                        className='listenNetworkButton'
                        onChange={onListenNetworkChanged}
                    />
                    <label htmlFor='listenNetworkButton' className='checkBoxLabel' aria-hidden="true">
                        Network
                    </label>
                </span>
                <span className='verticallyCenteredFlexItem' aria-label="Capture SDK Events" title="Capture SDK Events">
                    <input
                        type='checkbox'
                        id='listenSdkButton'
                        checked={props.filterSettings.listenSdk}
                        className='listenSdkButton'
                        onChange={onListenSdkChanged}
                    />
                    <label htmlFor='listenSdkButton' className='checkBoxLabel' aria-hidden="true">
                        SDK
                    </label>
                </span>
            </span>
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
