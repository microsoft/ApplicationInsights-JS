// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { INotificationListener } from "./INotificationListener";

export interface IDbgExtension {
    isEnabled: () => boolean;
    enable: () => void;
    disable: () => void;
    listener: INotificationListener,
    sendEvt?: (name: string, data: any) => void;
    debugMsg?: (name: string, data: any) => void;
    diagLog?: (name: string, data: any) => void;
}