// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { SeverityLevel } from './Contracts/Generated/SeverityLevel'
import { IPartC } from './IPartC';

/**
 * @export
 * @interface IExceptionTelemetry
 * @description Exception interface used as primary parameter to trackException
 */
export interface IExceptionTelemetry extends IPartC {
    /**
     * Unique guid identifying this error
     */
    id?: string;

    /**
     * @deprecated
     * @type {Error}
     * @memberof IExceptionTelemetry
     * @description DEPRECATED: Please use exception instead. Behavior/usage for exception remains the same as this field.
     */
    error?: Error;

    /**
     * @type {Error}
     * @memberof IExceptionTelemetry
     * @description Error Object(s)
     */
    exception?: Error;

    /**
     * @description Specified severity of exception for use with
     * telemetry filtering in dashboard
     * @type {(SeverityLevel | number)}
     * @memberof IExceptionTelemetry
     */
    severityLevel?: SeverityLevel | number;
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

export interface IExceptionInternal extends IPartC {
    ver: string;
    id: string;
    exceptions: IExceptionDetailsInternal[];
    severityLevel?: SeverityLevel | number;
    problemGroup: string;
    isManual: boolean;
}

export interface IExceptionDetailsInternal {
    id: number;
    outerId: number;
    typeName: string;
    message: string;
    hasFullStack: boolean;
    stack: string;
    parsedStack: IExceptionStackFrameInternal[];
}

export interface IExceptionStackFrameInternal {
    level: number;
    method: string;
    assembly: string;
    fileName: string;
    line: number;
    pos?: number;
}
