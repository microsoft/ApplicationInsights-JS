# v1.x.x (DEPRECATED)

## Microsoft Application Insights JavaScript SDK

The Legacy (v1) code has been removed from the active development branch and effectively archived in the [legacy-v1](https://github.com/microsoft/ApplicationInsights-JS/tree/legacy-v1).

No further changes are scheduled or expected, if required any isolated changes will only occur on that branch.

You are __STRONGLY__ encouraged to upgrade to the current latest version of the SDK as defined on the main [GitHub Home Page for this project](https://github.com/microsoft/ApplicationInsights-JS)

## Upgrading from the old Version of Application Insights

Breaking changes in the SDK V2 version:
- To allow for better API signatures, some of the apis such as trackPageView, trackException have been updated.
- ES3 (IE8) compatibility, while running in IE8 or lower versions of the browser is not an officially supported scenario we are working to maintain ES3 level compatibility to ensure that the SDK will not cause any unexpected failures due to Javascript parsing error. See [ES3/IE8 Compatibility](https://github.com/microsoft/ApplicationInsights-JS#es3ie8-compatibility) below for further information.
- Telemetry envelope has field name and structure changes due to data schema updates.
- Moved `context.operation` to `context.telemetryTrace`. Some fields were also changed (`operation.id` --> `telemetryTrace.traceID`)
  - If you want to maunally refresh the current pageview id (e.g. in SPA apps) this can be done with `appInsights.context.telemetryTrace.traceID = Util.newId()`

If you are using the current application insights PRODUCTION SDK (1.0.20) and want to see if the new SDK works in runtime, please update URL depending on your current SDK loading scenario:

**a)** Download via CDN scenario:
    Update code snippet that you currently use to point to the following URL:
    ```
    "https://js.monitor.azure.com/scripts/b/ai.2.min.js"
    ```

**b)** NPM scenario:
    Call downloadAndSetup to download full ApplicationInsights script from CDN and initialize it with instrumentation key.

```ts
appInsights.downloadAndSetup({
    instrumentationKey: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx",
    url: "https://js.monitor.azure.com/scripts/b/ai.2.min.js"
});
```

Test in internal environment to verify monitoring telemetry is working as expected. If all works, please update your api signatures appropriately to SDK V2 version and deploy in your production environments.

### Links

- [Version 1.x.x Readme](https://github.com/microsoft/ApplicationInsights-JS/tree/legacy-v1/README.md)
- [Version 1.x.x (Legacy) Branch](https://github.com/microsoft/ApplicationInsights-JS/tree/legacy-v1)

### Where is the code for the previous version

Please see the [legacy-v1 branch to review all previous code and documentation](https://github.com/microsoft/ApplicationInsights-JS/tree/legacy-v1)

