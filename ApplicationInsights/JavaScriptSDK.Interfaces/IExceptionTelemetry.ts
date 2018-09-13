import { SeverityLevel, Exception } from 'applicationinsights-common';

/**
 *
 *
 * @export
 * @interface IExceptionTelemetry
 */
export interface IExceptionTelemetry {
    error: Error | Error[];
    /**
     *
     *
     * @type {(SeverityLevel | number)}
     * @memberof IExceptionTelemetry
     */
    severityLevel?: SeverityLevel | number;
}

export interface IAutoExceptionTelemetry {
    message: string;
    url: string;
    lineNumber: number;
    columnNumber: number;
    error: Error;
}
