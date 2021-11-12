// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import React, { useEffect, useRef } from "react";
import { LogEntry } from "../LogEntry";
import { IFilterSettings } from "./IFilterSettings";

interface IEventDetailsProps {
    // tslint:disable-next-line:no-any
    data: any;
    filterSettings: IFilterSettings
}

export const EventDetails = (props: IEventDetailsProps): React.ReactElement<IEventDetailsProps> => {
    const targetRef = useRef<any>();

    useEffect(() => {
        let logEntry = new LogEntry(props.data || {}, 0, "", 0);
        let element = logEntry.render(props.filterSettings.filterText, [], true);

        // Remove any children
        if (targetRef.current) {
            while (targetRef.current.firstChild) {
                targetRef.current.removeChild(targetRef.current.firstChild);
            }
    
            targetRef.current.appendChild(element);
        }
    }, [props]);

    return (
        <div className='eventDetailsDiv dbg-lgr' ref={targetRef}>
        </div>
    );
};
