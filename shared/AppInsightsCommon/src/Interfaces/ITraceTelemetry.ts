// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { SeverityLevel } from './Contracts/Generated/SeverityLevel'
import { IPartC } from './IPartC';

export interface ITraceTelemetry extends IPartC {
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
}
