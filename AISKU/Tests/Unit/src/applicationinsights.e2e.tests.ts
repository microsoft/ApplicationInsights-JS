import { AITestClass, Assert, PollingAssert, EventValidator, TraceValidator, ExceptionValidator, MetricValidator, PageViewValidator, PageViewPerformanceValidator, RemoteDepdencyValidator } from "@microsoft/ai-test-framework";
import { SinonSpy } from "sinon";
import { AppInsightsSku as ApplicationInsights } from "../../../src/AISku";
import { Sender } from "@microsoft/applicationinsights-channel-js";
import { IDependencyTelemetry, ContextTagKeys, Event, Trace, Exception, Metric, PageView, PageViewPerformance, DistributedTracingModes, RequestHeaders, IAutoExceptionTelemetry, BreezeChannelIdentifier, IConfig, RemoteDependencyDataType } from "@microsoft/otel-core-js";
import { ITelemetryItem, getGlobal, newId, dumpObj, BaseTelemetryPlugin, IProcessTelemetryContext, __getRegisteredEvents, arrForEach, IConfiguration, ActiveStatus, FeatureOptInMode, IStackFrame } from "@microsoft/otel-core-js";
import { IPropTelemetryContext } from "@microsoft/applicationinsights-properties-js";
import { createAsyncResolvedPromise } from "@nevware21/ts-async";
import { CONFIG_ENDPOINT_URL } from "../../../src/InternalConstants";
import { utcNow } from "@nevware21/ts-utils";

function _checkExpectedFrame(expectedFrame: IStackFrame, actualFrame: IStackFrame,  index: number) {
    Assert.equal(expectedFrame.assembly, actualFrame.assembly, index + ") Assembly is not as expected");
    Assert.equal(expectedFrame.fileName, actualFrame.fileName, index + ") FileName is not as expected");
    Assert.equal(expectedFrame.line, actualFrame.line, index + ") Line is not as expected");
    Assert.equal(expectedFrame.method, actualFrame.method, index + ") Method is not as expected");
    Assert.equal(expectedFrame.level, actualFrame.level, index + ") Level is not as expected");    
}

export class ApplicationInsightsTests extends AITestClass {
    private static readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private static readonly _connectionString = `InstrumentationKey=${ApplicationInsightsTests._instrumentationKey}`;
    private static readonly _expectedTrackMethods = [
        "startTrackPage",
        "stopTrackPage",
        "trackException",
        "trackEvent",
        "trackMetric",
        "trackPageView",
        "trackTrace",
        "trackDependencyData",
        "setAuthenticatedUserContext",
        "clearAuthenticatedUserContext",
        "trackPageViewPerformance",
        "addTelemetryInitializer",
        "flush"
    ];

    private _ai: ApplicationInsights;
    private _aiName: string = 'AppInsightsSDK';
    private isFetchPolyfill:boolean = false;

    // Sinon
    private errorSpy: SinonSpy;
    private successSpy: SinonSpy;
    private loggingSpy: SinonSpy;
    private userSpy: SinonSpy;
    private _sessionPrefix: string = newId();
    private trackSpy: SinonSpy;
    private envelopeConstructorSpy: SinonSpy;

    // Context
    private tagKeys = new ContextTagKeys();
    private _config;
    private _appId: string;
    private _ctx: any;


    constructor(testName?: string) {
        super(testName || "ApplicationInsightsTests");
    }
    
    protected _getTestConfig(sessionPrefix: string) {
        let config: IConfiguration | IConfig = {
            connectionString: ApplicationInsightsTests._connectionString,
            disableAjaxTracking: false,
            disableFetchTracking: false,
            enableRequestHeaderTracking: true,
            enableResponseHeaderTracking: true,
            maxBatchInterval: 2500,
            disableExceptionTracking: false,
            namePrefix: sessionPrefix,
            enableCorsCorrelation: true,
            distributedTracingMode: DistributedTracingModes.AI_AND_W3C,
            samplingPercentage: 50,
            convertUndefined: "test-value",
            disablePageUnloadEvents: [ "beforeunload" ],
            extensionConfig: {
                ["AppInsightsCfgSyncPlugin"]: {
                    //cfgUrl: ""
                }
            }
        };

        return config;
    }

    public testInitialize() {
        try {
            this.isFetchPolyfill = fetch["polyfill"];
            this.useFakeServer = false;
            this._config = this._getTestConfig(this._sessionPrefix);
            this._ctx = {};

            const init = new ApplicationInsights({
                config: this._config
            });
            init.loadAppInsights();
            this._ai = init;
            this._ai.addTelemetryInitializer((item: ITelemetryItem) => {
                Assert.equal("4.0", item.ver, "Telemetry items inside telemetry initializers should be in CS4.0 format");
            });

            // Validate that the before unload event was not added
            let unloadPresent = false;
            let visibilityChangePresent = false;
            let beforeUnloadPresent = false;
            let theEvents = __getRegisteredEvents(window);
            arrForEach(theEvents, (theEvent) => {
                if (theEvent.name.startsWith("beforeunload")) {
                    beforeUnloadPresent = true;
                }

                if (theEvent.name.startsWith("unload")) {
                    unloadPresent = true;
                }

                if (theEvent.name.startsWith("visibilitychange")) {
                    visibilityChangePresent = true;
                }
            });

            Assert.ok(!beforeUnloadPresent, "The beforeunload event should not be present");
            Assert.ok(unloadPresent, "The unload event should be present");
            Assert.ok(visibilityChangePresent, "The visibilitychange event should be present");

            // Setup Sinon stuff
            const sender: Sender = this._ai.getPlugin<Sender>(BreezeChannelIdentifier).plugin;
            this.errorSpy = this.sandbox.spy(sender, '_onError');
            this.successSpy = this.sandbox.spy(sender, '_onSuccess');
            this.loggingSpy = this.sandbox.stub(this._ai['core'].logger, 'throwInternal');
            this.trackSpy = this.sandbox.spy(this._ai.appInsights.core, 'track')
            this.sandbox.stub((sender as any)._sample, 'isSampledIn').returns(true);
            this.envelopeConstructorSpy = this.sandbox.spy(Sender, 'constructEnvelope');
            console.log("* testInitialize()");
        } catch (e) {
            console.error('Failed to initialize', e);
        }
    }

    public testFinishedCleanup(): void {
        if (this._ai && this._ai.unload) {
            // force unload
            this._ai.unload(false);
        }

        if (this._ai && this._ai["dependencies"]) {
            this._ai["dependencies"].teardown();
        }

        console.log("* testCleanup(" + (AITestClass.currentTestInfo ? AITestClass.currentTestInfo.name : "<null>") + ")");
    }

    public registerTests() {
        this.addDynamicConfigTests();
        this.addGenericE2ETests();
        this.addAnalyticsApiTests();
        this.addAsyncTests();
        this.addDependencyPluginTests();
        this.addPropertiesPluginTests();
        this.addCDNOverrideTests();
        this.addCdnMonitorTests();
    }

    public addGenericE2ETests(): void {
        this.testCase({
            name: 'E2E.GenericTests: ApplicationInsightsAnalytics is loaded correctly',
            test: () => {
                Assert.ok(this._ai, 'ApplicationInsights SDK exists');
                // TODO: reenable this test when module is available from window w/o snippet
                // Assert.deepEqual(this._ai, window[this._aiName], `AI is available from window.${this._aiName}`);

                Assert.ok(this._ai.appInsights, 'App Analytics exists');
                Assert.equal(true, this._ai.appInsights.isInitialized(), 'App Analytics is initialized');


                Assert.ok(this._ai.appInsights.core, 'Core exists');
                Assert.equal(true, this._ai.appInsights.core.isInitialized(),
                    'Core is initialized');
            }
        });

        this.testCase({
            name: "Check plugin version string",
            test: () => {
                QUnit.assert.equal(0, this._ai.pluginVersionStringArr.length, "Checking the array length");
                QUnit.assert.equal("", this._ai.pluginVersionString);

                // Add a versioned plugin
                let testPlugin1 = new TestPlugin();
                this._ai.addPlugin(testPlugin1);
                QUnit.assert.equal(1, this._ai.pluginVersionStringArr.length, "Checking the array length");
                QUnit.assert.equal("TestPlugin=0.99.1", this._ai.pluginVersionString);

                // Add a versioned plugin
                let testPlugin2 = new TestPlugin();
                testPlugin2.identifier = "TestPlugin2";
                testPlugin2.version = "1.2.3.4";
                this._ai.addPlugin(testPlugin2);
                QUnit.assert.equal(2, this._ai.pluginVersionStringArr.length, "Checking the array length");
                QUnit.assert.equal("TestPlugin=0.99.1;TestPlugin2=1.2.3.4", this._ai.pluginVersionString);

                // Add a versioned plugin
                this._ai.getPlugin("TestPlugin").remove();
                QUnit.assert.equal(1, this._ai.pluginVersionStringArr.length, "Checking the array length");
                QUnit.assert.equal("TestPlugin2=1.2.3.4", this._ai.pluginVersionString);
            }
        });
    }

    public addDynamicConfigTests(): void {
        this.testCase({
            name: 'DynamicConfigTests: ApplicationInsights dynamic config works correctly',
            useFakeTimers: true,
            test: () => {
                let config = this._ai.config;
                let expectedIkey = ApplicationInsightsTests._instrumentationKey;
                let expectedConnectionString = ApplicationInsightsTests._connectionString;
                let expectedEndpointUrl = "https://dc.services.visualstudio.com/v2/track";
                let expectedLoggingLevel = 10000;
                Assert.ok(config, "ApplicationInsights config exists");
                Assert.equal(expectedConnectionString, config.connectionString, "connection string is set");
                Assert.equal(expectedIkey, config.instrumentationKey, "ikey is set");
                Assert.equal(expectedLoggingLevel, config.diagnosticLogInterval, "diagnosticLogInterval is set to 1000 by default");
                Assert.equal(expectedEndpointUrl, config.endpointUrl, "endpoint url is set from connection string");
                Assert.equal(false, config.disableAjaxTracking, "disableAjaxTracking is set to false");

                let onChangeCalled = 0;
                let handler = this._ai.onCfgChange((details) => {
                    onChangeCalled ++;
                    Assert.equal(expectedIkey, details.cfg.instrumentationKey, "Expect the iKey to be set");
                    Assert.equal(expectedEndpointUrl, details.cfg.endpointUrl, "Expect the endpoint to be set");
                    Assert.equal(expectedLoggingLevel, details.cfg.diagnosticLogInterval, "Expect the diagnosticLogInterval to be set");
                });

                Assert.equal(1, onChangeCalled, "OnCfgChange was not called");

                expectedIkey = "newIKey";
                config.instrumentationKey = expectedIkey;

                Assert.equal(1, onChangeCalled, "Expected the onChanged was called");
                this.clock.tick(1);
                Assert.equal(2, onChangeCalled, "Expected the onChanged was called again");

                expectedLoggingLevel = 2000;
                config.diagnosticLogInterval = expectedLoggingLevel;
                Assert.equal(2, onChangeCalled, "Expected the onChanged was called");
                this.clock.tick(1);
                Assert.equal(3, onChangeCalled, "Expected the onChanged was called again");

                expectedConnectionString = "InstrumentationKey=testKey";
                expectedIkey = "testKey";
                config.connectionString = expectedConnectionString;
                Assert.equal(3, onChangeCalled, "Expected the onChanged was called");
                this.clock.tick(1);
                Assert.equal(4, onChangeCalled, "Expected the onChanged was called again");
                
                // Remove the handler
                handler.rm();
            }
        });

        this.testCaseAsync({
            name: "Init: init with cs promise, when it is resolved and then change with cs string",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {

                // unload previous one first
                let oriInst = this._ai;
                if (oriInst && oriInst.unload) {
                    // force unload
                    oriInst.unload(false);
                }
        
                if (oriInst && oriInst["dependencies"]) {
                    oriInst["dependencies"].teardown();
                }
        
                this._config = this._getTestConfig(this._sessionPrefix);
                let csPromise = createAsyncResolvedPromise("InstrumentationKey=testIkey;ingestionendpoint=testUrl");
                this._config.connectionString = csPromise;
                this._config.initTimeOut= 80000;
                this._ctx.csPromise = csPromise;


                let init = new ApplicationInsights({
                    config: this._config
                });
                init.loadAppInsights();
                this._ai = init;
                let config = this._ai.config;
                let core = this._ai.core;
                let status = core.activeStatus && core.activeStatus();
                Assert.equal(status, ActiveStatus.PENDING, "status should be set to pending");
                
                
            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this._ai.core
                let activeStatus = core.activeStatus && core.activeStatus();
                let csPromise = this._ctx.csPromise;
                let config = this._ai.config;
            
                if (csPromise.state === "resolved" && activeStatus === ActiveStatus.ACTIVE) {
                    Assert.equal("testIkey", core.config.instrumentationKey, "ikey should be set");
                    Assert.equal("testUrl/v2/track", core.config.endpointUrl ,"endpoint shoule be set");

                    config.connectionString = "InstrumentationKey=testIkey1;ingestionendpoint=testUrl1";
                    this.clock.tick(1);
                    let status = core.activeStatus && core.activeStatus();
                    // promise is not resolved, no new changes applied
                    Assert.equal(status, ActiveStatus.ACTIVE, "status should be set to active test1");
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60) as any).concat(PollingAssert.createPollingAssert(() => {
                let core = this._ai.core
                let activeStatus = core.activeStatus && core.activeStatus();
            
                if (activeStatus === ActiveStatus.ACTIVE) {
                    Assert.equal("testIkey1", core.config.instrumentationKey, "ikey should be set test1");
                    Assert.equal("testUrl1/v2/track", core.config.endpointUrl ,"endpoint shoule be set test1");
                    return true;
                }
                return false;
            }, "Wait for new string response" + new Date().toISOString(), 60) as any)
        });

        this.testCaseAsync({
            name: "Init: init with cs promise and change with cs string at the same time",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {

                // unload previous one first
                let oriInst = this._ai;
                if (oriInst && oriInst.unload) {
                    // force unload
                    oriInst.unload(false);
                }
        
                if (oriInst && oriInst["dependencies"]) {
                    oriInst["dependencies"].teardown();
                }
        
                this._config = this._getTestConfig(this._sessionPrefix);
                let csPromise = createAsyncResolvedPromise("InstrumentationKey=testIkey;ingestionendpoint=testUrl");
                this._config.connectionString = csPromise;
                this._config.initTimeOut= 80000;
                this._ctx.csPromise = csPromise;


                let init = new ApplicationInsights({
                    config: this._config
                });
                init.loadAppInsights();
                this._ai = init;
                let config = this._ai.config;
                let core = this._ai.core;
                let status = core.activeStatus && core.activeStatus();
                Assert.equal(status, ActiveStatus.PENDING, "status should be set to pending");
                
                config.connectionString = "InstrumentationKey=testIkey1;ingestionendpoint=testUrl1";
                this.clock.tick(1);
                status = core.activeStatus && core.activeStatus();
                Assert.equal(status, ActiveStatus.ACTIVE, "active status should be set to active in next executing cycle");
                // Assert.equal(status, ActiveStatus.PENDING, "status should be set to pending test1");

                
                
            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this._ai.core
                let activeStatus = core.activeStatus && core.activeStatus();
            
                if (activeStatus === ActiveStatus.ACTIVE) {
                    Assert.equal("testIkey", core.config.instrumentationKey, "ikey should be set");
                    Assert.equal("testUrl/v2/track", core.config.endpointUrl ,"endpoint shoule be set");
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60) as any)
        });


        this.testCaseAsync({
            name: "Init: init with cs promise and offline channel",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {

                // unload previous one first
                let oriInst = this._ai;
                if (oriInst && oriInst.unload) {
                    // force unload
                    oriInst.unload(false);
                }
        
                if (oriInst && oriInst["dependencies"]) {
                    oriInst["dependencies"].teardown();
                }
        
                this._config = this._getTestConfig(this._sessionPrefix);
                let csPromise = createAsyncResolvedPromise("InstrumentationKey=testIkey;ingestionendpoint=testUrl");
                this._config.connectionString = csPromise;
                // Note: OfflineChannel was removed, commenting out for now
                // let offlineChannel = new OfflineChannel();
                // this._config.channels = [[offlineChannel]];
                this._config.initTimeOut= 80000;


                let init = new ApplicationInsights({
                    config: this._config
                });
                init.loadAppInsights();
                this._ai = init;
                let config = this._ai.config;
                let core = this._ai.core;
                let status = core.activeStatus && core.activeStatus();
                Assert.equal(status, ActiveStatus.PENDING, "status should be set to pending");

                
                config.connectionString = "InstrumentationKey=testIkey1;ingestionendpoint=testUrl1"
                this.clock.tick(1);
                status = core.activeStatus && core.activeStatus();
                Assert.equal(status, ActiveStatus.ACTIVE, "active status should be set to active in next executing cycle");
                // Assert.equal(status, ActiveStatus.PENDING, "status should be set to pending test1");
                
                
            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this._ai.core
                let activeStatus = core.activeStatus && core.activeStatus();
            
                if (activeStatus === ActiveStatus.ACTIVE) {
                    Assert.equal("testIkey", core.config.instrumentationKey, "ikey should be set");
                    Assert.equal("testUrl/v2/track", core.config.endpointUrl ,"endpoint shoule be set");
                    let sendChannel = this._ai.getPlugin(BreezeChannelIdentifier);
                    // Note: OfflineChannel was removed, commenting out for now
                    // let offlineChannelPlugin = this._ai.getPlugin("OfflineChannel").plugin;
                    Assert.equal(sendChannel.plugin.isInitialized(), true, "sender is initialized");
                    // Assert.equal(offlineChannelPlugin.isInitialized(), true, "offline channel is initialized");
                    // let urlConfig = offlineChannelPlugin["_getDbgPlgTargets"]()[0];
                    // Assert.ok(urlConfig, "offline url config is initialized");
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60) as any)
        });


        
        this.testCaseAsync({
            name: "Init: init with cs string, change with cs promise",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {
                let config = this._ai.config;
                let expectedIkey = ApplicationInsightsTests._instrumentationKey;
                let expectedConnectionString = ApplicationInsightsTests._connectionString;
                let expectedEndpointUrl = "https://dc.services.visualstudio.com/v2/track";
                Assert.ok(config, "ApplicationInsights config exists");
                Assert.equal(expectedConnectionString, config.connectionString, "connection string is set");
                Assert.equal(expectedIkey, config.instrumentationKey, "ikey is set");
                Assert.equal(expectedEndpointUrl, config.endpointUrl, "endpoint url is set from connection string");
                let core = this._ai.core;
                let status = core.activeStatus && core.activeStatus();
                Assert.equal(status, ActiveStatus.ACTIVE, "status should be set to active");

                let csPromise = createAsyncResolvedPromise("InstrumentationKey=testIkey;ingestionendpoint=testUrl");
                config.connectionString = csPromise;
                config.initTimeOut = 80000;
                this.clock.tick(1);
                status = core.activeStatus && core.activeStatus();
                Assert.equal(status, ActiveStatus.ACTIVE, "active status should be set to active in next executing cycle");
                //Assert.equal(status, ActiveStatus.PENDING, "status should be set to pending");
                
                
            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this._ai.core
                let activeStatus = core.activeStatus && core.activeStatus();
            
                if (activeStatus === ActiveStatus.ACTIVE) {
                    Assert.equal("testIkey", core.config.instrumentationKey, "ikey should be set");
                    Assert.equal("testUrl/v2/track", core.config.endpointUrl ,"endpoint shoule be set");
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60) as any)
        });

        this.testCaseAsync({
            name: "Init: init with cs null, ikey promise, endpoint promise",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {

                // unload previous one first
                let oriInst = this._ai;
                if (oriInst && oriInst.unload) {
                    // force unload
                    oriInst.unload(false);
                }
        
                if (oriInst && oriInst["dependencies"]) {
                    oriInst["dependencies"].teardown();
                }
        
                this._config = this._getTestConfig(this._sessionPrefix);
                let ikeyPromise = createAsyncResolvedPromise("testIkey");
                let endpointPromise = createAsyncResolvedPromise("testUrl");
                //let csPromise = createAsyncResolvedPromise("InstrumentationKey=testIkey;ingestionendpoint=testUrl");
                //this._config.connectionString = csPromise;
                this._config.connectionString = null;
                this._config.instrumentationKey = ikeyPromise;
                this._config.endpointUrl = endpointPromise;
                this._config.initTimeOut= 80000;



                let init = new ApplicationInsights({
                    config: this._config
                });
                init.loadAppInsights();
                this._ai = init;
                let config = this._ai.config;
                let core = this._ai.core;
                let status = core.activeStatus && core.activeStatus();
                Assert.equal(status, ActiveStatus.PENDING, "status should be set to pending");
                Assert.equal(config.connectionString,null, "connection string shoule be null");
                
                
            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this._ai.core
                let activeStatus = core.activeStatus && core.activeStatus();
            
                if (activeStatus === ActiveStatus.ACTIVE) {
                    Assert.equal("testIkey", core.config.instrumentationKey, "ikey should be set");
                    Assert.equal("testUrl", core.config.endpointUrl ,"endpoint shoule be set");
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60) as any)
        });


        this.testCase({
            name: "CfgSync DynamicConfigTests: Prod CDN is Fetched and feature is turned on/off as expected",
            useFakeTimers: true,
            test: () => {
                let fetchcalled = 0;
                let overrideFetchFn = (url: string, oncomplete: any, isAutoSync?: boolean) => {
                    fetchcalled ++;
                    Assert.equal(url, CONFIG_ENDPOINT_URL, "fetch should be called with prod cdn");
                };
                let config = {
                    instrumentationKey: "testIKey",
                    extensionConfig:{
                        ["AppInsightsCfgSyncPlugin"]: {
                            overrideFetchFn: overrideFetchFn
                        }

                    }
                } as IConfiguration & IConfig;
                let ai = new ApplicationInsights({config: config});
                ai.loadAppInsights();
          
                ai.config.extensionConfig = ai.config.extensionConfig || {};
                let extConfig = ai.config.extensionConfig["AppInsightsCfgSyncPlugin"];
                Assert.equal(extConfig.cfgUrl, CONFIG_ENDPOINT_URL, "default cdn endpoint should be set");
                Assert.equal(extConfig.syncMode, 2, "default mode should be set to receive");

                let featureOptIn = config.featureOptIn || {};
                Assert.equal(featureOptIn["iKeyUsage"].mode, FeatureOptInMode.enable, "ikey message should be turned on");
               
                Assert.equal(fetchcalled, 1, "fetch should be called once");
                config.extensionConfig = config.extensionConfig || {};
                let expectedTimeout = 2000000000;
                config.extensionConfig["AppInsightsCfgSyncPlugin"].scheduleFetchTimeout = expectedTimeout;
                this.clock.tick(1);

                extConfig = ai.config.extensionConfig["AppInsightsCfgSyncPlugin"];
                Assert.equal(extConfig.scheduleFetchTimeout, expectedTimeout, "timeout should be changes dynamically");
                ai.unload(false);
                if (ai && ai["dependencies"]) {
                    ai["dependencies"].teardown();
                }
            }
        });

        this.testCase({
            name: "Init Promise: Offline Support can be added and initialized with endpoint url",
            useFakeTimers: true,
            test: () => {
                this.clock.tick(1);
                // if fake timer is turned on, session data will return 0 and will throw sesson not renew error
                // Note: OfflineChannel was removed, commenting out for now
                // let offlineChannel = new OfflineChannel();
                let config = {
                    instrumentationKey: "testIKey",
                    endpointUrl: "testUrl",
                    extensionConfig:{
                        ["AppInsightsCfgSyncPlugin"]: {
                            cfgUrl: ""
                        }

                    },
                    // extensions:[offlineChannel]
                } as IConfiguration & IConfig;
                let ai = new ApplicationInsights({config: config});
                ai.loadAppInsights();
                this.clock.tick(1);

                let sendChannel = ai.getPlugin(BreezeChannelIdentifier);
                // Note: OfflineChannel was removed, commenting out for now
                // let offlineChannelPlugin = ai.getPlugin("OfflineChannel").plugin;
                Assert.equal(sendChannel.plugin.isInitialized(), true, "sender is initialized");
                // Assert.equal(offlineChannelPlugin.isInitialized(), true, "offline channel is initialized");
                // let urlConfig = offlineChannelPlugin["_getDbgPlgTargets"]()[0];
                // Assert.ok(urlConfig, "offline url config is initialized");

                ai.unload(false);
                if (ai && ai["dependencies"]) {
                    ai["dependencies"].teardown();
                }
                //offlineChannel.teardown();
                
            }
        });

        this.testCase({
            name: "Init Promise: Offline Support can be added and initialized with channels",
            useFakeTimers: true,
            test: () => {
                this.clock.tick(1);
                // Note: OfflineChannel was removed, commenting out for now
                // let offlineChannel = new OfflineChannel();
                let config = {
                    instrumentationKey: "testIKey",
                    endpointUrl: "testUrl",
                    extensionConfig:{
                        ["AppInsightsCfgSyncPlugin"]: {
                            cfgUrl: ""
                        }

                    },
                    // channels:[[offlineChannel]]
                } as IConfiguration & IConfig;
                let ai = new ApplicationInsights({config: config});
                ai.loadAppInsights();
                this.clock.tick(1);

                let sendChannel = ai.getPlugin(BreezeChannelIdentifier);
                // Note: OfflineChannel was removed, commenting out for now
                // let offlineChannelPlugin = ai.getPlugin("OfflineChannel").plugin;
                Assert.equal(sendChannel.plugin.isInitialized(), true, "sender is initialized");
                // Assert.equal(offlineChannelPlugin.isInitialized(), true, "offline channel is initialized");
                // let urlConfig = offlineChannelPlugin["_getDbgPlgTargets"]()[0];
                // Assert.ok(urlConfig, "offline url config is initialized");
             

                ai.unload(false);
                if (ai && ai["dependencies"]) {
                    ai["dependencies"].teardown();
                }
                
            }
        });

        this.testCase({
            name: "CfgSync DynamicConfigTests: Offline Support can be added and initialized without endpoint url",
            useFakeTimers: true,
            test: () => {
                this.clock.tick(1);
                // Note: OfflineChannel was removed, commenting out for now
                // let offlineChannel = new OfflineChannel();
                let config = {
                    connectionString: "InstrumentationKey=testIKey",
                    extensionConfig:{
                        ["AppInsightsCfgSyncPlugin"]: {
                            cfgUrl: ""
                        }

                    },
                    // channels:[[offlineChannel]]
                } as IConfiguration & IConfig;
                let ai = new ApplicationInsights({config: config});
                ai.loadAppInsights();
                this.clock.tick(1);

                let sendChannel = ai.getPlugin(BreezeChannelIdentifier);
                // Note: OfflineChannel was removed, commenting out for now
                // let offlineChannelPlugin = ai.getPlugin("OfflineChannel").plugin;
                Assert.equal(sendChannel.plugin.isInitialized(), true, "sender is initialized");
                // Assert.equal(offlineChannelPlugin.isInitialized(), true, "offline channel is initialized");
                // let urlConfig = offlineChannelPlugin["_getDbgPlgTargets"]()[0];

                this.clock.tick(1);
                // Assert.ok(urlConfig, "offline url config is initialized");

                ai.unload(false);
                if (ai && ai["dependencies"]) {
                    ai["dependencies"].teardown();
                }
            }
        });
        
    }

    public addCDNOverrideTests(): void {
        this.testCase({
            name: 'CDNOverrideTests: customer could overwrite the url endpoint',
            useFakeTimers: true,
            test: () => {
                let ingestionendpoint = "https://dc.services.visualstudio.com";
                this._ai.config.connectionString = "InstrumentationKey=xxx;IngestionEndpoint=" + ingestionendpoint + ";LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/"
                this.clock.tick(100);
                Assert.deepEqual(this._ai.config.endpointUrl, ingestionendpoint + "/v2/track", "endpoint url is set from connection string");
                this._ai.config.userOverrideEndpointUrl = "https://custom.endpoint";
                this.clock.tick(100);
                Assert.deepEqual(this._ai.config.endpointUrl, this._ai.config.userOverrideEndpointUrl, "endpoint url is override by userOverrideEndpointUrl");
            }
        });
    }

    public addAnalyticsApiTests(): void {
        this.testCase({
            name: 'E2E.AnalyticsApiTests: Public Members exist',
            test: () => {
                ApplicationInsightsTests._expectedTrackMethods.forEach(method => {
                    Assert.ok(this._ai[method], `${method} exists`);
                    Assert.equal('function', typeof this._ai[method], `${method} is a function`);
                });
            }
        });
    }

    public addCdnMonitorTests(): void {
        this.testCaseAsync({
            name: "E2E.GenericTests: Fetch Current CDN V3",
            stepDelay: 1,
            useFakeServer: false,
            useFakeFetch: false,
            fakeFetchAutoRespond: false,
            steps: [() => {
                // Use beta endpoint to pre-test any changes before public V3 cdn
                let random = utcNow();
                // Under Cors Mode, Options request will be auto-triggered
                try {
                    fetch(`https://js.monitor.azure.com/beta/ai.3.gbl.min.js?${random}`, {
                        method: "GET"
                    }).then((res) => {
                        this._ctx.res = res;
                        res.text().then((val) => {
                            this._ctx.val = val;
                        });
                    });
                } catch (e) {
                    Assert.ok(false, "Fetch Error: " + e);
                }

            }].concat(PollingAssert.createPollingAssert(() => {

                if (this._ctx && this._ctx.res && this._ctx.val) {
                    let res = this._ctx.res;
                    let status = res.status;
                    if (status === 200) {
                        // for Response headers:
                        // content-type: text/javascript; charset=utf-8
                        // x-ms-meta-aijssdksrc: should present
                        // x-ms-meta-aijssdkver should present
                        let headers = res.headers;
                        let headerCnt = 0;
                        headers.forEach((val, key) => {
                            if (key === "content-type") {
                                Assert.deepEqual(val, "text/javascript; charset=utf-8", "should have correct content-type response header");
                                headerCnt ++;
                            }
                            if (key === "x-ms-meta-aijssdksrc") {
                                Assert.ok(val, "should have sdk src response header");
                                headerCnt ++;
                            }
                            if (key === "x-ms-meta-aijssdkver") {
                                Assert.ok(val, "should have version number for response header");
                                headerCnt ++;
                            }
                        });
                        Assert.equal(headerCnt, 3, "all expected headers should be present");
                        return true;
                    }
                    return false;
                }
                return false;
            }, "Wait for response" + new Date().toISOString(), 60) as any)
        });

        this.testCaseAsync({
            name: "E2E.GenericTests: Fetch Current CDN V2",
            stepDelay: 1,
            useFakeServer: false,
            useFakeFetch: false,
            fakeFetchAutoRespond: false,
            steps: [() => {
                // Use public endpoint for V2
                let random = utcNow();
                // Under Cors Mode, Options request will be triggered
                fetch(`https://js.monitor.azure.com/scripts/b/ai.2.gbl.min.js?${random}`, {
                    method: "GET"
                }).then((res) => {
                    this._ctx.res = res;
                    res.text().then((val) => {
                        this._ctx.val = val;
                    });
                });

            }].concat(PollingAssert.createPollingAssert(() => {
                if (this._ctx && this._ctx.res && this._ctx.val) {
                    let res = this._ctx.res;
                    let status = res.status;
                    if (status === 200) {
                        // for Response headers:
                        // content-type: text/javascript; charset=utf-8
                        // x-ms-meta-aijssdksrc: should present
                        // x-ms-meta-aijssdkver should present
                        let headers = res.headers;
                        let headerCnt = 0;
                        headers.forEach((val, key) => {
                            if (key === "content-type") {
                                Assert.deepEqual(val, "text/javascript; charset=utf-8", "should have correct content-type response header");
                                headerCnt ++;
                            }
                            if (key === "x-ms-meta-aijssdksrc") {
                                Assert.ok(val, "should have sdk src response header");
                                headerCnt ++;
                            }
                            if (key === "x-ms-meta-aijssdkver") {
                                Assert.ok(val, "should have version number for response header");
                                headerCnt ++;
                            }
                        });
                        Assert.equal(headerCnt, 3, "all expected headers should be present");
                        return true;
                    }
                    return false;
                }
                return false;
            }, "Wait for response" + new Date().toISOString(), 60) as any)
        });

        this.testCase({
            name: "E2E.GenericTests: Fetch Static Web js0 - CDN V3",
            useFakeServer: false,
            useFakeFetch: false,
            fakeFetchAutoRespond: false,
            test: async () => {
                // Use beta endpoint to pre-test any changes before public V3 cdn
                let random = utcNow();
                // Under Cors Mode, Options request will be auto-triggered
                try {
                    let res = await fetch(`https://js0.tst.applicationinsights.io/scripts/b/ai.3.gbl.min.js?${random}`, {
                        method: "GET"
                    });

                    if (res.ok) {
                        let val = await res.text();
                        Assert.ok(val, "Response text should be returned" );
                    } else {
                        Assert.fail("Fetch failed with status: " + dumpObj(res));
                    }
                } catch (e) {
                    Assert.fail("Fetch Error: " + dumpObj(e));
                }
            }
        });
    }

    public addAsyncTests(): void {
        // NOTE: OfflineChannel functionality was removed - this test is disabled
        // this.testCaseAsync({
        //     name: "E2E.GenericTests: Send events with offline support",
        //     stepDelay: 1,
        //     steps: [() => {
        //         // Note: OfflineChannel was removed, commenting out for now
        //         // let offlineChannel = new OfflineChannel();
        //         // this._ai.addPlugin(offlineChannel);
        //         // this._ctx.offlineChannel = offlineChannel;
        //     }].concat(PollingAssert.createPollingAssert(() => {
        //         let offlineChannel = this._ctx.offlineChannel;
        //         if (offlineChannel && offlineChannel.isInitialized()) {
        //             let urlConfig = offlineChannel["_getDbgPlgTargets"]()[0];
        //             Assert.ok(urlConfig, "offline url config is initialized");
        //             let offlineListener = offlineChannel.getOfflineListener() as any;
        //             Assert.ok(offlineListener, "offlineListener should be initialized");
        //             // online
        //             offlineListener.setOnlineState(1);
        //             let inMemoTimer = offlineChannel["_getDbgPlgTargets"]()[3];
        //             Assert.ok(!inMemoTimer, "offline in memo timer should be null");
        //             this._ai.trackEvent({ name: "online event", properties: { "prop1": "value1" }, measurements: { "measurement1": 200 } });
        //             // set to offline status right way
        //             offlineListener.setOnlineState(2);
        //             this._ai.trackEvent({ name: "offline event", properties: { "prop2": "value2" }, measurements: { "measurement2": 200 } });
        //             inMemoTimer = offlineChannel["_getDbgPlgTargets"]()[3];
        //             Assert.ok(inMemoTimer, "in memo timer should not be null");
        //             let inMemoBatch = offlineChannel["_getDbgPlgTargets"]()[1][EventPersistence.Normal];
        //             Assert.equal(inMemoBatch && inMemoBatch.count(), 1, "should have one event");
        //             return true
        //         }
        //         return false
        //     }, "Wait for init" + new Date().toISOString(), 60) as any).concat(this.asserts(1)).concat(() => {
        //         const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
        //         if (payloadStr.length > 0) {
        //             const payload = JSON.parse(payloadStr[0]);
        //             const data = payload.data;
        //             Assert.ok( payload && payload.iKey);
        //             Assert.equal( ApplicationInsightsTests._instrumentationKey,payload.iKey,"payload ikey is not set correctly" );
        //             Assert.ok(data && data.baseData && data.baseData.properties["prop1"]);
        //             Assert.ok(data && data.baseData && data.baseData.measurements["measurement1"]);
        //         }
        //     })
        // });
        this.testCaseAsync({
            name: 'E2E.GenericTests: trackEvent sends to backend',
            stepDelay: 1,
            steps: [() => {
                this._ai.trackEvent({ name: 'event', properties: { "prop1": "value1" }, measurements: { "measurement1": 200 } });
            }].concat(this.asserts(1)).concat(() => {
                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    const data = payload.data;
                    Assert.ok( payload && payload.iKey);
                    Assert.equal( ApplicationInsightsTests._instrumentationKey,payload.iKey,"payload ikey is not set correctly" );
                    Assert.ok(data && data.baseData && data.baseData.properties["prop1"]);
                    Assert.ok(data && data.baseData && data.baseData.measurements["measurement1"]);
                }
            })
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackTrace sends to backend',
            stepDelay: 1,
            steps: [() => {
                this._ai.trackTrace({ message: 'trace', properties: { "foo": "bar", "prop2": "value2" } });
            }].concat(this.asserts(1)).concat(() => {
                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                const payload = JSON.parse(payloadStr[0]);
                const data = payload.data;
                Assert.ok(data && data.baseData &&
                    data.baseData.properties["foo"] && data.baseData.properties["prop2"]);
                Assert.equal("bar", data.baseData.properties["foo"]);
                Assert.equal("value2", data.baseData.properties["prop2"]);
            })
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: legacy trackException sends to backend',
            stepDelay: 1,
            steps: [() => {
                let exception: Error = null;
                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    exception = e;
                    this._ai.trackException({ error: exception } as any);
                }
                Assert.ok(exception);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException with auto telemetry sends to backend',
            stepDelay: 1,
            steps: [() => {
                let exception: Error = null;
                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    // Simulating window.onerror option
                    let autoTelemetry = {
                        message: e.message,
                        url: "https://dummy.auto.example.com",
                        lineNumber: 42,
                        columnNumber: 53,
                        error: e,
                        evt: null
                    } as IAutoExceptionTelemetry;
    
                    exception = e;
                    this._ai.trackException({ exception: autoTelemetry });
                }
                Assert.ok(exception);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException with auto telemetry sends to backend with custom properties',
            stepDelay: 1,
            steps: [() => {
                let exception: Error = null;
                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    // Simulating window.onerror option
                    let autoTelemetry = {
                        message: e.message,
                        url: "https://dummy.auto.example.com",
                        lineNumber: 42,
                        columnNumber: 53,
                        error: e,
                        evt: null
                    } as IAutoExceptionTelemetry;
    
                    exception = e;
                    this._ai.trackException({ exception: autoTelemetry }, { custom: "custom value" });
                }
                Assert.ok(exception);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException with message only sends to backend',
            stepDelay: 1,
            steps: [() => {
                let exception: Error = null;
                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    // Simulating window.onerror option
                    let autoTelemetry = {
                        message: e.toString(),
                        url: "https://dummy.message.example.com",
                        lineNumber: 42,
                        columnNumber: 53,
                        error: e.toString(),
                        evt: null
                    } as IAutoExceptionTelemetry;
    
                    exception = e;
                    this._ai.trackException({ exception: autoTelemetry });
                }
                Assert.ok(exception);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException with message holding error sends to backend',
            stepDelay: 1,
            steps: [() => {
                let exception: Error = null;
                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    // Simulating window.onerror option
                    let autoTelemetry = {
                        message: e,
                        url: "https://dummy.error.example.com",
                        lineNumber: 42,
                        columnNumber: 53,
                        error: undefined,
                        evt: null
                    } as IAutoExceptionTelemetry;
    
                    try {
                        exception = e;
                        this._ai.trackException({ exception: autoTelemetry });
                    } catch (e) {
                        console.log(e);
                        console.log(e.stack);
                        Assert.ok(false, e.stack);
                    }
                }
                Assert.ok(exception);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException with message holding error sends to backend with custom properties',
            stepDelay: 1,
            steps: [() => {
                let exception: Error = null;
                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    // Simulating window.onerror option
                    let autoTelemetry = {
                        message: e,
                        url: "https://dummy.error.example.com",
                        lineNumber: 42,
                        columnNumber: 53,
                        error: undefined,
                        evt: null
                    } as IAutoExceptionTelemetry;
    
                    try {
                        exception = e;
                        this._ai.trackException({ exception: autoTelemetry }, { custom: "custom value" });
                    } catch (e) {
                        console.log(e);
                        console.log(e.stack);
                        Assert.ok(false, e.stack);
                    }
                }
                Assert.ok(exception);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException with no Error sends to backend',
            stepDelay: 1,
            steps: [() => {
                let autoTelemetry = {
                    message: "Test Message",
                    url: "https://dummy.no.error.example.com",
                    lineNumber: 42,
                    columnNumber: 53,
                    error: this,
                    evt: null
                } as IAutoExceptionTelemetry;
                this._ai.trackException({ exception: autoTelemetry });
                Assert.ok(autoTelemetry);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException with CustomError sends to backend',
            stepDelay: 1,
            steps: [() => {
                this._ai.trackException({ id: "testID", exception: new CustomTestError("Test Custom Error!") });
            }].concat(this.asserts(1)).concat(() => {
                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    const data = payload.data;
                    Assert.ok(data, "Has Data");
                    if (data) {
                        Assert.ok(data.baseData, "Has BaseData");
                        let baseData = data.baseData;
                        if (baseData) {
                            const ex = baseData.exceptions[0];
                            Assert.ok(ex.message.indexOf("Test Custom Error!") !== -1, "Make sure the error message is present [" + ex.message + "]");
                            Assert.ok(ex.message.indexOf("CustomTestError") !== -1, "Make sure the error type is present [" + ex.message + "]");
                            Assert.equal("CustomTestError", ex.typeName, "Got the correct typename");
                            Assert.ok(ex.stack.length > 0, "Has stack");
                            Assert.ok(ex.parsedStack, "Stack was parsed");
                            Assert.ok(ex.hasFullStack, "Stack has been decoded");
                            Assert.equal(baseData.properties.id, "testID", "Make sure the error message id is present [" + baseData.properties + "]");
                        }
                    }
                }
            })
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException will keep id from the original exception',
            stepDelay: 1,
            steps: [() => {
                this._ai.trackException({id:"testId", error: new Error("test local exception"), severityLevel: 3});
            }].concat(this.asserts(1)).concat(() => {
                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    const data = payload.data;
                    Assert.ok(data, "Has Data");
                    if (data) {
                        Assert.ok(data.baseData, "Has BaseData");
                        let baseData = data.baseData;
                        if (baseData) {
                            const ex = baseData.exceptions[0];
                            console.log(JSON.stringify(baseData.properties));
                            Assert.equal(baseData.properties.id, "testId", "Make sure the error message id is present [" + ex.properties + "]");
                        }
                    }
                }
            })
        });


        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException with CustomError sends to backend with custom properties',
            stepDelay: 1,
            steps: [() => {
                this._ai.trackException({ exception: new CustomTestError("Test Custom Error!") }, { custom: "custom value" });
            }].concat(this.asserts(1)).concat(() => {
                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    const data = payload.data;
                    Assert.ok(data, "Has Data");
                    if (data) {
                        Assert.ok(data.baseData, "Has BaseData");
                        let baseData = data.baseData;
                        if (baseData) {
                            const ex = baseData.exceptions[0];
                            Assert.ok(ex.message.indexOf("Test Custom Error!") !== -1, "Make sure the error message is present [" + ex.message + "]");
                            Assert.ok(ex.message.indexOf("CustomTestError") !== -1, "Make sure the error type is present [" + ex.message + "]");
                            Assert.equal("CustomTestError", ex.typeName, "Got the correct typename");
                            Assert.ok(ex.stack.length > 0, "Has stack");
                            Assert.ok(ex.parsedStack, "Stack was parsed");
                            Assert.ok(ex.hasFullStack, "Stack has been decoded");

                            Assert.ok(baseData.properties, "Has BaseData properties");
                            Assert.equal(baseData.properties.custom, "custom value");
                        }
                    }
                }
            })
        });

        this.testCaseAsync({
            name: "E2E.GenericTests: trackException with multiple stack frame formats",
            stepDelay: 1,
            steps: [() => {
                let errObj = {
                    name: "E2E.GenericTests",
                    reason:{
                        message: "Test_Error_Throwing_Inside_UseCallback",
                        stack: "Error: Test_Error_Throwing_Inside_UseCallback\n" +
                            "at http://localhost:3000/static/js/main.206f4846.js:2:296748\n" +                      // Anonymous function with no function name attribution (firefox/ios)
                            "at Object.Re (http://localhost:3000/static/js/main.206f4846.js:2:16814)\n" +           // With class.function attribution
                            "at je (http://localhost:3000/static/js/main.206f4846.js:2:16968)\n" +                  // With function name attribution
                            "at Object.<anonymous> (http://localhost:3000/static/js/main.206f4846.js:2:42819)\n" +  // With Object.<anonymous> attribution
                            "at Object.<anonymous> (../localfile.js:2:1234)\n" +                                    // With Object.<anonymous> attribution and local file                  
                            "at (anonymous) @ VM60:1\n" +                                                           // With (anonymous) attribution            
                            "at [native code]\n" +                                                                  // With [native code] attribution
                            "at (at eval at <anonymous> (http://localhost:3000/static/js/main.206f4846.js:2:296748), <anonymous>:1:1)\n" + // With eval attribution
                            "at Object.eval (http://localhost:3000/static/js/main.206f4846.js:2:296748)\n" +        // With eval attribution
                            "at eval (http://localhost:3000/static/js/main.206f4846.js:2:296748)\n" +               // With eval attribution
                            "at eval (webpack-internal:///./src/App.tsx:1:1)\n" +                                   // With eval attribution
                            "at [arguments not available])@file://localhost/stacktrace.js:21\n" +                   // With arguments not available attribution
                            "at file://C:/Temp/stacktrace.js:27:1\n" +                                              // With file://localhost attribution
                            " Line 21 of linked script file://localhost/C:/Temp/stacktrace.js\n" +                  // With Line 21 of linked script attribution
                            " Line 11 of inline#1 script in http://localhost:3000/static/js/main.206f4846.js:2:296748\n" + // With Line 11 of inline#1 script attribution
                            " Line 68 of inline#2 script in file://localhost/teststack.html\n" +                    // With Line 68 of inline#2 script attribution
                            "at Function.Module._load (module.js:407:3)\n" +
                            " at Function.Module.runMain (module.js:575:10)\n"+ 
                            " at startup (node.js:159:18)\n" +
                            "at Global code (http://example.com/stacktrace.js:11:1)\n" +
                            "at Object.Module._extensions..js (module.js:550:10)\n" +
                            "   at c@http://example.com/stacktrace.js:9:3\n" +
                            "   at b@http://example.com/stacktrace.js:6:3\n" +
                            "   at a@http://example.com/stacktrace.js:3:3\n" +
                            "http://localhost:3000/static/js/main.206f4846.js:2:296748\n" +                      // Anonymous function with no function name attribution (firefox/ios)
                            "   c@http://example.com/stacktrace.js:9:3\n" +
                            "   b@http://example.com/stacktrace.js:6:3\n" +
                            "   a@http://example.com/stacktrace.js:3:3\n" +
                            "  at Object.testMethod (http://localhost:9002/shared/AppInsightsCommon/node_modules/@microsoft/ai-test-framework/dist/es5/ai-test-framework.js:53058:48)"
                    }
                };

                let exception = Exception.CreateAutoException("Test_Error_Throwing_Inside_UseCallback",
                    "url",
                    9,
                    0,
                    errObj
                );
                this._ai.trackException({ exception: exception }, { custom: "custom value" });
            }].concat(this.asserts(1)).concat(() => {

                const expectedParsedStack: IStackFrame[] = [
                    { level: 0, method: "<no_method>", assembly: "at http://localhost:3000/static/js/main.206f4846.js:2:296748", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 1, method: "Object.Re", assembly: "at Object.Re (http://localhost:3000/static/js/main.206f4846.js:2:16814)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 2, method: "je", assembly: "at je (http://localhost:3000/static/js/main.206f4846.js:2:16968)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 3, method: "Object.<anonymous>", assembly: "at Object.<anonymous> (http://localhost:3000/static/js/main.206f4846.js:2:42819)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 4, method: "Object.<anonymous>", assembly: "at Object.<anonymous> (../localfile.js:2:1234)", fileName: "../localfile.js", line: 2 },
                    { level: 5, method: "<anonymous>", assembly: "at (anonymous) @ VM60:1", fileName: "VM60", line: 1 },
                    { level: 6, method: "<no_method>", assembly: "at [native code]", fileName: "", line: 0 },
                    { level: 7, method: "<no_method>", assembly: "at (at eval at <anonymous> (http://localhost:3000/static/js/main.206f4846.js:2:296748), <anonymous>:1:1)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 8, method: "Object.eval", assembly: "at Object.eval (http://localhost:3000/static/js/main.206f4846.js:2:296748)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 9, method: "eval", assembly: "at eval (http://localhost:3000/static/js/main.206f4846.js:2:296748)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 10, method: "eval", assembly: "at eval (webpack-internal:///./src/App.tsx:1:1)", fileName: "webpack-internal:///./src/App.tsx", line: 1 },
                    { level: 11, method: "<no_method>", assembly: "at [arguments not available])@file://localhost/stacktrace.js:21", fileName: "file://localhost/stacktrace.js", line: 21 },
                    { level: 12, method: "<no_method>", assembly: "at file://C:/Temp/stacktrace.js:27:1", fileName: "file://C:/Temp/stacktrace.js", line: 27 },
                    { level: 13, method: "<no_method>", assembly: "Line 21 of linked script file://localhost/C:/Temp/stacktrace.js", fileName: "file://localhost/C:/Temp/stacktrace.js", line: 0 },
                    { level: 14, method: "<no_method>", assembly: "Line 11 of inline#1 script in http://localhost:3000/static/js/main.206f4846.js:2:296748", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 15, method: "<no_method>", assembly: "Line 68 of inline#2 script in file://localhost/teststack.html", fileName: "file://localhost/teststack.html", line: 0 },
                    { level: 16, method: "Function.Module._load", assembly: "at Function.Module._load (module.js:407:3)", fileName: "module.js", line: 407 },
                    { level: 17, method: "Function.Module.runMain", assembly: "at Function.Module.runMain (module.js:575:10)", fileName: "module.js", line: 575 },
                    { level: 18, method: "startup", assembly: "at startup (node.js:159:18)", fileName: "node.js", line: 159 },
                    { level: 19, method: "<no_method>", assembly: "at Global code (http://example.com/stacktrace.js:11:1)", fileName: "http://example.com/stacktrace.js", line: 11 },
                    { level: 20, method: "Object.Module._extensions..js", assembly: "at Object.Module._extensions..js (module.js:550:10)", fileName: "module.js", line: 550 },
                    { level: 21, method: "c", assembly: "at c@http://example.com/stacktrace.js:9:3", fileName: "http://example.com/stacktrace.js", line: 9 },
                    { level: 22, method: "b", assembly: "at b@http://example.com/stacktrace.js:6:3", fileName: "http://example.com/stacktrace.js", line: 6 },
                    { level: 23, method: "a", assembly: "at a@http://example.com/stacktrace.js:3:3", fileName: "http://example.com/stacktrace.js", line: 3 },
                    { level: 24, method: "<no_method>", assembly: "http://localhost:3000/static/js/main.206f4846.js:2:296748", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 25, method: "c", assembly: "c@http://example.com/stacktrace.js:9:3", fileName: "http://example.com/stacktrace.js", line: 9 },
                    { level: 26, method: "b", assembly: "b@http://example.com/stacktrace.js:6:3", fileName: "http://example.com/stacktrace.js", line: 6 },
                    { level: 27, method: "a", assembly: "a@http://example.com/stacktrace.js:3:3", fileName: "http://example.com/stacktrace.js", line: 3 },
                    { level: 28, method: "Object.testMethod", assembly: "at Object.testMethod (http://localhost:9002/shared/AppInsightsCommon/node_modules/@microsoft/ai-test-framework/dist/es5/ai-test-framework.js:53058:48)", fileName: "http://localhost:9002/shared/AppInsightsCommon/node_modules/@microsoft/ai-test-framework/dist/es5/ai-test-framework.js", line: 53058 }
                ];

                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    const data = payload.data;
                    Assert.ok(data, "Has Data");
                    if (data) {
                        Assert.ok(data.baseData, "Has BaseData");
                        let baseData = data.baseData;
                        if (baseData) {
                            const ex = baseData.exceptions[0];
                            Assert.ok(ex.message.indexOf("Test_Error_Throwing_Inside_UseCallback") !== -1, "Make sure the error message is present [" + ex.message + "]");
                            Assert.ok(ex.stack.length > 0, "Has stack");
                            Assert.ok(ex.parsedStack, "Stack was parsed");
                            Assert.ok(ex.hasFullStack, "Stack has been decoded");
                            Assert.equal(ex.parsedStack.length, 29);
                            for (let lp = 0; lp < ex.parsedStack.length; lp++) {
                                _checkExpectedFrame(expectedParsedStack[lp], ex.parsedStack[lp], lp);
                            }                            

                            Assert.ok(baseData.properties, "Has BaseData properties");
                            Assert.equal(baseData.properties.custom, "custom value");

                        }
                    }
                }
            })
        })

        this.testCaseAsync({
            name: "E2E.GenericTests: trackException with multiple line message",
            stepDelay: 1,
            steps: [() => {
                let message = "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n" +
                            "1. You might have mismatching versions of React and the renderer (such as React DOM)\n" +
                            "2. You might be breaking the Rules of Hooks\n" +
                            "3. You might have more than one copy of React in the same app\n" + 
                            "See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.";
                let errObj = {
                    typeName: "Error",
                    reason:{
                        message: "Error: " + message,
                        stack: "Error: " + message + "\n" +
                            "    at Object.throwInvalidHookError (https://localhost:44365/static/js/bundle.js:201419:13)\n" +
                            "    at useContext (https://localhost:44365/static/js/bundle.js:222943:25)\n" +
                            "    at useTenantContext (https://localhost:44365/static/js/bundle.js:5430:68)\n" +
                            "    at https://localhost:44365/static/js/bundle.js:4337:72\n" +
                            "    at _ZoneDelegate.invoke (https://localhost:44365/static/js/bundle.js:227675:158)\n" +
                            "    at ZoneImpl.run (https://localhost:44365/static/js/bundle.js:227446:35)\n" +
                            "    at https://localhost:44365/static/js/bundle.js:229764:30\n" +
                            "    at _ZoneDelegate.invokeTask (https://localhost:44365/static/js/bundle.js:227700:171)\n" +
                            "    at ZoneImpl.runTask (https://localhost:44365/static/js/bundle.js:227499:37)\n" +
                            "    at ZoneImpl.patchRunTask (https://localhost:44365/static/js/bundle.js:144112:27)"
                    }
                };

                let exception = Exception.CreateAutoException(message,
                    "url",
                    9,
                    0,
                    errObj
                );
                this._ai.trackException({ exception: exception }, { custom: "custom value" });
            }].concat(this.asserts(1)).concat(() => {

                const expectedParsedStack: IStackFrame[] = [
                    { level: 0, method: "Object.throwInvalidHookError", assembly: "at Object.throwInvalidHookError (https://localhost:44365/static/js/bundle.js:201419:13)", fileName: "https://localhost:44365/static/js/bundle.js", line: 201419 },
                    { level: 1, method: "useContext", assembly: "at useContext (https://localhost:44365/static/js/bundle.js:222943:25)", fileName: "https://localhost:44365/static/js/bundle.js", line: 222943 },
                    { level: 2, method: "useTenantContext", assembly: "at useTenantContext (https://localhost:44365/static/js/bundle.js:5430:68)", fileName: "https://localhost:44365/static/js/bundle.js", line: 5430 },
                    { level: 3, method: "<no_method>", assembly: "at https://localhost:44365/static/js/bundle.js:4337:72", fileName: "https://localhost:44365/static/js/bundle.js", line: 4337 },
                    { level: 4, method: "_ZoneDelegate.invoke", assembly: "at _ZoneDelegate.invoke (https://localhost:44365/static/js/bundle.js:227675:158)", fileName: "https://localhost:44365/static/js/bundle.js", line: 227675 },
                    { level: 5, method: "ZoneImpl.run", assembly: "at ZoneImpl.run (https://localhost:44365/static/js/bundle.js:227446:35)", fileName: "https://localhost:44365/static/js/bundle.js", line: 227446 },
                    { level: 6, method: "<no_method>", assembly: "at https://localhost:44365/static/js/bundle.js:229764:30", fileName: "https://localhost:44365/static/js/bundle.js", line: 229764 },
                    { level: 7, method: "_ZoneDelegate.invokeTask", assembly: "at _ZoneDelegate.invokeTask (https://localhost:44365/static/js/bundle.js:227700:171)", fileName: "https://localhost:44365/static/js/bundle.js", line: 227700 },
                    { level: 8, method: "ZoneImpl.runTask", assembly: "at ZoneImpl.runTask (https://localhost:44365/static/js/bundle.js:227499:37)", fileName: "https://localhost:44365/static/js/bundle.js", line: 227499 },
                    { level: 9, method: "ZoneImpl.patchRunTask", assembly: "at ZoneImpl.patchRunTask (https://localhost:44365/static/js/bundle.js:144112:27)", fileName: "https://localhost:44365/static/js/bundle.js", line: 144112 }
                ];

                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    const data = payload.data;
                    Assert.ok(data, "Has Data");
                    if (data) {
                        Assert.ok(data.baseData, "Has BaseData");
                        let baseData = data.baseData;
                        if (baseData) {
                            const ex = baseData.exceptions[0];
                            Assert.ok(ex.message.indexOf("Invalid hook call") !== -1, "Make sure the error message is present [" + ex.message + "]");
                            Assert.ok(ex.stack.length > 0, "Has stack");
                            Assert.ok(ex.parsedStack, "Stack was parsed");
                            Assert.ok(ex.hasFullStack, "Stack has been decoded");
                            Assert.equal(ex.parsedStack.length, 10);
                            for (let lp = 0; lp < ex.parsedStack.length; lp++) {
                                _checkExpectedFrame(expectedParsedStack[lp], ex.parsedStack[lp], lp);
                            }                            

                            Assert.ok(baseData.properties, "Has BaseData properties");
                            Assert.equal(baseData.properties.custom, "custom value");

                        }
                    }
                }
            })
        })

        this.testCaseAsync({
            name: "TelemetryContext: track metric",
            stepDelay: 1,
            steps: [
                () => {
                    console.log("* calling trackMetric " + new Date().toISOString());
                    for (let i = 0; i < 100; i++) {
                        this._ai.trackMetric({ name: "test" + i, average: Math.round(100 * Math.random()), min: 1, max: i+1, stdDev: 10.0 * Math.random() });
                    }
                    console.log("* done calling trackMetric " + new Date().toISOString());
                }
            ].concat(this.asserts(100))
        });

        this.testCaseAsync({
            name: "TelemetryContext: track custom metric",
            stepDelay: 1,
            steps: [
                () => {
                    console.log("* calling trackMetric " + new Date().toISOString());
                    this._ai.trackMetric({ name: "my_custom_metric_0", average: 2 });
                    this._ai.trackMetric({ name: "my_custom_metric_1", average: 1.1, sampleCount: 1, min: 1, max: 1, stdDev: 1.12 });
                    this._ai.trackMetric({ name: "my_custom_metric_2", average: 1.2, sampleCount: 2, min: 1, max: 2, stdDev: 1.23 });
                    this._ai.trackMetric({ name: "my_custom_metric_3", average: 1.3, sampleCount: 3, min: 1, max: 2.5, stdDev: 1.35 });
                    console.log("* done calling trackMetric " + new Date().toISOString());
                }
            ].concat(this.asserts(4))
        });

        this.testCaseAsync({
            name: `TelemetryContext: track page view ${window.location.pathname}`,
            stepDelay: 500,
            steps: [
                () => {
                    this._ai.trackPageView(); // sends 2
                }
            ]
            .concat(this.asserts(2))
            .concat(() => {

                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    const data = payload.data;
                    Assert.ok(data.baseData.id, "pageView id is defined");
                    Assert.ok(data.baseData.id.length > 0);
                    Assert.ok(payload.tags["ai.operation.id"]);
                    Assert.equal(data.baseData.id, payload.tags["ai.operation.id"], "pageView id matches current operation id");
                } else {
                    Assert.ok(false, "successSpy not called");
                }
            })
        });

        this.testCaseAsync({
            name: "TelemetryContext: track page view performance",
            stepDelay: 1,
            steps: [
                () => {
                    this._ai.trackPageViewPerformance({ name: 'name', uri: 'url' });
                }
            ].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: "TelemetryContext: track all types in batch",
            stepDelay: 1,
            steps: [
                () => {
                    let exception = null;
                    try {
                        window["a"]["b"]();
                    } catch (e) {
                        exception = e;
                    }

                    Assert.ok(exception);

                    this._ai.trackException({ exception });
                    this._ai.trackMetric({ name: "test", average: Math.round(100 * Math.random()) });
                    this._ai.trackTrace({ message: "test" });
                    this._ai.trackPageView({}); // sends 2
                    this._ai.trackPageViewPerformance({ name: 'name', uri: 'http://someurl' });
                    this._ai.flush();
                }
            ].concat(this.asserts(6))
        });

        this.testCaseAsync({
            name: "TelemetryContext: track all types in a large batch",
            stepDelay: 1,
            steps: [
                () => {
                    let exception = null;
                    try {
                        window["a"]["b"]();
                    } catch (e) {
                        exception = e;
                    }
                    Assert.ok(exception);

                    for (let i = 0; i < 100; i++) {
                        this._ai.trackException({ exception });
                        this._ai.trackMetric({ name: "test", average: Math.round(100 * Math.random()) });
                        this._ai.trackTrace({ message: "test" });
                        this._ai.trackPageView({ name: `${i}` }); // sends 2 1st time
                    }
                }
            ].concat(this.asserts(401, false))
        });

        this.testCaseAsync({
            name: "TelemetryInitializer: E2E override envelope data",
            stepDelay: 1,
            steps: [
                () => {
                    // Setup
                    const telemetryInitializer = {
                        init: (envelope) => {
                            envelope.baseData.name = 'other name'
                            return true;
                        }
                    }

                    // Act
                    this._ai.addTelemetryInitializer(telemetryInitializer.init);
                    this._ai.trackMetric({ name: "test", average: Math.round(100 * Math.random()) });
                }
            ]
                .concat(this.asserts(1))
                .concat(() => {
                    const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                    if (payloadStr.length > 0) {
                        let payloadItems = payloadStr.length;
                        Assert.equal(1, payloadItems, 'Only 1 track item is sent');
                        const payload = JSON.parse(payloadStr[0]);
                        Assert.ok(payload);

                        if (payload && payload.baseData) {
                            const nameResult: string = payload.data.baseData.metrics[0].name;
                            const nameExpect: string = 'other name';
                            Assert.equal(nameExpect, nameResult, 'telemetryinitializer override successful');
                        }
                    }
                })
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: undefined properties are replaced by customer defined value with config convertUndefined.',
            stepDelay: 1,
            steps: [() => {
                this._ai.trackPageView({ name: 'pageview', properties: { 'prop1': 'val1' }});
                this._ai.trackEvent({ name: 'event', properties: { 'prop2': undefined } });
            }].concat(this.asserts(3)).concat(() => {
                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                for (let i = 0; i < payloadStr.length; i++) {
                    const payload = JSON.parse(payloadStr[i]);const baseType = payload.data.baseType;
                    // Make the appropriate assersion depending on the baseType
                    switch (baseType) {
                        case Event.dataType:
                            const eventData = payload.data;
                            Assert.ok(eventData && eventData.baseData && eventData.baseData.properties['prop2']);
                            Assert.equal(eventData.baseData.properties['prop2'], 'test-value');
                            break;
                        case PageView.dataType:
                            const pageViewData = payload.data;
                            Assert.ok(pageViewData && pageViewData.baseData && pageViewData.baseData.properties['prop1']);
                            Assert.equal(pageViewData.baseData.properties['prop1'], 'val1');
                            break;
                        default:
                            break;
                    }
                }
            })
        });
    }

    public addDependencyPluginTests(): void {

        this.testCaseAsync({
            name: "TelemetryContext: trackDependencyData",
            stepDelay: 1,
            steps: [
                () => {
                    const data: IDependencyTelemetry = {
                        target: 'http://abc',
                        responseCode: 200,
                        type: 'GET',
                        id: 'abc'
                    }
                    this._ai.trackDependencyData(data);
                }
            ].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: "TelemetryContext: auto collection of ajax requests",
            stepDelay: 1,
            useFakeServer: true,
            fakeServerAutoRespond: true,
            steps: [
                () => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', 'https://httpbin.org/status/200');
                    xhr.send();
                    Assert.ok(true);
                }
            ].concat(this.asserts(1))
        });
        let global = getGlobal();
        if (global && global.fetch) {
            this.testCaseAsync({
                name: "DependenciesPlugin: auto collection of outgoing fetch requests " + (this.isFetchPolyfill ? " using polyfill " : ""),
                stepDelay: 5000,
                useFakeFetch: true,
                fakeFetchAutoRespond: true,
                steps: [
                    () => {
                        fetch('https://httpbin.org/status/200', { method: 'GET', headers: { 'header': 'value'} });
                        Assert.ok(true, "fetch monitoring is instrumented");
                    },
                    () => {
                        fetch('https://httpbin.org/status/200', { method: 'GET' });
                        Assert.ok(true, "fetch monitoring is instrumented");
                    },
                    () => {
                        fetch('https://httpbin.org/status/200');
                        Assert.ok(true, "fetch monitoring is instrumented");
                    }
                ].concat(this.asserts(3, false, false))
                    .concat(() => {
                        let args = [];
                        this.trackSpy.args.forEach(call => {
                            let message = call[0].baseData.message||"";
                            // Ignore the internal SendBrowserInfoOnUserInit message (Only occurs when running tests in a browser)
                            if (message.indexOf("AI (Internal): 72 ") == -1) {
                                args.push(call[0]);
                            }
                        });

                        let type = "Fetch";
                        if (this.isFetchPolyfill) {
                            type = "Ajax";
                            Assert.ok(true, "Using fetch polyfill");
                        }

                        Assert.equal(3, args.length, "track is called 3 times");
                        let baseData = args[0].baseData;
                        Assert.equal(type, baseData.type, "request is " + type + " type");
                        Assert.equal('value', baseData.properties.requestHeaders['header'], "fetch request's user defined request header is stored");
                        Assert.ok(baseData.properties.responseHeaders, "fetch request's reponse header is stored");

                        baseData = args[1].baseData;
                        Assert.equal(3, Object.keys(baseData.properties.requestHeaders).length, "two request headers set up when there's no user defined request header");
                        Assert.ok(baseData.properties.requestHeaders[RequestHeaders.requestIdHeader], "Request-Id header");
                        Assert.ok(baseData.properties.requestHeaders[RequestHeaders.requestContextHeader], "Request-Context header");
                        Assert.ok(baseData.properties.requestHeaders[RequestHeaders.traceParentHeader], "traceparent");
                        Assert.ok(!baseData.properties.requestHeaders[RequestHeaders.traceStateHeader], "traceState should not be present in outbound event");
                        const id: string = baseData.id;
                        const regex = id.match(/\|.{32}\..{16}\./g);
                        Assert.ok(id.length > 0);
                        Assert.equal(1, regex.length)
                        Assert.equal(id, regex[0]);
                    })
            });
        } else {
            this.testCase({
                name: "DependenciesPlugin: No crash when fetch not supported",
                test: () => {
                    Assert.ok(true, "fetch monitoring is correctly not instrumented")
                }
            });
        }
    }

    public addPropertiesPluginTests(): void {
        this.testCaseAsync({
            name: 'Custom Tags: allowed to send custom properties via addTelemetryInitializer',
            stepDelay: 1,
            steps: [
                () => {
                    this._ai.addTelemetryInitializer((item: ITelemetryItem) => {
                        item.tags[this.tagKeys.cloudName] = "my.custom.cloud.name";
                    });
                    this._ai.trackEvent({ name: "Custom event via addTelemetryInitializer" });
                }
            ]
            .concat(this.asserts(1, false, false))
            .concat(PollingAssert.createPollingAssert(() => {
                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length) {
                    const payload = JSON.parse(payloadStr[0]);
                        Assert.equal(1, payloadStr.length, 'Only 1 track item is sent - ' + payload.name);
                        Assert.ok(payload);

                    if (payload && payload.tags) {
                        const tagResult: string = payload.tags && payload.tags[this.tagKeys.cloudName];
                        const tagExpect: string = 'my.custom.cloud.name';
                        Assert.equal(tagResult, tagExpect, 'telemetryinitializer tag override successful');
                        return true;
                    }
                    return false;
                }
            }, 'Set custom tags') as any)
        });

        this.testCaseAsync({
            name: 'Custom Tags: allowed to send custom properties via addTelemetryInitializer & shimmed addTelemetryInitializer',
            stepDelay: 1,
            steps: [
                () => {
                    this._ai.addTelemetryInitializer((item: ITelemetryItem) => {
                        item.tags.push({[this.tagKeys.cloudName]: "my.shim.cloud.name"});
                    });
                    this._ai.trackEvent({ name: "Custom event" });
                }
            ]
            .concat(this.asserts(1))
            .concat(PollingAssert.createPollingAssert(() => {
                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length > 0) {
                    Assert.equal(1, payloadStr.length, 'Only 1 track item is sent');
                    const payload = JSON.parse(payloadStr[0]);
                    Assert.ok(payload);

                    if (payload && payload.tags) {
                        const tagResult: string = payload.tags && payload.tags[this.tagKeys.cloudName];
                        const tagExpect: string = 'my.shim.cloud.name';
                        Assert.equal(tagResult, tagExpect, 'telemetryinitializer tag override successful');
                        return true;
                    }
                    return false;
                }
            }, 'Set custom tags') as any)
        });

        this.testCaseAsync({
            name: 'Custom Tags: allowed to send custom properties via shimmed addTelemetryInitializer',
            stepDelay: 1,
            steps: [
                () => {
                    this._ai.addTelemetryInitializer((item: ITelemetryItem) => {
                        item.tags[this.tagKeys.cloudName] = "my.custom.cloud.name";
                        item.tags[this.tagKeys.locationCity] = "my.custom.location.city";
                        item.tags.push({[this.tagKeys.locationCountry]: "my.custom.location.country"});
                        item.tags.push({[this.tagKeys.operationId]: "my.custom.operation.id"});
                    });
                    this._ai.trackEvent({ name: "Custom event via shimmed addTelemetryInitializer" });
                }
            ]
            .concat(this.asserts(1))
            .concat(PollingAssert.createPollingAssert(() => {
                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    Assert.equal(1, payloadStr.length, 'Only 1 track item is sent - ' + payload.name);
                    if (payloadStr.length > 1) {
                        this.dumpPayloadMessages(this.successSpy);
                    }
                    Assert.ok(payload);

                    if (payload && payload.tags) {
                        const tagResult1: string = payload.tags && payload.tags[this.tagKeys.cloudName];
                        const tagExpect1: string = 'my.custom.cloud.name';
                        Assert.equal(tagResult1, tagExpect1, 'telemetryinitializer tag override successful');
                        const tagResult2: string = payload.tags && payload.tags[this.tagKeys.locationCity];
                        const tagExpect2: string = 'my.custom.location.city';
                        Assert.equal(tagResult2, tagExpect2, 'telemetryinitializer tag override successful');
                        const tagResult3: string = payload.tags && payload.tags[this.tagKeys.locationCountry];
                        const tagExpect3: string = 'my.custom.location.country';
                        Assert.equal(tagResult3, tagExpect3, 'telemetryinitializer tag override successful');
                        const tagResult4: string = payload.tags && payload.tags[this.tagKeys.operationId];
                        const tagExpect4: string = 'my.custom.operation.id';
                        Assert.equal(tagResult4, tagExpect4, 'telemetryinitializer tag override successful');
                        return true;
                    }
                    return false;
                }
            }, 'Set custom tags') as any)
        });

        this.testCaseAsync({
            name: 'AuthenticatedUserContext: setAuthenticatedUserContext authId',
            stepDelay: 1,
            steps: [
                () => {
                    const context = (this._ai.context) as IPropTelemetryContext;
                    context.user.setAuthenticatedUserContext('10001');
                    this._ai.trackTrace({ message: 'authUserContext test' });
                }
            ]
                .concat(this.asserts(1))
                .concat(PollingAssert.createPollingAssert(() => {
                    let payloadStr = this.getPayloadMessages(this.successSpy);
                    if (payloadStr.length > 0) {
                        let payloadEvents = payloadStr.length;
                        let thePayload:string = payloadStr[0];

                        if (payloadEvents !== 1) {
                            // Only 1 track should be sent
                            return false;
                        }
                        const payload = JSON.parse(thePayload);
                        if (payload && payload.tags) {
                            const tagName: string = this.tagKeys.userAuthUserId;
                            return '10001' === payload.tags[tagName];
                        }
                    }
                    return false;
                }, 'user.authenticatedId') as any)
        });

        this.testCaseAsync({
            name: 'AuthenticatedUserContext: setAuthenticatedUserContext authId and accountId',
            stepDelay: 1,
            steps: [
                () => {
                    const context = (this._ai.context) as IPropTelemetryContext;
                    context.user.setAuthenticatedUserContext('10001', 'account123');
                    this._ai.trackTrace({ message: 'authUserContext test' });
                }
            ]
                .concat(this.asserts(1))
                .concat(PollingAssert.createPollingAssert(() => {
                    const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                    if (payloadStr.length > 0) {
                        if (payloadStr.length !== 1) {
                            // Only 1 track should be sent
                            return false;
                        }
                        const payload = JSON.parse(payloadStr[0]);
                        if (payload && payload.tags) {
                            const authTag: string = this.tagKeys.userAuthUserId;
                            const accountTag: string = this.tagKeys.userAccountId;
                            return '10001' === payload.tags[authTag] /*&&
                            'account123' === payload.tags[accountTag] */; // bug https://msazure.visualstudio.com/One/_workitems/edit/3508825
                        }
                    }
                    return false;
                }, 'user.authenticatedId') as any)
        });

        this.testCaseAsync({
            name: 'AuthenticatedUserContext: setAuthenticatedUserContext non-ascii authId and accountId',
            stepDelay: 1,
            steps: [
                () => {
                    const context = (this._ai.context) as IPropTelemetryContext;
                    context.user.setAuthenticatedUserContext("\u0428", "\u0429");
                    this._ai.trackTrace({ message: 'authUserContext test' });
                }
            ]
                .concat(this.asserts(1))
                .concat(PollingAssert.createPollingAssert(() => {
                    const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                    if (payloadStr.length > 0) {
                        if (payloadStr.length !== 1) {
                            // Only 1 track should be sent
                            return false;
                        }
                        const payload = JSON.parse(payloadStr[0]);
                        if (payload && payload.tags) {
                            const authTag: string = this.tagKeys.userAuthUserId;
                            const accountTag: string = this.tagKeys.userAccountId;
                            return '\u0428' === payload.tags[authTag] /* &&
                            '\u0429' === payload.tags[accountTag] */; // bug https://msazure.visualstudio.com/One/_workitems/edit/3508825
                        }
                    }
                    return false;
                }, 'user.authenticatedId') as any)
        });

        this.testCaseAsync({
            name: 'AuthenticatedUserContext: clearAuthenticatedUserContext',
            stepDelay: 1,
            steps: [
                () => {
                    const context = (this._ai.context) as IPropTelemetryContext;
                    context.user.setAuthenticatedUserContext('10002', 'account567');
                    context.user.clearAuthenticatedUserContext();
                    this._ai.trackTrace({ message: 'authUserContext test' });
                }
            ]
                .concat(this.asserts(1))
                .concat(PollingAssert.createPollingAssert(() => {
                    const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                    if (payloadStr.length > 0) {
                        if (payloadStr.length !== 1) {
                            // Only 1 track should be sent
                            return false;
                        }
                        const payload = JSON.parse(payloadStr[0]);
                        if (payload && payload.tags) {
                            const authTag: string = this.tagKeys.userAuthUserId;
                            const accountTag: string = this.tagKeys.userAccountId;
                            return undefined === payload.tags[authTag] &&
                                undefined === payload.tags[accountTag];
                        }
                    }
                    return false;
                }, 'user.authenticatedId') as any)
        });

        // This doesn't need to be e2e
        this.testCase({
            name: 'AuthenticatedUserContext: setAuthenticatedUserContext does not set the cookie by default',
            test: () => {
                // Setup
                const context = (this._ai.context) as IPropTelemetryContext;
                const authSpy: SinonSpy = this.sandbox.spy(context.user, 'setAuthenticatedUserContext');
                let cookieMgr = this._ai.getCookieMgr();
                const cookieSpy: SinonSpy = this.sandbox.spy(cookieMgr, 'set');

                // Act
                context.user.setAuthenticatedUserContext('10002', 'account567');

                // Test
                Assert.ok(authSpy.calledOnce, 'setAuthenticatedUserContext called');
                Assert.equal(false, authSpy.calledWithExactly('10001', 'account567', false), 'Correct default args to setAuthenticatedUserContext');
                Assert.ok(cookieSpy.notCalled, 'cookie never set');
            }
        });

        this.testCase({
            name: 'Sampling: sampleRate is generated as a field in the envelope when it is less than 100',
            test: () => {
                this._ai.trackEvent({ name: 'event' });
                Assert.ok(this.envelopeConstructorSpy.called);
                const envelope = this.envelopeConstructorSpy.returnValues[0];
                Assert.equal(envelope.sampleRate, 50, "sampleRate is generated");
                Assert.equal(envelope.iKey, ApplicationInsightsTests._instrumentationKey, "default config iKey is used");
            }
        });

        this.testCase({
            name: 'iKey replacement: envelope will use the non-empty iKey defined in track method',
            test: () => {
                this._ai.trackEvent({ name: 'event1', properties: { "prop1": "value1" }, measurements: { "measurement1": 200 }, iKey:"1a6933ad-aaaa-aaaa-aaaa-000000000000" });
                Assert.ok(this.envelopeConstructorSpy.called);
                const envelope = this.envelopeConstructorSpy.returnValues[0];
                Assert.equal(envelope.iKey, "1a6933ad-aaaa-aaaa-aaaa-000000000000", "trackEvent iKey is replaced");
            }
        });

        this.testCase({
            name: 'iKey replacement: envelope will use the config iKey if defined ikey in track method is empty',
            test: () => {
                this._ai.trackEvent({ name: 'event1', properties: { "prop1": "value1" }, measurements: { "measurement1": 200 }, iKey:"" });
                Assert.ok(this.envelopeConstructorSpy.called);
                const envelope = this.envelopeConstructorSpy.returnValues[0];
                Assert.equal(envelope.iKey, ApplicationInsightsTests._instrumentationKey, "trackEvent iKey should not be replaced");
            }
        });
    }

    private boilerPlateAsserts = () => {
        Assert.ok(this.successSpy.called, "success");
        Assert.ok(!this.errorSpy.called, "no error sending");
        const isValidCallCount = this.loggingSpy.callCount === 0;
        Assert.ok(isValidCallCount, "logging spy was called 0 time(s)");
        if (!isValidCallCount) {
            while (this.loggingSpy.args.length) {
                Assert.ok(false, "[warning thrown]: " + dumpObj(this.loggingSpy.args.pop()));
            }
        }
    }
    private asserts: any = (expectedCount: number, includeInit:boolean = false, doBoilerPlate:boolean = true) => [
        () => {
            const message = "polling: " + new Date().toISOString();
            Assert.ok(true, message);
            console.log(message);

            if (doBoilerPlate) {
                if (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called) {
                    this.boilerPlateAsserts();
                }
            }
        },
        (PollingAssert.createPollingAssert(() => {
            let argCount = 0;
            if (this.successSpy.called && this.successSpy.args && this.successSpy.args.length > 0) {
                this.successSpy.args.forEach(call => {
                    argCount += call[0].length;
                });
            }

            Assert.ok(true, "* [" + argCount + " of " + expectedCount + "] checking success spy " + new Date().toISOString());

            if (argCount >= expectedCount) {
                let payloadStr = this.getPayloadMessages(this.successSpy, includeInit);
                if (payloadStr.length > 0) {
                    let currentCount: number = payloadStr.length;
                    console.log('curr: ' + currentCount + ' exp: ' + expectedCount, ' appId: ' + this._ai.context.appId());
                    if (currentCount === expectedCount && !!this._ai.context.appId()) {
                        const payload = JSON.parse(payloadStr[0]);
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
                            case RemoteDependencyDataType:
                                return RemoteDepdencyValidator.RemoteDepdencyValidator.Validate(payload, baseType);

                            default:
                                return EventValidator.EventValidator.Validate(payload, baseType);
                        }
                    }
                }
            }

            return false;
        }, "sender succeeded", 60))
    ];
}

class CustomTestError extends Error {
    constructor(message = "") {
      super(message);
      this.name = "CustomTestError";
      this.message = message + " -- test error.";
    }
}

class TestPlugin extends BaseTelemetryPlugin {
    public identifier: string = "TestPlugin";
    public version: string = "0.99.1";

    constructor() {
        super();
    }

    public processTelemetry(env: ITelemetryItem, itemCtx?: IProcessTelemetryContext | undefined): void {
        itemCtx?.processNext(env);
    }
}
