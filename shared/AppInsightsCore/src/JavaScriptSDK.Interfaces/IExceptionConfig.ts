// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
     * @property {number} maxLogs - Specifies the maximum number of logs that can be generated. If not explicitly set, it defaults to 5.
     */
    expLog: () => { logs: string[] },
    maxLogs: number
}
