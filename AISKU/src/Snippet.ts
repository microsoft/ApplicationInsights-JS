// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { IConfig, IConfiguration } from "@microsoft/otel-core-js";

/**
 *
 * @export
 * @interface Snippet
 */
export interface Snippet {
    config: IConfiguration & IConfig;
    queue?: Array<() => void>;
    sv?: string;
    version?: number;
}
