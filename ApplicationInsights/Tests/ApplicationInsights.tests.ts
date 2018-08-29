/// <reference path="./TestFramework/Common.ts" />
/// <reference path="../JavaScriptSDK/ApplicationInsights.ts" />

import { IConfig, Util } from "applicationinsights-common";
import { ITelemetryItem, AppInsightsCore } from "applicationinsights-core-js";
import { ApplicationInsights } from "../JavaScriptSDK/ApplicationInsights";

export class ApplicationInsightsTests extends TestClass {
    private getAppInsightsSnippet() {
        var snippet: IConfig = {
            emitLineDelimitedJson: false,
            accountId: undefined,
            sessionRenewalMs: 10,
            sessionExpirationMs: 10,
            maxBatchSizeInBytes: 1000000,
            maxBatchInterval: 1,
            enableDebug: false,
            disableExceptionTracking: false,
            disableTelemetry: false,
            verboseLogging: false,
            diagnosticLogInterval: 1000,
            autoTrackPageVisitTime: false,
            samplingPercentage: 100,
            disableAjaxTracking: true,
            overridePageViewDuration: false,
            maxAjaxCallsPerView: 20,
            cookieDomain: undefined,
            disableDataLossAnalysis: true,
            disableCorrelationHeaders: false,
            disableFlushOnBeforeUnload: false,
            enableSessionStorageBuffer: false,
            isCookieUseDisabled: false,
            isRetryDisabled: false,
            isStorageUseDisabled: false,
            isBeaconApiDisabled: true,
            appId: undefined,
            enableCorsCorrelation: false
        };

        // set default values
        return snippet;
    }

    public testInitialize() {
        this.clock.reset();
        Util.setCookie('ai_session', "");
        Util.setCookie('ai_user', "");
        if (Util.canUseLocalStorage()) {
            window.localStorage.clear();
        }
    }

    public testCleanup() {
        Util.setCookie('ai_session', "");
        Util.setCookie('ai_user', "");
        if (Util.canUseLocalStorage()) {
            window.localStorage.clear();
        }
    }

    public registerTests() {
        this.testCase({
            name: "AppInsightsTests: public members are correct",
            test: () => {
                // setup
                var appInsights = new ApplicationInsights();
                // the assert test will only see config as part of an object member if it has been initialized. Not sure how it worked before
                appInsights.config = {};
                var leTest = (name) => {
                    // assert
                    Assert.ok(name in appInsights, name + " exists");
                }

                // act
                var members = ["config"];
                while (members.length) {
                    leTest(members.pop());
                }
            }
        });

        this.addStartStopTests();
    }

    private addStartStopTests() {
        var testValues = {
            name: "name",
            url: "url",
            duration: 200,
            properties: {
                "property1": 5,
                "property2": 10
            },
            measurements: {
                "measurement": 300
            }
        };

        this.testCase({
            name: "Timing Tests: Start/StopPageView pass correct duration",
            test: () => {
                // setup
                var core = new AppInsightsCore();
                this.sandbox.stub(core, "getTransmissionControl");
                var appInsights = new ApplicationInsights();
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                var spy = this.sandbox.spy(appInsights, "sendPageViewInternal");

                // act
                appInsights.startTrackPage(testValues.name);
                this.clock.tick(testValues.duration);
                appInsights.stopTrackPage(testValues.name, testValues.url, testValues.properties);

                // verify
                Assert.ok(spy.calledOnce, "stop track page view sent data");
                var actual = spy.args[0][0];
                Assert.equal(testValues.duration, actual.duration, "duration is calculated and sent correctly");
                Assert.equal(testValues.name, actual.name);
                Assert.equal(testValues.url, actual.uri);

                var actualProperties = spy.args[0][1];
                Assert.equal(testValues.properties.property1, actualProperties.property1);
                Assert.equal(testValues.properties.property2, actualProperties.property2);
            }
        });

        this.testCase({
            name: "Timing Tests: Start/StopPageView tracks single page view with no parameters",
            test: () => {
                // setup
                var core = new AppInsightsCore();
                this.sandbox.stub(core, "getTransmissionControl");
                var appInsights = new ApplicationInsights();
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                var trackStub = this.sandbox.stub(appInsights.context, "track");
                this.clock.tick(10);        // Needed to ensure the duration calculation works

                // act
                appInsights.startTrackPage();
                this.clock.tick(testValues.duration);
                appInsights.stopTrackPage();
                Assert.ok(trackStub.calledOnce, "single page view tracking stopped");

                // verify
                var telemetry: ITelemetryItem = trackStub.args[0][0];
                Assert.equal(window.document.title, telemetry.baseData.name);
                Assert.equal(testValues.duration, telemetry.baseData.duration);
            }
        });

        this.testCase({
            name: "Timing Tests: Multiple Start/StopPageView track single pages view ",
            test: () => {
                // setup
                var core = new AppInsightsCore();
                this.sandbox.stub(core, "getTransmissionControl");
                var appInsights = new ApplicationInsights();
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                var trackStub = this.sandbox.stub(appInsights.context, "track");
                this.clock.tick(10);        // Needed to ensure the duration calculation works

                // act
                appInsights.startTrackPage(testValues.name);
                this.clock.tick(testValues.duration);

                appInsights.startTrackPage();
                this.clock.tick(testValues.duration);
                appInsights.stopTrackPage();
                Assert.ok(trackStub.calledOnce, "single page view tracking stopped no parameters");

                this.clock.tick(testValues.duration);
                appInsights.stopTrackPage(testValues.name, testValues.url, testValues.properties);
                Assert.ok(trackStub.calledTwice, "single page view tracking stopped all parameters");

                // verify
                // Empty parameters
                var telemetry: ITelemetryItem = trackStub.args[0][0];
                Assert.equal(window.document.title, telemetry.baseData.name);
                Assert.equal(window.document.location.href, telemetry.baseData.uri);

                // // All parameters
                telemetry = trackStub.args[1][0];
                Assert.equal(testValues.name, telemetry.baseData.name);
                Assert.equal(testValues.url, telemetry.baseData.uri);
                // Assert.deepEqual(testValues.properties, telemetry.properties);
                // Assert.deepEqual(testValues.measurements, telemetry.measurements);
            }
        });

        // this.testCase({
        //     name: "Timing Tests: Multiple startTrackPage",
        //     test:
        //         () => {
        //             // setup
        //             var appInsights = new ApplicationInsights();
        //             var logStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");
        //             Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;

        //             // act
        //             appInsights.startTrackPage();
        //             appInsights.startTrackPage();

        //             // verify
        //             Assert.ok(logStub.calledOnce, "calling start twice triggers warning to user");
        //         }
        // });

        // this.testCase({
        //     name: "Timing Tests: stopTrackPage called without a corresponding start",
        //     test:
        //         () => {
        //             // setup
        //             var appInsights = new ApplicationInsights();
        //             var logStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");
        //             Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;

        //             // act
        //             appInsights.stopTrackPage();

        //             // verify
        //             Assert.ok(logStub.calledOnce, "calling stop without a corresponding start triggers warning to user");
        //         }
        // });

        // this.testCase({
        //     name: "Timing Tests: Start/StopTrackEvent",
        //     test: () => {
        //         // setup
        //         var appInsights = new ApplicationInsights();
        //         var trackStub = this.sandbox.stub(appInsights.context._sender, "send");
        //         this.clock.tick(10);        // Needed to ensure the duration calculation works

        //         // act
        //         appInsights.startTrackEvent(testValues.name);
        //         this.clock.tick(testValues.duration);
        //         appInsights.stopTrackEvent(testValues.name, testValues.properties, testValues.measurements);
        //         Assert.ok(trackStub.calledOnce, "single page view tracking stopped");

        //         // verify
        //         var telemetry = <Microsoft.ApplicationInsights.Telemetry.Event>trackStub.args[0][0].data.baseData;
        //         Assert.equal(testValues.name, telemetry.name);
        //         Assert.deepEqual(testValues.properties, telemetry.properties);
        //         Assert.deepEqual(testValues.measurements, telemetry.measurements);

        //         // act
        //         trackStub.reset();
        //         appInsights.startTrackEvent(testValues.name);
        //         this.clock.tick(testValues.duration);
        //         appInsights.stopTrackEvent(testValues.name, testValues.properties, testValues.measurements);
        //         Assert.ok(trackStub.calledOnce, "single page view tracking stopped");

        //         // verify
        //         telemetry = <Microsoft.ApplicationInsights.Telemetry.Event>trackStub.args[0][0].data.baseData;
        //         Assert.equal(testValues.name, telemetry.name);
        //         Assert.deepEqual(testValues.properties, telemetry.properties);
        //         Assert.deepEqual(testValues.measurements, telemetry.measurements);
        //     }
        // });

        // this.testCase({
        //     name: "Timing Tests: Multiple Start/StopTrackEvent",
        //     test: () => {
        //         // setup

        //         var testValues2 = {
        //             name: "test2",
        //             duration: 500
        //         };

        //         var appInsights = new ApplicationInsights();
        //         var trackStub = this.sandbox.stub(appInsights.context._sender, "send");
        //         this.clock.tick(10);        // Needed to ensure the duration calculation works

        //         // act
        //         appInsights.startTrackEvent(testValues.name);

        //         appInsights.startTrackEvent(testValues2.name);
        //         this.clock.tick(testValues2.duration);
        //         appInsights.stopTrackEvent(testValues2.name);
        //         Assert.ok(trackStub.calledOnce, "single event tracking stopped for " + testValues2.name);

        //         this.clock.tick(testValues.duration);
        //         appInsights.stopTrackEvent(testValues.name, testValues.properties, testValues.measurements);
        //         Assert.ok(trackStub.calledTwice, "single event tracking stopped for " + testValues.name);

        //         // verify
        //         // TestValues2
        //         var telemetry = <Microsoft.ApplicationInsights.Telemetry.Event>trackStub.args[0][0].data.baseData;
        //         Assert.equal(testValues2.name, telemetry.name);

        //         // TestValues1
        //         telemetry = <Microsoft.ApplicationInsights.Telemetry.Event>trackStub.args[1][0].data.baseData;
        //         Assert.equal(testValues.name, telemetry.name);
        //         Assert.deepEqual(testValues.properties, telemetry.properties);
        //         Assert.deepEqual(testValues.measurements, telemetry.measurements);
        //     }
        // });

        // this.testCase({
        //     name: "Timing Tests: Multiple startTrackEvent",
        //     test:
        //         () => {
        //             // setup
        //             var appInsights = new ApplicationInsights();
        //             var logStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");
        //             Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;

        //             // act
        //             appInsights.startTrackEvent("Event1");
        //             appInsights.startTrackEvent("Event1");

        //             // verify
        //             Assert.ok(logStub.calledOnce, "calling startTrackEvent twice triggers warning to user");
        //         }
        // });

        // this.testCase({
        //     name: "Timing Tests: stopTrackPage called without a corresponding start",
        //     test:
        //         () => {
        //             // setup
        //             var appInsights = new ApplicationInsights();
        //             var logStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");
        //             Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;

        //             // act
        //             appInsights.stopTrackPage("Event1");

        //             // verify
        //             Assert.ok(logStub.calledOnce, "calling stopTrackEvent without a corresponding start triggers warning to user");
        //         }
        // });

        // this.testCase({
        //     name: "Timing Tests: Start/StopTrackEvent has correct duration",
        //     test: () => {
        //         // setup

        //         var testValues1 = {
        //             name: "test1",
        //             duration: 300
        //         };

        //         var testValues2 = {
        //             name: "test2",
        //             duration: 200
        //         };

        //         var appInsights = new ApplicationInsights();
        //         var trackStub = this.sandbox.stub(appInsights.context._sender, "send");
        //         this.clock.tick(55);        // Needed to ensure the duration calculation works

        //         // act
        //         appInsights.startTrackEvent(testValues1.name);
        //         this.clock.tick(testValues1.duration);
        //         appInsights.stopTrackEvent(testValues1.name);

        //         appInsights.startTrackEvent(testValues2.name);
        //         this.clock.tick(testValues2.duration);
        //         appInsights.stopTrackEvent(testValues2.name);

        //         // verify
        //         // TestValues1
        //         var telemetry = <Microsoft.ApplicationInsights.Telemetry.Event>trackStub.args[0][0].data.baseData;
        //         Assert.equal(testValues1.name, telemetry.name);
        //         Assert.equal(testValues1.duration, telemetry.measurements["duration"]);

        //         // TestValues2
        //         telemetry = <Microsoft.ApplicationInsights.Telemetry.Event>trackStub.args[1][0].data.baseData;
        //         Assert.equal(testValues2.name, telemetry.name);
        //         Assert.equal(testValues2.duration, telemetry.measurements["duration"]);
        //     }
        // });

        // this.testCase({
        //     name: "Timing Tests: Start/StopTrackEvent custom duration is not overriden",
        //     test: () => {
        //         // setup
        //         var testValues2 = {
        //             name: "name2",
        //             url: "url",
        //             duration: 345,
        //             properties: {
        //                 "property1": 5
        //             },
        //             measurements: {
        //                 "duration": 777
        //             }
        //         };

        //         var appInsights = new ApplicationInsights();
        //         var trackStub = this.sandbox.stub(appInsights.context._sender, "send");
        //         this.clock.tick(10);

        //         // act
        //         appInsights.startTrackEvent(testValues2.name);
        //         this.clock.tick(testValues2.duration);
        //         appInsights.stopTrackEvent(testValues2.name, testValues2.properties, testValues2.measurements);
        //         Assert.ok(trackStub.calledOnce, "single page view tracking stopped");

        //         // verify
        //         var telemetry = <Microsoft.ApplicationInsights.Telemetry.Event>trackStub.args[0][0].data.baseData;
        //         Assert.equal(testValues2.name, telemetry.name);
        //         Assert.deepEqual(testValues2.properties, telemetry.properties);
        //         Assert.deepEqual(testValues2.measurements, telemetry.measurements);
        //     }
        // });

        // this.testCase({
        //     name: "flush causes queue to be sent",
        //     test:
        //         () => {
        //             // setup
        //             var appInsights = new ApplicationInsights();
        //             appInsights.config.maxBatchInterval = 100;
        //             Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;
        //             appInsights.context._sender._sender = () => null;
        //             var senderSpy = this.sandbox.spy(appInsights.context._sender, "_sender");

        //             // act
        //             appInsights.trackEvent("Event1");
        //             appInsights.trackEvent("Event2");
        //             appInsights.trackEvent("Event3");

        //             // verify
        //             this.clock.tick(1);
        //             Assert.ok(senderSpy.notCalled, "data is not sent without calling flush");

        //             // act
        //             appInsights.flush();

        //             // verify
        //             this.clock.tick(1);
        //             Assert.ok(senderSpy.calledOnce, "data is sent after calling flush");
        //         }
        // });

        // this.testCase({
        //     name: "PageView should cause internal event throttle to be reset",
        //     test: () => {
        //         // setup
        //         var appInsights = new ApplicationInsights();
        //         Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;
        //         appInsights.context._sender._sender = () => null;
        //         var senderStub = this.sandbox.stub(appInsights.context._sender, "_sender");
        //         var resetInternalMessageCountStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "resetInternalMessageCount");

        //         // setup a page view envelope
        //         var pageView = new Microsoft.ApplicationInsights.Telemetry.PageView();
        //         var pageViewData = new Microsoft.ApplicationInsights.Telemetry.Common.Data<Microsoft.ApplicationInsights.Telemetry.PageView>(Microsoft.ApplicationInsights.Telemetry.PageView.dataType, pageView);
        //         var pageViewEnvelope = new Microsoft.ApplicationInsights.Telemetry.Common.Envelope(pageViewData, Microsoft.ApplicationInsights.Telemetry.PageView.envelopeType);

        //         // act
        //         appInsights.context.track(pageViewEnvelope);

        //         // verify
        //         Assert.ok(resetInternalMessageCountStub.calledOnce, "Internal throttle was not reset even though Page View was tracked");

        //     }
        // });

        // this.testCase({
        //     name: "No other event than PageView should cause internal event throttle to be reset",
        //     test: () => {
        //         // setup
        //         var appInsights = new ApplicationInsights();
        //         Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;
        //         appInsights.context._sender._sender = () => null;
        //         var senderStub = this.sandbox.stub(appInsights.context._sender, "_sender");
        //         var resetInternalMessageCountStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "resetInternalMessageCount");

        //         // setup a some other envelope
        //         var event = new Microsoft.ApplicationInsights.Telemetry.Event('Test Event');
        //         var eventData = new Microsoft.ApplicationInsights.Telemetry.Common.Data<Microsoft.ApplicationInsights.Telemetry.Event>(Microsoft.ApplicationInsights.Telemetry.Event.dataType, event);
        //         var eventEnvelope = new Microsoft.ApplicationInsights.Telemetry.Common.Envelope(eventData, Microsoft.ApplicationInsights.Telemetry.Event.envelopeType);

        //         // act
        //         appInsights.context.track(eventEnvelope);

        //         // verify
        //         Assert.ok(resetInternalMessageCountStub.notCalled, "Internal throttle was reset even though Page View was not tracked");
        //     }
        // });

        // this.testCase({
        //     name: "trackDependency includes instrumentation key into envelope name",
        //     test: () => {
        //         var iKey = "BDC8736D-D8E8-4B69-B19B-B0CE6B66A456";
        //         var iKeyNoDash = "BDC8736DD8E84B69B19BB0CE6B66A456";
        //         var snippet = this.getAppInsightsSnippet();
        //         var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);

        //         var trackStub = this.sandbox.stub(appInsights.context._sender, "send");

        //         // verify
        //         var test = (action, expectedEnvelopeType, expectedDataType) => {
        //             action();
        //             var envelope = this.getFirstResult(action, trackStub);
        //             Assert.equal(iKey, envelope.iKey, "envelope iKey");
        //             Assert.equal(expectedEnvelopeType.replace("{0}", iKeyNoDash), envelope.name, "envelope name");
        //             Assert.equal(expectedDataType, envelope.data.baseType, "type name");
        //             trackStub.reset();
        //         };

        //         // act
        //         test(() => appInsights.trackDependency("0", "GET", "http://asdf", "test", 123, true, 200), Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData.envelopeType,
        //             Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData.dataType);
        //     }
        // });

        // this.testCase({
        //     name: "trackDependency - by default no more than 20 ajaxes per view",
        //     test: () => {
        //         var snippet = this.getAppInsightsSnippet();
        //         var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
        //         var trackStub = this.sandbox.stub(appInsights.context, "track");

        //         // Act
        //         for (var i = 0; i < 100; ++i) {
        //             appInsights.trackDependency("0", "GET", "http://asdf", "test", 123, true, 200);
        //         }

        //         // Assert
        //         Assert.equal(20, trackStub.callCount, "Expected 20 invokations of trackAjax");
        //     }
        // });

        // this.testCase({
        //     name: "trackDependency - trackPageView resets counter of sent ajaxes",
        //     test: () => {
        //         var snippet = this.getAppInsightsSnippet();
        //         var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
        //         var trackStub = this.sandbox.stub(appInsights.context, "track");

        //         // Act
        //         for (var i = 0; i < 100; ++i) {
        //             appInsights.trackDependency("0", "POST", "http://asdf", "test", 123, true, 200);
        //         }

        //         appInsights.sendPageViewInternal("asdf", "http://microsoft.com", 123);
        //         trackStub.reset();

        //         for (var i = 0; i < 100; ++i) {
        //             appInsights.trackDependency("0", "POST", "http://asdf", "test", 123, true, 200);
        //         }

        //         // Assert
        //         Assert.equal(20, trackStub.callCount, "Expected 20 invokations of trackAjax");
        //     }
        // });

        // this.testCase({
        //     name: "trackDependency - only 1 user actionable trace about ajaxes limit per view",
        //     test: () => {
        //         var snippet = this.getAppInsightsSnippet();
        //         var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
        //         var trackStub = this.sandbox.stub(appInsights.context, "track");
        //         var loggingSpy = this.sandbox.spy(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");

        //         // Act
        //         for (var i = 0; i < 20; ++i) {
        //             appInsights.trackDependency("0", "POST", "http://asdf", "test", 123, true, 200);
        //         }

        //         loggingSpy.reset();

        //         for (var i = 0; i < 100; ++i) {
        //             appInsights.trackDependency("0", "POST", "http://asdf", "test", 123, true, 200);
        //         }

        //         // Assert
        //         Assert.equal(1, loggingSpy.callCount, "Expected 1 invokation of internal logging");
        //     }
        // });

        // this.testCase({
        //     name: "trackDependency - '-1' means no ajax per view limit",
        //     test: () => {
        //         var snippet = this.getAppInsightsSnippet();
        //         snippet.maxAjaxCallsPerView = -1;
        //         var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
        //         var trackStub = this.sandbox.stub(appInsights.context, "track");
        //         var ajaxCallsCount = 1000;

        //         // Act
        //         for (var i = 0; i < ajaxCallsCount; ++i) {
        //             appInsights.trackDependency("0", "POST", "http://asdf", "test", 123, true, 200);
        //         }

        //         // Assert
        //         Assert.equal(ajaxCallsCount, trackStub.callCount, "Expected " + ajaxCallsCount + " invokations of trackAjax (no limit)");
        //     }
        // });

        // this.testCase({
        //     name: "trackAjax obsolete method is still supported",
        //     test: () => {
        //         var appInsights = new ApplicationInsights();
        //         var trackStub = this.sandbox.stub(appInsights.context, "track");
        //         var pathName = "http://myurl.com/test";
        //         var url = "http://myurl.com/test";
        //         var target = "myurl.com"
        //         var duration = 123;
        //         var success = false;
        //         var resultCode = 404;

        //         // Act
        //         appInsights.trackAjax("0", url, pathName, duration, success, resultCode);

        //         // Assert
        //         Assert.ok(trackStub.called, "Track should be called");
        //         var rdd = <Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData>(<any>trackStub.args[0][0]).data.baseData;
        //         Assert.equal("/test", rdd.name);
        //         Assert.equal(url, rdd.data);
        //         Assert.equal(target, rdd.target);
        //         Assert.equal("00:00:00.123", rdd.duration);
        //         Assert.equal(success, rdd.success);
        //     }
        // });

        // this.testCase({
        //     name: "Ajax - Request-Context is not set if appId was not set",
        //     test: () => {
        //         var snippet = this.getAppInsightsSnippet();
        //         snippet.disableAjaxTracking = false;
        //         snippet.disableCorrelationHeaders = false;
        //         snippet.enableCorsCorrelation = true;
        //         snippet.maxBatchInterval = 0;
        //         var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);

        //         var trackStub = this.sandbox.spy(appInsights, "trackDependencyData");
        //         var expectedRootId = appInsights.context.operation.id;
        //         Assert.ok(expectedRootId.length > 0, "root id was initialized to non empty string");

        //         // Act
        //         var xhr = new XMLHttpRequest();
        //         xhr.open("GET", "/bla");
        //         xhr.send();

        //         var expectedAjaxId = (<any>xhr).ajaxData.id;
        //         Assert.ok(expectedAjaxId.length > 0, "ajax id was initialized");

        //         // Emulate response                               
        //         (<any>xhr).respond("200", {}, "");

        //         // Assert
        //         Assert.equal(expectedAjaxId, (<any>xhr).requestHeaders['Request-Id'], "Request-Id is set correctly");
        //         Assert.equal(null, (<any>xhr).requestHeaders['Request-Context'], "Request-Context is not set");
        //         Assert.equal(expectedAjaxId, trackStub.args[0][0].id, "ajax id passed to trackAjax correctly");
        //     }
        // });

        // this.testCase({
        //     name: "Ajax - Request-Id and Request-Context are set and passed correctly",
        //     test: () => {
        //         var snippet = this.getAppInsightsSnippet();
        //         snippet.disableAjaxTracking = false;
        //         snippet.disableCorrelationHeaders = false;
        //         snippet.enableCorsCorrelation = false;
        //         snippet.maxBatchInterval = 0;
        //         var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
        //         appInsights.context.appId = () => "C16FBA4D-ECE9-472E-8125-4FF5BEFAF8C1";

        //         var trackStub = this.sandbox.spy(appInsights, "trackDependencyData");
        //         var expectedRootId = appInsights.context.operation.id;
        //         Assert.ok(expectedRootId.length > 0, "root id was initialized to non empty string");

        //         // Act
        //         var xhr = new XMLHttpRequest();
        //         xhr.open("GET", "/bla");
        //         xhr.send();

        //         var expectedAjaxId = (<any>xhr).ajaxData.id;
        //         Assert.ok(expectedAjaxId.length > 0, "ajax id was initialized");

        //         // Emulate response                               
        //         (<any>xhr).respond("200", {}, "");

        //         // Assert
        //         Assert.equal(expectedAjaxId, (<any>xhr).requestHeaders['Request-Id'], "Request-Id is set correctly");
        //         Assert.equal("appId=cid-v1:C16FBA4D-ECE9-472E-8125-4FF5BEFAF8C1", (<any>xhr).requestHeaders['Request-Context'], "Request-Context is set correctly");
        //         Assert.equal(expectedAjaxId, trackStub.args[0][0].id, "ajax id passed to trackAjax correctly");
        //     }
        // });

        // this.testCase({
        //     name: "Ajax - Request-Id is not set for dependency calls with different port number if CORS correlation turned off",
        //     test: () => {
        //         var snippet = this.getAppInsightsSnippet();
        //         snippet.disableAjaxTracking = false;
        //         snippet.disableCorrelationHeaders = false;
        //         snippet.enableCorsCorrelation = false;
        //         snippet.maxBatchInterval = 0;
        //         var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
        //         var trackStub = this.sandbox.spy(appInsights, "trackDependencyData");
        //         var expectedRootId = appInsights.context.operation.id;
        //         Assert.ok(expectedRootId.length > 0, "root id was initialized to non empty string");

        //         // override currentWindowHost
        //         var sampleHost = "api.applicationinsights.io";
        //         (<any>appInsights)._ajaxMonitor.currentWindowHost = sampleHost;

        //         // Act
        //         var xhr = new XMLHttpRequest();
        //         xhr.open("GET", "https://" + sampleHost + ":888/test");
        //         xhr.send();

        //         var expectedAjaxId = (<any>xhr).ajaxData.id;
        //         Assert.ok(expectedAjaxId.length > 0, "ajax id was initialized");

        //         // Emulate response                               
        //         (<any>xhr).respond("200", {}, "");

        //         // Assert
        //         Assert.equal(null, (<any>xhr).requestHeaders['Request-Id'], "Request-Id is not set");
        //     }
        // });

        // this.testCase({
        //     name: "Ajax - Request-Id is set for dependency calls with different port number if CORS correlation turned on",
        //     test: () => {
        //         var snippet = this.getAppInsightsSnippet();
        //         snippet.disableAjaxTracking = false;
        //         snippet.disableCorrelationHeaders = false;
        //         snippet.enableCorsCorrelation = true;
        //         snippet.maxBatchInterval = 0;
        //         var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
        //         var trackStub = this.sandbox.spy(appInsights, "trackDependencyData");
        //         var expectedRootId = appInsights.context.operation.id;
        //         Assert.ok(expectedRootId.length > 0, "root id was initialized to non empty string");

        //         // override currentWindowHost
        //         var sampleHost = "api.applicationinsights.io";
        //         (<any>appInsights)._ajaxMonitor.currentWindowHost = sampleHost;

        //         // Act
        //         var xhr = new XMLHttpRequest();
        //         xhr.open("GET", "https://" + sampleHost + ":888/test");
        //         xhr.send();

        //         var expectedAjaxId = (<any>xhr).ajaxData.id;
        //         Assert.ok(expectedAjaxId.length > 0, "ajax id was initialized");

        //         // Emulate response                               
        //         (<any>xhr).respond("200", {}, "");

        //         // Assert
        //         Assert.equal(expectedAjaxId, (<any>xhr).requestHeaders['Request-Id'], "Request-Id is set correctly");
        //         Assert.equal(expectedAjaxId, trackStub.args[0][0].id, "ajax id passed to trackAjax correctly");
        //     }
        // });

        // this.testCase({
        //     name: "Ajax - disableCorrelationHeaders disables Request-Id and Request-Context headers",
        //     test: () => {
        //         var snippet = this.getAppInsightsSnippet();
        //         snippet.disableAjaxTracking = false;
        //         snippet.disableCorrelationHeaders = true;
        //         snippet.enableCorsCorrelation = true;
        //         snippet.maxBatchInterval = 0;

        //         var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
        //         appInsights.context.appId = () => "C16FBA4D-ECE9-472E-8125-4FF5BEFAF8C1";

        //         var trackStub = this.sandbox.spy(appInsights, "trackDependencyData");
        //         var expectedRootId = appInsights.context.operation.id;
        //         Assert.ok(expectedRootId.length > 0, "root id was initialized to non empty string");

        //         // Act
        //         var xhr = new XMLHttpRequest();
        //         xhr.open("GET", "/bla");
        //         xhr.send();

        //         // Emulate response                               
        //         (<any>xhr).respond("200", {}, "");

        //         // Assert
        //         Assert.equal(null, (<any>xhr).requestHeaders['Request-Id'], "Request-Id header is not set.");
        //         Assert.equal(null, (<any>xhr).requestHeaders['Request-Context'], "Request-Context header is not set.");
        //     }
        // });

        // this.testCase({
        //     name: "Ajax - Request-Id and Request-Context headers are disabled for excluded domain",
        //     test: () => {
        //         var snippet = this.getAppInsightsSnippet();
        //         snippet.disableAjaxTracking = false;
        //         snippet.disableCorrelationHeaders = false;
        //         snippet.enableCorsCorrelation = true;
        //         snippet.correlationHeaderExcludedDomains = ["some.excluded.domain"];
        //         snippet.maxBatchInterval = 0;
        //         var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
        //         var trackStub = this.sandbox.spy(appInsights, "trackDependencyData");
        //         var expectedRootId = appInsights.context.operation.id;
        //         Assert.ok(expectedRootId.length > 0, "root id was initialized to non empty string");

        //         // Act
        //         var xhr = new XMLHttpRequest();
        //         xhr.open("GET", "http://some.excluded.domain/test");
        //         xhr.send();

        //         // Emulate response                               
        //         (<any>xhr).respond("200", {}, "");

        //         // Assert
        //         Assert.equal(null, (<any>xhr).requestHeaders['Request-Id'], "Request-Id header is not set.");
        //         Assert.equal(null, (<any>xhr).requestHeaders['Request-Context'], "Request-Context header is not set.");
        //     }
        // });
    }

    // private getFirstResult(action: string, trackStub: SinonStub, skipSessionState?: boolean) {
    //     var index: number;
    //     if (skipSessionState) {
    //         index = 1;
    //     } else {
    //         index = 0;
    //     }
    //     Assert.ok(trackStub.args && trackStub.args[index] && trackStub.args[index], "track was called for: " + action);
    //     return <Microsoft.Telemetry.Envelope>trackStub.args[index][0];
    // }
}