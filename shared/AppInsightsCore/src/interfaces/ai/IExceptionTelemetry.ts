// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPartC } from "./IPartC";
import { SeverityLevel } from "./contracts/SeverityLevel";

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
     * @deprecated Please use the `exception` field instead. The behavior and usage of `exception` remains the same as this field.
     * Unique guid identifying this error.
     */
    error?: Error;

    /**
     * @description Error Object(s)
     */
    exception?: Error | IAutoExceptionTelemetry;

    /**
     * @description Specified severity of exception for use with
     * telemetry filtering in dashboard
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
     */
    message: string;

    /**
     * @description URL of the script where the error was raised
     */
    url: string;

    /**
     * @description Line number where error was raised
     */
    lineNumber: number;

    /**
     * @description Column number for the line where the error occurred
     */
    columnNumber: number;

    /**
     * @description Error Object (object)
     */
    error: any;
    
    /**
     * @description The event at the time of the exception (object)
     */
    evt?: Event|string;

    /**
     * @description The provided stack for the error
     */
    stackDetails?: IStackDetails;

    /**
     * @description The calculated type of the error
     */
    typeName?: string;

    /**
     * @description The descriptive source of the error
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
