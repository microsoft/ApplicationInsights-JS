// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { SeverityLevel } from './Contracts/Generated/SeverityLevel'

export interface ITraceTelemetry {
    /**
     * @description A message string
     * @type {string}
     * @memberof ITraceTelemetry
     */
    message: string;

    /**
     * @description Severity level of the logging message used for filtering in the portal
     * @type {SeverityLevel}
     * @memberof ITraceTelemetry
     */
    severityLevel?: SeverityLevel;

    /**
     * property bag to contain an extension to domain properties - extension to Part B
     */
    properties?: { [key: string]: any };
}
