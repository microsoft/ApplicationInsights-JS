// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import { DataEventType } from "../dataSources/IDataEvent";

export interface IFilterSettings {
    filterText: string;
    filterByType: DataEventType | undefined;
    showCondensedDetails: boolean;
}
