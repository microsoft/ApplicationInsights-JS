/// <reference path="../testframework/performancetesthelper.ts" />
/// <reference path="../../JavaScriptSDK/Serializer.ts" />
class SerializerPerfTests extends PerformanceTestHelper {

    public registerTests() {
        this.testCaseAsync({
            name: "perf: Serializer methods",
            stepDelay: 160 * 1000,
            steps: [
                () => {
                    var error = new Error("test error");
                    var pageView = new Microsoft.ApplicationInsights.Telemetry.PageView("page name", undefined);
                    var pageViewPerformance = new Microsoft.ApplicationInsights.Telemetry.PageViewPerformance("page name", undefined, 42);
                    var metric = new Microsoft.ApplicationInsights.Telemetry.Metric("metric name", 42);
                    var exception = new Microsoft.ApplicationInsights.Telemetry.Exception(error, "unhandled");
                    var event = new Microsoft.ApplicationInsights.Telemetry.Event("event name");
                    var trace = new Microsoft.ApplicationInsights.Telemetry.Trace("this is a trace");
                    
                    var pageViewPropsMeas = new Microsoft.ApplicationInsights.Telemetry.PageView("page name", undefined, this.testProperties, this.testMeasurements);
                    var pageViewPerformancePropsMeas = new Microsoft.ApplicationInsights.Telemetry.PageViewPerformance("page name", undefined, 42, this.testProperties, this.testMeasurements);
                    var exceptionPropsMeas = new Microsoft.ApplicationInsights.Telemetry.Exception(error, "unhandled", this.testProperties, this.testMeasurements);
                    var eventPropsMeas = new Microsoft.ApplicationInsights.Telemetry.Event("event name", this.testProperties, this.testMeasurements);
                    var tracePropsMeas = new Microsoft.ApplicationInsights.Telemetry.Trace("this is a trace", this.testProperties);
                    
                    this._enqueueTest("serializer.serialize(pageView)", pageView);
                    this._enqueueTest("serializer.serialize(pageViewPerformance)", pageViewPerformance);
                    this._enqueueTest("serializer.serialize(metric)", metric);
                    this._enqueueTest("serializer.serialize(exception)", exception);
                    this._enqueueTest("serializer.serialize(event)", event);
                    this._enqueueTest("serializer.serialize(trace)", trace);
                    
                    this.runTests();
                },
                () => this.onTimeout()
            ]
        });
    }

    private _enqueueTest(name, telemetry: Microsoft.ApplicationInsights.ISerializable) {
        //telemetry.iKey = "fakeIKey";
        this.enqueueTest(name, () => Microsoft.ApplicationInsights.Serializer.serialize(telemetry));
    }
}

new SerializerPerfTests().registerTests();