// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import React from "react";
import { DataEventType } from "../dataSources/IDataEvent";

interface IEventTypeIconProps {
    eventType: DataEventType | undefined;
    suppress?: DataEventType[];
}

export const EventTypeIcon = (props: IEventTypeIconProps): React.ReactElement<IEventTypeIconProps> => {
    if (props.eventType && props.suppress && props.suppress.indexOf(props.eventType) > -1) {
        return <div />;
    }
    switch (props.eventType) {
    case undefined:
        return <img src='../images/all.png' alt='All events' className='typeIcon' />;
    case "appLogic":
        return <img src='../images/appLogic.png' alt='App logic events' className='typeIcon' />;
    case "warning":
        return <img src='../images/warning.png' alt='Warning events' className='typeIcon' />;
    case "fatalError":
        return <img src='../images/error.png' alt='Error events' className='typeIcon' />;
    case "performance":
        return <img src='../images/performance.png' alt='Performance events' className='typeIcon' />;
    default:
        return <div />;
    }
};
