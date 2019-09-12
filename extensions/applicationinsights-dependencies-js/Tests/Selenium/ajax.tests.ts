/// <reference path="../TestFramework/TestClass.ts" />
import { AjaxMonitor } from "../../src/ajax";
import { RemoteDependencyData, DisabledPropertyName, IConfig, DistributedTracingModes, RequestHeaders } from "@microsoft/applicationinsights-common";
import { AppInsightsCore, IConfiguration, ITelemetryItem, ITelemetryPlugin, IChannelControls } from "@microsoft/applicationinsights-core-js";

export class AjaxTests extends TestClass {
    public testInitialize() {
        var xhr = sinon.useFakeXMLHttpRequest();
    }

    public testCleanup() {
    }

    public registerTests() {
        this.testCase({
            name: "Dependencies Configuration: Config can be set from root config",
            test: () => {
                let ajaxMonitor = new AjaxMonitor();
                ajaxMonitor.initialize({
                    instrumentationKey: "instrumentation_key",
                    maxAjaxCallsPerView: 999,
                }, new AppInsightsCore(), []);

                Assert.equal(999, ajaxMonitor["_config"].maxAjaxCallsPerView, "Config options can be set from root config");
        }

        });

        this.testCase({
            name: "Ajax: xhr.open gets instrumented",
            test: () => {
                let ajaxMonitor = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = { instrumentationKey: "instrumentationKey", extensionConfig: {"AjaxPlugin": {}}};
                appInsightsCore.initialize(coreConfig, [ajaxMonitor, new TestChannelPlugin()]);

                // act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "http://microsoft.com");

                // assert
                Assert.ok((<any>xhr).ajaxData)
                var ajaxData = (<any>xhr).ajaxData;
                Assert.equal("http://microsoft.com", ajaxData.requestUrl, "RequestUrl is collected correctly");
            }
        });

        this.testCase({
            name: "Ajax: xhr with disabled flag isn't tracked",
            test: () => {
                let ajaxMonitor = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig: IConfiguration & IConfig = { instrumentationKey: "", disableAjaxTracking: false };
                appInsightsCore.initialize(coreConfig, [ajaxMonitor, new TestChannelPlugin()]);

                // act
                var xhr = new XMLHttpRequest();
                xhr[DisabledPropertyName] = true;
                xhr.open("GET", "http://microsoft.com");

                // assert
                Assert.equal(undefined, (<any>xhr).ajaxData, "RequestUrl is collected correctly");
            }
        });

        this.testCase({
            name: "Ajax: xhr request header is tracked as part C data when enableRequestHeaderTracking flag is true",
            test: () => {
                let ajaxMonitor = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig: IConfiguration & IConfig = { instrumentationKey: "abc", disableAjaxTracking: false, enableRequestHeaderTracking: true };
                appInsightsCore.initialize(coreConfig, [ajaxMonitor, new TestChannelPlugin()]);

                var trackStub = this.sandbox.stub(ajaxMonitor, "trackDependencyDataInternal");

                // act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "http://microsoft.com");
                xhr.setRequestHeader("header name", "header value");
                xhr.send();

                // Emulate response
                (<any>xhr).respond(200, {}, "");

                // assert
                Assert.ok(trackStub.calledOnce, "trackDependencyDataInternal is called");
                Assert.equal("Ajax", trackStub.args[0][0].type, "request is Ajax type");
                Assert.notEqual(undefined, trackStub.args[0][0].properties.requestHeaders, "xhr request's request header is stored");
                Assert.equal(undefined, trackStub.args[0][0].properties.responseHeaders, "xhr request's reponse header is not stored when enableResponseHeaderTracking flag is not set, default is false");
            }
        });

        this.testCase({
            name: "Ajax: xhr request header is tracked as part C data when enableResponseHeaderTracking flag is true",
            test: () => {
                let ajaxMonitor = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig: IConfiguration & IConfig = { instrumentationKey: "abc", disableAjaxTracking: false, enableResponseHeaderTracking: true };
                appInsightsCore.initialize(coreConfig, [ajaxMonitor, new TestChannelPlugin()]);

                var trackStub = this.sandbox.stub(ajaxMonitor, "trackDependencyDataInternal");

                // act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "http://microsoft.com");
                xhr.send();

                // Emulate response
                (<any>xhr).respond(200, {"Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*"}, "");

                // assert
                Assert.ok(trackStub.calledOnce, "trackDependencyDataInternal is called");
                Assert.equal("Ajax", trackStub.args[0][0].type, "request is Ajax type");
                Assert.equal(undefined, trackStub.args[0][0].properties.requestHeaders, "xhr request's request header is not stored when enableRequestHeaderTracking flag is not set, default is false");
                Assert.notEqual(undefined, trackStub.args[0][0].properties.responseHeaders, "xhr request's reponse header is stored");
            }
        });

        this.testCase({
            name: "Fetch: fetch with disabled flag isn't tracked",
            test: () => {
                if (typeof fetch === 'undefined') {
                    Assert.ok(true);
                    return;
                }

                let ajaxMonitor = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = { instrumentationKey: "", disableFetchTracking: false };
                appInsightsCore.initialize(coreConfig, [ajaxMonitor, new TestChannelPlugin()]);
                let fetchSpy = this.sandbox.spy(ajaxMonitor, "createFetchRecord")

                // Act
                Assert.ok(fetchSpy.notCalled, "No fetch called yet");
                fetch("https://httpbin.org/status/200", {method: "post", [DisabledPropertyName]: true});

                // Assert
                Assert.ok(fetchSpy.notCalled, "createFetchRecord called once after using fetch");
            }
        });

        this.testCase({
            name: "Fetch: fetch gets instrumented",
            test: () => {
                if (typeof fetch === 'undefined') {
                    Assert.ok(true);
                    return;
                }

                let ajaxMonitor = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = { instrumentationKey: "", disableFetchTracking: false };
                appInsightsCore.initialize(coreConfig, [ajaxMonitor, new TestChannelPlugin()]);
                let fetchSpy = this.sandbox.spy(ajaxMonitor, "createFetchRecord")

                // Act
                Assert.ok(fetchSpy.notCalled, "No fetch called yet");
                fetch("https://httpbin.org/status/200", {method: "post", [DisabledPropertyName]: false});

                // Assert
                Assert.ok(fetchSpy.calledOnce, "createFetchRecord called once after using fetch");
            }
        });

        this.testCase({
            name: "Fetch: fetch keeps custom headers",
            test: () => {
                if (typeof fetch === 'undefined') {
                    Assert.ok(true);
                    return;
                }
                let ajaxMonitor = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = {
                    instrumentationKey: "",
                    disableFetchTracking: false,
                    disableAjaxTracking: true
                };
                appInsightsCore.initialize(coreConfig, [ajaxMonitor, new TestChannelPlugin()]);
                let fetchSpy = this.sandbox.spy(window, "fetch");

                // Setup
                let headers = new Headers();
                headers.append('My-Header', 'Header field');
                let init = {
                    method: 'get',
                    headers: headers
                };
                const url = 'https://httpbin.org/status/200';

                let headerSpy = this.sandbox.spy(ajaxMonitor, "includeCorrelationHeaders");

                // Act
                Assert.ok(fetchSpy.notCalled);
                fetch(url, init);

                // Assert
                Assert.ok(fetchSpy.calledOnce);
                Assert.ok(headerSpy.calledOnce);
                Assert.deepEqual(init, headerSpy.returnValue || headerSpy.returnValues[0]);

            }
        });

        this.testCase({
            name: "Ajax: successful request, ajax monitor doesn't change payload",
            test: () => {
                var callback = this.sandbox.spy();
                let ajaxMonitor = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = { instrumentationKey: "instrumentationKey", extensionConfig: {"AjaxPlugin": {}}};
                appInsightsCore.initialize(coreConfig, [ajaxMonitor, new TestChannelPlugin()]);

                // Act
                var xhr = new XMLHttpRequest();
                xhr.onload = callback;
                xhr.open("GET", "/bla");
                xhr.send();


                // Emulate response
                (<any>xhr).respond(200, { "Content-Type": "application/json" }, "bla");
                Assert.ok((<any>ajaxMonitor)._trackAjaxAttempts === 1, "TrackAjax is called");

                // Assert
                var result = callback.args[0][0].target;
                Assert.ok(callback.called, "Ajax callback is called");
                Assert.equal("bla", result.responseText, "Expected result match");
                Assert.equal(200, result.status, "Expected 200 response code");
                Assert.equal(4, xhr.readyState, "Expected readyState is 4 after request is finished");
            }
        });

        this.testCase({
            name: "Ajax: custom onreadystatechange gets called",
            test: () => {
                var onreadystatechangeSpy = this.sandbox.spy();
                var ajax = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = { instrumentationKey: "instrumentationKey", extensionConfig: {"AjaxPlugin": {}}};
                appInsightsCore.initialize(coreConfig, [ajax, new TestChannelPlugin()]);
                var trackStub = this.sandbox.stub(ajax, "trackDependencyDataInternal");

                // Act
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = onreadystatechangeSpy;
                xhr.open("GET", "/bla");
                xhr.send();

                Assert.ok(trackStub.notCalled, "TrackAjax should not be called yet");

                // Emulate response
                (<any>xhr).respond(200, {}, "");

                // Assert
                Assert.ok(trackStub.called, "TrackAjax is called");
                Assert.equal(5, onreadystatechangeSpy.callCount, "custom onreadystatechange should be called");

            }
        });

        this.testCase({
            name: "Ajax: 200 means success",
            test: () => {
                var ajax = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = { instrumentationKey: "instrumentationKey", extensionConfig: {"AjaxPlugin": {}}};
                appInsightsCore.initialize(coreConfig, [ajax, new TestChannelPlugin()]);
                var trackStub = this.sandbox.stub(ajax, "trackDependencyDataInternal");

                // Act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "/bla");
                xhr.send();

                // Emulate response
                (<any>xhr).respond(200, {}, "");

                // Assert
                Assert.equal(true, trackStub.args[0][0].success, "TrackAjax should receive true as a 'success' argument");

            }
        });

        this.testCase({
            name: "Ajax: non 200 means failure",
            test: () => {
                var ajax = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = { instrumentationKey: "instrumentationKey", extensionConfig: {"AjaxPlugin": {}}};
                appInsightsCore.initialize(coreConfig, [ajax, new TestChannelPlugin()]);
                var trackStub = this.sandbox.stub(ajax, "trackDependencyDataInternal");

                // Act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "/bla");
                xhr.send();

                // Emulate response
                (<any>xhr).respond(404, {}, "");

                // Assert
                Assert.equal(false, trackStub.args[0][0].success, "TrackAjax should receive false as a 'success' argument");

            }
        });

        [200, 201, 202, 203, 204, 301, 302, 303, 304].forEach((responseCode) => {
            this.testCase({
                name: "Ajax: test success http response code: " + responseCode,
                test: () => {
                    this.testAjaxSuccess(responseCode, true);
                }
            })
        });

        [400, 401, 402, 403, 404, 500, 501].forEach((responseCode) => {
            this.testCase({
                name: "Ajax: test failure http response code: " + responseCode,
                test: () => {
                    this.testAjaxSuccess(responseCode, false);
                }
            })
        });

        this.testCase({
            name: "Ajax: overriding ready state change handlers in all possible ways",
            test: () => {
                var ajax = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = { instrumentationKey: "instrumentationKey", extensionConfig: {"AjaxPlugin": {}}};
                appInsightsCore.initialize(coreConfig, [ajax, new TestChannelPlugin()]);
                var trackStub = this.sandbox.stub(ajax, "trackDependencyDataInternal");
                var cb1 = this.sandbox.spy();
                var cb2 = this.sandbox.spy();
                var cb3 = this.sandbox.spy();
                var cb4 = this.sandbox.spy();
                var cb5 = this.sandbox.spy();
                var cb6 = this.sandbox.spy();
                var cb7 = this.sandbox.spy();

                // Act
                var xhr = new XMLHttpRequest();
                xhr.addEventListener("readystatechange", cb1);
                xhr.addEventListener("readystatechange", cb2);
                xhr.open("GET", "/bla");
                xhr.onreadystatechange = cb3;
                xhr.addEventListener("readystatechange", cb4);
                xhr.addEventListener("readystatechange", cb5);
                xhr.send();
                xhr.addEventListener("readystatechange", cb6);
                xhr.addEventListener("readystatechange", cb7);

                Assert.ok(!trackStub.called, "TrackAjax should not be called yet");

                // Emulate response
                (<any>xhr).respond(404, {}, "");

                // Assert
                Assert.ok(trackStub.calledOnce, "TrackAjax should be called");
                Assert.ok(cb1.called, "callback 1 should be called");
                Assert.ok(cb2.called, "callback 2 should be called");
                Assert.ok(cb3.called, "callback 3 should be called");
                Assert.ok(cb4.called, "callback 4 should be called");
                Assert.ok(cb5.called, "callback 5 should be called");
                Assert.ok(cb6.called, "callback 6 should be called");
                Assert.ok(cb7.called, "callback 7 should be called");

            }
        });

        this.testCase({
            name: "Ajax: test ajax duration is calculated correctly",
            test: () => {
                var initialPerformance = window.performance;
                try {
                    // Mocking window performance (sinon doesn't have it).
                    // tick() is similar to sinon's clock.tick()
                    (<any>window).performance = <any>{
                        current: 0,

                        now: function () {
                            return this.current;
                        },

                        tick: function (ms: number) {
                            this.current += ms;
                        },

                        timing: initialPerformance.timing
                    };

                    var ajax = new AjaxMonitor();
                    let appInsightsCore = new AppInsightsCore();
                    let coreConfig = { instrumentationKey: "instrumentationKey", extensionConfig: {"AjaxPlugin": {}}};
                    appInsightsCore.initialize(coreConfig, [ajax, new TestChannelPlugin()]);
                    var trackStub = this.sandbox.stub(ajax, "trackDependencyDataInternal");
                // tick to set the initial time be non zero
                    (<any>window.performance).tick(23);

                    // Act
                    var xhr = new XMLHttpRequest();
                    var clock = this.clock;
                    var expectedResponseDuration = 50;
                    xhr.onreadystatechange = () => {
                        if (xhr.readyState == 3) {
                            (<any>window.performance).tick(expectedResponseDuration);
                        }
                    }
                    xhr.open("GET", "/bla");
                    xhr.send();
                    // Emulate response
                    (<any>xhr).respond(404, {}, "");

                    // Assert
                    Assert.ok(trackStub.calledOnce, "TrackAjax should be called");
                    Assert.equal(expectedResponseDuration, trackStub.args[0][0].duration, "Ajax duration should match expected duration");
                } finally {
                    (<any>window.performance).performance = initialPerformance;
                }
            }
        });

        this.testCase({
            name: "Ajax: 2nd invokation of xhr.send doesn't cause send wrapper to execute 2nd time",
            test: () => {
                var ajax = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = { instrumentationKey: "instrumentationKey", extensionConfig: {"AjaxPlugin": {}}};
                appInsightsCore.initialize(coreConfig, [ajax, new TestChannelPlugin()]);
                var spy = this.sandbox.spy(ajax, "sendHandler");

                // Act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "/bla");
                xhr.send();

                try {
                    xhr.send();
                } catch (e) { }


                // Assert
                Assert.ok(spy.calledOnce, "sendPrefixInstrumentor should be called only once");
            }
        });

        this.testCase({
            name: "Ajax: 2 invokation of xhr.open() doesn't cause send wrapper to execute 2nd time",
            test: () => {
                var ajax = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = { instrumentationKey: "instrumentationKey", extensionConfig: {"AjaxPlugin": {}}};
                appInsightsCore.initialize(coreConfig, [ajax, new TestChannelPlugin()]);
                var spy = this.sandbox.spy(ajax, "openHandler");

                // Act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "/bla");

                try {
                    xhr.open("GET", "/bla");
                } catch (e) { }


                // Assert
                Assert.ok(spy.calledOnce, "sendPrefixInstrumentor should be called only once");
            }
        });

        this.testCase({
            name: "Ajax: should create and pass a traceparent header if w3c is enabled",
            test: () => {
                var ajax = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = { instrumentationKey: "instrumentationKey", extensionConfig: {"AjaxPlugin": {}}};
                appInsightsCore.initialize(coreConfig, [ajax, new TestChannelPlugin()]);
                ajax['currentWindowHost'] = "www.example.com";
                ajax['_config'].appId = "appId";
                ajax['_isUsingW3CHeaders'] = true;

                // Act
                var xhr = new XMLHttpRequest();
                var stub = this.sandbox.stub(xhr, "setRequestHeader");
                xhr.open("GET", "http://www.example.com");
                xhr.send();

                // Assert
                Assert.equal(true, stub.calledWith(RequestHeaders.requestIdHeader)); // AI
                Assert.equal(true, stub.calledWith(RequestHeaders.traceParentHeader)); // W3C
            }
        })
    }

    private testAjaxSuccess(responseCode: number, success: boolean) {
        var ajax = new AjaxMonitor();
        let appInsightsCore = new AppInsightsCore();
        let coreConfig = { instrumentationKey: "instrumentationKey", extensionConfig: {"AjaxPlugin": {}}};
        appInsightsCore.initialize(coreConfig, [ajax, new TestChannelPlugin()]);
        var trackStub = this.sandbox.stub(ajax, "trackDependencyDataInternal");

        // Act
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/bla");
        xhr.send();

        // Emulate response
        (<any>xhr).respond(responseCode, {}, "");

        // Assert
        Assert.equal(success, trackStub.args[0][0].success, "TrackAjax should receive " + success + " as a 'success' argument");
    }
}

class TestChannelPlugin implements IChannelControls {

    public isFlushInvoked = false;
    public isUnloadInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;

    constructor() {
        this.processTelemetry = this._processTelemetry.bind(this);
    }
    public pause(): void {
        this.isPauseInvoked = true;
    }

    public resume(): void {
        this.isResumeInvoked = true;
    }

    public teardown(): void {
        this.isTearDownInvoked = true;
    }

    flush(async?: boolean, callBack?: () => void): void {
        this.isFlushInvoked = true;
        if (callBack) {
            callBack();
        }
    }

    public processTelemetry;

    public identifier = "Sender";

    setNextPlugin(next: ITelemetryPlugin) {
        // no next setup
    }

    public priority: number = 1001;

    public initialize = (config: IConfiguration) => {
    }

    private _processTelemetry(env: ITelemetryItem) {

    }
}

class TestAjaxMonitor extends AjaxMonitor {

}
