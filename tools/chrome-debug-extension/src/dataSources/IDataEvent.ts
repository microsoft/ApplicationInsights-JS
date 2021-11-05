// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

export type DataEventType = "other" | "appLogic" | "warning" | "fatalError" | "performance";

export interface IDataEvent {
    name: string;
    time: string;
    // tslint:disable-next-line:no-any
    data: any;
    type?: DataEventType;
    dynamicValue?: string;
    condensedDetails?: string;
    sessionNumber?: string;
}
