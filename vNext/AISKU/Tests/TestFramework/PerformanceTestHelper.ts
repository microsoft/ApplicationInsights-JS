/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../External/jquery.d.ts" />
/// <reference path="../../JavaScriptSDK/AppInsights.ts" />
/// <reference path="../../JavaScriptSDK/Telemetry/Common/Data.ts" />
interface IJSLitmus {
    test: (name: string, f: Function) => void;
    stop: () => void;
    runAll: (e?: Event) => JQueryDeferred<void>;
    _tests: any[];
}

interface IPerfResult {
    operationCount: number;
    timeInMs: number;
    name: string;
    opsPerSec: number;
    period: number;
    date: number;
    platform: string;
    os: string;
    oneHrDate: number;
    friendlyDate: string;
    group: string;
    millisecondsPerOp: number;
    microsecondsPerOp: number;
    secondsPerOp: number;
    browser: string;
}

declare var JSLitmus: IJSLitmus;

class PerformanceTestHelper extends TestClass {

    public testCount;
    public appInsights;
    public testProperties;
    public testMeasurements;
    public results: IPerfResult[];
    private isDone;

    constructor(timeout?: number) {
        super();
        this.testCount = 0;
        this.synchronouslyLoadJquery();
        this.results = [];
    }

    /** Method called before the start of each test method */
    public testInitialize() {
        this.useFakeServer = false;
        sinon.fakeServer["restore"]();

        this.useFakeTimers = false;
        this.clock.restore();

        this.appInsights = new Microsoft.ApplicationInsights.AppInsights(<any>{
            instrumentationKey: "3e6a441c-b52b-4f39-8944-f81dd6c2dc46",
            url: "file:///C:/src/sdk/src/JavaScript/JavaScriptSDK.Tests//E2ETests/ai.js",
            endpointUrl: "https://dc.services.visualstudio.com/v2/track",
            maxBatchInterval: 0
        });

        this.appInsights.context._sender._sender = () => null;
        this.testProperties = { p1: "val", p2: "val", p3: "val", p4: "val", p5: "val", p6: "val", p7: "val" };
        this.testMeasurements = { m1: 1, m2: 1, m3: 1, m4: 1, m5: 1, m6: 1, m7: 1, m8: 1, m9: 1 };
    }

    /** Method called after each test method has completed */
    public testCleanup() {
        this.useFakeServer = true;
        this.useFakeTimers = true;
        var serializedPerfResults: string = window["perfResults"] || "[]";
        var perfResults: IPerfResult[] = <any>(JSON.parse(serializedPerfResults));
        perfResults = perfResults.concat(this.results);
        window["perfResults"] = JSON.stringify(perfResults);
        window["perfResultsCsv"] = this.toCsv(perfResults).csv;
        window["perfResultsCsvHeaders"] = this.toCsv(perfResults).headers;
    }

    private toCsv(array: any[]) {
        var headers = "";
        if (array.length > 0) {
            var names = [];
            for (var name in array[0]) {
                names.push(name);
            }

            headers = names.join(",");
        }

        var csv = [];
        for (var i = 0; i < array.length; i++) {
            var datum = array[i];
            var values = [];
            for (var j = 0; j < names.length; j++) {
                values.push(datum[names[j]]);
            }

            csv.push(values.join(","));
        }

        return { headers: headers, csv: csv.join("\r\n") };
    }

    public enqueueTest(name: string, action: () => void) {
        JSLitmus.test(name, (count) => {
            while (count--) {
                action();
            }
        });
    }

    public runTests() {
        JSLitmus.runAll().done(() => this.onTestsComplete());
    }

    public onTestsComplete() {
        var perfLogging = new Microsoft.ApplicationInsights.AppInsights(<any>{
            instrumentationKey: "1a6933ad-f260-447f-a2b0-e2233f6658eb",
            url: "file:///C:/src/sdk/src/JavaScript/JavaScriptSDK.Tests//E2ETests/ai.js",
            endpointUrl: "http://prodintdataforker.azurewebsites.net/dcservices?intKey=4d93aad0-cf1d-45b7-afc9-14f55504f6d5",
            sessionRenewalMs: 30 * 60 * 1000,
            sessionExpirationMs: 24 * 60 * 60 * 1000,
            maxBatchSizeInBytes: 1000000,
            maxBatchInterval: 0
        });

        perfLogging.context._sender._sender = (payload) => {
            var xhr = new sinon["xhr"].workingXHR();
            xhr.open("POST", perfLogging.config.endpointUrl, true);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.send(payload);
        }

        JSLitmus.stop();
        for (var i = 0; i < JSLitmus._tests.length; i++) {
            var test = JSLitmus._tests[i];
            var opsPerSec = test.count / test.time;
            Assert.ok(true, test.name + " operations per sec:" + opsPerSec);

            var timeInMs = <number>test.time;
            var date = +new Date;
            var oneHr = 60 * 60 * 1000;
            var oneHrDate = Math.floor(date / oneHr) * oneHr;
            var friendlyDate = new Date(oneHrDate).toISOString();
            var platform = <string>test.platform;
            var browser = "internetExplorer";
            var name = <string>test.name;
            var group = name.split(".")[0];
            if (platform.toLowerCase().indexOf("chrome") >= 0) {
                browser = "chrome";
            } else if (platform.toLowerCase().indexOf("firefox") >= 0) {
                browser = "firefox";
            } else if (platform.toLowerCase().indexOf("safari") >= 0) {
                browser = "safari";
            }

            var result: IPerfResult = {
                name: name,
                timeInMs: timeInMs,
                operationCount: 1,
                opsPerSec: 1 / (timeInMs / 1000),
                period: 1,
                date: date,
                oneHrDate: oneHrDate,
                friendlyDate: friendlyDate,
                group: group,
                platform: platform,
                browser: browser,
                os: <string>test.os,
                millisecondsPerOp: (timeInMs / 1),
                microsecondsPerOp: (timeInMs / 1) * 1000,
                secondsPerOp: (timeInMs / 1) / 1000
            };

            perfLogging.trackMetric(result.name, opsPerSec);
            var event = new Microsoft.ApplicationInsights.Telemetry.Event(result.name, opsPerSec, result);
            var data = new Microsoft.ApplicationInsights.Telemetry.Common.Data<Microsoft.ApplicationInsights.Telemetry.Event>(
                Microsoft.ApplicationInsights.Telemetry.Event.dataType, event);
            var envelope = new Microsoft.ApplicationInsights.Telemetry.Common.Envelope(data, Microsoft.ApplicationInsights.Telemetry.Event.envelopeType);
            perfLogging.context.track(envelope);

            this.results.push(result);
        }

        JSLitmus._tests.length = 0;
        this.isDone = true;
        this.testCleanup();
    }

    public onTimeout() {
        if (!this.isDone) {
            Assert.ok(false, "timeout reached");
            this.onTestsComplete();
        }
    }

    /**
     * Synchronously loads jquery
     * we could regress the test suite and develop sublte jquery dependencies in the product code
     * if jquery were added to all tests as it hides a lot of cross browser weirdness. However,
     * for these tests it is useful to manipulate the dom to display performance results.
     */
    private synchronouslyLoadJquery() {
        if (!window["$"]) {
            // get some kind of XMLHttpRequest
            var xhrObj = <any>false;
            if (window["ActiveXObject"]) {
                xhrObj = <any>new ActiveXObject("Microsoft.XMLHTTP");
            } else if (window["XMLHttpRequest"]) {
                xhrObj = <any>new XMLHttpRequest();
            } else {
                alert("Please upgrade your browser!  Your browser does not support AJAX!");
            }

            // open and send a synchronous request
            xhrObj.open('GET', "http://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.1/jquery.js", false);
            xhrObj.send('');

            // add the returned content to a newly created script tag
            var script = document.createElement('script');
            script.type = "text/javascript";
            script.text = xhrObj.responseText;
            document.getElementsByTagName('head')[0].appendChild(script);
        }
    }
}