window.appInsights = {
    config: {
        instrumentationKey: "INSTRUMENTATION_KEY",
        url: "CDN_URL",
        endpointUrl: "ENDPOINT_URL",
        maxBatchInterval: 0,
    },
    queue: [
        function () {
            console.log('from the queue');
        },
        function () {
            console.log('from the queue');
        },
        function () {
            console.log('from the queue');
        },
        function () {
            console.log('from the queue');
        },
        function () {
            console.log('from the queue');
        },
        function () {
            console.log('from the queue');
        },
        function () {
            console.log('from the queue');
        }
    ]
}
