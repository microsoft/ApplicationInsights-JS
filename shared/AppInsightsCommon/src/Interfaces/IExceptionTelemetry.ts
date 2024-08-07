// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { SeverityLevel } from "./Contracts/SeverityLevel";
import { IPartC } from "./IPartC";

export interface IExceptionConfig{
    /**
     * If set to true, when exception is sent out, the SDK will also send out all scripts basic info that are loaded on the page.
     * Notice: This would increase the size of the exception telemetry.
     */
    inclScripts?: boolean;

   /**
     * Callback function for collecting logs to be included in telemetry data.
     *
     * The length of logs to generate is controlled by the `maxLogs` parameter.
     *
     * This callback is called before telemetry data is sent, allowing for dynamic customization of the logs.
     *
     * @returns {Object} An object with the following property:
     * - logs: An array of strings, where each string represents a log entry to be included in the telemetry.
     *
     * @property {number} maxLogs - Specifies the maximum number of logs that can be generated. If not explicitly set, it defaults to 10.
     */
    expLog: () => { logs: string[] },
    maxLogs: number

}

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
    exception?: Error | IAutoExceptionTelemetry;

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
     * @type {any}
     * @memberof IAutoExceptionTelemetry
     */
    error: any;
    
    /**
     * @description The event at the time of the exception (object)
     * @type {Event|string}
     * @memberof IAutoExceptionTelemetry
     */
    evt?: Event|string;

    /**
     * @description The provided stack for the error
     * @type {IStackDetails}
     * @memberof IAutoExceptionTelemetry
     */
    stackDetails?: IStackDetails;

    /**
     * @description The calculated type of the error
     * @type {string}
     * @memberof IAutoExceptionTelemetry
     */
    typeName?: string;

    /**
     * @description The descriptive source of the error
     * @type {string}
     * @memberof IAutoExceptionTelemetry
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
