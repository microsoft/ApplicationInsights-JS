// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import React from "react";
import { DataEventType } from "../dataSources/IDataEvent";
import { EventTypeIcon } from "./eventTypeIcon";

interface IEventTypeCounterProps {
    eventType: DataEventType | undefined;
    count: number;
}

export const EventTypeCounter = (
    props: IEventTypeCounterProps
): React.ReactElement<IEventTypeCounterProps> => {
    return (
        <div className='eventTypeCounterDiv verticallyCenteredFlexItem'>
            <div>
                <EventTypeIcon eventType={props.eventType} />
            </div>
            <div className='eventTypeCounterCountDiv'>{props.count}</div>
        </div>
    );
};
