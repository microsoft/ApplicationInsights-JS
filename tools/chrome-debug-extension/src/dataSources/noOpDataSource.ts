// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDataEvent } from "./IDataEvent";
import { IDataSource } from "./IDataSource";

export class NoOpDataSource implements IDataSource {
    private nextListenerId: number = 0;

    public startListening = (): void => {
    };

    public stopListening = (): void => {
    };

    public addListener = (callback: (newDataEvent: IDataEvent) => void): number => {
        return this.nextListenerId++;
    };

    public removeListener = (id: number): boolean => {
        return true;
    };
}
