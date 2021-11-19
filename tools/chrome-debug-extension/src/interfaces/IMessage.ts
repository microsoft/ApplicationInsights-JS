// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDataEvent } from "../dataSources/IDataEvent";
import { MessageSource, MessageType } from "../Enums";

export interface IMessage {
    id: MessageType,
    src: MessageSource;
    tabId?: number,
    details: IDataEvent
}