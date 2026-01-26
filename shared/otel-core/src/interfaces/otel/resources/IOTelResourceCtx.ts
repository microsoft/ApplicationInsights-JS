// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelConfig } from "../config/IOTelConfig";
import { OTelRawResourceAttribute } from "./IOTelResource";

export interface IOTelResourceCtx {
    cfg: IOTelConfig;
    
    /**
     * @returns the Resource's attributes.
     */
    attribs: OTelRawResourceAttribute[];
}
