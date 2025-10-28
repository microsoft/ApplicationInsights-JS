/**
* Configuration for extra exceptions information sent with the exception telemetry.
* @example
* ```js
* const appInsights = new ApplicationInsights({
config: {
connectionString: 'InstrumentationKey=YOUR_INSTRUMENTATION_KEY_GOES_HERE',
expCfg: {
inclScripts: true,
expLog : () => {
return {logs: ["log info 1", "log info 2"]};
},
maxLogs : 100
}
}
});
appInsights.trackException({error: new Error(), severityLevel: SeverityLevel.Critical});
* ```
* @interface IExceptionConfig
*/
export interface IExceptionConfig {
    /**
     * If set to true, when exception is sent out, the SDK will also send out all scripts basic info that are loaded on the page.
     * Notice: This would increase the size of the exception telemetry.
     * @defaultvalue true
     */
    inclScripts?: boolean;
    /**
     * Callback function for collecting logs to be included in telemetry data.
     *
     * The length of logs to generate is controlled by the `maxLogs` parameter.
     *
     * This callback is called before telemetry data is sent, allowing for dynamic customization of the logs.
     *
     * @returns An object with the following property:
     * - logs: An array of strings, where each string represents a log entry to be included in the telemetry.
     *
     * @property maxLogs - Specifies the maximum number of logs that can be generated. If not explicitly set, it defaults to 50.
     */
    expLog?: () => {
        logs: string[];
    };
    /**
     * The maximum number of logs to include in the telemetry data.
     * If not explicitly set, it defaults to 50.
     * This is used in conjunction with the `expLog` callback.
     */
    maxLogs?: number;
}
