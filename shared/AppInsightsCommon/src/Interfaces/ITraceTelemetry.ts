// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { SeverityLevel } from "./Contracts/SeverityLevel";
import { IPartC } from "./IPartC";

export interface ITraceTelemetry extends IPartC {
    /**
     * @description A message string
     */
    message: string;

    /**
     * @description Severity level of the logging message used for filtering in the portal
     */
    severityLevel?: SeverityLevel;

    /**
     * @description custom defiend iKey
     */
    iKey?: string;
}
