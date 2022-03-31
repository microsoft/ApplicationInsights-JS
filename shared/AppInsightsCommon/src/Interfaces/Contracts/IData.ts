// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IBase } from "./IBase";

/**
 * Data struct to contain both B and C sections.
 */
export interface IData<TDomain> extends IBase {
    /**
     * Name of item (B section) if any. If telemetry data is derived straight from this, this should be null.
     */
    baseType: string;

    /**
     * Container for data item (B section).
     */
    baseData: TDomain;
}