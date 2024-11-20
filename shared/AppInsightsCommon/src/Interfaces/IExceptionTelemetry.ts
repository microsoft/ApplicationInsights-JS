// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { SeverityLevel } from "./Contracts/SeverityLevel";
import { IPartC } from "./IPartC";

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
     * @description DEPRECATED: Please use exception instead. Behavior/usage for exception remains the same as this field.
     */
    error?: Error;

    /**
     * @type {Error}
     * @description Error Object(s)
     */
    exception?: Error | IAutoExceptionTelemetry;

    /**
     * @description Specified severity of exception for use with
     * telemetry filtering in dashboard
     * @type {(SeverityLevel | number)}
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
     */
    message: string;

    /**
     * @description URL of the script where the error was raised
     * @type {string}
     */
    url: string;

    /**
     * @description Line number where error was raised
     * @type {number}
     */
    lineNumber: number;

    /**
     * @description Column number for the line where the error occurred
     * @type {number}
     */
    columnNumber: number;

    /**
     * @description Error Object (object)
     * @type {any}
     */
    error: any;
    
    /**
     * @description The event at the time of the exception (object)
     * @type {Event|string}
     */
    evt?: Event|string;

    /**
     * @description The provided stack for the error
     * @type {IStackDetails}
     */
    stackDetails?: IStackDetails;

    /**
     * @description The calculated type of the error
     * @type {string}
     */
    typeName?: string;

    /**
     * @description The descriptive source of the error
     * @type {string}
     */
    errorSrc?: string;
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

export interface IStackDetails {
    src: string,
    obj: string[],
}
