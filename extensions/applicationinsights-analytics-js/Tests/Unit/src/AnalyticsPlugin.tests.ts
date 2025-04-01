import { 
    Assert, AITestClass, PollingAssert, EventValidator, TraceValidator, ExceptionValidator, 
    MetricValidator, PageViewPerformanceValidator, PageViewValidator, RemoteDepdencyValidator
} from "@microsoft/ai-test-framework";
import { SinonStub, SinonSpy } from 'sinon';
import { 
    Exception, SeverityLevel, Event, Trace, PageViewPerformance, IConfig, IExceptionInternal, 
    AnalyticsPluginIdentifier, IAppInsights, Metric, PageView, RemoteDependencyData, utlCanUseLocalStorage, createDomEvent 
} from "@microsoft/applicationinsights-common";
import { ITelemetryItem, AppInsightsCore, IPlugin, IConfiguration, IAppInsightsCore, setEnableEnvMocks, getLocation, dumpObj, __getRegisteredEvents, createCookieMgr, findAllScripts } from "@microsoft/applicationinsights-core-js";
import { Sender } from "@microsoft/applicationinsights-channel-js"
import { PropertiesPlugin } from "@microsoft/applicationinsights-properties-js";
import { AnalyticsPlugin } from "../../../src/JavaScriptSDK/AnalyticsPlugin";

declare class ExceptionHelper {
    capture: (appInsights:IAppInsights) => void;
    captureStrict: (appInsights:IAppInsights) => void;
    throw: (value:any) => void;
    throwCors: () => void;
    throwStrict: (value:any) => void;
    throwRuntimeException: (timeoutFunc: VoidFunction) => void;
    throwStrictRuntimeException: (timeoutFunc: VoidFunction) => void;
};

export class AnalyticsPluginTests extends AITestClass {
    private _onerror:any = null;
    private trackSpy:SinonSpy;
    private throwInternalSpy:SinonSpy;
    private exceptionHelper: any = new ExceptionHelper();
    private cookieMgr = createCookieMgr();

    constructor(name?: string, emulateIe?: boolean) {
        super(name, emulateIe);
        this.assertNoEvents = true;
        this.assertNoHooks = true;
    }

    public testInitialize() {
        this._onerror = window.onerror;
        setEnableEnvMocks(false);
        super.testInitialize();
        this.cookieMgr.set('ai_session', "");
        this.cookieMgr.set('ai_user', "");
        if (utlCanUseLocalStorage()) {
            window.localStorage.clear();
        }
    }

    public testCleanup() {
        super.testCleanup();
        this.cookieMgr.set('ai_session', "");
        this.cookieMgr.set('ai_user', "");
        if (utlCanUseLocalStorage()) {
            window.localStorage.clear();
        }
        window.onerror = this._onerror;
    }

    public causeException(cb:Function) {
        AITestClass.orgSetTimeout(() => {
            cb();
        }, 0);
    }

    public registerTests() {

        this.testCase({
            name: 'enableAutoRouteTracking: event listener is added to the popstate event',
            test: () => {
                // Setup
                const appInsights = new AnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const eventListenerStub = this.sandbox.stub(window, 'addEventListener');
                let evtNamespace = (appInsights as any)._evtNamespace;

                let registeredEvents = __getRegisteredEvents(window, null, evtNamespace);
                Assert.equal(0, registeredEvents.length, "No Events should be registered");

                this.onDone(() => {
                    core.unload(false);
                });

                // Act
                core.initialize({
                    instrumentationKey: '',
                    enableAutoRouteTracking: true
                } as IConfig & IConfiguration, [appInsights, channel]);

                registeredEvents = __getRegisteredEvents(window, null, evtNamespace);
                Assert.equal(2, registeredEvents.length, "Two Events should be registered");

                // Assert
                Assert.ok(eventListenerStub.calledTwice);
                Assert.equal(eventListenerStub.args[0][0], "popstate");
                Assert.equal(eventListenerStub.args[1][0], "locationchange");

                core.getPlugin(appInsights.identifier).remove(false);

                registeredEvents = __getRegisteredEvents(window, null, evtNamespace);
                Assert.equal(0, registeredEvents.length, "All Events should have been removed");
            }
        });

        this.testCase({
            name: 'enableAutoRouteTracking: route changes trigger a new pageview',
            useFakeTimers: true,
            assertNoEvents: true,
            test: () => {
                // Current URL will be the test page
                setEnableEnvMocks(true);
                this.setLocationHref("firstUri");

                // Setup
                const appInsights = new AnalyticsPlugin();
                appInsights.autoRoutePVDelay = 500;
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const properties = new PropertiesPlugin();
                const trackPageViewStub = this.sandbox.stub(appInsights, 'trackPageView');
                let evtNamespace = (appInsights as any)._evtNamespace;

                let registeredEvents = __getRegisteredEvents(window, null, evtNamespace);
                Assert.equal(0, registeredEvents.length, "No Events should be registered");

                this.onDone(() => {
                    if (core.isInitialized()) {
                        core.unload(false);
                    }
                });

                // Act
                core.initialize({
                    instrumentationKey: '',
                    enableAutoRouteTracking: true
                } as IConfig & IConfiguration, [appInsights, channel, properties]);

                properties.context.telemetryTrace.traceID = 'not set';
                properties.context.telemetryTrace.name = 'name not set';

                registeredEvents = __getRegisteredEvents(window, null, evtNamespace);
                Assert.equal(2, registeredEvents.length, "Two Events should be registered");

                this.setLocationHref("secondUri");
                window.dispatchEvent(createDomEvent('locationchange'));
                this.clock.tick(500);

                this.setLocationHref("thirdUri");
                window.dispatchEvent(createDomEvent('locationchange'));
                this.clock.tick(500);

                // Assert
                Assert.equal(2, trackPageViewStub.callCount);
                Assert.ok(properties.context.telemetryTrace.traceID);
                Assert.ok(properties.context.telemetryTrace.name);
                Assert.notEqual(properties.context.telemetryTrace.traceID, 'not set', 'current operation id is updated after route change');
                Assert.notEqual(properties.context.telemetryTrace.name, 'name not set', 'current operation name is updated after route change');
                // Assert.equal(appInsights['_prevUri'], 'secondUri', "the previous uri is stored on variable _prevUri");
                // Assert.equal(appInsights['_currUri'], window.location.href, "the current uri is stored on variable _currUri");

                Assert.equal("firstUri", trackPageViewStub.args[0][0].refUri, "previous uri is assigned to refUri as firstUri, and send as an argument of trackPageview method");
                Assert.equal("secondUri", trackPageViewStub.args[1][0].refUri, "previous uri is assigned to refUri as secondUri and send as an argument of trackPageview method");

                core.unload(false);
                registeredEvents = __getRegisteredEvents(window, null, evtNamespace);
                Assert.equal(0, registeredEvents.length, "All Events should have been removed");
            }
        });

        this.testCase({
            name: 'enableAutoRouteTracking: route changes trigger a new pageview with correct refUri when route changes happening before the timer autoRoutePVDelay stops',
            useFakeTimers: true,
            test: () => {
                // Setup
                setEnableEnvMocks(true);
                this.setLocationHref("firstUri");

                const appInsights = new AnalyticsPlugin();
                appInsights.autoRoutePVDelay = 500;
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const properties = new PropertiesPlugin();
                appInsights['_prevUri'] = "firstUri";
                const trackPageViewStub = this.sandbox.stub(appInsights, 'trackPageView');

                this.onDone(() => {
                    core.unload(false);
                });

                // Act
                core.initialize({
                    instrumentationKey: '',
                    enableAutoRouteTracking: true
                } as IConfig & IConfiguration, [appInsights, channel, properties]);
                properties.context.telemetryTrace.traceID = 'not set';
                properties.context.telemetryTrace.name = 'name not set';

                window.dispatchEvent(createDomEvent('locationchange'));
                this.clock.tick(200);

                // set up second dispatch
                window.dispatchEvent(createDomEvent('locationchange'));
                this.clock.tick(500);


                // Assert
                Assert.equal(2, trackPageViewStub.callCount);
                Assert.ok(properties.context.telemetryTrace.traceID);
                Assert.ok(properties.context.telemetryTrace.name);
                Assert.notEqual(properties.context.telemetryTrace.traceID, 'not set', 'current operation id is updated after route change');
                Assert.notEqual(properties.context.telemetryTrace.name, 'name not set', 'current operation name is updated after route change');
                // first trackPageView event
                Assert.equal(trackPageViewStub.args[0][0].refUri, 'firstUri', "first trackPageview event: refUri grabs the value of existing _prevUri");
                // Assert.equal(appInsights['_currUri'], getLocation(true).href, "first trackPageview event: the current uri is stored on variable _currUri");
                // second trackPageView event
                Assert.equal(trackPageViewStub.args[1][0].refUri, getLocation(true).href, "second trackPageview event: refUri grabs the value of updated _prevUri, which is the first pageView event's _currUri");
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
                const appInsights = new AnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const properties = new PropertiesPlugin();

                this.sandbox.stub(appInsights, 'trackPageView');

                this.onDone(() => {
                    core.unload(false);
                });

                // Act
                core.initialize({
                    instrumentationKey: '',
                    enableAutoRouteTracking: true
                } as IConfig & IConfiguration, [appInsights, channel, properties]);

                properties.context.telemetryTrace.traceID = 'not set';
                properties.context.telemetryTrace.parentID = undefined;

                window.dispatchEvent(createDomEvent('locationchange'));

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
                const appInsights: AnalyticsPlugin = new AnalyticsPlugin();

                // Act
                const config = {
                    instrumentationKey: 'ikey'
                };

                this.onDone(() => {
                    core.unload(false);
                });

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
                const appInsights: AnalyticsPlugin = new AnalyticsPlugin();

                const config = {
                    instrumentationKey: 'ikey',
                    autoTrackPageVisitTime: true
                };

                this.onDone(() => {
                    core.unload(false);
                });

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
                const appInsights = new AnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const properties = new PropertiesPlugin();

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

                this.onDone(() => {
                    core.unload(false);
                });

                // Initialize
                core.initialize(config, [appInsights, channel, properties]);

                // Assert
                Assert.equal(12, appInsights.config.samplingPercentage);
                Assert.notEqual('aaa', appInsights.config.accountId);
                Assert.equal('def', appInsights.config.accountId);
                //Assert.equal('instrumentation_key', (appInsights['config'] as IConfiguration).instrumentationKey);
                Assert.equal(30 * 60 * 1000, appInsights.config.sessionRenewalMs);
                Assert.equal(24 * 60 * 60 * 1000, appInsights.config.sessionExpirationMs);

                let extConfig = core.config.extensionConfig![AnalyticsPluginIdentifier] as IConfig;
                Assert.equal('instrumentation_key', core.config.instrumentationKey);
                Assert.equal(12, extConfig.samplingPercentage);
                Assert.notEqual('aaa', extConfig.accountId);
                Assert.equal('def', extConfig.accountId);
                Assert.equal(30 * 60 * 1000, extConfig.sessionRenewalMs);
                Assert.equal(24 * 60 * 60 * 1000, extConfig.sessionExpirationMs);
            }
        });

        this.testCase({
            name: "AppInsightsTests: autoExceptionInstrumented can be set correctly without root config",
            test: () => {
                let appInsights = new AnalyticsPlugin();
                let core = new AppInsightsCore();
                let channel = new ChannelPlugin();

                let config: IConfig & IConfiguration = {
                    instrumentationKey: "instrumentation_key",
                    samplingPercentage: 12,
                    extensionConfig: {}
                };

                this.onDone(() => {
                    core.unload(false);
                });

                // Initialize
                core.initialize(config, [appInsights, channel]);

                let extConfig = (core.config.extensionConfig || {})[AnalyticsPluginIdentifier] as IConfig;
                Assert.equal(extConfig.autoExceptionInstrumented, undefined, "auto exception hook should be undefined for extenstion config");
                let autoExceptionHooked = appInsights["_getDbgPlgTargets"]()[1];
                Assert.equal(autoExceptionHooked, true, "autoExceptionInstrumented should be set true");
                let errorHookCnt = appInsights["_getDbgPlgTargets"]()[0];
                Assert.equal(errorHookCnt, 1, "auto exception hook should be instrumented");
                Assert.equal(extConfig.autoUnhandledPromiseInstrumented, false, "autoUnhandledPromise should not be Instrumented");
            }
        });

        this.testCase({
            name: "AppInsightsTests: autoExceptionInstrumented can be set correctly without root config and with  enableUnhandledPromiseRejectionTracking ",
            test: () => {
                let appInsights = new AnalyticsPlugin();
                let core = new AppInsightsCore();
                let channel = new ChannelPlugin();

                let config: IConfig & IConfiguration = {
                    instrumentationKey: "instrumentation_key",
                    samplingPercentage: 12,
                    extensionConfig: {
                        [appInsights.identifier]: {
                            enableUnhandledPromiseRejectionTracking: true
                        }
                    }
                };

                this.onDone(() => {
                    core.unload(false);
                });

                // Initialize
                core.initialize(config, [appInsights, channel]);

                let extConfig = (core.config.extensionConfig || {})[AnalyticsPluginIdentifier] as IConfig;
                Assert.equal(extConfig.autoExceptionInstrumented, undefined, "auto exception hook should be undefined for extenstion config");
                let autoExceptionHooked = appInsights["_getDbgPlgTargets"]()[1];
                Assert.equal(autoExceptionHooked, true, "autoExceptionInstrumented should be set true");
                Assert.equal(extConfig.autoUnhandledPromiseInstrumented, true, "autoUnhandledPromiseInstrumented is set to true");
                let errorHookCnt = appInsights["_getDbgPlgTargets"]()[0];
                Assert.equal(errorHookCnt, 2, "auto exception hook should be instrumented twice");
            }
        });


        this.testCase({
            name: "AppInsightsTests: autoExceptionInstrumented can be set correctly with root config",
            useFakeTimers: true,
            test: () => {
                let appInsights = new AnalyticsPlugin();
                let core = new AppInsightsCore();
                let channel = new ChannelPlugin();

                let config: IConfig & IConfiguration = {
                    instrumentationKey: "instrumentation_key",
                    samplingPercentage: 12,
                    autoExceptionInstrumented: true,
                    extensionConfig: {}
                };

                this.onDone(() => {
                    core.unload(false);
                });

                // Initialize
                core.initialize(config, [appInsights, channel]);

                let extConfig = (core.config.extensionConfig || {})[AnalyticsPluginIdentifier] as IConfig;
                Assert.equal(extConfig.autoExceptionInstrumented, undefined, "auto exception hook should be undefined for extenstion config");
                let autoExceptionHooked = appInsights["_getDbgPlgTargets"]()[1];
                Assert.equal(autoExceptionHooked, true, "autoExceptionInstrumented should be set true");
                let errorHookCnt = appInsights["_getDbgPlgTargets"]()[0];
                Assert.equal(errorHookCnt, 0, "auto exception hook should not be instrumented again");
                Assert.equal(extConfig.autoUnhandledPromiseInstrumented, false, "autoUnhandledPromise should not be Instrumented");

                (core.config as IConfiguration & IConfig).autoExceptionInstrumented = false;
                extConfig.autoExceptionInstrumented = false;
                this.clock.tick(1);
                autoExceptionHooked = appInsights["_getDbgPlgTargets"]()[1];
                Assert.equal(autoExceptionHooked, true, "autoExceptionInstrumented should be not be override");



            }
        });

        this.testCase({
            name: "AppInsightsTests: autoExceptionInstrumented can be set correctly with root config and enableUnhandledPromiseRejectionTracking",
            test: () => {
                let appInsights = new AnalyticsPlugin();
                let core = new AppInsightsCore();
                let channel = new ChannelPlugin();

                let config: IConfig & IConfiguration = {
                    instrumentationKey: "instrumentation_key",
                    samplingPercentage: 12,
                    autoExceptionInstrumented: true,
                    extensionConfig: {
                        [appInsights.identifier]: {
                            enableUnhandledPromiseRejectionTracking: true
                        }
                    }
                };

                this.onDone(() => {
                    core.unload(false);
                });

                // Initialize
                core.initialize(config, [appInsights, channel]);

                let extConfig = (core.config.extensionConfig || {})[AnalyticsPluginIdentifier] as IConfig;
                Assert.equal(extConfig.autoExceptionInstrumented, undefined, "auto exception hook should be undefined for extenstion config");
                let autoExceptionHooked = appInsights["_getDbgPlgTargets"]()[1];
                Assert.equal(autoExceptionHooked, true, "autoExceptionInstrumented should be set true");
                Assert.equal(extConfig.autoUnhandledPromiseInstrumented, true, "autoUnhandledPromiseInstrumented is set to true");
                let errorHookCnt = appInsights["_getDbgPlgTargets"]()[0];
                Assert.equal(errorHookCnt, 1, "auto exception hook should be instrumented for autoUnhandledPromiseInstrumented");
            }
        });

        this.testCase({
            name: "AppInsightsTests: public members are correct",
            test: () => {
                // setup
                const appInsights = new AnalyticsPlugin();

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
                    "stopTrackPage",
                    "startTrackEvent",
                    "stopTrackEvent"
                ];
                while (members.length) {
                    leTest(members.pop());
                }
            }
        });

        this.addGenericTests();
        this.addStartStopTrackPageTests();
        this.addStartStopTrackEventTests()
        this.addTrackExceptionTests();
        this.addOnErrorTests();
        this.addTrackMetricTests();
        this.addTelemetryInitializerTests();
        this.addScriptInfoTests();
    }

    private addScriptInfoTests(): void {
        this.testCase({
            name: "AppInsightsTests: findAllScripts function returns correct information",
            useFakeTimers: true,
            test: () => {
                // Initialize Application Insights core with plugins
                let script = window.document.createElement("script");
                script.src = "https://www.example.com/test.js";
                script.innerHTML = 'test script';
                window.document.body.appendChild(script);

                let doc = window.document;
                let scriptsInfo = findAllScripts(doc);
                Assert.deepEqual(true, JSON.stringify(scriptsInfo).indexOf("https://www.example.com/test.js") !== -1, "script info contains the correct url");
            }
        });
        this.testCase({
            name: "AppInsightsTests: trackException would contain scrips info when config turns on",
            useFakeTimers: true,
            test: () => {
                const appInsights = new AnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const properties = new PropertiesPlugin();
                // Configuration
                const config = {
                    instrumentationKey: 'ikey',
                };
                this.onDone(() => {
                    core.unload(false);
                });
                // Initialize Application Insights core with plugins
                core.initialize(config, [appInsights, channel, properties]);

                // add test script
                let script = window.document.createElement("script");
                script.src = "https://www.example1.com/test.js";
                script.setAttribute("referrerpolicy", "no-referrer");
                script.innerHTML = 'test script';
                let script2 = window.document.createElement("script");
                script2.src = "https://www.test.com/test.js";
                script2.innerHTML = "test tests";
                script2.setAttribute("async", ""); 
                window.document.body.appendChild(script);
                window.document.body.appendChild(script2);


                const trackStub = this.sandbox.stub(appInsights.core, "track");
                appInsights.trackException({error: new Error(), severityLevel: SeverityLevel.Critical});
                Assert.ok(trackStub.calledOnce, "single exception is tracked");
                const baseData = (trackStub.args[0][0] as ITelemetryItem).baseData as IExceptionInternal;
                const prop = baseData.properties;
                Assert.equal(-1, JSON.stringify(prop).indexOf("https://www.example.com/test.js"), "script info is not included");
                
                appInsights.config.expCfg.inclScripts = true;
                this.clock.tick(1);
                appInsights.trackException({error: new Error(), severityLevel: SeverityLevel.Critical});
                Assert.ok(trackStub.calledTwice, "single exception is tracked");
                const baseData2 = (trackStub.args[1][0] as ITelemetryItem).baseData as IExceptionInternal;
                const prop2 = baseData2.properties;
                Assert.deepEqual(true, prop2["exceptionScripts"].includes('"url":"https://www.test.com/test.js","async":true}'))
                Assert.deepEqual(true, prop2["exceptionScripts"].includes('"url":"https://www.example1.com/test.js","referrerPolicy":"no-referrer"'))

            }
        });


        this.testCase({
            name: "AppInsightsTests: trackException would contain log info when config turns on",
            useFakeTimers: true,
            test: () => {
                const appInsights = new AnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const properties = new PropertiesPlugin();
                // Configuration
                const config = {
                    instrumentationKey: 'ikey',
                };
                this.onDone(() => {
                    core.unload(false);
                });
                // Initialize Application Insights core with plugins
                core.initialize(config, [appInsights, channel, properties]);

                const trackStub = this.sandbox.stub(appInsights.core, "track");
                appInsights.trackException({error: new Error(), severityLevel: SeverityLevel.Critical});
                Assert.ok(trackStub.calledOnce, "single exception is tracked");
                const baseData = (trackStub.args[0][0] as ITelemetryItem).baseData as IExceptionInternal;
                const prop = baseData.properties;
                Assert.equal(-1, JSON.stringify(prop).indexOf("test message"), "log info is not included");
                
                let applelist = new Array(49).fill("apple");
                // check maxLength default value
                appInsights.config.expCfg.expLog = () => {
                    return {logs: applelist.concat(['pear', 'banana'])};
                };;
                this.clock.tick(1);
                appInsights.trackException({error: new Error(), severityLevel: SeverityLevel.Critical});
                Assert.ok(trackStub.calledTwice, "second exception is tracked");
                const baseData2 = (trackStub.args[1][0] as ITelemetryItem).baseData as IExceptionInternal;
                const prop2 = baseData2.properties;
                Assert.deepEqual(true, prop2["exceptionLog"].includes('apple'), "log info before max length is included");
                Assert.deepEqual(true, prop2["exceptionLog"].includes('pear'), "log info before max length is included");

                Assert.equal(-1, prop2["exceptionLog"].indexOf("banana"), "text after max length should not be included");


                // check maxLength would truncate the log info
                let myLogFunction = () => {
                    return {logs: ['test message', 'check message', 'banana']};
                };
                appInsights.config.expCfg.expLog = myLogFunction;
                appInsights.config.expCfg.maxLogs = 2;
                this.clock.tick(1);
                appInsights.trackException({error: new Error(), severityLevel: SeverityLevel.Critical});
                this.clock.tick(1);
                Assert.ok(trackStub.calledThrice, "third exception is tracked");
                const baseData3 = (trackStub.args[2][0] as ITelemetryItem).baseData as IExceptionInternal;
                const prop3 = baseData3.properties;
                Assert.deepEqual(true, prop3["exceptionLog"].includes('test'), "log info is included");
                Assert.equal(false, prop3["exceptionLog"].includes("banana"), "text after max length should not be included");

            }
        });
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
                const appInsights = new AnalyticsPlugin();

                this.onDone(() => {
                    core.unload(false);
                });

                core.addPlugin(appInsights);
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
            useFakeTimers: true,
            test: () => {
                // setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin]
                );
                const appInsights = new AnalyticsPlugin();
                core.addPlugin(appInsights);
                const senderStub = this.sandbox.stub(appInsights.core, "track");

                // Act
                appInsights.trackException({exception: new Error(), severityLevel: SeverityLevel.Critical});
                appInsights.trackException({error: new Error(), severityLevel: SeverityLevel.Critical});
                appInsights.trackException({exception: "Critical Exception" as any, severityLevel: SeverityLevel.Critical});
                appInsights.trackException("Critical Exception" as any);
                this.clock.tick(1);

                // Test
                Assert.equal(4, senderStub.callCount, "Telemetry is sent when master switch is on");
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

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin]
                );
                const appInsights = new AnalyticsPlugin();
                core.addPlugin(appInsights);
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

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin]
                );
                const appInsights = new AnalyticsPlugin();
                core.addPlugin(appInsights);
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

        this.testCase({
            name: "TrackExceptionTests: trackException with a string as the exception",
            test: () => {
                // setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin]
                );
                const appInsights = new AnalyticsPlugin();
                core.addPlugin(appInsights);
                const trackStub = this.sandbox.stub(appInsights.core, "track");

                // Test
                appInsights.trackException({exception: new Error("Critical Exception"), severityLevel: SeverityLevel.Critical});
                Assert.ok(trackStub.calledOnce, "single exception is tracked");
                Assert.equal(SeverityLevel.Critical, trackStub.firstCall.args[0].baseData.severityLevel);
                Assert.equal("Critical Exception", trackStub.firstCall.args[0].baseData.exceptions[0].message);

                trackStub.reset();

                appInsights.trackException({exception: "String Exception" as any, severityLevel: SeverityLevel.Error});
                Assert.ok(trackStub.calledOnce, "single exception is tracked");
                Assert.equal(SeverityLevel.Error, trackStub.firstCall.args[0].baseData.severityLevel);
                Assert.equal("String Exception", trackStub.firstCall.args[0].baseData.exceptions[0].message);

                trackStub.reset();

                appInsights.trackException("Direct String Exception" as any);
                Assert.ok(trackStub.calledOnce, "single exception is tracked");
                Assert.equal("string: Direct String Exception", trackStub.firstCall.args[0].baseData.exceptions[0].message);

                trackStub.reset();

                appInsights.trackException(new Error("Wrapped String Exception") as any);
                Assert.ok(trackStub.calledOnce, "single exception is tracked");
                Assert.equal("Wrapped String Exception", trackStub.firstCall.args[0].baseData.exceptions[0].message);

                trackStub.reset();

                appInsights.trackException(null as any);
                Assert.ok(trackStub.calledOnce, "single exception is tracked");
                Assert.equal("not_specified", trackStub.firstCall.args[0].baseData.exceptions[0].message, JSON.stringify(trackStub.firstCall.args[0].baseData.exceptions[0]));
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

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin]
                );
                const appInsights = new AnalyticsPlugin();
                core.addPlugin(appInsights);

                const unexpectedError = new Error();
                const expectedString = dumpObj(unexpectedError);
                const throwSpy = this.sandbox.spy(core.logger, "throwInternal");
                this.sandbox.stub(appInsights, "trackException").throws(unexpectedError);

                // Act
                appInsights._onerror({message: "msg", url: "some://url", lineNumber: 123, columnNumber: 456, error: unexpectedError});

                // Assert
                Assert.equal(1, throwSpy.callCount);
                // Check Message
                Assert.ok(throwSpy.args[0][2].indexOf("_onError threw exception while logging error,") !== -1, "Message should indicate that _onError failed");
                // Check Exception contains the exception details
                Assert.ok(throwSpy.args[0][3].exception.indexOf(expectedString) !== -1, "Expected error to contain - " + expectedString);
            }
        });

        this.testCase({
            name: "OnErrorTests: _onerror stringifies error object",
            test: () => {
                // setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin]
                );
                const appInsights = new AnalyticsPlugin();
                core.addPlugin(appInsights);
                const unexpectedError = new Error("some message");
                const throwSpy = this.sandbox.spy(core.logger, "throwInternal");
                const stub = this.sandbox.stub(appInsights, "trackException").throws(unexpectedError);

                // Act
                appInsights._onerror({message: "any message", url: "any://url", lineNumber: 123, columnNumber: 456, error: unexpectedError});

                // Test
                const dumpExMsg = throwSpy.args[0][3].exception;
                Assert.ok(dumpExMsg.indexOf("stack: ") != -1);
                Assert.ok(dumpExMsg.indexOf(`message: \"${unexpectedError.message}\"`) !== -1 ||
                    dumpExMsg.indexOf(`message: '${unexpectedError.message}'`) !== -1);
                Assert.ok(dumpExMsg.indexOf("name: \"Error\"") !== -1 ||
                    dumpExMsg.indexOf("name: 'Error'") !== -1);
            }
        });

        this.testCase({
            name: "OnErrorTests: _onerror logs name of unexpected error thrown by trackException for diagnostics",
            test: () => {
                // setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                const appInsights = new AnalyticsPlugin();
                core.addPlugin(appInsights);

                const throwInternal = this.sandbox.spy(appInsights.core.logger, "throwInternal");

                this.sandbox.stub(appInsights, "trackException").throws(new CustomTestError("Simulated Error"));
                const expectedErrorName: string = "CustomTestError";

                appInsights._onerror({message: "some message", url: "some://url", lineNumber: 1234, columnNumber: 5678, error: new Error()});

                Assert.ok(throwInternal.calledOnce, "throwInternal called once");
                const logMessage: string = throwInternal.getCall(0).args[2];
                Assert.notEqual(-1, logMessage.indexOf(expectedErrorName), "expected: " + logMessage);
            }
        });

        this.testCase({
            name: "OnErrorTests: _onerror adds document URL in case of CORS error",
            test: () => {
                // setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin]
                );
                const appInsights = new AnalyticsPlugin();
                core.addPlugin(appInsights);
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

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin]
                );
                const appInsights = new AnalyticsPlugin();
                core.addPlugin(appInsights);
                const trackExceptionSpy = this.sandbox.spy(appInsights, "trackException");

                // Act
                // Last arg is not an error/null which will be treated as not CORS issue
                appInsights._onerror({message: "Script error.", url: "", lineNumber: 0, columnNumber: 0, error: new Object() as any});

                // Assert
                // properties are passed as a 3rd parameter
                Assert.equal(document.URL, trackExceptionSpy.args[0][1].url);
            }
        });

        this.testCase({
            name: "OnErrorTests: _onerror logs name of unexpected error thrown by trackException for diagnostics",
            test: () => {
                // setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                const appInsights = new AnalyticsPlugin();
                core.addPlugin(appInsights);

                const throwInternal = this.sandbox.spy(appInsights.core.logger, "throwInternal");

                // Internal code does call this anymore!
                const expectedErrorName: string = "test error";

                let theError = new Error();
                theError.name = expectedErrorName;
                this.sandbox.stub(appInsights, "trackException").throws(theError);


                appInsights._onerror({message: "some message", url: "some://url", lineNumber: 1234, columnNumber: 5678, error: "the error message"});

                Assert.ok(throwInternal.calledOnce, "throwInternal called once");
                const logMessage: string = throwInternal.getCall(0).args[2];
                Assert.notEqual(-1, logMessage.indexOf(expectedErrorName), "logMessage: " + logMessage);
            }
        });


        this.testCaseAsync({
            name: "OnErrorTests: _onerror logs name of unexpected error thrown by trackException for diagnostics",
            stepDelay: 1,
            useFakeTimers: true,
            steps: [() => {
                // setup
                const sender: Sender = new Sender();
                const core = new AppInsightsCore();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {
                        instrumentationKey: "key",
                        extensionConfig: {
                            [sender.identifier]: {
                                enableSessionStorageBuffer: false,
                                maxBatchInterval: 1
                            }
                        }                
                    },
                    [sender]
                );
                const appInsights = new AnalyticsPlugin();
                core.addPlugin(appInsights);
                appInsights.addTelemetryInitializer((item: ITelemetryItem) => {
                    Assert.equal("4.0", item.ver, "Telemetry items inside telemetry initializers should be in CS4.0 format");
                });

                this.throwInternalSpy = this.sandbox.spy(appInsights.core.logger, "throwInternal");
                sender._sender = (payload:any[], isAsync:boolean) => {
                    sender._onSuccess(payload, payload.length);
                };
                this.sandbox.spy()
                this.trackSpy = this.sandbox.spy(sender, "_onSuccess");

                this.exceptionHelper.capture(appInsights);

                this.causeException(() => {
                    this.exceptionHelper.throwRuntimeException(AITestClass.orgSetTimeout);
                });

                Assert.ok(!this.trackSpy.calledOnce, "track not called yet");
                Assert.ok(!this.throwInternalSpy.called, "No internal errors");
            }].concat(this.waitForException(1))
            .concat(() => {
                let isLocal = window.location.protocol === "file:";
                let exp = this.trackSpy.args[0];
                const payloadStr: string[] = this.getPayloadMessages(this.trackSpy);
            
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    const data = payload.data;
                    Assert.ok(data, "Has Data");
                    if (data) {
                        Assert.ok(data.baseData, "Has BaseData");
                        let baseData = data.baseData;
                        if (baseData) {
                            const ex = baseData.exceptions[0];
                            if (isLocal) {
                                Assert.ok(ex.message.indexOf("Script error:") !== -1, "Make sure the error message is present [" + ex.message + "]");
                                Assert.equal("String", ex.typeName, "Got the correct typename [" + ex.typeName + "]");
                            } else {
                                Assert.ok(ex.message.indexOf("ug is not a function") !== -1, "Make sure the error message is present [" + ex.message + "]");
                                Assert.equal("TypeError", ex.typeName, "Got the correct typename [" + ex.typeName + "]");
                                Assert.ok(baseData.properties["columnNumber"], "has column number");
                                Assert.ok(baseData.properties["lineNumber"], "has Line number");
                            }

                            Assert.ok(ex.stack.length > 0, "Has stack");
                            Assert.ok(ex.parsedStack, "Stack was parsed");
                            Assert.ok(ex.hasFullStack, "Stack has been decoded");
                            Assert.ok(baseData.properties["url"], "has Url");
                            Assert.ok(baseData.properties["errorSrc"].indexOf("window.onerror@") !== -1, "has source");
                        }
                    }
                }
            })

        });

        this.testCaseAsync({
            name: "OnErrorTests: _onerror logs name of unexpected error thrown by trackException for diagnostics with a text exception",
            stepDelay: 1,
            useFakeTimers: true,
            steps: [() => {
                // setup
                const sender: Sender = new Sender();
                const core = new AppInsightsCore();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {
                        instrumentationKey: "key",
                        extensionConfig: {
                            [sender.identifier]: {
                                enableSessionStorageBuffer: false,
                                maxBatchInterval: 1
                            }
                        }                
                    },
                    [sender]
                );
                const appInsights = new AnalyticsPlugin();
                core.addPlugin(appInsights);
                appInsights.addTelemetryInitializer((item: ITelemetryItem) => {
                    Assert.equal("4.0", item.ver, "Telemetry items inside telemetry initializers should be in CS4.0 format");
                });

                this.throwInternalSpy = this.sandbox.spy(appInsights.core.logger, "throwInternal");
                sender._sender = (payload:any[], isAsync:boolean) => {
                    sender._onSuccess(payload, payload.length);
                };
                this.sandbox.spy()
                this.trackSpy = this.sandbox.spy(sender, "_onSuccess");

                this.exceptionHelper.capture(appInsights);
                this.causeException(() => {
                    this.exceptionHelper.throw("Test Text Error!");
                });

                Assert.ok(!this.trackSpy.calledOnce, "track not called yet");
                Assert.ok(!this.throwInternalSpy.called, "No internal errors");
            }].concat(this.waitForException(1))
            .concat(() => {
                let exp = this.trackSpy.args[0];
                const payloadStr: string[] = this.getPayloadMessages(this.trackSpy);
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    const data = payload.data;
                    Assert.ok(data, "Has Data");
                    if (data) {
                        Assert.ok(data.baseData, "Has BaseData");
                        let baseData = data.baseData;
                        if (baseData) {
                            const ex = baseData.exceptions[0];
                            Assert.ok(ex.message.indexOf("Test Text Error!") !== -1, "Make sure the error message is present [" + ex.message + "]");
                            Assert.ok(baseData.properties["columnNumber"], "has column number");
                            Assert.ok(baseData.properties["lineNumber"], "has Line number");
                            Assert.equal("String", ex.typeName, "Got the correct typename");
                            Assert.ok(ex.stack.length > 0, "Has stack");
                            Assert.ok(ex.parsedStack, "Stack was parsed");
                            Assert.ok(ex.hasFullStack, "Stack has been decoded");
                            Assert.ok(baseData.properties["url"], "has Url");
                            Assert.ok(baseData.properties["errorSrc"].indexOf("window.onerror@") !== -1, "has source");
                        }
                    }
                }
            })
        });

        this.testCaseAsync({
            name: "OnErrorTests: _onerror logs name of unexpected error thrown by trackException for diagnostics with a custom direct exception",
            stepDelay: 1,
            useFakeTimers: true,
            steps: [() => {
                // setup
                const sender: Sender = new Sender();
                const core = new AppInsightsCore();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {
                        instrumentationKey: "key",
                        extensionConfig: {
                            [sender.identifier]: {
                                enableSessionStorageBuffer: false,
                                maxBatchInterval: 1
                            }
                        }                
                    },
                    [sender]
                );
                const appInsights = new AnalyticsPlugin();
                core.addPlugin(appInsights);
                appInsights.addTelemetryInitializer((item: ITelemetryItem) => {
                    Assert.equal("4.0", item.ver, "Telemetry items inside telemetry initializers should be in CS4.0 format");
                });

                this.throwInternalSpy = this.sandbox.spy(appInsights.core.logger, "throwInternal");
                sender._sender = (payload:any[], isAsync:boolean) => {
                    sender._onSuccess(payload, payload.length);
                };
                this.sandbox.spy()
                this.trackSpy = this.sandbox.spy(sender, "_onSuccess");

                this.exceptionHelper.capture(appInsights);
                this.causeException(() => {
                    this.exceptionHelper.throw(new CustomTestError("Test Text Error!"));
                });

                Assert.ok(!this.trackSpy.calledOnce, "track not called yet");
                Assert.ok(!this.throwInternalSpy.called, "No internal errors");
            }].concat(this.waitForException(1))
            .concat(() => {

                let isLocal = window.location.protocol === "file:";
                let exp = this.trackSpy.args[0];
                const payloadStr: string[] = this.getPayloadMessages(this.trackSpy);
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    const data = payload.data;
                    Assert.ok(data, "Has Data");
                    if (data) {
                        Assert.ok(data.baseData, "Has BaseData");
                        let baseData = data.baseData;
                        if (baseData) {
                            const ex = baseData.exceptions[0];
                            if (isLocal) {
                                Assert.ok(ex.message.indexOf("Script error:") !== -1, "Make sure the error message is present [" + ex.message + "]");
                                Assert.equal("String", ex.typeName, "Got the correct typename");
                            } else {
                                Assert.ok(ex.message.indexOf("Test Text Error!") !== -1, "Make sure the error message is present [" + ex.message + "]");
                                Assert.ok(ex.message.indexOf("CustomTestError") !== -1, "Make sure the error type is present [" + ex.message + "]");
                                Assert.equal("CustomTestError", ex.typeName, "Got the correct typename");
                                Assert.ok(baseData.properties["columnNumber"], "has column number");
                                Assert.ok(baseData.properties["lineNumber"], "has Line number");
                            }

                            Assert.ok(ex.stack.length > 0, "Has stack");
                            Assert.ok(ex.parsedStack, "Stack was parsed");
                            Assert.ok(ex.hasFullStack, "Stack has been decoded");
                            Assert.ok(baseData.properties["url"], "has Url");
                            Assert.ok(baseData.properties["errorSrc"].indexOf("window.onerror@") !== -1, "has source");
                        }
                    }
                }
            })
        });

        this.testCaseAsync({
            name: "OnErrorTests: _onerror logs name of unexpected error thrown by trackException for diagnostics with a strict custom direct exception",
            stepDelay: 1,
            useFakeTimers: true,
            steps: [() => {
                // setup
                const sender: Sender = new Sender();
                const core = new AppInsightsCore();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {
                        instrumentationKey: "key",
                        extensionConfig: {
                            [sender.identifier]: {
                                enableSessionStorageBuffer: false,
                                maxBatchInterval: 1
                            }
                        }                
                    },
                    [sender]
                );
                const appInsights = new AnalyticsPlugin();
                core.addPlugin(appInsights);
                appInsights.addTelemetryInitializer((item: ITelemetryItem) => {
                    Assert.equal("4.0", item.ver, "Telemetry items inside telemetry initializers should be in CS4.0 format");
                });

                this.throwInternalSpy = this.sandbox.spy(appInsights.core.logger, "throwInternal");
                sender._sender = (payload:any[], isAsync:boolean) => {
                    sender._onSuccess(payload, payload.length);
                };
                this.sandbox.spy()
                this.trackSpy = this.sandbox.spy(sender, "_onSuccess");

                this.exceptionHelper.capture(appInsights);
                this.causeException(() => {
                    this.exceptionHelper.throwStrict(new CustomTestError("Test Text Error!"));
                });

                Assert.ok(!this.trackSpy.calledOnce, "track not called yet");
                Assert.ok(!this.throwInternalSpy.called, "No internal errors");
            }].concat(this.waitForException(1))
            .concat(() => {

                let isLocal = window.location.protocol === "file:";
                let exp = this.trackSpy.args[0];
                const payloadStr: string[] = this.getPayloadMessages(this.trackSpy);
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    const data = payload.data;
                    Assert.ok(data, "Has Data");
                    if (data) {
                        Assert.ok(data.baseData, "Has BaseData");
                        let baseData = data.baseData;
                        if (baseData) {
                            const ex = baseData.exceptions[0];
                            if (isLocal) {
                                Assert.ok(ex.message.indexOf("Script error:") !== -1, "Make sure the error message is present [" + ex.message + "]");
                                Assert.equal("String", ex.typeName, "Got the correct typename");
                            } else {
                                Assert.ok(ex.message.indexOf("Test Text Error!") !== -1, "Make sure the error message is present [" + ex.message + "]");
                                Assert.ok(ex.message.indexOf("CustomTestError") !== -1, "Make sure the error type is present [" + ex.message + "]");
                                Assert.equal("CustomTestError", ex.typeName, "Got the correct typename");
                                Assert.ok(baseData.properties["columnNumber"], "has column number");
                                Assert.ok(baseData.properties["lineNumber"], "has Line number");
                            }

                            Assert.ok(ex.stack.length > 0, "Has stack");
                            Assert.ok(ex.parsedStack, "Stack was parsed");
                            Assert.ok(ex.hasFullStack, "Stack has been decoded");
                            Assert.ok(baseData.properties["url"], "has Url");
                            Assert.ok(baseData.properties["errorSrc"].indexOf("window.onerror@") !== -1, "has source");
                        }
                    }
                }
            })
        });
    }

    private throwStrictRuntimeException() {
        "use strict";
        function doThrow() {
            var ug: any = "Hello";
            // This should throw
            ug();
        }

        doThrow();
    }

    private addStartStopTrackPageTests() {
        const testValues = {
            name: "name",
            url: "url",
            duration: 200,
            properties: {
                "property1": "5",
                "property2": "10",
                "refUri": "test.com"
            },
            measurements: {
                "measurement": 300
            }
        };

        this.testCase({
            name: "Timing Tests: Start/StopPageView pass correct duration",
            useFakeTimers: true,
            test: () => {
                // setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "key"},
                    [plugin]
                );
                const appInsights = new AnalyticsPlugin();
                core.addPlugin(appInsights);
                const spy = this.sandbox.spy(appInsights, "sendPageViewInternal");
                this.clock.tick(1);

                // act
                appInsights.startTrackPage(testValues.name);
                this.clock.tick(testValues.duration);
                appInsights.stopTrackPage(testValues.name, testValues.url, testValues.properties, testValues.measurements);

                // verify
                Assert.ok(spy.calledOnce, "stop track page view sent data");
                const actual = spy.args[0][0];
                Assert.equal(testValues.name, actual.name);
                Assert.equal(testValues.url, actual.uri);

                const actualProperties = actual.properties;
                const actualMeasurements = actual.measurements;
                Assert.equal(testValues.duration, actualProperties.duration, "duration is calculated and sent correctly");
                Assert.equal(testValues.properties.property1, actualProperties.property1);
                Assert.equal(testValues.properties.property2, actualProperties.property2);
                Assert.equal(testValues.properties.refUri, actualProperties.refUri);
                Assert.equal(testValues.measurements.measurement, actualMeasurements.measurement);
            }
        });
        this.testCase({
            name: "Timing Tests: Start/StopPageView tracks single page view with no parameters",
            useFakeTimers: true,
            test: () => {
                // setup
                const core = new AppInsightsCore();

                // this.sandbox.stub(core, "getTransmissionControls");
                const appInsights = new AnalyticsPlugin();
                this.onDone(() => {
                    appInsights.teardown();
                });

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
            useFakeTimers: true,
            test: () => {
                // setup
                const core = new AppInsightsCore();

                // this.sandbox.stub(core, "getTransmissionControls");
                const appInsights = new AnalyticsPlugin();
                this.onDone(() => {
                    appInsights.teardown();
                });

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
            useFakeTimers: true,
            test:
                () => {
                    // setup
                    const plugin = new ChannelPlugin();
                    const core = new AppInsightsCore();

                    this.onDone(() => {
                        core.unload(false);
                    });
    
                    core.initialize(
                        {instrumentationKey: "ikey"},
                        [plugin]
                    );
                    const appInsights = new AnalyticsPlugin();
                    core.addPlugin(appInsights);
                    const logStub = this.sandbox.stub(core.logger, "throwInternal");
                    core.config.loggingLevelConsole = 999;
                    this.clock.tick(1);

                    // act
                    appInsights.startTrackPage();
                    appInsights.startTrackPage();

                    // verify
                    Assert.ok(logStub.calledOnce, "calling start twice triggers warning to user");
                }
        });

        this.testCase({
            name: "Timing Tests: stopTrackPage called without a corresponding start",
            useFakeTimers: true,
            test:
                () => {
                    // setup
                    const plugin = new ChannelPlugin();
                    const core = new AppInsightsCore();

                    this.onDone(() => {
                        core.unload(false);
                    });
    
                    core.initialize(
                        {instrumentationKey: "ikey"},
                        [plugin]
                    );
                    const appInsights = new AnalyticsPlugin();
                    core.addPlugin(appInsights);
                    const logStub = this.sandbox.stub(core.logger, "throwInternal");
                    core.config.loggingLevelConsole = 999;
                    this.clock.tick(1);

                    // act
                    appInsights.stopTrackPage();

                    // verify
                    Assert.ok(logStub.calledOnce, "calling stop without a corresponding start triggers warning to user");
                }
        });
    }

    private addTrackMetricTests() {
        this.testCase({
            name: 'TrackMetricTests: trackMetric batches metrics sent in a hot loop',
            useFakeTimers: true,
            test: () => {
                // Setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin]
                );
                const appInsights = new AnalyticsPlugin();
                core.addPlugin(appInsights);
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

    private addStartStopTrackEventTests() {
        const testValues = {
            name: "testStopTrack",
            properties: {
                "property1": "5",
                "property2": "10",
                "refUri": "test.com"
            },
            measurements: {
                "measurement": 300
            }
        };

        this.testCase({
            name: "TelemetryContex: empty Start/StopTrackEvent should only have duration properties",
            useFakeTimers: true,
            test: () => {
                const core = new AppInsightsCore();
                // this.sandbox.stub(core, "getTransmissionControls");
                const appInsights = new AnalyticsPlugin();
                this.onDone(() => {
                    appInsights.teardown();
                });

                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                const trackStub = this.sandbox.stub(appInsights.core, "track");
                this.clock.tick(5);

                // act
                appInsights.startTrackEvent(testValues.name);
                this.clock.tick(5);
                appInsights.stopTrackEvent(testValues.name);
                Assert.ok(trackStub.calledOnce, "single event tracking stopped");

                // verify
                const telemetry = trackStub.args[0][0];
                Assert.equal(testValues.name,telemetry.baseData.name);
                Assert.deepEqual({ "duration": "5"},telemetry.baseData.properties);
                Assert.equal(undefined, telemetry.baseData.measurements.measurement);
            }
        });

        this.testCase({
            name: "TelemetryContex: Start/StopTrackEvent capture correct properties and measurements",
            useFakeTimers: true,
            test: () => {
                const core = new AppInsightsCore();
                // this.sandbox.stub(core, "getTransmissionControls");
                const appInsights = new AnalyticsPlugin();
                this.onDone(() => {
                    appInsights.teardown();
                });

                appInsights.initialize({ "instrumentationKey": "ikey" }, core, []);
                const trackStub = this.sandbox.stub(appInsights.core, "track");
                this.clock.tick(5);

                // act
                appInsights.startTrackEvent(testValues.name);
                this.clock.tick(5);
                appInsights.stopTrackEvent(testValues.name,testValues.properties,testValues.measurements);
                Assert.ok(trackStub.calledOnce, "single event tracking stopped");

                // verify
                const telemetry = trackStub.args[0][0];
                Assert.equal(testValues.name,telemetry.baseData.name);
                Assert.equal(testValues.properties.property1,telemetry.baseData.properties.property1);
                Assert.equal(testValues.properties.property2, telemetry.baseData.properties.property2);
                Assert.equal(testValues.properties.refUri, telemetry.baseData.properties.refUri);
                Assert.equal("5", telemetry.baseData.properties.duration);
                Assert.equal(testValues.measurements.measurement, telemetry.baseData.measurements.measurement);
            }
        });
    }

    private addTelemetryInitializerTests(): void {
        this.testCase({
            name: "TelemetryContext: onBeforeSendTelemetry is called within track() and gets the envelope as an argument",
            useFakeTimers: true,
            test: () => {
                // Setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                const appInsights = new AnalyticsPlugin();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin, appInsights]
                );

                const trackStub = this.sandbox.spy(plugin, 'processTelemetry');
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
            useFakeTimers: true,
            test: () => {
                // Setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                const appInsights = new AnalyticsPlugin();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin, appInsights]
                );

                const trackStub = this.sandbox.spy(plugin, 'processTelemetry');
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
                const appInsights = new AnalyticsPlugin();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin, appInsights]
                );

                const trackStub = this.sandbox.spy(plugin, 'processTelemetry');

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
                const appInsights = new AnalyticsPlugin();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin, appInsights]
                );

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
            name: "TelemetryContext: all added telemetry initializers get invoked for trackException",
            test: () => {
                // Setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                const appInsights = new AnalyticsPlugin();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin, appInsights]
                );

                const initializer1 = { init: (item: ITelemetryItem) => { 
                    if (item.data !== undefined) {
                        item.data.init1 = true;
                    }
                } };
                const initializer2 = { init: (item: ITelemetryItem) => { 
                    if (item.data !== undefined) {
                        item.data.init2 = true;
                    }
                } };
                const spy1 = this.sandbox.spy(initializer1, "init");
                const spy2 = this.sandbox.spy(initializer2, "init");

                // act
                appInsights.addTelemetryInitializer(initializer1.init);
                appInsights.addTelemetryInitializer(initializer2.init);

                // Act
                appInsights._onerror({message: "msg", url: "some://url", lineNumber: 123, columnNumber: 456, error: new Error()});

                // verify
                Assert.ok(spy1.calledOnce);
                Assert.ok(spy2.calledOnce);
            }
        });

        this.testCase({
            name: "TelemetryContext: all added telemetry initializers get invoked for _onError calls",
            test: () => {
                // Setup
                const plugin = new ChannelPlugin();
                const core = new AppInsightsCore();
                const appInsights = new AnalyticsPlugin();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin, appInsights]
                );

                const initializer1 = { init: () => { } };
                const initializer2 = { init: () => { } };
                const spy1 = this.sandbox.spy(initializer1, "init");
                const spy2 = this.sandbox.spy(initializer2, "init");

                // act
                appInsights.addTelemetryInitializer(initializer1.init);
                appInsights.addTelemetryInitializer(initializer2.init);

                appInsights.trackException({exception: new Error(), severityLevel: SeverityLevel.Critical});

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
                const appInsights = new AnalyticsPlugin();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin, appInsights]
                );

                const trackStub = this.sandbox.spy(plugin, 'processTelemetry');

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
                const appInsights = new AnalyticsPlugin();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin, appInsights]
                );

                const trackStub = this.sandbox.spy(plugin, 'processTelemetry');

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
                const appInsights = new AnalyticsPlugin();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin, appInsights]
                );

                const trackStub = this.sandbox.spy(plugin, 'processTelemetry');

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
                const appInsights = new AnalyticsPlugin();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin, appInsights]
                );

                const trackStub = this.sandbox.spy(plugin, 'processTelemetry');

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
                const appInsights = new AnalyticsPlugin();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin, appInsights]
                );

                const trackStub = this.sandbox.spy(plugin, 'processTelemetry');

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
                const appInsights = new AnalyticsPlugin();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin, appInsights]
                );

                const trackStub = this.sandbox.spy(plugin, 'processTelemetry');

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
                const appInsights = new AnalyticsPlugin();

                this.onDone(() => {
                    core.unload(false);
                });

                core.initialize(
                    {instrumentationKey: "ikey"},
                    [plugin, appInsights]
                );

                const trackStub = this.sandbox.spy(plugin, 'processTelemetry');
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

    private checkNoInternalErrors() {
        if (this.throwInternalSpy) {
            Assert.ok(this.throwInternalSpy.notCalled, "Check no internal errors");
            if (this.throwInternalSpy.called) {
                Assert.ok(false, JSON.stringify(this.throwInternalSpy.args[0]));
            }
        }
    }

    private waitForException: any = (expectedCount:number, action: string = "", includeInit:boolean = false) => [
        () => {
            const message = "polling: " + new Date().toISOString() + " " + action;
            Assert.ok(true, message);
            console.log(message);
            this.checkNoInternalErrors();
            this.clock.tick(500);
        },
        (PollingAssert.createPollingAssert(() => {
            this.checkNoInternalErrors();
            let argCount = 0;
            if (this.trackSpy.called) {
                this.trackSpy.args.forEach(call => {
                    argCount += call.length;
                });
            }
    
            Assert.ok(true, "* [" + argCount + " of " + expectedCount + "] checking spy " + new Date().toISOString());
            try {
                if (argCount >= expectedCount) {
                    let payloads: any = []
                    this.trackSpy.args[0][0].forEach(item => {
                        payloads.push(item.item)
                    });
                    const payload = JSON.parse(payloads);
                    const baseType = payload.data.baseType;
                    // call the appropriate Validate depending on the baseType
                    switch (baseType) {
                        case Event.dataType:
                            return EventValidator.EventValidator.Validate(payload, baseType);
                        case Trace.dataType:
                            return TraceValidator.TraceValidator.Validate(payload, baseType);
                        case Exception.dataType:
                            return ExceptionValidator.ExceptionValidator.Validate(payload, baseType);
                        case Metric.dataType:
                            return MetricValidator.MetricValidator.Validate(payload, baseType);
                        case PageView.dataType:
                            return PageViewValidator.PageViewValidator.Validate(payload, baseType);
                        case PageViewPerformance.dataType:
                            return PageViewPerformanceValidator.PageViewPerformanceValidator.Validate(payload, baseType);
                        case RemoteDependencyData.dataType:
                            return RemoteDepdencyValidator.RemoteDepdencyValidator.Validate(payload, baseType);
    
                        default:
                            return EventValidator.EventValidator.Validate(payload, baseType);
                    }
                }
            } finally {
                this.clock.tick(500);
            }
            
            return false;
        }, "sender succeeded", 10, 1000))
    ];
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

    public initialize = (config: IConfiguration, core: IAppInsightsCore, plugin: IPlugin[]) => {
    }

    private _processTelemetry(env: ITelemetryItem) {

    }
}

class CustomTestError extends Error {
    constructor(message = "") {
      super(message);
      this.name = "CustomTestError";
      this.message = message + " -- test error.";
    }
}