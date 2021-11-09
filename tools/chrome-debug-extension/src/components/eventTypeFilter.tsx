// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import React from "react";
import { ICounts } from "../dataSources/dataHelpers";
import { DataEventType } from "../dataSources/IDataEvent";
import { EventTypeCounter } from "./eventTypeCounter";

interface IEventTypeFilterProps {
    currentEventTypeFilter: DataEventType | undefined;
    onEventTypeFilterChanged: (newEventTypeFilter: DataEventType | undefined) => void;
    counts: ICounts;
}

export const EventTypeFilter = (props: IEventTypeFilterProps): React.ReactElement<IEventTypeFilterProps> => {
    const appLogic: DataEventType = "appLogic";
    const performance: DataEventType = "performance";
    const warning: DataEventType = "warning";
    const fatalError: DataEventType = "fatalError";

    function selectionChanged(event: React.ChangeEvent<HTMLInputElement>): void {
        // We know it's a valid value, so we can use 'as'
        const dataEventType = event.target.value ? (event.target.value as DataEventType) : undefined;
        props.onEventTypeFilterChanged(dataEventType);
    }

    return (
        <div className='eventTypeFilterContainer'>
            <div className='eventTypeFilterInputContainer'>
                <input
                    type='radio'
                    name='eventTypeFilter'
                    className='eventTypeFilterInput'
                    title='All'
                    value={undefined}
                    checked={props.currentEventTypeFilter === undefined}
                    onChange={selectionChanged}
                />
                <EventTypeCounter eventType={undefined} count={props.counts.all} />
            </div>
            <div className='eventTypeFilterInputContainer'>
                <input
                    name='eventTypeFilter'
                    type='radio'
                    className='eventTypeFilterInput'
                    title='Just app logic'
                    value={appLogic}
                    checked={props.currentEventTypeFilter === appLogic}
                    onChange={selectionChanged}
                />
                <EventTypeCounter eventType={appLogic} count={props.counts.appLogic} />
            </div>
            <div className='eventTypeFilterInputContainer'>
                <input
                    name='eventTypeFilter'
                    type='radio'
                    className='eventTypeFilterInput'
                    title='Just performance'
                    value={performance}
                    checked={props.currentEventTypeFilter === performance}
                    onChange={selectionChanged}
                />
                <EventTypeCounter eventType={performance} count={props.counts.performance} />
            </div>
            <div className='eventTypeFilterInputContainer'>
                <input
                    name='eventTypeFilter'
                    type='radio'
                    className='eventTypeFilterInput'
                    title='Just warnings'
                    checked={props.currentEventTypeFilter === warning}
                    value={warning}
                    onChange={selectionChanged}
                />
                <EventTypeCounter eventType={warning} count={props.counts.warning} />
            </div>
            <div className='eventTypeFilterInputContainer'>
                <input
                    name='eventTypeFilter'
                    type='radio'
                    className='eventTypeFilterInput'
                    title='Just fatal errors'
                    checked={props.currentEventTypeFilter === fatalError}
                    value={fatalError}
                    onChange={selectionChanged}
                />
                <EventTypeCounter eventType={fatalError} count={props.counts.fatalError} />
            </div>
        </div>
    );
};
