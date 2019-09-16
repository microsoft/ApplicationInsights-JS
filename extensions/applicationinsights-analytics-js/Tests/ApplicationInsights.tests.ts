/// <reference path="./TestFramework/Common.ts" />

import { Util, Exception, SeverityLevel, Trace, PageViewPerformance, IConfig, IExceptionInternal } from "@microsoft/applicationinsights-common";
import {
    ITelemetryItem, AppInsightsCore,
    IPlugin, IConfiguration
} from "@microsoft/applicationinsights-core-js";
import { ApplicationInsights } from "../src/JavaScriptSDK/ApplicationInsights";

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
            name: 'enableAutoRouteTracking: event listener is added to the popstate event',
            test: () => {
                // Setup
                const appInsights = new ApplicationInsights();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const eventListenerStub = this.sandbox.stub(window, 'addEventListener');

                // Act
                core.initialize({
                    instrumentationKey: '',
                    enableAutoRouteTracking: true
                } as IConfig & IConfiguration, [appInsights, channel]);

                // Assert
                Assert.ok(eventListenerStub.calledTwice);
                Assert.equal(eventListenerStub.args[0][0], "popstate");
                Assert.equal(eventListenerStub.args[1][0], "locationchange");
            }
        });

        this.testCase({
            name: 'enableAutoRouteTracking: route changes trigger a new pageview',
            test: () => {
                // Setup
                const appInsights = new ApplicationInsights();
                appInsights.autoRoutePVDelay = 500;
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                appInsights['_properties'] = ({
                    context: { telemetryTrace: { traceID: 'not set', name: 'name not set' } }
                } as any)
                appInsights['_prevUri'] = "firstUri";
                appInsights['_currUri'] = "secondUri";
                const trackPageViewStub = this.sandbox.stub(appInsights, 'trackPageView');

                // Act
                core.initialize({
                    instrumentationKey: '',
                    enableAutoRouteTracking: true
                } as IConfig & IConfiguration, [appInsights, channel]);
                window.dispatchEvent(Util.createDomEvent('locationchange'));
                this.clock.tick(500);

                // Assert
                Assert.ok(trackPageViewStub.calledOnce);
                Assert.ok(appInsights['_properties'].context.telemetryTrace.traceID);
                Assert.ok(appInsights['_properties'].context.telemetryTrace.name);
                Assert.notEqual(appInsights['_properties'].context.telemetryTrace.traceID, 'not set', 'current operation id is updated after route change');
                Assert.notEqual(appInsights['_properties'].context.telemetryTrace.name, 'name not set', 'current operation name is updated after route change');
                Assert.equal(appInsights['_prevUri'], 'secondUri', "the previous uri is stored on variable _prevUri");
                Assert.equal(appInsights['_currUri'], window.location.href, "the current uri is stored on variable _currUri");
                Assert.equal(appInsights['_prevUri'], trackPageViewStub.args[0][0].refUri, "previous uri is assigned to refUri and send as an argument of trackPageview method");
            }
        });

        this.testCase({
            name: 'enableAutoRouteTracking: route changes trigger a new pageview with correct refUri when route changes happening before the timer autoRoutePVDelay stops',
            test: () => {
                // Setup
                const appInsights = new ApplicationInsights();
                appInsights.autoRoutePVDelay = 500;
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                appInsights['_properties'] = ({
                    context: { telemetryTrace: { traceID: 'not set', name: 'name not set' } }
                } as any)
                appInsights['_prevUri'] = "firstUri";
                const trackPageViewStub = this.sandbox.stub(appInsights, 'trackPageView');

                // Act
                core.initialize({
                    instrumentationKey: '',
                    enableAutoRouteTracking: true
                } as IConfig & IConfiguration, [appInsights, channel]);
                window.dispatchEvent(Util.createDomEvent('locationchange'));
                this.clock.tick(200);

                // set up second dispatch
                window.dispatchEvent(Util.createDomEvent('locationchange'));
                this.clock.tick(500);


                // Assert
                Assert.ok(trackPageViewStub.calledTwice);
                Assert.ok(appInsights['_properties'].context.telemetryTrace.traceID);
                Assert.ok(appInsights['_properties'].context.telemetryTrace.name);
                Assert.notEqual(appInsights['_properties'].context.telemetryTrace.traceID, 'not set', 'current operation id is updated after route change');
                Assert.notEqual(appInsights['_properties'].context.telemetryTrace.name, 'name not set', 'current operation name is updated after route change');
                // first trackPageView event
                Assert.equal(trackPageViewStub.args[0][0].refUri, 'firstUri', "first trackPageview event: refUri grabs the value of existing _prevUri");
                Assert.equal(appInsights['_currUri'], window.location.href, "first trackPageview event: the current uri is stored on variable _currUri");
                // second trackPageView event
                Assert.equal(trackPageViewStub.args[1][0].refUri, window.location.href, "second trackPageview event: refUri grabs the value of updated _prevUri, which is the first pageView event's _currUri");
            }
        });

        this.testCase({
            name: 'enableAutoRouteTracking: (IE9) app does not crash if history.pushState does not exist',
            test: () => {
                // Setup
                const originalPushState = history.pushState;
                const originalReplaceState = history.replaceState;
                history.pushState = null;
                history.replaceState = null;
                const appInsights = new ApplicationInsights();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                appInsights['_properties'] = ({
                    context: { telemetryTrace: { traceID: 'not set'}}
                } as any)
                this.sandbox.stub(appInsights, 'trackPageView');

                // Act
                core.initialize({
                    instrumentationKey: '',
                    enableAutoRouteTracking: true
                } as IConfig & IConfiguration, [appInsights, channel]);
                window.dispatchEvent(Util.createDomEvent('locationchange'));

                // Assert
                Assert.ok(true, 'App does not crash when history object is incomplete');

                // Cleanup
                history.pushState = originalPushState;
                history.replaceState = originalReplaceState;
            }
        });

        this.testCase({
            name: 'AppInsightsTests: PageVisitTimeManager is constructed when analytics plugin is initialized',
            test: () => {
                // Setup
                const channel = new ChannelPlugin();
                const core = new AppInsightsCore();
                const appInsights: ApplicationInsights = new ApplicationInsights();

                // Act
                const config = {
                    instrumentationKey: 'ikey'
                };

                core.initialize(
                    config,
                    [appInsights, channel]
                );
                const pvtm = appInsights['_pageVisitTimeManager'];

                // Assert
                Assert.ok(pvtm)
                Assert.ok(pvtm['_logger']);
                Assert.ok(pvtm['pageVisitTimeTrackingHandler']);
            }
        });

        this.testCase({
            name: 'AppInsightsTests: PageVisitTimeManager is available when config.autoTrackPageVisitTime is true and trackPageView is called',
            test: () => {
                // Setup
                const channel = new ChannelPlugin();
                const core = new AppInsightsCore();
                const appInsights: ApplicationInsights = new ApplicationInsights();

                const config = {
                    instrumentationKey: 'ikey',
                    autoTrackPageVisitTime: true
                };
                core.initialize(
                    config,
                    [appInsights, channel]
                );
                const pvtm = appInsights['_pageVisitTimeManager'];
                const pvtmSpy = this.sandbox.spy(pvtm, 'trackPreviousPageVisit');

                Assert.ok(pvtm)
                Assert.ok(pvtmSpy.notCalled);

                // Act
                appInsights.trackPageView();

                // Assert
                Assert.ok(pvtmSpy.calledOnce);
            }
        });

        this.testCase({
            name: 'AppInsightsTests: config can be set from root',
            test: () => {
                // Setup
                const appInsights: ApplicationInsights = new ApplicationInsights();

                // Act
                const config = {
                    instrumentationKey: 'instrumentation_key',
                    samplingPercentage: 12,
                    accountId: 'aaa',
                    extensionConfig: {
                        [appInsights.identifier]: {
                            accountId: 'def'
                        }
                    }
                };
                appInsights.initialize(config, new AppInsightsCore(), []);

                // Assert
                Assert.equal(12, appInsights.config.samplingPercentage);
                Assert.notEqual('aaa', appInsights.config.accountId);
                Assert.equal('def', appInsights.config.accountId);
                Assert.equal('instrumentation_key', appInsights['_globalconfig'].instrumentationKey);
            }
        });

        this.testCase({
            name: "AppInsightsTests: public members are correct",
            test: () => {
                // setup
                const appInsights = new ApplicationInsights();
                // the assert test will only see config as part of an object member if it has been initialized. Not sure how it worked before
                appInsights.config = {};
                const leTest = (name) => {
                    // assert
                    Assert.ok(name in appInsights, name + " exists");
                }

                // act
                const members = [
                    "config",
                    "trackException",
                    "_onerror",
                    "trackEvent",
                    "trackTrace",
                    "trackMetric",
                    "trackPageView",
                    "trackPageViewPerformance",
                    "startTrackPage",
                    "stopTrackPage"
                ];
                while (members.length) {
                    leTest(members.pop());
                }
            }
        });

        this.addGenericTests();
        this.addStartStopTrackPageTests();
        this.addTrackExceptionTests();
        this.addOnErrorTests();
        this.addTrackMetricTests();
        this.addTelemetryInitializerTests();
    }

    private addGenericTests(): void {
        this.testCase({
            name: 'AppInsightsGenericTests: envelope type, data type, and ikey are correct',
            test: () => {
                // setup
                const iKey: string = "BDC8736D-D8E8-4B69-B19B-B0CE6B66A456";
                const iKeyNoDash: string = "BDC8736DD8E84B69B19BB0CE6B66A456";
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: iKey},
                    [plugin]
                );
                const appInsights = new ApplicationInsights();
                appInsights.initialize({instrumentationKey: core.config.instrumentationKey}, core, []);
                const trackStub = this.sandbox.stub(appInsights.core, "track");

                let envelope: ITelemetryItem;
                const test = (action, expectedEnvelopeType, expectedDataType, test?: () => void) => {
                    action();
                    envelope = this.getFirstResult(action, trackStub);
                    Assert.equal("", envelope.iKey, "envelope iKey");
                    Assert.equal(expectedEnvelopeType, envelope.name, "envelope name");
                    Assert.equal(expectedDataType, envelope.baseType, "data type name");
                    if (typeof test === 'function') {test();}
                    trackStub.reset();
                };

                // Test
                test(() => appInsights.trackException({exception: new Error(), severityLevel: SeverityLevel.Critical}), Exception.envelopeType, Exception.dataType)
                test(() => appInsights.trackException({error: new Error(), severityLevel: SeverityLevel.Critical}), Exception.envelopeType, Exception.dataType)
                test(() => appInsights.trackTrace({message: "some string"}), Trace.envelopeType, Trace.dataType);
                test(() => appInsights.trackPageViewPerformance({name: undefined, uri: undefined, measurements: {somefield: 123}}, {vpHeight: 123}), PageViewPerformance.envelopeType, PageViewPerformance.dataType, () => {
                    Assert.deepEqual(undefined, envelope.baseData.properties, 'Properties does not exist in Part B');
                });
            }
        });

        this.testCase({
            name: 'AppInsightsGenericTests: public APIs call track',
            test: () => {
                // setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                const appInsights = new ApplicationInsights();
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                const senderStub = this.sandbox.stub(appInsights.core, "track");

                // Act
                appInsights.trackException({exception: new Error(), severityLevel: SeverityLevel.Critical});
                appInsights.trackException({error: new Error(), severityLevel: SeverityLevel.Critical});
                this.clock.tick(1);

                // Test
                Assert.ok(senderStub.calledTwice, "Telemetry is sent when master switch is on");
            }
        });
    }

    private addTrackExceptionTests(): void {
        this.testCase({
            name: "TrackExceptionTests: trackException accepts single exception",
            test: () => {
                // setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                const appInsights = new ApplicationInsights();
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                const trackStub = this.sandbox.stub(appInsights.core, "track");

                // Test
                appInsights.trackException({error: new Error(), severityLevel: SeverityLevel.Critical});
                Assert.ok(trackStub.calledOnce, "single exception is tracked");

                // Verify ver is a string, as required by CS4.0
                const baseData = (trackStub.args[0][0] as ITelemetryItem).baseData as IExceptionInternal;
                Assert.equal("string", typeof baseData.ver, "Exception.ver should be a string for CS4.0");
                Assert.equal("4.0", baseData.ver);
            }
        });

        this.testCase({
            name: "TrackExceptionTests: trackException allows logging errors with different severity level",
            test: () => {
                // setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                const appInsights = new ApplicationInsights();
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                const trackStub = this.sandbox.stub(appInsights.core, "track");

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
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
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
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                const appInsights = new ApplicationInsights();
                appInsights.initialize({ instrumentationKey: "ikey"}, core, []);
                const dumpSpy = this.sandbox.spy(Util, "dump")
                const unexpectedError = new Error("some message");
                const stub = this.sandbox.stub(appInsights, "trackException").throws(unexpectedError);

                // Act
                appInsights._onerror({message: "any message", url: "any://url", lineNumber: 123, columnNumber: 456, error: unexpectedError});

                // Test
                Assert.ok(dumpSpy.returnValues[0].indexOf("stack: ") != -1);
                Assert.ok(dumpSpy.returnValues[0].indexOf(`message: '${unexpectedError.message}'`) !== -1);
                Assert.ok(dumpSpy.returnValues[0].indexOf("name: 'Error'") !== -1);
            }
        });

        this.testCase({
            name: "OnErrorTests: _onerror logs name of unexpected error thrown by trackException for diagnostics",
            test: () => {
                // setup
                const plugin = new ChannelPlugin();
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
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
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
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                const appInsights = new ApplicationInsights();
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                const trackExceptionSpy = this.sandbox.spy(appInsights, "trackException");

                // Act
                // Last arg is not an error/null which will be treated as not CORS issue
                appInsights._onerror({message: "Script error.", url: "", lineNumber: 0, columnNumber: 0, error: new Object() as any});

                // Assert
                // properties are passed as a 3rd parameter
                Assert.equal(document.URL, trackExceptionSpy.args[0][1].url);
            }
        });
    }

    private addStartStopTrackPageTests() {
        const testValues = {
            name: "name",
            url: "url",
            duration: 200,
            properties: {
                "property1": "5",
                "property2": "10"
            },
            measurements: {
                "measurement": 300
            }
        };

        this.testCase({
            name: "Timing Tests: Start/StopPageView pass correct duration",
            test: () => {
                // setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                const appInsights = new ApplicationInsights();
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                const spy = this.sandbox.spy(appInsights, "sendPageViewInternal");
                this.clock.tick(1);

                // act
                appInsights.startTrackPage(testValues.name);
                this.clock.tick(testValues.duration);
                appInsights.stopTrackPage(testValues.name, testValues.url, testValues.properties);

                // verify
                Assert.ok(spy.calledOnce, "stop track page view sent data");
                const actual = spy.args[0][0];
                Assert.equal(testValues.name, actual.name);
                Assert.equal(testValues.url, actual.uri);

                const actualProperties = actual.properties;
                Assert.equal(testValues.duration, actualProperties.duration, "duration is calculated and sent correctly");
                Assert.equal(testValues.properties.property1, actualProperties.property1);
                Assert.equal(testValues.properties.property2, actualProperties.property2);
            }
        });
        this.testCase({
            name: "Timing Tests: Start/StopPageView tracks single page view with no parameters",
            test: () => {
                // setup
                const core = new AppInsightsCore();
                this.sandbox.stub(core, "getTransmissionControl");
                const appInsights = new ApplicationInsights();
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                const trackStub = this.sandbox.stub(appInsights.core, "track");
                this.clock.tick(10);        // Needed to ensure the duration calculation works

                // act
                appInsights.startTrackPage();
                this.clock.tick(testValues.duration);
                appInsights.stopTrackPage();
                Assert.ok(trackStub.calledOnce, "single page view tracking stopped");

                // verify
                const telemetry: ITelemetryItem = trackStub.args[0][0];
                Assert.equal(window.document.title, telemetry.baseData.name);
                Assert.equal(testValues.duration, telemetry.baseData.properties.duration);
            }
        });

        this.testCase({
            name: "Timing Tests: Multiple Start/StopPageView track single pages view ",
            test: () => {
                // setup
                const core = new AppInsightsCore();
                this.sandbox.stub(core, "getTransmissionControl");
                const appInsights = new ApplicationInsights();
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                const trackStub = this.sandbox.stub(appInsights.core, "track");
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
                let telemetry: ITelemetryItem = trackStub.args[0][0];
                Assert.equal(window.document.title, telemetry.baseData.name);
                Assert.equal(window.document.location.href, telemetry.baseData.uri);

                // // All parameters
                telemetry = trackStub.args[1][0];
                Assert.equal(testValues.name, telemetry.baseData.name);
                Assert.equal(testValues.url, telemetry.baseData.uri);
                Assert.deepEqual(testValues.properties, telemetry.baseData.properties);
            }
        });

        this.testCase({
            name: "Timing Tests: Multiple startTrackPage",
            test:
                () => {
                    // setup
                    const plugin = new ChannelPlugin();
                    const core = new AppInsightsCore();
                    core.initialize(
                        {instrumentationKey: "key"},
                        [plugin]
                    );
                    const appInsights = new ApplicationInsights();
                    appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                    const logStub = this.sandbox.stub(core.logger, "throwInternal");
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
                    const plugin = new ChannelPlugin();
                    const core = new AppInsightsCore();
                    core.initialize(
                        {instrumentationKey: "key"},
                        [plugin]
                    );
                    const appInsights = new ApplicationInsights();
                    appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                    const logStub = this.sandbox.stub(core.logger, "throwInternal");
                    core.logger.consoleLoggingLevel = () => 999;

                    // act
                    appInsights.stopTrackPage();

                    // verify
                    Assert.ok(logStub.calledOnce, "calling stop without a corresponding start triggers warning to user");
                }
        });
    }

    private addTrackMetricTests() {
        this.testCase({
            name: 'TrackMetricTests: treackMetric batches metrics sent in a hot loop',
            test: () => {
                // Setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                const appInsights = new ApplicationInsights();
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                const trackStub = this.sandbox.stub(appInsights.core, "track");

                // Act
                appInsights.trackMetric({name: "test metric", average: 0});
                this.clock.tick(1);

                // Verify

                Assert.ok(trackStub.calledOnce, "core.track was called once after sending one metric");
                trackStub.reset();

                // Act
                for (let i = 0; i < 100; i++) {
                    appInsights.trackMetric({name: "test metric", average: 0});
                }
                this.clock.tick(1);

                // Test
                Assert.equal(100, trackStub.callCount, "core.track was called 100 times for sending 100 metrics");
            }
        });
    }

    private addTelemetryInitializerTests(): void {
        this.testCase({
            name: "TelemetryContext: onBeforeSendTelemetry is called within track() and gets the envelope as an argument",
            test: () => {
                // Setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                const appInsights = new ApplicationInsights();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin, appInsights]
                );
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, [plugin, appInsights]);
                plugin.initialize({instrumentationKey: 'ikey'}, core, [plugin, appInsights]);

                const trackStub = this.sandbox.spy(appInsights.core['_channelController'].channelQueue[0][0], 'processTelemetry');
                const telemetryInitializer = {
                    initializer: (envelope) => { }
                }
                const spy = this.sandbox.spy(telemetryInitializer, "initializer");

                // act
                appInsights.addTelemetryInitializer(telemetryInitializer.initializer);
                appInsights.trackEvent({name: 'test event'});
                this.clock.tick(1);

                // verify
                Assert.ok(spy.calledOnce, 'telemetryInitializer was called');
                Assert.deepEqual(trackStub.args[0][0], spy.args[0][0], 'expected envelope is used');
            }
        });

        this.testCase({
            name: "TelemetryContext: onBeforeSendTelemetry changes the envelope props and sender gets them",
            test: () => {
                // Setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                const appInsights = new ApplicationInsights();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin, appInsights]
                );
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, [plugin, appInsights]);
                plugin.initialize({instrumentationKey: 'ikey'}, core, [plugin, appInsights]);
                const trackStub = this.sandbox.spy(appInsights.core['_channelController'].channelQueue[0][0], 'processTelemetry');
                const nameOverride = "my unique name";
                const telemetryInitializer = {
                    initializer: (envelope) => {
                        envelope.name = nameOverride;
                        return true;}
                }

                // act
                appInsights.addTelemetryInitializer(telemetryInitializer.initializer);
                appInsights.trackTrace({message: 'test message'});
                this.clock.tick(1);

                // verify
                Assert.ok(trackStub.calledOnce, "channel sender was called");

                const envelope: ITelemetryItem = trackStub.args[0][0];
                Assert.equal(envelope.name, nameOverride, 'expected envelope is used');
            }
        });

        this.testCase({
            name: "TelemetryContext: telemetry initializer can modify the contents of an envelope",
            test: () => {
                // Setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                const appInsights = new ApplicationInsights();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin, appInsights]
                );
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, [plugin, appInsights]);
                plugin.initialize({instrumentationKey: 'ikey'}, core, [plugin, appInsights]);
                const trackStub = this.sandbox.spy(appInsights.core['_channelController'].channelQueue[0][0], 'processTelemetry');

                const messageOverride = "my unique name";
                const propOverride = "val1";
                const telemetryInitializer = {
                    // This illustrates how to use telemetry initializer (onBeforeSendTelemetry)
                    // to access/ modify the contents of an envelope.
                    initializer: (envelope) => {
                        if (envelope.baseType ===
                            Trace.dataType) {
                            const telemetryItem = envelope.baseData;
                            telemetryItem.message = messageOverride;
                            telemetryItem.properties = telemetryItem.properties || {};
                            telemetryItem.properties["prop1"] = propOverride;
                            return true;
                        }
                    }
                }

                appInsights.addTelemetryInitializer(telemetryInitializer.initializer);

                // act
                appInsights.trackTrace({message: 'test message'});

                // verify
                Assert.ok(trackStub.calledOnce, "sender should be called");

                const envelope: ITelemetryItem = trackStub.args[0][0];
                Assert.equal(messageOverride, envelope.baseData.message);
                Assert.equal(propOverride, envelope.baseData.properties["prop1"]);
            }
        });

        this.testCase({
            name: "TelemetryContext: all added telemetry initializers get invoked",
            test: () => {
                // Setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                const appInsights = new ApplicationInsights();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin, appInsights]
                );
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, [plugin, appInsights]);
                plugin.initialize({instrumentationKey: 'ikey'}, core, [plugin, appInsights]);
                const initializer1 = { init: () => { } };
                const initializer2 = { init: () => { } };
                const spy1 = this.sandbox.spy(initializer1, "init");
                const spy2 = this.sandbox.spy(initializer2, "init");

                // act
                appInsights.addTelemetryInitializer(initializer1.init);
                appInsights.addTelemetryInitializer(initializer2.init);

                appInsights.trackTrace({message: 'test message'});

                // verify
                Assert.ok(spy1.calledOnce);
                Assert.ok(spy2.calledOnce);
            }
        });

        this.testCase({
            name: "TelemetryContext: telemetry initializer - returning false means don't send an item",
            test: () => {
                // Setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                const appInsights = new ApplicationInsights();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin, appInsights]
                );
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, [plugin, appInsights]);
                plugin.initialize({instrumentationKey: 'ikey'}, core, [plugin, appInsights]);
                const trackStub = this.sandbox.spy(appInsights.core['_channelController'].channelQueue[0][0], 'processTelemetry');

                // act
                appInsights.addTelemetryInitializer(() => false);
                appInsights.trackTrace({message: 'test message'});

                // verify
                Assert.ok(trackStub.notCalled);
            }
        });

        this.testCase({
            name: "TelemetryContext: telemetry initializer - returning void means do send an item (back compact with older telemetry initializers)",
            test: () => {
                // Setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                const appInsights = new ApplicationInsights();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin, appInsights]
                );
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, [plugin, appInsights]);
                plugin.initialize({instrumentationKey: 'ikey'}, core, [plugin, appInsights]);
                const trackStub = this.sandbox.spy(appInsights.core['_channelController'].channelQueue[0][0], 'processTelemetry');

                // act
                appInsights.addTelemetryInitializer(() => { return; });
                appInsights.trackTrace({message: 'test message'});

                // verify
                Assert.ok(trackStub.calledOnce); // TODO: use sender
            }
        });

        this.testCase({
            name: "TelemetryContext: telemetry initializer - returning true means do send an item",
            test: () => {
                // Setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                const appInsights = new ApplicationInsights();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin, appInsights]
                );
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, [plugin, appInsights]);
                plugin.initialize({instrumentationKey: 'ikey'}, core, [plugin, appInsights]);
                const trackStub = this.sandbox.spy(appInsights.core['_channelController'].channelQueue[0][0], 'processTelemetry');

                // act
                appInsights.addTelemetryInitializer(() => true);
                appInsights.trackTrace({message: 'test message'});

                // verify
                Assert.ok(trackStub.calledOnce);
            }
        });

        this.testCase({
            name: "TelemetryContext: telemetry initializer - if one of initializers returns false than item is not sent",
            test: () => {
                // Setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                const appInsights = new ApplicationInsights();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin, appInsights]
                );
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, [plugin, appInsights]);
                plugin.initialize({instrumentationKey: 'ikey'}, core, [plugin, appInsights]);
                const trackStub = this.sandbox.spy(appInsights.core['_channelController'].channelQueue[0][0], 'processTelemetry');

                // act
                appInsights.addTelemetryInitializer(() => true);
                appInsights.addTelemetryInitializer(() => false);

                appInsights.trackTrace({message: 'test message'});

                // verify
                Assert.ok(trackStub.notCalled);
            }
        });

        this.testCase({
            name: "TelemetryContext: telemetry initializer - if one of initializers returns false (any order) than item is not sent",
            test: () => {
                // Setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                const appInsights = new ApplicationInsights();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin, appInsights]
                );
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, [plugin, appInsights]);
                plugin.initialize({instrumentationKey: 'ikey'}, core, [plugin, appInsights]);
                const trackStub = this.sandbox.spy(appInsights.core['_channelController'].channelQueue[0][0], 'processTelemetry');

                // act
                appInsights.addTelemetryInitializer(() => false);
                appInsights.addTelemetryInitializer(() => true);

                appInsights.trackTrace({message: 'test message'});

                // verify
                Assert.ok(trackStub.notCalled);
            }
        });

        this.testCase({
            name: "TelemetryContext: telemetry initializer - returning not boolean/undefined/null means do send an item (back compat with older telemetry initializers)",
            test: () => {
                // Setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                const appInsights = new ApplicationInsights();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin, appInsights]
                );
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, [plugin, appInsights]);
                plugin.initialize({instrumentationKey: 'ikey'}, core, [plugin, appInsights]);
                const trackStub = this.sandbox.spy(appInsights.core['_channelController'].channelQueue[0][0], 'processTelemetry');

                // act
                appInsights.addTelemetryInitializer((() => "asdf") as any);
                appInsights.addTelemetryInitializer(() => null);
                appInsights.addTelemetryInitializer(() => undefined);
                appInsights.trackTrace({message: 'test message'});

                // verify
                Assert.ok(trackStub.calledOnce); // TODO: use sender
            }
        });

        this.testCase({
            name: "TelemetryContext: telemetry initializer - if one initializer fails then error logged and is still sent",
            test: () => {
                // Setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                const appInsights = new ApplicationInsights();
                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin, appInsights]
                );
                appInsights.initialize({ "instrumentationKey": "ikey" }, core, [plugin, appInsights]);
                plugin.initialize({instrumentationKey: 'ikey'}, core, [plugin, appInsights]);
                const trackStub = this.sandbox.spy(appInsights.core['_channelController'].channelQueue[0][0], 'processTelemetry');
                const logStub = this.sandbox.spy(appInsights.core.logger, "throwInternal")
                // act
                appInsights.addTelemetryInitializer(() => { throw new Error("Test error IGNORE"); });
                appInsights.addTelemetryInitializer(() => { });
                appInsights.trackTrace({message: 'test message'});

                // verify
                Assert.ok(trackStub.calledOnce);
                Assert.ok(logStub.calledOnce);

            }
        });
    }

    private getFirstResult(action: string, trackStub: SinonStub, skipSessionState?: boolean): ITelemetryItem {
        const index: number = skipSessionState ? 1 : 0;

        Assert.ok(trackStub.args && trackStub.args[index] && trackStub.args[index][0], "track was called for: " + action);
        return trackStub.args[index][0] as ITelemetryItem;
    }
}

class ChannelPlugin implements IPlugin {

    public isFlushInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;

    public identifier = "Sender";

    public priority: number = 1001;

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

    public processTelemetry(env: ITelemetryItem) {}

    setNextPlugin(next: any) {
        // no next setup
    }

    public initialize = (config: IConfiguration, core: AppInsightsCore, plugin: IPlugin[]) => {
    }

    private _processTelemetry(env: ITelemetryItem) {

    }
}
