{
    src: "https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js",
    // name: "appInsights", // Global SDK Instance name defaults to "appInsights" when not supplied
    // ld: 0, // Defines the load delay (in ms) before attempting to load the sdk. -1 = block page load and add to head. (default) = 0ms load after timeout,
    // useXhr: 1, // Use XHR instead of fetch to report failures (if available),
    // dle: true, // Prevent the SDK from reporting load failure log
    crossOrigin: "anonymous", // When supplied this will add the provided value as the cross origin attribute on the script tag
    // onInit: null, // Once the application insights instance has loaded and initialized this callback function will be called with 1 argument -- the sdk instance (DO NOT ADD anything to the sdk.queue -- As they won't get called)
    // sri: false, // Custom optional value to specify whether fetching the snippet from integrity file and do integrity check 
    cfg: { // Application Insights Configuration
        connectionString: "YOUR_CONNECTION_STRING"
    }
}