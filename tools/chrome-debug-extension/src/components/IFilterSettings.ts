// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { DataEventType } from "../dataSources/IDataEvent";

export interface IFilterSettings {
    filterContent: boolean;
    filterText: string;
    filterByType: DataEventType | undefined;
    showCondensedDetails: boolean;
    listenNetwork: boolean;
    listenSdk: boolean;
}
