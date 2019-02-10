// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { SeverityLevel } from './Contracts/Generated/SeverityLevel'

/**
 * @export
 * @interface IExceptionTelemetry
 * @description Exception interface used as primary parameter to trackException
 */
export interface IExceptionTelemetry {
    /**
     * @type {Error}
     * @memberof IExceptionTelemetry
     * @description Error Object(s)
     */
    error: Error;

    /**
     * @description Specified severity of exception for use with
     * telemetry filtering in dashboard
     * @type {(SeverityLevel | number)}
     * @memberof IExceptionTelemetry
     */
    severityLevel?: SeverityLevel | number;

    /**
     * Collection of custom properties
     * @type {{ [key: string]: string}}
     * @memberof IExceptionTelemetry
     */
    properties?: { [key: string]: string};

    /**
     * Collection of custom measurements
     * @type {{ [key: string]: number}}
     * @memberof IExceptionTelemetry
     */
    measurements?: { [key: string]: number};
}

/**
 * @description window.onerror function parameters
 * @export
 * @interface IAutoExceptionTelemetry
 */
export interface IAutoExceptionTelemetry {
    /**
     * @description error message. Available as event in HTML onerror="" handler
     * @type {string}
     * @memberof IAutoExceptionTelemetry
     */
    message: string;

    /**
     * @description URL of the script where the error was raised
     * @type {string}
     * @memberof IAutoExceptionTelemetry
     */
    url: string;

    /**
     * @description Line number where error was raised
     * @type {number}
     * @memberof IAutoExceptionTelemetry
     */
    lineNumber: number;

    /**
     * @description Column number for the line where the error occurred
     * @type {number}
     * @memberof IAutoExceptionTelemetry
     */
    columnNumber: number;

    /**
     * @description Error Object (object)
     * @type {Error}
     * @memberof IAutoExceptionTelemetry
     */
    error: Error;
}
