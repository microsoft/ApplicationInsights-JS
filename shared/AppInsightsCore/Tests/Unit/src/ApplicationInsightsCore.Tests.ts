import { Assert, AITestClass, PollingAssert } from "@microsoft/ai-test-framework";
import { IConfiguration, ITelemetryPlugin, ITelemetryItem, IPlugin, IAppInsightsCore, normalizeJsName, random32, mwcRandomSeed, newId, randomValue, mwcRandom32, isNullOrUndefined, SenderPostManager, OnCompleteCallback, IPayloadData, _ISenderOnComplete, TransportType, _ISendPostMgrConfig, dumpObj, onConfigChange, createProcessTelemetryContext } from "../../../src/applicationinsights-core-js"
import { AppInsightsCore } from "../../../src/JavaScriptSDK/AppInsightsCore";
import { IChannelControls } from "../../../src/JavaScriptSDK.Interfaces/IChannelControls";
import { _eInternalMessageId, LoggingSeverity } from "../../../src/JavaScriptSDK.Enums/LoggingEnums";
import { _InternalLogMessage, DiagnosticLogger } from "../../../src/JavaScriptSDK/DiagnosticLogger";
import { ActiveStatus } from "../../../src/JavaScriptSDK.Enums/InitActiveStatusEnum";
import { createAsyncPromise, createAsyncRejectedPromise, createAsyncResolvedPromise, createTimeoutPromise, doAwaitResponse } from "@nevware21/ts-async";
import { fieldRedaction } from "../../../src/JavaScriptSDK/EnvUtils";


const AIInternalMessagePrefix = "AITR_";
const MaxInt32 = 0xFFFFFFFF;

export class ApplicationInsightsCoreTests extends AITestClass {
    private ctx: any;

    public testInitialize() {
        super.testInitialize();
        this.ctx = {};
    }

    public testCleanup() {
        super.testCleanup();
        this.ctx = {};
        
    }

    public registerTests() {
        this.testCase({
            name: "ApplicationInsightsCore: Initialization validates input",
            test: () => {

                const samplingPlugin = new TestSamplingPlugin();

                const appInsightsCore = new AppInsightsCore();
                try {
                    appInsightsCore.initialize(null, [samplingPlugin]);
                } catch (error) {
                    Assert.ok(true, "Validates configuration");
                }

                const config2: IConfiguration = {
                    endpointUrl: "https://dc.services.visualstudio.com/v2/track",
                    instrumentationKey: "40ed4f60-2a2f-4f94-a617-22b20a520864",
                    extensionConfig: {}
                };

                try {
                    appInsightsCore.initialize(config2, null);
                } catch (error) {
                    Assert.ok(true, "Validates extensions are provided");
                }
                const config: IConfiguration = {
                    endpointUrl: "https://dc.services.visualstudio.com/v2/track",
                    instrumentationKey: "",
                    extensionConfig: {}
                };
                try {
                    appInsightsCore.initialize(config, [samplingPlugin]);
                } catch (error) {
                    Assert.ok(true, "Validates instrumentationKey");
                }

                const channelPlugin1 = new ChannelPlugin();
                channelPlugin1.priority = 1001;

                const config3 = {
                    extensions: [channelPlugin1],
                    endpointUrl: "https://dc.services.visualstudio.com/v2/track",
                    instrumentationKey: "",
                    extensionConfig: {}
                };
                try {
                    appInsightsCore.initialize(config3, [samplingPlugin]);
                } catch (error) {
                    Assert.ok(true, "Validates channels cannot be passed in through extensions");
                }

                const channelPlugin2 = new ChannelPlugin();
                channelPlugin2.priority = 200;

                const config4 = {
                    channels: [[channelPlugin2]],
                    endpointUrl: "https://dc.services.visualstudio.com/v2/track",
                    instrumentationKey: "",
                    extensionConfig: {}
                };

                let thrown = false;
                try {
                    appInsightsCore.initialize(config4, [samplingPlugin]);
                } catch (error) {
                    thrown = true;
                }
                Assert.ok(thrown, "Validates channels passed in through config, priority cannot be less Channel controller priority");

            }
        });

        this.testCase({
            name: "SendPostManager: init and change with expected config",
            useFakeTimers: true,
            test: () => {
                let SendPostMgr = new SenderPostManager();
                let onXhrCalled = 0;
                let onFetchCalled = 0;
                let onBeaconRetryCalled = 0;
                let onCompleteFuncs = {
                    fetchOnComplete: (response: Response, onComplete: OnCompleteCallback, resValue?: string, payload?: IPayloadData) => {
                        onFetchCalled ++;
                        Assert.equal(onFetchCalled, 1, "onFetch is called once test1");
                    },
                    xhrOnComplete: (request: XMLHttpRequest, onComplete: OnCompleteCallback, payload?: IPayloadData) => {
                        if (request.readyState === 4) {
                            onXhrCalled ++;
                        }
                        
                    },
                    beaconOnRetry: (data: IPayloadData, onComplete: OnCompleteCallback, canSend: (payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => boolean) => {
                        onBeaconRetryCalled ++;
                    }

                } as _ISenderOnComplete;

                let onCompleteCallback = (status: number, headers: {
                    [headerName: string]: string;
                }, response?: string) => {
                    return;
                };
                
                let transports = [TransportType.Xhr, TransportType.Fetch, TransportType.Beacon];


                // use xhr, appInsights
                let config = {
                    enableSendPromise: false,
                    isOneDs: false,
                    disableCredentials: false,
                    disableXhr: false,
                    disableBeacon: false,
                    disableBeaconSync: false,
                    senderOnCompleteCallBack: onCompleteFuncs
                } as _ISendPostMgrConfig;
                let payload = {
                    urlString: "test",
                    data: "test data"
                } as IPayloadData;

                SendPostMgr.initialize(config, new DiagnosticLogger());
                let isInit = SendPostMgr["_getDbgPlgTargets"]()[0];
                Assert.ok(isInit, "should init");
                let isOneDs = SendPostMgr["_getDbgPlgTargets"]()[1];
                Assert.equal(isOneDs, false, "is not oneds");
                let credentials = SendPostMgr["_getDbgPlgTargets"]()[2];
                Assert.equal(credentials, false, "credentials is set ot false");
                let promise = SendPostMgr["_getDbgPlgTargets"]()[3];
                Assert.equal(promise, false, "promise is set ot false");

                let inst = SendPostMgr.getSenderInst(transports, false);
                Assert.ok(inst, "xhr interface should exist");
                inst.sendPOST(payload, onCompleteCallback, false);
           

                Assert.equal(this._getXhrRequests().length, 1, "xhr is called once");
                let request = this._getXhrRequests()[0];
                let reqHeaders = request.requestHeaders["Content-type"];
                Assert.equal(reqHeaders, "application/json;charset=utf-8");
                this.sendJsonResponse(request, {}, 200);
                Assert.equal(onXhrCalled, 1, "onxhr is called once");
                Assert.equal(onFetchCalled, 0, "onFetch is not called");
                Assert.equal(onBeaconRetryCalled, 0, "onBeacon is not called");

                // use fetch, appInsghts
                config = {
                    enableSendPromise: false,
                    isOneDs: false,
                    disableCredentials: false,
                    disableXhr: true,
                    disableBeacon: false,
                    disableBeaconSync: false,
                    senderOnCompleteCallBack: onCompleteFuncs
                } as _ISendPostMgrConfig;
                SendPostMgr.SetConfig(config);

                let res = {
                    status: 200,
                    headers: { "Content-type": "application/json" },
                    value: {},
                    ok: true,
                    text: () => {
                        return "test";
                    }
                };
            
                this.hookFetch((resolve) => {
                    AITestClass.orgSetTimeout(function() {
                        resolve(res);
                    }, 0);
                });

                inst = SendPostMgr.getSenderInst(transports, false);
                Assert.ok(inst, "xhr interface should exist test1");
                inst.sendPOST(payload, onCompleteCallback, false);

                this.clock.tick(10);


                // use beacon
                config = {
                    enableSendPromise: false,
                    isOneDs: false,
                    disableCredentials: false,
                    disableXhr: true,
                    disableBeacon: false,
                    disableBeaconSync: false,
                    senderOnCompleteCallBack: onCompleteFuncs
                } as _ISendPostMgrConfig;
                SendPostMgr.SetConfig(config);
                this.hookSendBeacon((url, data) => {
                    return false;
                });
                transports = [TransportType.Xhr,TransportType.Beacon];
                inst = SendPostMgr.getSenderInst(transports, false);
                Assert.ok(inst, "xhr interface should exist test2");
                inst.sendPOST(payload, onCompleteCallback, false);
                Assert.equal(onBeaconRetryCalled, 1, "onBeacon is not called test2");

                // change config, xhr
                config = {
                    enableSendPromise: true,
                    isOneDs: true,
                    disableCredentials: true,
                    disableXhr: false,
                    disableBeacon: true,
                    disableBeaconSync: false,
                    senderOnCompleteCallBack: onCompleteFuncs
                } as _ISendPostMgrConfig;
                SendPostMgr.SetConfig(config);
                isInit = SendPostMgr["_getDbgPlgTargets"]()[0];
                Assert.ok(isInit, "should init test3");
                isOneDs = SendPostMgr["_getDbgPlgTargets"]()[1];
                Assert.equal(isOneDs, true, "is not oneds test3");
                credentials = SendPostMgr["_getDbgPlgTargets"]()[2];
                Assert.equal(credentials, true, "credentials is set ot false test3");
                promise = SendPostMgr["_getDbgPlgTargets"]()[3];
                Assert.equal(promise, true, "promise is set ot false test3");

                inst = SendPostMgr.getSenderInst(transports, false);
                inst.sendPOST(payload, onCompleteCallback, false);

                Assert.equal(this._getXhrRequests().length, 2, "xhr is called once again for 1ds");
                request = this._getXhrRequests()[1];
                reqHeaders = request.requestHeaders["Content-type"];
                Assert.ok(!reqHeaders, "1ds post xhr request headers should be set by query parameters");
                this.sendJsonResponse(request, {}, 200);
                Assert.equal(onXhrCalled, 2, "onxhr is called twice");
            }
        });

        this.testCase({
            name: "ApplicationInsightsCore: PerfMgr should be created as expected",
            test: () => {
                let channelPlugin = new TestChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    { 
                        instrumentationKey: "testIkey", 
                        channels: [[channelPlugin]],
                        enablePerfMgr: true
                    } as IConfiguration,
                        
                    []);
                let perfMgr = appInsightsCore.getPerfMgr();
                Assert.ok(perfMgr, "perfMgr should be created without customized createPerfMgr function");
            }
        });



        this.testCase({
            name: "ApplicationInsightsCore: Initialization initializes setNextPlugin",
            test: () => {
                const samplingPlugin = new TestSamplingPlugin();
                samplingPlugin.priority = 20;

                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                // Assert prior to initialize
                Assert.ok(!samplingPlugin.nexttPlugin, "Not setup prior to pipeline initialization");

                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41" },
                    [samplingPlugin, channelPlugin]);
                Assert.ok(samplingPlugin._initialized, "Make sure the plugin is initialized");
                Assert.ok(!!samplingPlugin.nexttPlugin, "setup prior to pipeline initialization");
            }
        });


        this.testCase({
            name: "ApplicationInsightsCore: Plugins can be added with same priority",
            test: () => {
                const samplingPlugin = new TestSamplingPlugin();
                samplingPlugin.priority = 20;

                const samplingPlugin1 = new TestSamplingPlugin();
                samplingPlugin1.priority = 20;

                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;

                const appInsightsCore = new AppInsightsCore();
                try {
                    appInsightsCore.initialize(
                        { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41" },
                        [samplingPlugin, samplingPlugin1, channelPlugin]);

                    Assert.ok("No error on duplicate priority");
                } catch (error) {
                    Assert.ok(false); // duplicate priority does not throw error
                }
            }
        });

        this.testCase({
            name: "ApplicationInsightsCore: flush clears channel buffer",
            test: () => {
                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41" },
                    [channelPlugin]);

                Assert.ok(!channelPlugin.isUnloadInvoked, "Unload not called on initialize");
                appInsightsCore.getChannels().forEach((q: any) => {
                    if (q.onunloadFlush) {
                        q.onunloadFlush()
                    }
                });

                Assert.ok(channelPlugin.isUnloadInvoked, "Unload triggered for channel");
            }
        });

        this.testCase({
            name: "config.channel adds to the channels to the start of the extension channels",
            test: () => {
                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1030;

                const channelPlugin1 = new ChannelPlugin();
                channelPlugin1.priority = 1030;

                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41", channels: [[channelPlugin1]] },
                    [channelPlugin]);

                const channelQueues = appInsightsCore.getChannels();
                Assert.equal(2, channelQueues.length, "Total number of channel queues");
                Assert.equal(channelQueues[0], channelPlugin1, "Number of channels in queue 1");
                Assert.equal(channelQueues[1], channelPlugin, "Number of channels in queue 2");
            }
        });

        this.testCase({
            name: "Initialization: channels adds and initialize with offline channel with channel config",
            useFakeTimers: true,
            test: () => {
                let offlineChannelPlugin = new TestOfflineChannelPlugin();

                let channelPlugin = new TestChannelPlugin();
              

                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    { instrumentationKey: "testIkey", channels: [[offlineChannelPlugin, channelPlugin]] },
                    []);
                this.clock.tick(1);

                const channelQueues = appInsightsCore.getChannels();
                Assert.equal(2, channelQueues.length, "Total number of channel queues");
                Assert.equal(offlineChannelPlugin._isInit, true, "offline channel is initialized");
            }
        });

        
        this.testCase({
            name: "Initialization: channels adds and initialize with offline channel with extension config",
            useFakeTimers: true,
            test: () => {
                let offlineChannelPlugin = new TestOfflineChannelPlugin();

                let channelPlugin = new TestChannelPlugin();
              

                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    { instrumentationKey: "testIkey", channels: [[channelPlugin]] },
                    [offlineChannelPlugin]);

                const channelQueues = appInsightsCore.getChannels();
                this.clock.tick(1);
                Assert.equal(2, channelQueues.length, "Total number of channel queues");
                Assert.equal(offlineChannelPlugin._isInit, true, "offline channel is initialized");
            }
        });

        this.testCase({
            name: 'ApplicationInsightsCore: track adds required default fields if missing',
            useFakeTimers: true,
            test: () => {
                const expectedIKey: string = "09465199-12AA-4124-817F-544738CC7C41";
                const expectedTimestamp = new Date().toISOString();
                const expectedBaseType = "EventData";

                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize({ instrumentationKey: expectedIKey }, [channelPlugin]);

                // Act
                const bareItem: ITelemetryItem = { name: 'test item' };
                appInsightsCore.track(bareItem);
                this.clock.tick(1);

                // Test
                Assert.equal(expectedIKey, bareItem.iKey, "Instrumentation key is added");
                Assert.deepEqual(expectedTimestamp, bareItem.time, "Timestamp is added");
            }
        });

        this.testCase({
            name: 'ApplicationInsightsCore: track does not replace non-empty iKey',
            useFakeTimers: true,
            test: () => {
                const configIkey: string = "configIkey";
                const eventIkey: string = "eventIkey";

                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize({ instrumentationKey:configIkey}, [channelPlugin]);

                // Act
                const bareItem: ITelemetryItem = { name: 'test item', iKey: eventIkey };
                appInsightsCore.track(bareItem);
                this.clock.tick(1);

                // Test
                Assert.equal(eventIkey, bareItem.iKey, "Instrumentation key is replaced");
            }
        });

        this.testCase({
            name: "DiagnosticLogger: Critical logging history is saved",
            test: () => {
                // Setup
                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize({ instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41", loggingLevelTelemetry: 999 }, [channelPlugin]);

                const messageId = _eInternalMessageId.CannotAccessCookie; // can be any id

                // Test precondition
                Assert.equal(0, appInsightsCore.logger.queue.length, 'PRE: No logging recorded');

                // Act
                appInsightsCore.logger.throwInternal(LoggingSeverity.CRITICAL, messageId, "Test Error");

                // Test postcondition
                Assert.equal(1, appInsightsCore.logger.queue.length, "POST: Correct messageId logged");
                Assert.ok(appInsightsCore.logger.queue[0].message.indexOf('Test Error') !== -1, "Correct message logged");
                Assert.equal(messageId, appInsightsCore.logger.queue[0].messageId, "Correct message logged");
            }
        });

        this.testCase({
            name: 'DiagnosticLogger: Logger can be created with default constructor',
            test: () => {
                // setup
                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.logger = new DiagnosticLogger();

                const messageId = _eInternalMessageId.CannotAccessCookie; // can be any id

                // Verify precondition
                Assert.equal(0, appInsightsCore.logger.queue.length, 'PRE: No internal logging performed yet');

                // Act
                appInsightsCore.logger.throwInternal(LoggingSeverity.CRITICAL, messageId, "Some message");

                // Test postcondition
                Assert.equal(1, appInsightsCore.logger.queue.length, 'POST: Logging success');
                Assert.equal(messageId, appInsightsCore.logger.queue[0].messageId, "POST: Correct messageId logged");

                // Logging same error doesn't duplicate
                Assert.equal(1, appInsightsCore.logger.queue.length, "Pre: Only 1 logged message");
                appInsightsCore.logger.throwInternal(LoggingSeverity.CRITICAL, messageId, "Some message");
                Assert.equal(1, appInsightsCore.logger.queue.length, "Pre: Still only 1 logged message");
            }
        });

        // TODO: test no reinitialization
        this.testCase({
            name: "Initialize: core cannot be reinitialized",
            test: () => {
                // Setup
                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                const initFunction = () => appInsightsCore.initialize({ instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41" }, [channelPlugin]);

                // Assert precondition
                Assert.ok(!appInsightsCore.isInitialized(), "PRE: core constructed but not initialized");

                // Init
                initFunction();

                // Assert initialized
                Assert.ok(appInsightsCore.isInitialized(), "core is initialized");

                Assert.throws(initFunction, Error, "Core cannot be reinitialized");
            }
        });

        // TODO: test pollInternalLogs
        this.testCase({
            name: "DiagnosticLogger: Logs can be polled",
            useFakeTimers: true,
            test: () => {
                // Setup
                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    {
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41",
                        diagnosticLogInterval: 1
                    }, [channelPlugin]);
                const trackTraceSpy = this.sandbox.stub(appInsightsCore, "track");

                Assert.equal(0, appInsightsCore.logger.queue.length, "Queue is empty");

                // Setup queue
                const queue: _InternalLogMessage[] = appInsightsCore.logger.queue;
                queue.push(new _InternalLogMessage(1, "Hello1"));
                queue.push(new _InternalLogMessage(2, "Hello2"));
                const poller = appInsightsCore.pollInternalLogs();

                // Assert precondition
                Assert.equal(2, appInsightsCore.logger.queue.length, "Queue contains 2 items");

                // Act
                this.clock.tick(1);

                // Assert postcondition
                Assert.equal(0, appInsightsCore.logger.queue.length, "Queue is empty");

                const data1 = trackTraceSpy.args[0][0];
                Assert.ok(data1.baseData.message.indexOf("Hello1") !== -1);

                const data2 = trackTraceSpy.args[1][0];
                Assert.ok(data2.baseData.message.indexOf("Hello2") !== -1);

                // Cleanup
                poller.cancel();
            }
        });

        // TODO: test stopPollingInternalLogs
        this.testCase({
            name: "DiagnosticLogger: stop Polling InternalLogs flushes logs when not empty",
            useFakeTimers: true,
            test: () => {
                // Setup
                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    {
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41",
                        diagnosticLogInterval: 1
                    }, [channelPlugin]);

                Assert.equal(0, appInsightsCore.logger.queue.length, "Queue is empty");

                // Setup queue
                const queue: _InternalLogMessage[] = appInsightsCore.logger.queue;
                queue.push(new _InternalLogMessage(1, "Hello1"));
                queue.push(new _InternalLogMessage(2, "Hello2"));
                appInsightsCore.pollInternalLogs();

                // Assert precondition
                Assert.equal(2, appInsightsCore.logger.queue.length, "Queue contains 2 items");
                
                // Act
                appInsightsCore.stopPollingInternalLogs();

                // We now flush the internal logs when stop Polling internal logs is called
                Assert.equal(0, appInsightsCore.logger.queue.length, "Queue is empty");

                queue.push(new _InternalLogMessage(2, "Hello3"));
                this.clock.tick(60000);

                Assert.equal(1, appInsightsCore.logger.queue.length, "Queue is not empty");
            }
        });

        // TODO: test stopPollingInternalLogs and check max size of the queue.
        this.testCase({
            name: "DiagnosticLogger: stop Polling InternalLogs",
            useFakeTimers: true,
            test: () => {
                // Setup
                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    {
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41",
                        diagnosticLogInterval: 1
                    }, [channelPlugin]);

                appInsightsCore.pollInternalLogs();

                // Assert precondition
                Assert.equal(0, appInsightsCore.logger.queue.length, "Queue contains 0 items");
                
                // Act
                appInsightsCore.stopPollingInternalLogs();
                let count = 1002;
                while(count > 0) {
                    appInsightsCore.logger.throwInternal(LoggingSeverity.CRITICAL, count, "Test Error");
                    --count;
                }

                //  this.clock.tick(1000);
                // Assert postcondition
                Assert.equal(26, appInsightsCore.logger.queue.length, "Queue is not empty");
            }
        });

        // TODO: test logger crosscontamination
        this.testCase({
            name: "DiagnosticLogger: Logs in separate cores do not interfere",
            test: () => {
                // Setup
                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    {
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41",
                        loggingLevelTelemetry: 999
                    }, [channelPlugin]
                );
                const dummyCore = new AppInsightsCore();
                dummyCore.initialize(
                    {
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41",
                        loggingLevelTelemetry: 999
                    }, [channelPlugin]
                );

                const messageId = _eInternalMessageId.CannotAccessCookie; // can be any id

                // Test precondition
                Assert.equal(0, appInsightsCore.logger.queue.length, 'PRE: No internal logging performed yet');
                Assert.equal(0, dummyCore.logger.queue.length, 'PRE: No dummy logging');

                // Act
                appInsightsCore.logger.throwInternal(LoggingSeverity.CRITICAL, messageId, "Test Error");

                // Test postcondition
                Assert.equal(1, appInsightsCore.logger.queue.length, 'POST: Logging success');
                Assert.equal(0, dummyCore.logger.queue.length, 'POST: No dummy logging');
            }
        });

        this.testCase({
            name: "ApplicationInsightsCore: Plugins can be provided through configuration",
            test: () => {
                const samplingPlugin = new TestSamplingPlugin();
                samplingPlugin.priority = 20;

                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;

                const appInsightsCore = new AppInsightsCore();
                try {
                    appInsightsCore.initialize(
                        { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41", extensions: [samplingPlugin] },
                        [channelPlugin]);
                } catch (error) {
                    Assert.ok(false, "No error expected");
                }

                let found = false;
                Assert.equal(samplingPlugin, appInsightsCore.getPlugin(samplingPlugin.identifier).plugin, "Plugin passed in through config is part of pipeline");
            }
        });

        this.testCase({
            name: "ApplicationInsightsCore: Non telemetry specific plugins are initialized and not part of telemetry processing pipeline",
            test: () => {
                const samplingPlugin = new TestSamplingPlugin();
                samplingPlugin.priority = 20;

                const testPlugin = new TestPlugin();

                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;

                const appInsightsCore = new AppInsightsCore();
                try {
                    appInsightsCore.initialize(
                        { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41" },
                        [testPlugin, samplingPlugin, channelPlugin]);
                } catch (error) {
                    Assert.ok(false, "Exception not expected");
                }

                Assert.ok(typeof ((appInsightsCore as any)["_getDbgPlgTargets"]()[0][0].processTelemetry) !== 'function', "Extensions can be provided through overall configuration");
            }
        });

        this.testCase({
            name: "Channels can be passed in through configuration",
            test: () => {

                const channelPlugin1 = new ChannelPlugin();
                channelPlugin1.priority = 1001;

                const channelPlugin2 = new ChannelPlugin();
                channelPlugin2.priority = 1002;

                const channelPlugin3 = new ChannelPlugin();
                channelPlugin3.priority = 1001;

                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    {
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41",
                        channels: [[channelPlugin1, channelPlugin2], [channelPlugin3]]
                    },
                    []);

                Assert.ok(channelPlugin1._nextPlugin === channelPlugin2);
                Assert.ok(isNullOrUndefined(channelPlugin3._nextPlugin));
                const channelControls = appInsightsCore.getChannels();

                Assert.ok(channelControls.length === 2);
                Assert.ok(channelControls[0] === channelPlugin1);
                Assert.ok(channelControls[1] === channelPlugin2);
                
                // Assert.ok(channelControls[0].length === 2);
                // Assert.ok(channelControls[1].length === 1);
                // Assert.ok(channelControls[0][0] === channelPlugin1);
                // Assert.ok(channelControls[1][0] === channelPlugin3);
                Assert.ok(channelPlugin1._nextPlugin === channelPlugin2);
                Assert.ok(channelPlugin2._nextPlugin === undefined);
            }
        });

        this.testCase({
            name: 'ApplicationInsightsCore: user can add two channels in single queue',
            test: () => {
                const channelPlugin1 = new ChannelPlugin();
                channelPlugin1.priority = 1001;

                const channelPlugin2 = new ChannelPlugin();
                channelPlugin2.priority = 1002;

                const channelPlugin3 = new ChannelPlugin();
                channelPlugin3.priority = 1003;

                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    {
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41"
                    },
                    [channelPlugin3, channelPlugin2, channelPlugin1]);

                Assert.ok(channelPlugin1._nextPlugin === channelPlugin2);
                Assert.ok(channelPlugin2._nextPlugin === channelPlugin3);
                Assert.ok(isNullOrUndefined(channelPlugin3._nextPlugin));
                const channelControls = appInsightsCore.getChannels();
                Assert.ok(channelControls.length === 3);
                Assert.ok(channelControls[0] === channelPlugin1);
                Assert.ok(channelControls[1] === channelPlugin2);
                Assert.ok(channelControls[2] === channelPlugin3);
            }
        });

        this.testCase({
            name: 'ApplicationInsightsCore: Validates root level properties in telemetry item',
            test: () => {
                const expectedIKey: string = "09465199-12AA-4124-817F-544738CC7C41";

                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                const samplingPlugin = new TestSamplingPlugin(true);
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize({ instrumentationKey: expectedIKey }, [samplingPlugin, channelPlugin]);

                // Act
                const bareItem: ITelemetryItem = {
                    name: 'test item',
                    ext: {
                        "user": { "id": "test" }
                    },
                    tags: [{ "device.id": "AABA40BC-EB0D-44A7-96F5-ED2103E47AE9" }],
                    data: {
                        "custom data": {
                            "data1": "value1"
                        }
                    },
                    baseType: "PageviewData",
                    baseData: { name: "Test Page" }
                };

                appInsightsCore.track(bareItem);
            }
        });

        this.testCase({
            name: "Channels work even if no extensions are present",
            test: () => {
                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1030;
                const appInsightsCore = new AppInsightsCore();
                const channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");
                appInsightsCore.initialize(
                    {
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41", channels: [[channelPlugin]]
                    }, []);
                const event: ITelemetryItem = { name: 'test' };
                appInsightsCore.track(event);
                const evt = channelSpy.args[0][0];
                Assert.ok(evt.name === "test");
            }
        });

        this.testCase({
            name: "ApplicationInsightsCore: Track queue event when not all extensions are initialized",
            test: () => {
                const trackPlugin = new TrackPlugin();
                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                const appInsightsCore = new AppInsightsCore();
                const channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");
                appInsightsCore.initialize(
                    { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41" },
                    [trackPlugin, channelPlugin]);
                Assert.ok(channelSpy.calledOnce, "Channel process incorrect number of times");
                Assert.ok(channelSpy.args[0][0].name == "TestEvent1", "Incorrect event");
                Assert.ok(appInsightsCore.eventCnt() == 0, "Event queue wrong number of events");
            }
        });

        this.testCase({
            name: "ApplicationInsightsCore: Validate JS name normalization",
            test: () => {
                Assert.equal("Hello", normalizeJsName("Hello"));
                Assert.equal("Hello_World", normalizeJsName("Hello.World"));
                Assert.equal("_Hello_World", normalizeJsName("@Hello.World"));
                Assert.equal("_Hello_World", normalizeJsName("#Hello.World"));
                Assert.equal("_Hello_World", normalizeJsName(".Hello#World"));
                Assert.equal("_Hello_World_", normalizeJsName(".Hello(World)"));
                Assert.equal("_Hello_World_", normalizeJsName(".Hello&World%"));
                Assert.equal("_Hello_World_", normalizeJsName("!Hello=World+"));
                Assert.equal("_Hello_World_", normalizeJsName("~Hello[World]"));
                Assert.equal("_Hello_World_", normalizeJsName(":Hello{World}"));
                Assert.equal("_Hello_World_", normalizeJsName("\'Hello\'World;"));
                Assert.equal("_Hello_World_", normalizeJsName("\"Hello\\World\""));
                Assert.equal("_Hello_World_", normalizeJsName("|Hello<World>"));
                Assert.equal("_Hello_World_", normalizeJsName("?Hello,World-"));
            }
        });

        // init with ikey: null
        this.testCase({
            name: "ApplicationInsightsCore Init: init with ikey null, will throw error message",
            useFakeTimers: true,
            test: () => {
                let trackPlugin = new TrackPlugin();
                let channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                let core = new AppInsightsCore();
                let channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");
                let activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.NONE, "default should be inactive status");

                let config = {
                    instrumentationKey: undefined,
                    endpointUrl: "testUrl"
                } as IConfiguration;

                let errorisCalled = false;

                try {
                    core.initialize(
                        config,
                        [trackPlugin, channelPlugin]);

                } catch (e) {
                    errorisCalled = true;
                    Assert.ok(JSON.stringify(e.message).indexOf("Please provide instrumentation key") > -1, "should send provide ikey error message");
                }

                Assert.ok(errorisCalled, "ikey error should be called");
               

                Assert.ok(!channelSpy.calledOnce, "channel should not be called once");
                Assert.equal(core.config.instrumentationKey, null, "channel testIkey should be null");
                Assert.equal(core.config.endpointUrl, "testUrl", "channel endpoint should not be changed");
                activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.INACTIVE, "default should be inactive status test1");

                core.track({name: "test1"});
                Assert.ok(core.eventCnt() == 0, "Event should not be queued");

                let isInit = core.isInitialized();
                Assert.ok(!isInit, "core is not initialized");

                // Test re-init with valid ikey
                config.instrumentationKey = "testIkey";
                
                core.initialize(
                    config,
                    [trackPlugin, channelPlugin]);
                Assert.ok(channelSpy.calledOnce, "channel should be called once");
                Assert.equal(core.config.instrumentationKey, "testIkey", "channel testIkey should be set");
                Assert.equal(core.config.endpointUrl, "testUrl", "channel endpoint should not be changed");
                activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.ACTIVE, "default should be active status again");
                isInit = core.isInitialized();
                Assert.ok(isInit, "core is initialized");

            }
        });

        // init with ikey: string, endpoint null
        this.testCase({
            name: "ApplicationInsightsCore Init: init with ikey string, endpoint null",
            useFakeTimers: true,
            test: () => {
                let trackPlugin = new TrackPlugin();
                let channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                let core = new AppInsightsCore();
                let channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");
                let activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.NONE, "default should be inactive status");

                let config = {
                    instrumentationKey: "testIkey",
                    endpointUrl: undefined
                } as IConfiguration;

                let errorisCalled = false;

                try {
                    core.initialize(
                        config,
                        [trackPlugin, channelPlugin]);

                } catch (e) {
                    errorisCalled = true;
                }

                Assert.ok(!errorisCalled, "ikey error should not be called");
               
                Assert.ok(channelSpy.calledOnce, "channel should be called once");
                Assert.ok(core.eventCnt() == 0, "Event should not be queued");
                let evt = channelSpy.args[0][0];
                Assert.equal(evt.iKey, "testIkey", "event ikey should be null");
                Assert.equal(core.config.instrumentationKey, "testIkey", "channel testIkey should not be changed");
                Assert.equal(core.config.endpointUrl, null, "channel endpoint should not be changed");
                activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.ACTIVE, "default should be active status test");
              
            }
        });

        // init with ikey: string, endpointUrl: string
        this.testCase({
            name: "ApplicationInsightsCore Init: init with ikey string, endpoint url string, dynamic changes with string",
            useFakeTimers: true,
            test: () => {
                let trackPlugin = new TrackPlugin();
                let channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                let core = new AppInsightsCore();
                let channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");
                let activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.NONE, "default should be pending status");

                let config = {
                    instrumentationKey: "testIkey",
                    endpointUrl: "testUrl"
                } as IConfiguration;
                core.initialize(
                    config,
                    [trackPlugin, channelPlugin]);

                Assert.ok(channelSpy.calledOnce, "channel should be called once");
                Assert.ok(core.eventCnt() == 0, "Event should not be queued");
                let evt = channelSpy.args[0][0];
                Assert.equal(evt.iKey, "testIkey", "event ikey should be set");
                Assert.equal(core.config.instrumentationKey, "testIkey", "channel testIkey should be set");
                Assert.equal(core.config.endpointUrl, "testUrl", "channel endpoint should be set");
                activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.ACTIVE, "default should be active status");
        


                core.config.instrumentationKey = "testIkey1";
                core.config.endpointUrl = "testUrl1";
                this.clock.tick(1);
                core.track({name: "test1"});
                Assert.equal(channelSpy.callCount, 2, "channel should be called twice");
                Assert.ok(core.eventCnt() == 0, "Event should not be queued test1");
                evt = channelSpy.args[1][0];
                Assert.equal(evt.name, "test1", "event name should be set");
                Assert.equal(evt.iKey, "testIkey1", "event ikey should be set test1");
                activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.ACTIVE, "default should be active status test1");


                // change the ikey to null again, inactive
                core.config.instrumentationKey = undefined;
                this.clock.tick(1);
                activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.INACTIVE, "default should be inactive status test1");
              
            }
        });

        this.testCaseAsync({
            name: "ApplicationInsightsCore Init: init with ikey resolved promise, endpoint url resolved promise",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {
                let trackPlugin = new TrackPlugin();
                let channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                let core = new AppInsightsCore();
                let channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");
                this.ctx.core = core;
                this.ctx.channelSpy = channelSpy;

                let ikeyPromise = createAsyncResolvedPromise("testIkey");
                let urlPromise = createAsyncResolvedPromise("testUrl");

                let config = {
                    instrumentationKey: ikeyPromise,
                    endpointUrl: urlPromise,
                    initTimeOut: 80000
                } as IConfiguration;
                core.initialize(
                    config,
                    [trackPlugin, channelPlugin]);
          

                Assert.ok(!channelSpy.calledOnce, "channel should not be called once");
                Assert.ok(core.eventCnt() == 1, "Event should be queued");
                let activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.PENDING, "active status should be set to pending");

            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this.ctx.core;
                let activeStatus = core.activeStatus();
                let channelSpy = this.ctx.channelSpy
            
                if (activeStatus === ActiveStatus.ACTIVE) {
                    Assert.equal(core.config.instrumentationKey, "testIkey", "channel testIkey should not be changed");
                    Assert.equal(core.config.endpointUrl, "testUrl", "channel endpoint should be changed");
                    Assert.ok(channelSpy.calledOnce, "channel should be called once");
                    Assert.ok(core.eventCnt() == 0, "Event should be released");
                    let evt = channelSpy.args[0][0];
                    Assert.equal(evt.iKey, "testIkey", "event ikey should be set");
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60, 1000) as any)
        });

        this.testCaseAsync({
            name: "ApplicationInsightsCore Init: init with ikey resolved promise, endpoint url rejected promise",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {
                let trackPlugin = new TrackPlugin();
                let channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                let core = new AppInsightsCore();
                let channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");
                this.ctx.core = core;
                this.ctx.channelSpy = channelSpy;

                let ikeyPromise = createAsyncResolvedPromise("testIkey");
                let urlPromise = createAsyncRejectedPromise(new Error("endpoint error"));

                let config = {
                    instrumentationKey: ikeyPromise,
                    endpointUrl: urlPromise,
                    initTimeOut: 80000
                } as IConfiguration;
                core.initialize(
                    config,
                    [trackPlugin, channelPlugin]);
          

                Assert.ok(!channelSpy.calledOnce, "channel should not be called once");
                Assert.ok(core.eventCnt() == 1, "Event should be queued");
                let activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.PENDING, "active status should be set to pending");

            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this.ctx.core;
                let activeStatus = core.activeStatus();
                let channelSpy = this.ctx.channelSpy
            
                if (activeStatus === ActiveStatus.ACTIVE) {
                    Assert.equal(core.config.instrumentationKey, "testIkey", "channel testIkey should not be changed");
                    Assert.equal(core.config.endpointUrl, null, "channel endpoint should not be changed");
                    Assert.ok(channelSpy.calledOnce, "channel should be called once");
                    Assert.ok(core.eventCnt() == 0, "Event should be released");
                    let evt = channelSpy.args[0][0];
                    Assert.equal(evt.iKey, "testIkey", "event ikey should be set");
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60, 1000) as any)
        });

        this.testCaseAsync({
            name: "ApplicationInsightsCore Init: init with ikey rejected promise, endpoint url rejected promise",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {
                let trackPlugin = new TrackPlugin();
                let channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                let core = new AppInsightsCore();
                let channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");
                this.ctx.core = core;
                this.ctx.channelSpy = channelSpy;

                let ikeyPromise = createAsyncRejectedPromise(new Error("ikey error"));
                let urlPromise = createAsyncRejectedPromise(new Error("endpoint error"));

                this.ctx.ikeyPromise = ikeyPromise;
                this.ctx.urlPromise = urlPromise;

                let config = {
                    instrumentationKey: ikeyPromise,
                    endpointUrl: urlPromise,
                    initTimeOut: 80000
                } as IConfiguration;
            
                core.initialize(
                    config,
                    [trackPlugin, channelPlugin]);

                Assert.ok(!channelSpy.calledOnce, "channel should not be called once");
                Assert.ok(core.eventCnt() == 1, "Event should be queued");
                let activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.PENDING, "active status should be set to pending");

            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this.ctx.core;
                let activeStatus = core.activeStatus();
                let channelSpy = this.ctx.channelSpy
                let ikeyPromise = this.ctx.ikeyPromise;
                let urlPromise = this.ctx.urlPromise;
            
                if (activeStatus === ActiveStatus.INACTIVE) {
                    Assert.deepEqual(core.config.instrumentationKey, ikeyPromise, "channel testIkey should not be changed");
                    Assert.deepEqual(core.config.endpointUrl, urlPromise, "channel endpoint should not be changed");
                    Assert.ok(!channelSpy.calledOnce, "channel should not be called once");
                    Assert.ok(core.eventCnt() == 0, "Event should be released");
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60, 1000) as any)
        });

        this.testCaseAsync({
            name: "ApplicationInsightsCore Init: init with ikey promise chain, endpoint url promise chain",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {
                let trackPlugin = new TrackPlugin();
                let channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                let core = new AppInsightsCore();
                let channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");
                this.ctx.core = core;
                this.ctx.channelSpy = channelSpy;

                let csPromise = createAsyncResolvedPromise("instrumentationKey=testIkey;endpoint=testUrl");
                let ikeyPromise = createAsyncPromise((resolve, reject) => {
                    doAwaitResponse(csPromise, (res) => {
                        if (!res.rejected) {
                            resolve("testIkey");
                            return;
                        }
                        reject(new Error("ikey error"));
                    })
                });
                let urlPromise = createAsyncPromise((resolve, reject) => {
                    doAwaitResponse(csPromise, (res) => {
                        if (!res.rejected) {
                            resolve("testUrl");
                            return;
                        }
                        reject(new Error("url error"));
                    })
                });

                let config = {
                    instrumentationKey: ikeyPromise,
                    endpointUrl: urlPromise,
                    initTimeOut: 80000
                } as IConfiguration;
                core.initialize(
                    config,
                    [trackPlugin, channelPlugin]);
          

                Assert.ok(!channelSpy.calledOnce, "channel should not be called once");
                Assert.ok(core.eventCnt() == 1, "Event should be queued");
                let activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.PENDING, "active status should be set to pending");


            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this.ctx.core;
                let activeStatus = core.activeStatus();
                let channelSpy = this.ctx.channelSpy
            
                if (activeStatus === ActiveStatus.ACTIVE) {
                    Assert.equal(core.config.instrumentationKey, "testIkey", "channel testIkey should not be changed");
                    Assert.equal(core.config.endpointUrl, "testUrl", "channel endpoint should be changed");
                    Assert.ok(channelSpy.calledOnce, "channel should be called once");
                    Assert.ok(core.eventCnt() == 0, "Event should be released");
                    let evt = channelSpy.args[0][0];
                    Assert.equal(evt.iKey, "testIkey", "event ikey should be set");
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60, 1000) as any)
        });

        this.testCaseAsync({
            name: "ApplicationInsightsCore Init: init with ikey mutiple layer promise chain, endpoint url mutiple layer promise chain",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {
                let trackPlugin = new TrackPlugin();
                let channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                let core = new AppInsightsCore();
                let channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");
                this.ctx.core = core;
                this.ctx.channelSpy = channelSpy;

                let csPromise = createAsyncResolvedPromise("instrumentationKey=testIkey;endpoint=testUrl");
                let ikeyPromise = createAsyncPromise((resolve, reject) => {
                    doAwaitResponse(csPromise, (res) => {
                        if (!res.rejected) {
                            resolve(createAsyncResolvedPromise("testIkey"));
                            return;
                        }
                        reject(createAsyncRejectedPromise(new Error("ikey error")));
                        return;
                    })
                });
                let urlPromise = createAsyncPromise((resolve, reject) => {
                    doAwaitResponse(csPromise, (res) => {
                        if (!res.rejected) {
                            resolve(createAsyncResolvedPromise("testUrl"));
                            return;
                        }
                        reject(createAsyncRejectedPromise(new Error("url error")));
                        return;
                    })
                });

                let config = {
                    instrumentationKey: ikeyPromise,
                    endpointUrl: urlPromise,
                    initTimeOut: 80000
                } as IConfiguration;
                core.initialize(
                    config,
                    [trackPlugin, channelPlugin]);
          

                Assert.ok(!channelSpy.calledOnce, "channel should not be called once");
                Assert.ok(core.eventCnt() == 1, "Event should be queued");
                let activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.PENDING, "active status should be set to pending");


            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this.ctx.core;
                let activeStatus = core.activeStatus();
                let channelSpy = this.ctx.channelSpy
            
                if (activeStatus === ActiveStatus.ACTIVE) {
                    Assert.equal(core.config.instrumentationKey, "testIkey", "channel testIkey should not be changed");
                    Assert.equal(core.config.endpointUrl, "testUrl", "channel endpoint should be changed");
                    Assert.ok(channelSpy.calledOnce, "channel should be called once");
                    Assert.ok(core.eventCnt() == 0, "Event should be released");
                    let evt = channelSpy.args[0][0];
                    Assert.equal(evt.iKey, "testIkey", "event ikey should be set");
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60, 1000) as any)
        });


        
        this.testCaseAsync({
            name: "ApplicationInsightsCore Init: init with ikey string, endpoint url string, dynamic changed with resolved promises",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {
                let trackPlugin = new TrackPlugin();
                let channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                let core = new AppInsightsCore();
                let channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");

                let config = {
                    instrumentationKey: "testIkey",
                    endpointUrl: "testUrl",
                    initTimeOut: 80000
                } as IConfiguration;
                core.initialize(
                    config,
                    [trackPlugin, channelPlugin]);
                this.ctx.core = core;
                this.ctx.channelSpy = channelSpy;

                Assert.ok(channelSpy.calledOnce, "channel should not be called once");
                Assert.ok(core.eventCnt() == 0, "Event should not be queued");
                let activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.ACTIVE, "default should be active status");
                Assert.ok(channelSpy.calledOnce, "channel should be called once");
                Assert.ok(core.eventCnt() == 0, "Event should be released");
                let evt = channelSpy.args[0][0];
                Assert.equal(evt.iKey, "testIkey", "event ikey should be set");
                activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.ACTIVE, "default should be active status");

                let ikeyPromise = createAsyncResolvedPromise("testIkey1");
                let urlPromise = createAsyncResolvedPromise("testUrl1");
                core.config.instrumentationKey = ikeyPromise;
                core.config.endpointUrl = urlPromise;
                this.clock.tick(1);
                activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.ACTIVE, "active status should be set to active in next executing cycle");
                //Assert.equal(activeStatus, ActiveStatus.PENDING, "active status should be set to pending");

            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this.ctx.core;
                let activeStatus = core.activeStatus();
                let channelSpy = this.ctx.channelSpy
            
                if (activeStatus === ActiveStatus.ACTIVE) {
                    Assert.equal(core.config.instrumentationKey, "testIkey1", "channel testIkey should not be changed");
                    Assert.equal(core.config.endpointUrl, "testUrl1", "channel endpoint should be changed");
                    core.track({name: "test2"});
                    Assert.ok(core.eventCnt() == 0, "Event should not be queued test1");
                    let evt = channelSpy.args[1][0];
                    Assert.equal(evt.name, "test2", "event name should be set test2");
                    Assert.equal(evt.iKey, "testIkey1", "event ikey should be set test1");
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60, 1000) as any)
        });

        this.testCaseAsync({
            name: "ApplicationInsightsCore Init: init with ikey resolved promise, endpoint url resolved promise, dynamic change with promise",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {
                let trackPlugin = new TrackPlugin();
                let channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                let core = new AppInsightsCore();
                let channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");
                this.ctx.core = core;
                this.ctx.channelSpy = channelSpy;

                let ikeyPromise = createAsyncResolvedPromise("testIkey");
                let urlPromise = createAsyncResolvedPromise("testUrl");

                let config = {
                    instrumentationKey: ikeyPromise,
                    endpointUrl: urlPromise,
                    initTimeOut: 80000
                } as IConfiguration;
                core.initialize(
                    config,
                    [trackPlugin, channelPlugin]);
          

                Assert.ok(!channelSpy.calledOnce, "channel should not be called once");
                Assert.ok(core.eventCnt() == 1, "Event should be queued");
                let activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.PENDING, "active status should be set to pending");


            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this.ctx.core;
                let activeStatus = core.activeStatus();
                let channelSpy = this.ctx.channelSpy;
                if (activeStatus === ActiveStatus.ACTIVE) {
                    Assert.equal(activeStatus, ActiveStatus.ACTIVE, "active status should be set to active");
                    Assert.equal(core.config.instrumentationKey, "testIkey", "channel testIkey should not be changed");
                    Assert.equal(core.config.endpointUrl, "testUrl", "channel endpoint should be changed");
                    Assert.ok(channelSpy.calledOnce, "channel should be called once");
                    Assert.ok(core.eventCnt() == 0, "Event should be released");
                    let evt = channelSpy.args[0][0];
                    Assert.equal(evt.iKey, "testIkey", "event ikey should be set");

                    let ikeyPromise = createAsyncResolvedPromise("testIkey1");
                    let urlPromise = createAsyncResolvedPromise("testUrl1");
                    core.config.instrumentationKey = ikeyPromise;
                    core.config.endpointUrl = urlPromise;
                    this.ctx.secondCall = true;
                    //Assert.equal(activeStatus, ActiveStatus.PENDING, "active status should be set to pending test1");
                    return true;
                }
                return false;
            }, "Wait for promise first response" + new Date().toISOString(), 60, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let core = this.ctx.core;
                let activeStatus = core.activeStatus();
                let channelSpy = this.ctx.channelSpy;
           
                if (this.ctx.secondCall && activeStatus === ActiveStatus.ACTIVE) {
                    Assert.equal(activeStatus, ActiveStatus.ACTIVE, "active status should be set to active test1");
                    Assert.equal(core.config.instrumentationKey, "testIkey1", "channel testIkey should not be changed test1");
                    Assert.equal(core.config.endpointUrl, "testUrl1", "channel endpoint should be changed test1");
                    Assert.ok(core.eventCnt() == 0, "Event should be released");
                    core.track({name: "test1"});
                    let evt = channelSpy.args[1][0];
                    Assert.equal(evt.name, "test1", "event name should be set test2");
                    Assert.equal(evt.iKey, "testIkey1", "event ikey should be set test1");

                    return true;
                }
                return false;
            }, "Wait for promise second response" + new Date().toISOString(), 60, 1000) as any)
        });

        this.testCaseAsync({
            name: "ApplicationInsightsCore Init: init with ikey promise, endpoint url promise, dynamic changed with strings",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {
                let trackPlugin = new TrackPlugin();
                let channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                let core = new AppInsightsCore();
                let channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");

                let ikeyPromise = createAsyncResolvedPromise("testIkey");
                let urlPromise = createAsyncResolvedPromise("testUrl");

                let unresolveIkeyPromise = createAsyncPromise((resolve, reject) => {
                    //do nothing,
                }) // init with it, it should be pending

                let newIkeyPromise = createAsyncPromise((resolve, reject) => {
                    resolve("ikey")
                }) // init with it, pending, no changes or string
                // resolve first one, active

                let config = {
                    instrumentationKey: ikeyPromise,
                    endpointUrl: urlPromise,
                    initTimeOut: 80000
                } as IConfiguration;
                core.initialize(
                    config,
                    [trackPlugin, channelPlugin]);
                this.ctx.core = core;
                this.ctx.channelSpy = channelSpy;

                Assert.ok(!channelSpy.calledOnce, "channel should not be called once");
                Assert.ok(core.eventCnt() == 1, "Event should be queued");
                let activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.PENDING, "default should be pending status");

                // status is pending, following changes should not be applied
                core.config.instrumentationKey = "testIkey1";
                core.config.endpointUrl = "testUrl1";
               

            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this.ctx.core;
                let activeStatus = core.activeStatus();
                let channelSpy = this.ctx.channelSpy
            
                if (activeStatus === ActiveStatus.ACTIVE) {
                    Assert.equal(core.config.instrumentationKey, "testIkey", "channel testIkey should not be changed");
                    Assert.equal(core.config.endpointUrl, "testUrl", "channel endpoint should be changed");
                    Assert.ok(core.eventCnt() == 0, "Event should not be queued test1");
                    let evt1 = channelSpy.args[0][0];
                    Assert.equal(evt1.iKey, "testIkey", "event ikey should be set test1");
                    this.clock.tick(1);
                    core.track({name: "test2"});
                    let evt2 = channelSpy.args[1][0];
                    Assert.equal(evt2.name, "test2", "event name should be set test2");
                    Assert.equal(evt2.iKey, "testIkey", "event ikey should be set test1");
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60, 1000) as any)
        });


        this.testCaseAsync({
            name: "ApplicationInsightsCore Init: init with ikey promise, endpoint url promise, dynamic changed with strings while waiting promises",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {
                let trackPlugin = new TrackPlugin();
                let channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                let core = new AppInsightsCore();
                let channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");

                let urlPromise = createAsyncResolvedPromise("testUrl");

                let resolveFunc;

                let ikeyPromise = createAsyncPromise((resolve, reject) => {
                    resolveFunc = resolve;
                    //do nothing, mock unresolve
                });

                let config = {
                    instrumentationKey: ikeyPromise,
                    endpointUrl: urlPromise,
                    initTimeOut: 80000
                } as IConfiguration;
                core.initialize(
                    config,
                    [trackPlugin, channelPlugin]);
                this.ctx.core = core;
                this.ctx.channelSpy = channelSpy;

                Assert.ok(!channelSpy.calledOnce, "channel should not be called once");
                Assert.ok(core.eventCnt() == 1, "Event should be queued");
                let activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.PENDING, "default should be pending status");

                // status is pending, following changes should not be applied
                core.config.instrumentationKey = "testIkey1";
                this.clock.tick(1);
                Assert.ok(!channelSpy.calledOnce, "channel should not be called once");
                Assert.ok(core.eventCnt() == 1, "Event should be queued");
                activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.PENDING, "default should be pending status");

                resolveFunc("testIkey");
                
            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this.ctx.core;
                let activeStatus = core.activeStatus();
                let channelSpy = this.ctx.channelSpy
            
                if (activeStatus === ActiveStatus.ACTIVE) {
                    Assert.equal(core.config.instrumentationKey, "testIkey", "channel testIkey should not be changed");
                    Assert.equal(core.config.endpointUrl, "testUrl", "channel endpoint should be changed");
                    Assert.ok(core.eventCnt() == 0, "Event should not be queued test1");
                    let evt1 = channelSpy.args[0][0];
                    Assert.equal(evt1.iKey, "testIkey", "event ikey should be set test1");
                    this.clock.tick(1);
                    core.track({name: "test2"});
                    let evt2 = channelSpy.args[1][0];
                    Assert.equal(evt2.name, "test2", "event name should be set test2");
                    Assert.equal(evt2.iKey, "testIkey", "event ikey should be set test1");
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60, 1000) as any)
        });

        this.testCaseAsync({
            name: "ApplicationInsightsCore Init: init with ikey and endpoint timeout promises",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {
                let trackPlugin = new TrackPlugin();
                let channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                let core = new AppInsightsCore();
                let channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");
                this.ctx.core = core;
                this.ctx.channelSpy = channelSpy;

                let ikeyPromise = createTimeoutPromise(60, true,"testIkey");
                let urlPromise = createTimeoutPromise(60, true, "testUrl");

                let config = {
                    instrumentationKey: ikeyPromise,
                    endpointUrl: urlPromise,
                    initTimeOut: 1
                } as IConfiguration;
                core.initialize(
                    config,
                    [trackPlugin, channelPlugin]);
          

                Assert.ok(!channelSpy.calledOnce, "channel should not be called once");
                Assert.ok(core.eventCnt() == 1, "Event should be queued");
                let activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.PENDING, "active status should be set to pending");

            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this.ctx.core;
                let activeStatus = core.activeStatus();
                let channelSpy = this.ctx.channelSpy;
            
                if (activeStatus === ActiveStatus.INACTIVE) {
                    Assert.ok(!channelSpy.calledOnce, "channel should not be called once");
                    Assert.ok(core.eventCnt() == 0, "Event should be released");
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60, 1000) as any)
        });

        this.testCaseAsync({
            name: "ApplicationInsightsCore Init: init with ikey timeout promises and endpoint promises",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {
                let channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                let core = new AppInsightsCore();
                let channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");

                let ikeyPromise = createTimeoutPromise(20, true, "testIkey1");
                let urlPromise = createTimeoutPromise(1, true, "testUrl1");

                let config = {
                    instrumentationKey: ikeyPromise,
                    endpointUrl: urlPromise,
                    initTimeOut: 6
                } as IConfiguration;
                core.initialize(
                    config,
                    [channelPlugin]);
                this.ctx.core = core;
                this.ctx.channelSpy = channelSpy;

                let activeStatus = core.activeStatus();
                Assert.equal(activeStatus, ActiveStatus.PENDING, "active status should be set to pending");
                Assert.ok(!channelSpy.calledOnce, "channel should not be called");
                core.track({name: "testEvent"});


            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this.ctx.core;
                let activeStatus = core.activeStatus();
                let channelSpy = this.ctx.channelSpy
            
                if (activeStatus === ActiveStatus.INACTIVE) {
                    Assert.ok(core.eventCnt() == 0, "Event should be released");
                    Assert.ok(!channelSpy.called, "channel should not be called");
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60, 1000) as any)
        });




        this.testCase({
            name: 'newId tests length',
            test: () => {
                _checkNewId(5, newId(5), "Test the previous length");
                _checkNewId(10, newId(10), "Test the double the previous length");
                _checkNewId(22, newId(), "Test new default length");
                _checkNewId(99, newId(99), "Test 99 character == 74.25 bytes");
                _checkNewId(200, newId(200), "Test 200 character == 150 bytes");

                // Check the id is not zero filled ("A") based on the an int32 === 5 base64 bytes (plus 2 bits)
                let theNewId = newId();
                Assert.notEqual("AAAAAAAAAAAAAAAA", theNewId.substring(0, 16), "Make sure that [" + theNewId + "] value is not zero filled (generally -- it is randomly possible)")
                Assert.notEqual("AAAAAAAAAAAAAAAA", theNewId.substring(5), "Make sure that [" + theNewId + "] value is not zero filled (generally -- it is randomly possible)")
            }
        });

        this.testCase({
            name: 'newId check randomness',
            timeout: 15000,
            test: () => {
                let map = {};

                // Check that mwcRandom is bing called (relies on the mwc implementation from the default seed)
                mwcRandomSeed(1);
                Assert.notEqual(722346555, random32(), "Make sure that the mwcRandom was not being called - step 1");
                Assert.notEqual(3284929732, random32(), "Make sure that the mwcRandom was not being called - step2");

                // cause auto seeding again
                mwcRandomSeed();

                for (let lp = 0; lp < 10000; lp ++) {
                    let theNewId = newId();
                    if (map[theNewId]) {
                        Assert.ok(false, "[" + theNewId + "] was duplicated...")
                    }

                    map[theNewId] = true;
                }

                mwcRandomSeed(1);
                Assert.notEqual(722346555, random32(), "Make sure that the mwcRandom was not being called");
            }
        });

        this.testCase({
            name: 'newId check randomness -- emulating IE',
            timeout: 15000,
            test: () => {
                let map = {};

                // Enumlate IE
                this.setUserAgent("Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0)");
                this.setCrypto(null);
                
                // Check that mwcRandom is bing called (relies on the mwc implementation from the default seed)
                mwcRandomSeed(1);
                Assert.equal(722346555, random32(), "Make sure that the mwcRandom was being called - step 1");
                Assert.equal(3284929732, random32(), "Make sure that the mwcRandom was being called - step2");

                // cause auto seeding again
                mwcRandomSeed();
                Assert.notEqual(722346555, random32(), "Make sure that the mwcRandom was being called - step 3");

                for (let lp = 0; lp < 10000; lp ++) {
                    let theNewId = newId();
                    if (map[theNewId]) {
                        Assert.ok(false, "[" + theNewId + "] was duplicated...")
                    }

                    map[theNewId] = true;
                }

                // Reset the seed and re-check the expected result
                mwcRandomSeed(1);
                Assert.equal(722346555, random32(), "Make sure that the mwcRandom was not being called - step 4");
            }
        });

        this.testCase({
            name: 'Test CoreUtils.randomValue() randomness and distribution',
            timeout: 15000,
            test: () => {
                let numBuckets = 100;
                let buckets: number[] = _createBuckets(100);
                let runs = 1000000;

                for (let lp = 0; lp < runs; lp++) {
                    const bucket = randomValue(numBuckets-1);
                    buckets[bucket] ++;
                }

                let min = 10;
                let max = -1;
                let mode = 0;
            
                for (let lp = 0; lp < numBuckets; lp++) {
                    buckets[lp] /= runs;
                    mode += buckets[lp];
                    min = Math.min(min, buckets[lp]);
                    max = Math.max(max, buckets[lp]);

                    if (buckets[lp] === 0) {
                        Assert.ok(false, 'Bucket: ' + lp + ' is empty!');
                    }
                }

                Assert.equal(undefined, buckets[numBuckets], 'Make sure that we only allocated the correct number of buckets');
            
                const totalVariance = mode / numBuckets;

                let perfectDist = 1 / numBuckets;
                let testDist = perfectDist * 1.5;

                Assert.ok(min > 0 && min <= testDist, min + ': Make sure that we have a good minimum distribution, perfect distribution is (1/bucketCount) = ' + perfectDist);
                Assert.ok(max > 0 && max <= testDist, max + ': Make sure that we have a good maximum distribution, perfect distribution is (1/bucketCount) = ' + perfectDist);
                Assert.ok(totalVariance > 0 && totalVariance <= testDist, totalVariance + ': Check the average distribution perfect distribution is (1/bucketCount) = ' + perfectDist);
            }
        });

        this.testCase({
            name: 'Test CoreUtils.random32() randomness and distribution',
            timeout: 15000,
            test: () => {
                let numBuckets = 100;
                let buckets: number[] = _createBuckets(100);
                let runs = 1000000;

                for (let lp = 0; lp < runs; lp++) {
                    // Need to use floor otherwise the bucket is defined as a float as the index
                    const bucket = Math.floor((random32() / MaxInt32) * numBuckets);
                    buckets[bucket] ++;
                }

                let min = 10;
                let max = -1;
                let mode = 0;
            
                for (let lp = 0; lp < numBuckets; lp++) {
                    buckets[lp] /= runs;
                    mode += buckets[lp];
                    min = Math.min(min, buckets[lp]);
                    max = Math.max(max, buckets[lp]);

                    if (buckets[lp] === 0) {
                        Assert.ok(false, 'Bucket: ' + lp + ' is empty!');
                    }
                }

                Assert.equal(undefined, buckets[numBuckets], 'Make sure that we only allocated the correct number of buckets');
            
                const totalVariance = mode / numBuckets;

                let perfectDist = 1 / numBuckets;
                let testDist = perfectDist * 1.5;

                Assert.ok(min > 0 && min <= testDist, min + ': Make sure that we have a good minimum distribution, perfect distribution is (1/bucketCount) = ' + perfectDist);
                Assert.ok(max > 0 && max <= testDist, max + ': Make sure that we have a good maximum distribution, perfect distribution is (1/bucketCount) = ' + perfectDist);
                Assert.ok(totalVariance > 0 && totalVariance <= testDist, totalVariance + ': Check the average distribution perfect distribution is (1/bucketCount) = ' + perfectDist);
            }
        });

        this.testCase({
            name: 'Test CoreUtils.mwcRandom32() randomness and distribution',
            timeout: 15000,
            test: () => {
                let numBuckets = 100;
                let buckets: number[] = _createBuckets(100);
                let runs = 1000000;

                for (let lp = 0; lp < runs; lp++) {
                    // Need to use floor otherwise the bucket is defined as a float as the index
                    const bucket = Math.floor((mwcRandom32() / MaxInt32) * numBuckets);
                    buckets[bucket] ++;
                }

                let min = 10;
                let max = -1;
                let mode = 0;
            
                for (let lp = 0; lp < numBuckets; lp++) {
                    buckets[lp] /= runs;
                    mode += buckets[lp];
                    min = Math.min(min, buckets[lp]);
                    max = Math.max(max, buckets[lp]);

                    if (buckets[lp] === 0) {
                        Assert.ok(false, 'Bucket: ' + lp + ' is empty!');
                    }
                }
            
                Assert.equal(undefined, buckets[numBuckets], 'Make sure that we only allocated the correct number of buckets');

                const totalVariance = mode / numBuckets;

                let perfectDist = 1 / numBuckets;
                let testDist = perfectDist * 1.5;

                Assert.ok(min > 0 && min <= testDist, min + ': Make sure that we have a good minimum distribution, perfect distribution is (1/bucketCount) = ' + perfectDist);
                Assert.ok(max > 0 && max <= testDist, max + ': Make sure that we have a good maximum distribution, perfect distribution is (1/bucketCount) = ' + perfectDist);
                Assert.ok(totalVariance > 0 && totalVariance <= testDist, totalVariance + ': Check the average distribution perfect distribution is (1/bucketCount) = ' + perfectDist);
            }
        });

        this.testCase({
            name: 'Test Excessive unload hook detection - make sure calling getPerfMgr() does not cause excessive unload hook detection',
            test: () => {
                const appInsightsCore = new AppInsightsCore();
                const channelPlugin1 = new ChannelPlugin();
                channelPlugin1.priority = 1001;

                const theConfig = {
                    channels: [[channelPlugin1]],
                    endpointUrl: "https://dc.services.visualstudio.com/v2/track",
                    instrumentationKey: "",
                    extensionConfig: {}
                };

                appInsightsCore.initialize(theConfig, []);
                Assert.equal(true, appInsightsCore.isInitialized(), "Core is initialized");

                // Send lots of notifications
                for (let lp = 0; lp < 100; lp++) {
                    Assert.equal(null, appInsightsCore.getPerfMgr());
                }
            }
        });

        this.testCase({
            name: "should redact basic auth credentials from URL",
            test: () => {
                let config = {
                    redactionEnabled: false
                } as IConfiguration;
               
                const location = {
                    href: "https://user:password@example.com"
                } as Location;
                
                let redactedLocation = location;
                if (config.redactionEnabled){
                    redactedLocation = fieldRedaction(location);
                    Assert.equal(redactedLocation.href, "https://REDACTED:REDACTED@example.com/");
                }
                Assert.notEqual(redactedLocation.href, "https://REDACTED:REDACTED@example.com/");
                
            }
        });
        
        this.testCase({
            name: "should not modify URL without credentials",
            test: () => {
                const location = {
                    href: "https://example.com/path"
                } as Location;
        
                const redactedLocation = fieldRedaction(location);
                Assert.equal(redactedLocation.href, "https://example.com/path");
            }
        });
        
        this.testCase({
            name: "should redact URL with only username",
            test: () => {
                const location = {
                    href: "https://username@example.com"
                } as Location;
        
                const redactedLocation = fieldRedaction(location);
                Assert.equal(
                    redactedLocation.href, 
                    "https://REDACTED@example.com/",
                    "Expected URL to have username redacted");
            }
        });
        
        this.testCase({
            name: "should preserve query parameters while redacting auth",
            test: () => {
                const location = {
                    href: "https://www.example.com/path?color=blue&sig=X-Goog-Signature"
                } as Location;
        
                const redactedLocation = fieldRedaction(location);
                Assert.equal(redactedLocation.href, "https://www.example.com/path?color=blue&sig=REDACTED");
            }
        });

        this.testCase({
            name: "should preserve query parameters while redacting auth",
            test: () => {
                let config = {
                    redactionEnabled: false
                } as IConfiguration;
                const location = {
                    href: "https://www.example.com/path?color=blue&sig=AWSAccessKeyId"
                } as Location;
                
                if (config.redactionEnabled){
                    const redactedLocation = fieldRedaction(location);
                    Assert.equal(redactedLocation.href, "https://www.example.com/path?color=blue&sig=REDACTED");
                }
                Assert.notEqual(location.href, "https://www.example.com/path?color=blue&sig=REDACTED");
            }
        });
        
        this.testCase({
            name: "should handle invalid URL format",
            test: () => {
                const location = {
                    href: "invalid-url"
                } as Location;
        
                const redactedLocation = fieldRedaction(location);
                Assert.equal(redactedLocation.href, "invalid-url");
            }
        });
        
        this.testCase({
            name: "should handle special characters in credentials", 
            test: () => {
                const location = {
                    href: "https://user%20name:pass%20word@example.com"
                } as Location;
        
                const redactedLocation = fieldRedaction(location);
                Assert.equal(redactedLocation.href, "https://REDACTED:REDACTED@example.com/",
                    "URL should have encoded credentials redacted");
            }
        });
        
        this.testCase({
            name: "should handle URLs with multiple @ symbols",
            test: () => {
                const location = {
                    href: "https://user:pass@example.com/path@somewhere"
                } as Location;
        
                const redactedLocation = fieldRedaction(location);
                Assert.equal(redactedLocation.href, "https://REDACTED:REDACTED@example.com/path@somewhere");
            }
        });


        function _createBuckets(num: number) {
            // Using helper function as TypeScript 2.5.3 is complaining about new Array<number>(100).fill(0);
            let buckets: number[] = [];
            for (let lp = 0; lp < num; lp++) {
                buckets[lp] = 0;
            }

            return buckets;
        }

        function _checkNewId(idLen: number, newId: string, message: string) {
            Assert.equal(idLen, newId.length, "[" + newId + "] - " + message);
        }
    }
}

class TestSamplingPlugin implements ITelemetryPlugin {
    public processTelemetry: (env: ITelemetryItem) => void;
    public initialize: (config: IConfiguration) => void;
    public identifier: string = "AzureSamplingPlugin";
    public setNextPlugin: (next: ITelemetryPlugin) => void;
    public priority: number = 5;
    public version = "1.0.31-Beta";
    public nexttPlugin: ITelemetryPlugin;
    private samplingPercentage;
    private _validateItem = false;
    public _initialized = false;

    constructor(validateItem: boolean = false) {
        this.processTelemetry = this._processTelemetry.bind(this);
        this.initialize = this._start.bind(this);
        this.setNextPlugin = this._setNextPlugin.bind(this);
        this._validateItem = validateItem;
    }

    private _processTelemetry(env: ITelemetryItem) {
        if (!env) {
            throw Error("Invalid telemetry object");
        }

        if (this._validateItem) {
            Assert.ok(env.baseData);
            Assert.ok(env.baseType);
            Assert.ok(env.data);
            Assert.ok(env.ext);
            Assert.ok(env.tags);
        }
    }

    private _start(config: IConfiguration) {
        if (!config) {
            throw Error("required configuration missing");
        }

        const pluginConfig = config.extensions ? config.extensions[this.identifier] : null;
        this.samplingPercentage = pluginConfig ? pluginConfig.samplingPercentage : 100;
        this._initialized = true;
    }

    private _setNextPlugin(next: ITelemetryPlugin): void {
        this.nexttPlugin = next;
    }
}

class ChannelPlugin implements IChannelControls {
    public _nextPlugin: ITelemetryPlugin;
    public isFlushInvoked = false;
    public isUnloadInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;
    public version: string = "1.0.33-Beta";

    public processTelemetry;

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

    onunloadFlush(async?: boolean) {
        this.isUnloadInvoked = true;
    }

    setNextPlugin(next: ITelemetryPlugin) {
        this._nextPlugin = next;
    }

    public initialize = (config: IConfiguration) => {

    }

    public _processTelemetry(env: ITelemetryItem) {
        console.log(JSON.stringify(env))
    }
}

class TestPlugin implements IPlugin {
    public identifier: string = "TestPlugin";
    public version: string = "1.0.31-Beta";

    private _config: IConfiguration;

    public initialize(config: IConfiguration) {
        this._config = config;
        // do custom one time initialization
    }
}

class TrackPlugin implements IPlugin {
    public identifier: string = "TrackPlugin";
    public version: string = "1.0.31-Beta";
    public priority = 2;
    public _nextPlugin: ITelemetryPlugin;
    public isInitialized: any;
    private _config: IConfiguration;

    public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) {
        this._config = config;
        core.track({ name: 'TestEvent1' });

    }

    public setNextPlugin(next: ITelemetryPlugin) {
        this._nextPlugin = next;
    }

    public processTelemetry(evt: ITelemetryItem) {
        this._nextPlugin?.processTelemetry(evt);
    }
}

class TestOfflineChannelPlugin implements IChannelControls {
    public _nextPlugin: ITelemetryPlugin;
    public isFlushInvoked = false;
    public isUnloadInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;
    public version: string = "1.0.33-Beta";

    public processTelemetry;

    public identifier = "OfflineChannel";

    public priority: number = 1000;
    public events: ITelemetryItem[] = [];

    public _isInit: boolean = false;
  

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

    onunloadFlush(async?: boolean) {
        this.isUnloadInvoked = true;
    }

    setNextPlugin(next: ITelemetryPlugin) {
        this._nextPlugin = next;
    }

    public initialize = (config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: any) => {
     
        setTimeout(() => {
            let plugin = core.getPlugin<IChannelControls>("Sender");
            let channel = plugin && plugin.plugin;
            this._isInit = channel && channel.isInitialized();
        }, 0);
        
    }

    public isInitialized = () => {
        return this._isInit;
        
    }

    public _processTelemetry(env: ITelemetryItem) {
        this.events.push(env);

        // Just calling processTelemetry as this is the original design of the Plugins (as opposed to the newer processNext())
    }

}

class TestChannelPlugin implements IChannelControls {
    public _nextPlugin: ITelemetryPlugin;
    public isFlushInvoked = false;
    public isUnloadInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;
    public version: string = "1.0.33-Beta";

    public processTelemetry;

    public identifier = "Sender";

    public priority: number = 1001;
    public events: ITelemetryItem[] = [];
    public _isInitialized: boolean = false;

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

    onunloadFlush(async?: boolean) {
        this.isUnloadInvoked = true;
    }

    setNextPlugin(next: ITelemetryPlugin) {
        this._nextPlugin = next;
    }

    public initialize = (config: IConfiguration) => {
        this._isInitialized = true
    }

    
    public isInitialized = () => {
        return  this._isInitialized
        
    }


    public _processTelemetry(env: ITelemetryItem) {
        this.events.push(env);

        // Just calling processTelemetry as this is the original design of the Plugins (as opposed to the newer processNext())
        this._nextPlugin?.processTelemetry(env);
    }
}

