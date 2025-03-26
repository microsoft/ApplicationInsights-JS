// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDomain } from "./IDomain";
import { IExceptionDetails } from "./IExceptionDetails";
import { SeverityLevel } from "./SeverityLevel";

/**
 * An instance of Exception represents a handled or unhandled exception that occurred during execution of the monitored application.
 */
export interface IExceptionData extends IDomain {

    /**
     * Schema version
     */
    ver: number; /* 2 */

    /**
     * Exception chain - list of inner exceptions.
     */
    exceptions: IExceptionDetails[]; /* [] */

    /**
     * Severity level. Mostly used to indicate exception severity level when it is reported by logging library.
     */
    severityLevel: SeverityLevel;

    /**
     * Collection of custom properties.
     */
    properties: any; /* {} */

    /**
     * Collection of custom measurements.
     */
    measurements: any; /* {} */
}
