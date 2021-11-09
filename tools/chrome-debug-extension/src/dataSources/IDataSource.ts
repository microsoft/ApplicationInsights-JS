// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDataEvent } from "./IDataEvent";

export type DataSourceType = "Network" | "DiagnosticInjection" | "OneDSDataSource";

export interface IDataSource {
    addListener: (callback: (newDataEvent: IDataEvent) => void) => number;
    removeListener: (id: number) => boolean;

    startListening(): void;
    stopListening(): void;
}
