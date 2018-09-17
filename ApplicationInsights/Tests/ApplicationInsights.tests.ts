/// <reference path="./TestFramework/Common.ts" />
/// <reference path="../JavaScriptSDK/ApplicationInsights.ts" />

import { Util, Exception, SeverityLevel, Envelope } from "applicationinsights-common";
import {
    ITelemetryItem, AppInsightsCore, IAppInsightsCore,
    IPlugin, IConfiguration
} from "applicationinsights-core-js";
import { ApplicationInsights } from "../JavaScriptSDK/ApplicationInsights";

export class ApplicationInsightsTests extends TestClass {
    public testInitialize() {
        this.clock.reset();
        Util.setCookie(undefined, 'ai_session', "");
        Util.setCookie(undefined, 'ai_user', "");
        if (Util.canUseLocalStorage()) {
            window.localStorage.clear();
        }
    }

    public testCleanup() {
        Util.setCookie(undefined, 'ai_session', "");
        Util.setCookie(undefined, 'ai_user', "");
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
                var members = [
                    "config",
                    "trackException",
                    "_onerror",
                    "trackPageView",
                    "startTrackEvent",
                    "stopTrackEvent",
                    "startTrackPage",
                    "stopTrackPage"
                ];
                while (members.length) {
                    leTest(members.pop());
                }
            }
        });

        this.addGenericTests();
        this.addStartStopTrackEventTests();
        this.addStartStopTrackPageTests();
        this.addTrackExceptionTests();
        this.addOnErrorTests();
    }

    private addGenericTests(): void {
        this.testCase({
            name: 'AppInsightsGenericTests: envelope type, data type, and ikey are correct',
            test: () => {
                // setup
                var iKey: string = "BDC8736D-D8E8-4B69-B19B-B0CE6B66A456";
                var iKeyNoDash: string = "BDC8736DD8E84B69B19BB0CE6B66A456";
                var plugin = new TestPlugin();
                var core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: iKey},
                    [plugin]
                );
                var appInsights = new ApplicationInsights();
                appInsights.initialize({instrumentationKey: core.config.instrumentationKey}, core, []);
                var trackStub = this.sandbox.stub(appInsights.core, "track");

                var test = (action, expectedEnvelopeType, expectedDataType) => {
                    action();
                    var envelope: ITelemetryItem = this.getFirstResult(action, trackStub);
                    Assert.equal(iKey, envelope.instrumentationKey, "envelope iKey");
                    Assert.equal(expectedEnvelopeType.replace("{0}", iKeyNoDash), envelope.name, "envelope name");
                    Assert.equal(expectedDataType, envelope.baseType, "data type name");
                    trackStub.reset();
                };

                // Test
                test(() => appInsights.trackException({error: new Error(), severityLevel: SeverityLevel.Critical}), Exception.envelopeType, Exception.dataType)
            }
        });

        this.testCase({
            name: 'AppInsightsGenericTests: public APIs call track',
            test: () => {
                // setup
                const plugin = new TestPlugin();
                var core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                var appInsights = new ApplicationInsights();
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                const senderStub = this.sandbox.stub(appInsights.core, "track");

                // Act
                appInsights.trackException({error: new Error(), severityLevel: SeverityLevel.Critical});
                this.clock.tick(1);

                // Test
                Assert.ok(senderStub.calledOnce, "Telemetry is sent when master switch is on");
            }
        });
    }

    private addStartStopTrackEventTests(): void {
        const plugin = new TestPlugin();
        var core = new AppInsightsCore();
        core.initialize(
            {instrumentationKey: "key"},
            [plugin]
        );
        var appInsights = new ApplicationInsights();
        appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);

        const testValues = {
            name: "name",
            url: "url",
            duration: 200,
            customProperties: {
                "property1": 5,
                "property2": 10,
                "measurement": 300.0
            }
        }

        this.testCase({
            name: 'Timing Tests: Start/StopTrackEvent',
            test: () => {
                let trackStub = this.sandbox.stub(appInsights.core, "track");

                // Act
                appInsights.startTrackEvent(testValues.name);
                this.clock.tick(testValues.duration);
                appInsights.stopTrackEvent(testValues.name, testValues.customProperties);
                Assert.ok(trackStub.calledOnce, "single page view tracking stopped");

                // Test
                var telemetry: ITelemetryItem = trackStub.args[0][0];
                Assert.equal(testValues.name, telemetry.baseData.name);
                Assert.deepEqual(testValues.customProperties, telemetry.data);

                // Act
                trackStub.reset();
                appInsights.startTrackEvent(testValues.name);
                this.clock.tick(testValues.duration);
                appInsights.stopTrackEvent(testValues.name, testValues.customProperties);
                Assert.ok(trackStub.calledOnce, "single page view tracking stopped");

                // Test
                telemetry = trackStub.args[0][0];
                Assert.equal(testValues.name, telemetry.baseData.name);
                Assert.deepEqual(testValues.customProperties, telemetry.data);
            }
        });

        this.testCase({
            name: 'Timing Tests: Multiple Start/StopTrackEvent',
            test: () => {
                // Setup
                let trackStub = this.sandbox.stub(appInsights.core, "track");
                const testValues2 = {
                    name: "test2",
                    duration: 500
                };

                // Act
                appInsights.startTrackEvent(testValues.name);
                appInsights.startTrackEvent(testValues2.name);

                this.clock.tick(testValues2.duration);
                appInsights.stopTrackEvent(testValues2.name);
                Assert.ok(trackStub.calledOnce, "single event tracking stopped for " + testValues2.name);

                this.clock.tick(testValues.duration);
                appInsights.stopTrackEvent(testValues.name, testValues.customProperties);
                Assert.ok(trackStub.calledTwice, "single event tracking stopped for " + testValues.name);

                // Test "test2"
                const firstEvent: ITelemetryItem = trackStub.args[0][0];
                Assert.equal(testValues2.name, firstEvent.baseData.name);

                // Test "test1"
                const secondEvent: ITelemetryItem = trackStub.args[1][0];
                Assert.equal(testValues.name, secondEvent.baseData.name);
                Assert.deepEqual(testValues.customProperties, secondEvent.data)
            }
        });

        this.testCase({
            name: 'Timing Tests: stopTrackPage called without a corresponing start',
            test: () => {
                // Setup
                var logStub = this.sandbox.stub(appInsights.core.logger, "throwInternal");

                // Act
                appInsights.stopTrackEvent("Event1");

                // Test
                Assert.ok(logStub.calledOnce, "calling stopTrackEvent without a corrensponding start triggers warning to user");
            }
        });

        this.testCase({
            name: 'Timing Tests: Start/StopTrackEvent has correct duration',
            test: () => {
                // Setup
                var testValues1 = {
                    name: "test1",
                    duration: 300
                };

                var testValues2 = {
                    name: "test2",
                    duration: 200
                };
                let trackStub = this.sandbox.stub(appInsights.core, "track");
                this.clock.tick(55);

                // Act
                appInsights.startTrackEvent(testValues1.name);
                this.clock.tick(testValues1.duration);
                appInsights.stopTrackEvent(testValues1.name);

                appInsights.startTrackEvent(testValues2.name);
                this.clock.tick(testValues2.duration);
                appInsights.stopTrackEvent(testValues2.name);

                // Test
                // TestValues1
                let telemetry: ITelemetryItem = trackStub.args[0][0];
                Assert.equal(testValues1.name, telemetry.baseData.name);
                Assert.equal(testValues1.duration, telemetry.data.duration);

                // TestValues2
                telemetry = trackStub.args[1][0];
                Assert.equal(testValues2.name, telemetry.baseData.name);
                Assert.equal(testValues2.duration, telemetry.data.duration);
            }
        });

        this.testCase({
            name: 'Timing Tests: Start/StopTrackEvent custom duration is not overridden',
            test: () => {
                // Setup
                var testValues2 = {
                    name: "name2",
                    url: "url",
                    duration: 345,
                    customProperties: {
                        "property1": 5,
                        "duration": 777
                    }
                };
                let trackStub = this.sandbox.stub(appInsights.core, "track");
                this.clock.tick(10);

                // Act
                appInsights.startTrackEvent(testValues2.name);
                this.clock.tick(testValues2.duration);
                appInsights.stopTrackEvent(testValues2.name, testValues2.customProperties);
                Assert.ok(trackStub.calledOnce, "single page view tracking stopped");

                // Verify
                let telemetry: ITelemetryItem = trackStub.args[0][0];
                Assert.equal(testValues2.name, telemetry.baseData.name);
                Assert.deepEqual(testValues2.customProperties, telemetry.data);
            }
        });
    }

    private addTrackExceptionTests(): void {
        this.testCase({
            name: "TrackExceptionTests: trackException accepts single exception and an array of exceptions",
            test: () => {
                // setup
                const plugin = new TestPlugin();
                var core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                var appInsights = new ApplicationInsights();
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                let trackStub = this.sandbox.stub(appInsights.core, "track");

                // Test
                appInsights.trackException({error: new Error(), severityLevel: SeverityLevel.Critical});
                Assert.ok(trackStub.calledOnce, "single exception is tracked");
                appInsights.trackException({error: [new Error()]});
                Assert.ok(trackStub.calledTwice, "array of exceptions is tracked");
            }
        });

        this.testCase({
            name: "TrackExceptionTests: trackException allows logging errors with different severity level",
            test: () => {
                // setup
                const plugin = new TestPlugin();
                var core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                var appInsights = new ApplicationInsights();
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                let trackStub = this.sandbox.stub(appInsights.core, "track");

                // Test
                appInsights.trackException({error: new Error(), severityLevel: SeverityLevel.Critical});
                Assert.ok(trackStub.calledOnce, "single exception is tracked");
                Assert.equal(SeverityLevel.Critical, trackStub.firstCall.args[0].baseData.severityLevel);

                trackStub.reset();

                appInsights.trackException({error: new Error(), severityLevel: SeverityLevel.Error});
                Assert.ok(trackStub.calledOnce, "single exception is tracked");
                Assert.equal(SeverityLevel.Error, trackStub.firstCall.args[0].baseData.severityLevel);
            }
        });
    }

    private addOnErrorTests(): void {
        this.testCase({
            name: "OnErrorTests: _onerror creates a dump of unexpected error thrown by trackException for logging",
            test: () => {
                // setup
                const plugin = new TestPlugin();
                var core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                const appInsights = new ApplicationInsights();
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);

                const unexpectedError = new Error();
                const dumpSpy = this.sandbox.stub(Util, "dump");
                this.sandbox.stub(appInsights, "trackException").throws(unexpectedError);

                // Act
                appInsights._onerror({message: "msg", url: "some://url", lineNumber: 123, columnNumber: 456, error: unexpectedError});

                // Assert
                Assert.ok(dumpSpy.calledWith(unexpectedError))
            }
        });

        this.testCase({
            name: "OnErrorTests: _onerror stringifies error object",
            test: () => {
                // setup
                const plugin = new TestPlugin();
                var core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                var appInsights = new ApplicationInsights();
                appInsights.initialize({ instrumentationKey: "ikey"}, core, []);
                var dumpSpy = this.sandbox.spy(Util, "dump")
                var unexpectedError = new Error("some message");
                var stub = this.sandbox.stub(appInsights, "trackException").throws(unexpectedError);

                // Act
                appInsights._onerror({message: "any message", url: "any://url", lineNumber: 123, columnNumber: 456, error: unexpectedError});

                // Test
                Assert.ok(dumpSpy.returnValues[0].indexOf("stack: ") != -1);
                Assert.ok(dumpSpy.returnValues[0].indexOf(`message: '${unexpectedError.message}'`) != -1);
                Assert.ok(dumpSpy.returnValues[0].indexOf("name: 'Error'") != -1);
            }
        });

        this.testCase({
            name: "OnErrorTests: _onerror logs name of unexpected error thrown by trackException for diagnostics",
            test: () => {
                // setup
                const plugin = new TestPlugin();
                const core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                const appInsights = new ApplicationInsights();
                appInsights.initialize({ instrumentationKey: "key" }, core, []);

                const throwInternal = this.sandbox.spy(appInsights.core.logger, "throwInternal");
                const nameStub = this.sandbox.stub(Util, "getExceptionName");

                this.sandbox.stub(appInsights, "trackException").throws(new Error());
                const expectedErrorName: string = "test error";

                nameStub.returns(expectedErrorName);

                appInsights._onerror({message: "some message", url: "some://url", lineNumber: 1234, columnNumber: 5678, error: new Error()});

                Assert.ok(throwInternal.calledOnce, "throwInternal called once");
                const logMessage: string = throwInternal.getCall(0).args[2];
                Assert.notEqual(-1, logMessage.indexOf(expectedErrorName));
            }
        });

        this.testCase({
            name: "OnErrorTests: _onerror adds document URL in case of CORS error",
            test: () => {
                // setup
                const plugin = new TestPlugin();
                var core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                const appInsights = new ApplicationInsights();
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                const trackSpy = this.sandbox.spy(appInsights.core, "track");

                // Act
                appInsights._onerror({message: "Script error.", url: "", lineNumber: 0, columnNumber: 0, error: null});

                // Assert
                Assert.equal(document.URL, trackSpy.args[0][0].baseData.url);
            }
        });

        this.testCase({
            name: "OnErrorTests: _onerror adds document URL in case of no CORS error",
            test: () => {
                // setup
                const plugin = new TestPlugin();
                var core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                var appInsights = new ApplicationInsights();
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                const trackExceptionSpy = this.sandbox.spy(appInsights, "trackException");

                // Act
                // Last arg is not an error/null which will be treated as not CORS issue
                appInsights._onerror({message: "Script error.", url: "", lineNumber: 0, columnNumber: 0, error: <any>new Object()});

                // Assert
                // properties are passed as a 3rd parameter
                Assert.equal(document.URL, trackExceptionSpy.args[0][1].url);
            }
        });
    }

    private addStartStopTrackPageTests() {
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
                const plugin = new TestPlugin();
                var core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
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
                Assert.equal(testValues.name, actual.name);
                Assert.equal(testValues.url, actual.uri);

                var actualProperties = spy.args[0][1];
                Assert.equal(testValues.duration, actualProperties.duration, "duration is calculated and sent correctly");
                Assert.equal(testValues.properties.property1, actualProperties.property1);
                Assert.equal(testValues.properties.property2, actualProperties.property2);
            }
        });
/* TODO: Commented until ai.context is valid
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
                Assert.equal(testValues.duration, telemetry.data.duration);
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
                Assert.deepEqual(testValues.properties, telemetry.data);
            }
        });
        */

        this.testCase({
            name: "Timing Tests: Multiple startTrackPage",
            test:
                () => {
                    // setup
                    const plugin = new TestPlugin();
                    var core = new AppInsightsCore();
                    core.initialize(
                        {instrumentationKey: "key"},
                        [plugin]
                    );
                    var appInsights = new ApplicationInsights();
                    appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                    var logStub = this.sandbox.stub(core.logger, "throwInternal");
                    core.logger.consoleLoggingLevel = () => 999;

                    // act
                    appInsights.startTrackPage();
                    appInsights.startTrackPage();

                    // verify
                    Assert.ok(logStub.calledOnce, "calling start twice triggers warning to user");
                }
        });

        this.testCase({
            name: "Timing Tests: stopTrackPage called without a corresponding start",
            test:
                () => {
                    // setup
                    const plugin = new TestPlugin();
                    var core = new AppInsightsCore();
                    core.initialize(
                        {instrumentationKey: "key"},
                        [plugin]
                    );
                    var appInsights = new ApplicationInsights();
                    appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                    var logStub = this.sandbox.stub(core.logger, "throwInternal");
                    core.logger.consoleLoggingLevel = () => 999;

                    // act
                    appInsights.stopTrackPage();

                    // verify
                    Assert.ok(logStub.calledOnce, "calling stop without a corresponding start triggers warning to user");
                }
        });
    }

    private getFirstResult(action: string, trackStub: SinonStub, skipSessionState?: boolean): ITelemetryItem {
        const index: number = skipSessionState ? 1 : 0;

        Assert.ok(trackStub.args && trackStub.args[index] && trackStub.args[index][0], "track was called for: " + action);
        return <ITelemetryItem>trackStub.args[index][0];
    }
}

class TestPlugin implements IPlugin {
    private _config: IConfiguration;
    priority: number = 100;

    public initialize(config: IConfiguration) {
        this._config = config;
        // do custom one time initialization
    }
}