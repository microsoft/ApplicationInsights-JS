// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IMessage } from "../interfaces/IMessage";

export type DataSourceType = "Default";

export interface IDataSource {
    addListener: (callback: (newMessage: IMessage) => void) => number;
    removeListener: (id: number) => boolean;

    startListening: () => void;
    stopListening: () => void;
}
