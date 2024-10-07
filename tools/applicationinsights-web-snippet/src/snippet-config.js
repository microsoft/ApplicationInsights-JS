{
    src: "https://js.monitor.azure.com/scripts/c/ms.analytics-web-3.gbl.min.js",
    // name: "oneDSWeb", // Global SDK Instance name defaults to "oneDSWeb" when not supplied
    // ld: 0, // Defines the load delay (in ms) before attempting to load the sdk. -1 = block page load and add to head. (default) = 0ms load after timeout,
    // useXhr: 1, // Use XHR instead of fetch to report failures (if available),
    // crossOrigin: "anonymous", // When supplied this will add the provided value as the cross origin attribute on the script tag
    // disableReport: true, // Disable reporting when the SDK cannot be downloaded
    // onInit: null, // Once the application insights instance has loaded and initialized this callback function will be called with 1 argument -- the sdk instance (DO NOT ADD anything to the sdk.queue -- As they won't get called)
    cfg: { // One DS SDK Configuration
        instrumentationKey: "YOUR_TENANT_KEY",
        webAnalyticsConfiguration: {}
    },
    ext:[] // Extensions to initialize the sdk with
}
