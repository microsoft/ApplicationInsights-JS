## Add More Information to Exception Telemetry

To enhance the detail and usefulness of exception telemetry in your application, you can configure additional settings through the `IExceptionConfig` interface. This allows for more comprehensive data to be included when exceptions are sent, such as scripts loaded on the page.

### Configuration

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| expCfg | [`IExceptionConfig`](https://github.com/microsoft/ApplicationInsights-JS/blob/main/shared/AppInsightsCommon/src/Interfaces/IExceptionTelemetry.ts) | `undefined` | Set additional configuration for exceptions, such as more scripts to include in the exception telemetry. |

### Example Usage
```js
const appInsights = new ApplicationInsights({
    config: {
        connectionString: 'InstrumentationKey=YOUR_INSTRUMENTATION_KEY_GOES_HERE',
        expCfg: {
            inclScripts: true,
            expLog : () => {
                return {message: ["log info 1", "log info 2"], maxLength: 100};
            }
        }
    }
});
appInsights.trackException({error: new Error(), severityLevel: SeverityLevel.Critical});
```
