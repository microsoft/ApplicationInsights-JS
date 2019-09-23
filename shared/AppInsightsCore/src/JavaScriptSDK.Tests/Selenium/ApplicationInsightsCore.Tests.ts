/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/AppInsightsCore.ts" />
/// <reference path="../../applicationinsights-core-js.ts" />

import { IConfiguration, ITelemetryPlugin, ITelemetryItem, IPlugin, CoreUtils } from "../../applicationinsights-core-js"
import { AppInsightsCore } from "../../JavaScriptSDK/AppInsightsCore";
import { IChannelControls } from "../../JavaScriptSDK.Interfaces/IChannelControls";
import { _InternalMessageId, LoggingSeverity } from "../../JavaScriptSDK.Enums/LoggingEnums";
import { _InternalLogMessage, DiagnosticLogger } from "../../JavaScriptSDK/DiagnosticLogger";

export class ApplicationInsightsCoreTests extends TestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
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
                appInsightsCore.getTransmissionControls().forEach(queues => {
                    queues.forEach((q: IChannelControls & ChannelPlugin) => {
                        if (q.onunloadFlush) {
                            q.onunloadFlush()
                        }
                    });
                });

                Assert.ok(channelPlugin.isUnloadInvoked, "Unload triggered for channel");
            }
        });

        this.testCase({
            name: "config.channel adds additional queue to existing channels",
            test: () => {
                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1030;

                const channelPlugin1 = new ChannelPlugin();
                channelPlugin1.priority = 1030;

                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41", channels: [[channelPlugin1]] },
                    [channelPlugin]);


                const channelQueues = appInsightsCore.getTransmissionControls();
                Assert.equal(2, channelQueues.length, "Total number of channel queues");
                Assert.equal(1, channelQueues[0].length, "Number of channels in queue 1");
                Assert.equal(1, channelQueues[1].length, "Number of channels in queue 2");
            }
        });

        this.testCase({
            name: 'ApplicationInsightsCore: track adds required default fields if missing',
            test: () => {
                const expectedIKey: string = "09465199-12AA-4124-817F-544738CC7C41";
                const expectedTimestamp = new Date().toISOString();
                const expectedBaseType = "EventData";

                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize({ instrumentationKey: expectedIKey }, [channelPlugin]);
                const validateStub = this.sandbox.stub(appInsightsCore, "_validateTelemetryItem");

                // Act
                const bareItem: ITelemetryItem = { name: 'test item' };
                appInsightsCore.track(bareItem);
                this.clock.tick(1);

                // Test
                Assert.ok(validateStub.calledOnce, "validateTelemetryItem called");
                const newItem: ITelemetryItem = validateStub.args[0][0];
                Assert.equal(expectedIKey, newItem.iKey, "Instrumentation key is added");
                Assert.deepEqual(expectedTimestamp, newItem.time, "Timestamp is added");
            }
        });

        this.testCase({
            name: "DiagnosticLogger: Critical logging history is saved",
            test: () => {
                // Setup
                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize({ instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41", loggingLevelTelemetry: 999 }, [channelPlugin]);

                const messageId: _InternalMessageId = _InternalMessageId.CannotAccessCookie; // can be any id
                const messageKey = appInsightsCore.logger['AIInternalMessagePrefix'] + messageId;

                // Test precondition
                Assert.ok(appInsightsCore.logger['_messageCount'] === 0, 'PRE: No internal logging performed yet');
                Assert.ok(!appInsightsCore.logger['_messageLogged'][messageKey], "PRE: messageId not yet logged");

                // Act
                appInsightsCore.logger.throwInternal(LoggingSeverity.CRITICAL, messageId, "Test Error");

                // Test postcondition
                Assert.ok(appInsightsCore.logger['_messageCount'] === 1, 'POST: Logging success');
                Assert.ok(appInsightsCore.logger['_messageLogged'][messageKey], "POST: Correct messageId logged");
            }
        });

        this.testCase({
            name: 'DiagnosticLogger: Logger can be created with default constructor',
            test: () => {
                // setup
                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.logger = new DiagnosticLogger();

                const messageId: _InternalMessageId = _InternalMessageId.CannotAccessCookie; // can be any id
                const messageKey = appInsightsCore.logger['AIInternalMessagePrefix'] + messageId;

                // Verify precondition
                Assert.ok(appInsightsCore.logger['_messageCount'] === 0, 'PRE: No internal logging performed yet');

                // Act
                appInsightsCore.logger.throwInternal(LoggingSeverity.CRITICAL, messageId, "Some message");

                // Test postcondition
                Assert.ok(appInsightsCore.logger['_messageLogged'][messageKey], "POST: Correct messageId logged");
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
                Assert.ok(!appInsightsCore["_isInitialized"], "PRE: core constructed but not initialized");

                // Init
                initFunction();

                // Assert initialized
                Assert.ok(appInsightsCore["_isInitialized"], "core is initialized");

                Assert.throws(initFunction, Error, "Core cannot be reinitialized");
            }
        });

        // TODO: test pollInternalLogs
        this.testCase({
            name: "DiagnosticLogger: Logs can be polled",
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
                clearInterval(poller);
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

                const messageId: _InternalMessageId = _InternalMessageId.CannotAccessCookie; // can be any id
                const messageKey = appInsightsCore.logger['AIInternalMessagePrefix'] + messageId;

                // Test precondition
                Assert.equal(0, appInsightsCore.logger['_messageCount'], 'PRE: No internal logging performed yet');
                Assert.ok(!appInsightsCore.logger['_messageLogged'][messageKey], "PRE: messageId not yet logged");
                Assert.equal(0, dummyCore.logger['_messageCount'], 'PRE: No dummy logging');
                Assert.ok(!dummyCore.logger['_messageLogged'][messageKey], "PRE: No dummy messageId logged");

                // Act
                appInsightsCore.logger.throwInternal(LoggingSeverity.CRITICAL, messageId, "Test Error");

                // Test postcondition
                Assert.equal(1, appInsightsCore.logger['_messageCount'], 'POST: Logging success');
                Assert.ok(appInsightsCore.logger['_messageLogged'][messageKey], "POST: Correct messageId logged");
                Assert.equal(0, dummyCore.logger['_messageCount'], 'POST: No dummy logging');
                Assert.ok(!dummyCore.logger['_messageLogged'][messageKey], "POST: No dummy messageId logged");
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
                (appInsightsCore as any)._extensions.forEach(ext => {
                    if (ext.identifier === samplingPlugin.identifier) {
                        found = true;
                    }
                });

                Assert.ok(found, "Plugin pased in through config is part of pipeline");
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

                Assert.ok(typeof ((appInsightsCore as any)._extensions[0].processTelemetry) !== 'function', "Extensions can be provided through overall configuration");
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
                Assert.ok(CoreUtils.isNullOrUndefined(channelPlugin3._nextPlugin));
                const channelControls = appInsightsCore.getTransmissionControls();
                Assert.ok(channelControls.length === 2);
                Assert.ok(channelControls[0].length === 2);
                Assert.ok(channelControls[1].length === 1);
                Assert.ok(channelControls[0][0] === channelPlugin1);
                Assert.ok(channelControls[1][0] === channelPlugin3);
                Assert.ok(channelPlugin2._nextPlugin === undefined);
                Assert.ok(channelPlugin3._nextPlugin === undefined);
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
                    [channelPlugin1, channelPlugin2, channelPlugin3]);

                Assert.ok(channelPlugin1._nextPlugin === channelPlugin2);
                Assert.ok(channelPlugin2._nextPlugin === channelPlugin3);
                Assert.ok(CoreUtils.isNullOrUndefined(channelPlugin3._nextPlugin));
                const channelControls = appInsightsCore.getTransmissionControls();
                Assert.ok(channelControls.length === 1);
                Assert.ok(channelControls[0].length === 3);
                Assert.ok(channelControls[0][0] === channelPlugin1);
                Assert.ok(channelControls[0][1] === channelPlugin2);
                Assert.ok(channelControls[0][2] === channelPlugin3);
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
