// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export type DataEventType = "other" | "appLogic" | "warning" | "fatalError" | "performance";

/**
 * Basic Event abstraction used to display the details in the table
 */
export interface IDataEvent {
    /**
     * The raw data of the event, this is displayed in the details section of the extension
     */
    data: any;

    name: string;
    time: string;

    tabId?: number;
    type?: DataEventType;
    dynamicValue?: string;
    condensedDetails?: string;
    sessionNumber?: string;
}
