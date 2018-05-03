/// <reference path="../testframework/performancetesthelper.ts" />

class ApiPerfTests extends PerformanceTestHelper {

    public registerTests() {
        this.testCaseAsync({
            name: "perf: Test API methods",
            stepDelay: 30 * 1000,
            steps: [
                () => {
                    var error = new Error("test error");

                    // appInsights
                    this.enqueueTest("appInsights.trackEvent", () => this.appInsights.trackEvent("ev", this.testProperties, this.testMeasurements));
                    this.enqueueTest("appInsights.trackException", () => this.appInsights.trackException(error, null, this.testProperties, this.testMeasurements));
                    this.enqueueTest("appInsights.trackMetric", () => this.appInsights.trackMetric("m", 1, this.testProperties, this.testMeasurements));
                    this.enqueueTest("appInsights.trackPageView", () => this.appInsights.trackPageView("name", "url", this.testProperties, this.testMeasurements));
                    this.enqueueTest("appInsights.trackTrace", () => this.appInsights.trackTrace("t", this.testProperties, this.testMeasurements));
                    
                    // context
                    var telemetry = new Microsoft.ApplicationInsights.Telemetry.Trace("trace");
                    var data = new Microsoft.ApplicationInsights.Telemetry.Common.Data(Microsoft.ApplicationInsights.Telemetry.Trace.dataType, telemetry);
                    var envelope = new Microsoft.ApplicationInsights.Telemetry.Common.Envelope(data, Microsoft.ApplicationInsights.Telemetry.Trace.envelopeType);
                    this.enqueueTest("appInsights.context.track", () => this.appInsights.context.track(envelope));

                    this.runTests();
                },
                () => this.onTimeout()
            ]
        });
    }
}

new ApiPerfTests().registerTests();