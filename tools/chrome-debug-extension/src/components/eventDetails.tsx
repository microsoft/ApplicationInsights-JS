// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import React from "react";
import { LogEntry } from "../LogEntry";
import { IFilterSettings } from "./IFilterSettings";

interface IEventDetailsProps {
    // tslint:disable-next-line:no-any
    data: any;
    filterSettings: IFilterSettings
}

export const EventDetails = (props: IEventDetailsProps): React.ReactElement<IEventDetailsProps> => {
    let logEntry = new LogEntry(props.data || {}, 0, "", 0);
    let element = logEntry.render(props.filterSettings.filterText, [], true);
    console.log(logEntry);
    console.log(element);

    // <pre>{JSON.stringify(props.data, undefined, 2)}</pre>
    return (
        <div className='eventDetailsDiv dbg-lgr'>
            <div dangerouslySetInnerHTML={{ __html: element.outerHTML }}></div>
        </div>
    );
};
