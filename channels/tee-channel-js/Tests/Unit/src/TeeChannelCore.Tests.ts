import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { ITelemetryItem, AppInsightsCore, isNullOrUndefined, IChannelControls, ITelemetryPlugin, ITelemetryPluginChain, IConfiguration, IPlugin, eLoggingSeverity, _eInternalMessageId } from "@microsoft/otel-core-js";
import { TeeChannel } from "../../../src/TeeChannel";

const AIInternalMessagePrefix = "AITR_";
const MaxInt32 = 0xFFFFFFFF;

export class TeeChannelCoreTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "config.channel dynamic config",
            useFakeTimers: true,
            test: () => {
                const channelPlugin = new ChannelPlugin();
                const teeChannel = new TeeChannel();
                const appInsightsCore = new AppInsightsCore();
                const channelPlugin1 = new ChannelPlugin();
                channelPlugin1.priority = 1030;
                const channelPlugin2 = new ChannelPlugin();
                channelPlugin2.priority = 1031;
                const extId = teeChannel.identifier;

                appInsightsCore.initialize(
                    { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41", channels: [[channelPlugin, teeChannel],[channelPlugin1]]},[]
                );
                let coreChannels =  appInsightsCore.getChannels();
                Assert.equal(2, coreChannels.length, "Total number of core channel queues in test 1");
                Assert.deepEqual(coreChannels[0], teeChannel, "core channel 2 in test 1");
                Assert.deepEqual(coreChannels[1], channelPlugin, "core channel 2 in test 1");
                let teeChannels = teeChannel.getTeeChannels();
                Assert.equal(1, teeChannels.length, "Total number of tee channel queues");
                Assert.equal(1, teeChannels[0].length, "tee channel 1 length in test 1");
                Assert.equal(channelPlugin1, teeChannels[0][0], "tee channel 1 in test 1");
               
                appInsightsCore.config.extensionConfig = appInsightsCore.config.extensionConfig? appInsightsCore.config.extensionConfig : {};
                let extConfig = appInsightsCore.config.extensionConfig;
                let teeChanneConfig = extConfig[extId];
                Assert.deepEqual(teeChanneConfig, {ignoreCoreChannels: false, teeChannels: null}, "default config is set");

                appInsightsCore.config.extensionConfig[extId] = {ignoreCoreChannels: false, teeChannels: [[channelPlugin2]]};
                this.clock.tick(1);
                coreChannels = appInsightsCore.getChannels();
                Assert.equal(2, coreChannels.length, "Total number of core channel queues in test 2");
                Assert.deepEqual(coreChannels[0], teeChannel, "core channel 1 in test 2");
                Assert.deepEqual(coreChannels[1], channelPlugin, "core channel 2 in test 2");
                teeChannels = teeChannel.getTeeChannels();
                Assert.equal(2, teeChannels.length, "Total number of tee channel queues");
                Assert.equal(1, teeChannels[0].length, "tee channel 1 length in test 2");
                Assert.equal(channelPlugin1, teeChannels[0][0], "tee channel 1 in test 2");
                Assert.equal(1, teeChannels[1].length, "tee channel 2 length in test 2");
                Assert.equal(channelPlugin2, teeChannels[1][0], "tee channel 2 in test 2");

                appInsightsCore.config.extensionConfig[extId] = {ignoreCoreChannels: true, teeChannels: [[channelPlugin1, teeChannel]]};
                this.clock.tick(1);
                coreChannels = appInsightsCore.getChannels();
                Assert.equal(2, coreChannels.length, "Total number of core channel queues in test 3");
                Assert.deepEqual(coreChannels[0], teeChannel, "core channel 1 in test 3");
                Assert.deepEqual(coreChannels[1], channelPlugin, "core channel 2 in test 3");
                teeChannels = teeChannel.getTeeChannels();
                Assert.equal(1, teeChannels.length, "Total number of tee channel queues");
                Assert.equal(1, teeChannels[0].length, "tee channel 1 length in test 3");
                Assert.equal(channelPlugin1, teeChannels[0][0], "tee channel 1 index 1 in test 3");

                appInsightsCore.config.extensionConfig[extId] = {ignoreCoreChannels: false, teeChannels: [[channelPlugin1, teeChannel]]};
                this.clock.tick(1);
                coreChannels = appInsightsCore.getChannels();
                Assert.equal(2, coreChannels.length, "Total number of core channel queues in test 4");
                Assert.deepEqual(coreChannels[0], teeChannel, "core channel 1 in test 4");
                Assert.deepEqual(coreChannels[1], channelPlugin, "core channel 2 in test 4");
                teeChannels = teeChannel.getTeeChannels();
                Assert.equal(2, teeChannels.length, "Total number of tee channel queues");
                Assert.equal(1, teeChannels[0].length, "tee channel 1 length in test 4");
                Assert.equal(channelPlugin1, teeChannels[0][0], "tee channel 1 index1 in test 4");
                Assert.equal(1, teeChannels[1].length, "tee channel 2 length in test 4");
                Assert.equal(channelPlugin1, teeChannels[1][0], "tee channel 2 index 1 in test 4");
            }
        });

        this.testCase({
            name: "config.channel adds queue to existing channels",
            test: () => {
                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1030;

                const channelPlugin1 = new ChannelPlugin();
                channelPlugin1.priority = 1030;

                const teeChannel = new TeeChannel();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41", channels: [[channelPlugin1, teeChannel]] },
                    [channelPlugin]);


                const coreChannels = appInsightsCore.getChannels();
                const teeChannels = teeChannel.getTeeChannels();
                Assert.equal(3, coreChannels.length, "Total number of channel queues");
                Assert.equal(0, teeChannels.length, "Total number of tee channel queues");
            }
        });

        this.testCase({
            name: "teeChannels config adds queue to existing channels",
            test: () => {
                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1030;

                const channelPlugin1 = new ChannelPlugin();
                channelPlugin1.priority = 1030;

                const channelPlugin2 = new ChannelPlugin();
                channelPlugin1.priority = 1030;

                const teeChannel = new TeeChannel();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    {
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41",
                        channels: [[channelPlugin1, teeChannel]],
                        extensionConfig: {
                            [teeChannel.identifier] : {
                                teeChannels: [[channelPlugin2]]
                            }
                        }
                    },
                    [channelPlugin],
                    );

                const coreChannels = appInsightsCore.getChannels();
                const teeChannels = teeChannel.getTeeChannels();
                Assert.equal(3, coreChannels.length, "Total number of channel queues");
                Assert.equal(1, teeChannels.length, "Total number of tee channel queues");
                Assert.equal(1, teeChannels[0].length, "Number of tee channels in queue 1");

                Assert.ok(teeChannels[0][0] === channelPlugin2);
            }
        });

        this.testCase({
            name: "Tee channels can be passed in through the config.channel with the teeChannel in the primary channel queue",
            test: () => {
                const channelPlugin2 = new ChannelPlugin();
                channelPlugin2.priority = 1030;

                const channelPlugin1 = new ChannelPlugin();
                channelPlugin1.priority = 1030;

                const teeChannel = new TeeChannel();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41", channels: [[channelPlugin1, teeChannel], [channelPlugin2]] },
                    []
                    );

                const coreChannels = appInsightsCore.getChannels();
                const teeChannels = teeChannel.getTeeChannels();
                Assert.equal(2, coreChannels.length, "Total number of channel queues");
                Assert.ok(coreChannels[0] === teeChannel);
                Assert.ok(coreChannels[1] === channelPlugin1);
                Assert.ok(channelPlugin1._nextPlugin === undefined);


                Assert.equal(1, teeChannels.length, "Total number of tee channel queues");
                Assert.equal(1, teeChannels[0].length, "Number of tee channels in queue 1");

                Assert.ok(teeChannels[0][0] === channelPlugin2);
                
                Assert.ok(channelPlugin2._nextPlugin === undefined);

            }
        });

        this.testCase({
            name: "Tee channels passed via config.channel and extensionConfig teeChannels",
            test: () => {
                const channelPlugin1 = new ChannelPlugin();
                channelPlugin1.priority = 1030;

                const channelPlugin2 = new ChannelPlugin();
                channelPlugin2.priority = 1030;

                const channelPlugin3 = new ChannelPlugin();
                channelPlugin2.priority = 1030;

                const teeChannel = new TeeChannel();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    { 
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41", 
                        channels: [[channelPlugin1, teeChannel], [channelPlugin2]],
                        extensionConfig: {
                            [teeChannel.identifier] : {
                                teeChannels: [[channelPlugin3]]
                            }
                        }
                    },
                    []
                    );

                const coreChannels = appInsightsCore.getChannels();
                const teeChannels = teeChannel.getTeeChannels();
                Assert.equal(2, coreChannels.length, "Total number of channel queues");
                Assert.ok(coreChannels[0] === teeChannel);
                Assert.ok(coreChannels[1] === channelPlugin1);
                Assert.ok(channelPlugin1._nextPlugin === undefined);


                Assert.equal(2, teeChannels.length, "Total number of tee channel queues");
                Assert.equal(1, teeChannels[0].length, "Number of tee channels in queue 1");
                Assert.equal(1, teeChannels[1].length, "Number of tee channels in queue 1");

                Assert.ok(teeChannels[0][0] === channelPlugin2);
                Assert.ok(teeChannels[1][0] === channelPlugin3);
                
                Assert.ok(channelPlugin2._nextPlugin === undefined);

            }
        });

        this.testCase({
            name: "Channels can be passed in through configuration with the teeChannel as an extension",
            test: () => {

                const channelPlugin1 = new ChannelPlugin();
                channelPlugin1.priority = 1001;

                const channelPlugin2 = new ChannelPlugin();
                channelPlugin2.priority = 1002;

                const channelPlugin3 = new ChannelPlugin();
                channelPlugin3.priority = 1001;

                const appInsightsCore = new AppInsightsCore();
                const teeChannel = new TeeChannel();

                appInsightsCore.initialize(
                    {
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41",
                        channels: [[channelPlugin1, channelPlugin2], [channelPlugin3]],
                        extensions: [teeChannel]
                    },
                    []);

                Assert.ok(channelPlugin1._nextPlugin === channelPlugin2);
                Assert.ok(isNullOrUndefined(channelPlugin3._nextPlugin));
                const coreChannels = appInsightsCore.getChannels();
                const teeChannels = teeChannel.getTeeChannels();

                Assert.equal(3, coreChannels.length, "Number of core channels");
                Assert.ok(coreChannels[0] === teeChannel);
                Assert.ok(coreChannels[1] === channelPlugin1);
                Assert.ok(coreChannels[2] === channelPlugin2);

                Assert.equal(1, teeChannels[0].length);
                Assert.ok(teeChannels[0][0] === channelPlugin3);
                
                Assert.ok(channelPlugin2._nextPlugin === undefined);
                Assert.ok(channelPlugin3._nextPlugin === undefined);
            }
        });


        this.testCase({
            name: "Validate a warning when the TeeChannel is not added",
            test: () => {

                const channelPlugin1 = new ChannelPlugin();
                channelPlugin1.priority = 1001;

                const channelPlugin2 = new ChannelPlugin();
                channelPlugin2.priority = 1002;

                const channelPlugin3 = new ChannelPlugin();
                channelPlugin3.priority = 1001;

                const appInsightsCore = new AppInsightsCore();
                let throwSpy = this.sandbox.stub(appInsightsCore.logger, 'throwInternal');

                appInsightsCore.initialize(
                    {
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41",
                        channels: [[channelPlugin1, channelPlugin2], [channelPlugin3]]
                    },
                    [],
                    appInsightsCore.logger      // Reuse the default logger
                    );

                Assert.ok(channelPlugin1._nextPlugin === channelPlugin2);
                Assert.ok(isNullOrUndefined(channelPlugin3._nextPlugin));
                const coreChannels = appInsightsCore.getChannels();

                Assert.equal(2, coreChannels.length, "Number of core channels");
                Assert.ok(coreChannels[0] === channelPlugin1);
                Assert.ok(coreChannels[1] === channelPlugin2);

                Assert.ok(channelPlugin2._nextPlugin === undefined);
                Assert.ok(channelPlugin3._nextPlugin === undefined);

                // Test
                Assert.equal(throwSpy.calledOnce, true, "Critical was logged");
                Assert.equal(throwSpy.args[0][0], eLoggingSeverity.CRITICAL, "Checking that the error is critical");
                Assert.equal(throwSpy.args[0][1], _eInternalMessageId.SenderNotInitialized, "Checking that the error number");
                Assert.ok(throwSpy.args[0][2].indexOf("TeeChannel") != -1);
                Assert.equal(throwSpy.args[0][4], false, "Checking that this was not a user error");
            }
        });
    }
}

class ChannelPlugin implements IChannelControls {
    public _nextPlugin: ITelemetryPlugin | ITelemetryPluginChain;
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

    setNextPlugin(next: ITelemetryPlugin | ITelemetryPluginChain) {
        this._nextPlugin = next;
    }

    public initialize = (config: IConfiguration) => {
    }

    public _processTelemetry(env: ITelemetryItem) {
    }
}
