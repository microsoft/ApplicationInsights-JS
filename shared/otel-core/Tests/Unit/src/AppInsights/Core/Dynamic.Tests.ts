import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { dumpObj } from "@nevware21/ts-utils";
import { AppInsightsCore } from "../../../../../src/core/AppInsights/AppInsightsCore";
import { _eInternalMessageId } from "../../../../../src/otel-core-js";
import { IConfiguration } from "../../../../../src/otel-core-js";
import { IPlugin, ITelemetryPlugin } from "../../../../../src/otel-core-js";
import { ITelemetryItem } from "../../../../../src/otel-core-js";
import { IAppInsightsCore } from "../../../../../src/otel-core-js";
import { ITelemetryPluginChain } from "../../../../../src/otel-core-js";
import { IProcessTelemetryContext } from "../../../../../src/otel-core-js";
import { OldTrackPlugin, TestChannelPlugin, TestPlugin } from "./TestPlugins";
import { BaseTelemetryPlugin } from "../../../../../src/otel-core-js";

export class DynamicTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "Dynamic disable: Initialization with plugins and disable shared trackPlugin",
            test: () => {

                const coreChannelPlugin = new TestChannelPlugin();
                const sharedChannelPlugin = new TestChannelPlugin();

                const trackPlugin = new TrackPlugin();

                const appInsightsCore = new AppInsightsCore();
                const appInsightsSharedCore = new AppInsightsCore();
                const config: IConfiguration = {
                    instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41"
                };
                try {
                    appInsightsCore.initialize(config, [coreChannelPlugin, new TestPlugin(), trackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                Assert.equal(1, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal(0, coreChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[0].data.sampled);

                try {
                    appInsightsSharedCore.initialize(config, [sharedChannelPlugin, new TestPlugin(), trackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                // The 2nd usage of the trackPlugin doesn't call initialize so we won't have any additional event (from the initialize of trackPlugin)
                Assert.equal(0, sharedChannelPlugin.events.length, "We should have a track call");

                let testTrackPlugin = appInsightsCore.getPlugin(trackPlugin.identifier);
                Assert.ok(testTrackPlugin != null, "Track plugin should be returned");
                Assert.equal(trackPlugin, testTrackPlugin.plugin, "The returned plugin should be the same instance");

                let testSharedTrackPlugin = appInsightsSharedCore.getPlugin(trackPlugin.identifier);
                Assert.ok(testSharedTrackPlugin != null, "Shared Track plugin should be returned");
                Assert.equal(trackPlugin, testSharedTrackPlugin.plugin, "The returned Shared plugin should be the same instance");

                appInsightsCore.track({
                    name: "MyCustomEvent"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent"
                });

                Assert.equal(2, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent", coreChannelPlugin.events[1].name);
                Assert.equal(1, coreChannelPlugin.events[1].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[1].data.sampled);

                Assert.equal(1, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent", sharedChannelPlugin.events[0].name);
                Assert.equal(2, sharedChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, sharedChannelPlugin.events[0].data.sampled);

                // Disable the shared instance track plugin
                appInsightsSharedCore.getPlugin(trackPlugin.identifier).setEnabled(false);

                appInsightsCore.track({
                    name: "MyCustomEvent2"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent2"
                });

                Assert.equal(3, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent2", coreChannelPlugin.events[2].name);
                Assert.equal(undefined, (coreChannelPlugin.events[2].data || {}).trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[2].data.sampled);

                Assert.equal(2, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent2", sharedChannelPlugin.events[1].name);
                Assert.equal(undefined, (sharedChannelPlugin.events[1].data || {}).trackPlugin, "The track plugin should not have been applied to the shared instance");
                Assert.equal(true, sharedChannelPlugin.events[1].data.sampled);
            }
        });

        this.testCase({
            name: "Dynamic disable: Initialization with plugins and disable core but not trackPlugin",
            test: () => {

                const coreChannelPlugin = new TestChannelPlugin();
                const sharedChannelPlugin = new TestChannelPlugin();

                const trackPlugin = new TrackPlugin();

                const appInsightsCore = new AppInsightsCore();
                const appInsightsSharedCore = new AppInsightsCore();
                const config: IConfiguration = {
                    instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41"
                };
                try {
                    appInsightsCore.initialize(config, [coreChannelPlugin, new TestPlugin(), trackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                Assert.equal(1, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal(0, coreChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[0].data.sampled);

                try {
                    appInsightsSharedCore.initialize(config, [sharedChannelPlugin, new TestPlugin(), trackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                // The 2nd usage of the trackPlugin doesn't call initialize so we won't have any additional event (from the initialize of trackPlugin)
                Assert.equal(0, sharedChannelPlugin.events.length, "We should have a track call");

                let testTrackPlugin = appInsightsCore.getPlugin(trackPlugin.identifier);
                Assert.ok(testTrackPlugin != null, "Track plugin should be returned");
                Assert.equal(trackPlugin, testTrackPlugin.plugin, "The returned plugin should be the same instance");

                let testSharedTrackPlugin = appInsightsSharedCore.getPlugin(trackPlugin.identifier);
                Assert.ok(testSharedTrackPlugin != null, "Shared Track plugin should be returned");
                Assert.equal(trackPlugin, testSharedTrackPlugin.plugin, "The returned Shared plugin should be the same instance");

                appInsightsCore.track({
                    name: "MyCustomEvent"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent"
                });

                Assert.equal(2, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent", coreChannelPlugin.events[1].name);
                Assert.equal(1, coreChannelPlugin.events[1].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[1].data.sampled);

                Assert.equal(1, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent", sharedChannelPlugin.events[0].name);
                Assert.equal(2, sharedChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, sharedChannelPlugin.events[0].data.sampled);

                appInsightsCore.getPlugin(trackPlugin.identifier).setEnabled(false);

                appInsightsCore.track({
                    name: "MyCustomEvent2"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent2"
                });

                Assert.equal(3, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent2", coreChannelPlugin.events[2].name);
                Assert.equal(undefined, (coreChannelPlugin.events[2].data || {}).trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[2].data.sampled);

                Assert.equal(2, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent2", sharedChannelPlugin.events[1].name);
                Assert.equal(undefined, (sharedChannelPlugin.events[1].data || {}).trackPlugin, "The track plugin should not have been applied to the shared instance");
                Assert.equal(true, sharedChannelPlugin.events[1].data.sampled);
            }
        });

        this.testCase({
            name: "Dynamic disable: Initialization with plugins and disable shared old trackPlugin",
            test: () => {

                const coreChannelPlugin = new TestChannelPlugin();
                const sharedChannelPlugin = new TestChannelPlugin();

                const oldTrackPlugin = new OldTrackPlugin();

                const appInsightsCore = new AppInsightsCore();
                const appInsightsSharedCore = new AppInsightsCore();
                const config: IConfiguration = {
                    instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41"
                };
                try {
                    appInsightsCore.initialize(config, [coreChannelPlugin, new TestPlugin(), oldTrackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                Assert.equal(1, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal(0, coreChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[0].data.sampled);

                try {
                    appInsightsSharedCore.initialize(config, [sharedChannelPlugin, new TestPlugin(), oldTrackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                // The 2nd usage of the trackPlugin doesn't call initialize so we won't have any additional event (from the initialize of trackPlugin)
                Assert.equal(0, sharedChannelPlugin.events.length, "We should have a track call");

                let testTrackPlugin = appInsightsCore.getPlugin(oldTrackPlugin.identifier);
                Assert.ok(testTrackPlugin != null, "Track plugin should be returned");
                Assert.equal(oldTrackPlugin, testTrackPlugin.plugin, "The returned plugin should be the same instance");

                let testSharedTrackPlugin = appInsightsSharedCore.getPlugin(oldTrackPlugin.identifier);
                Assert.ok(testSharedTrackPlugin != null, "Shared Track plugin should be returned");
                Assert.equal(oldTrackPlugin, testSharedTrackPlugin.plugin, "The returned Shared plugin should be the same instance");

                appInsightsCore.track({
                    name: "MyCustomEvent"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent"
                });

                Assert.equal(2, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent", coreChannelPlugin.events[1].name);
                Assert.equal(1, coreChannelPlugin.events[1].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[1].data.sampled);

                Assert.equal(1, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent", sharedChannelPlugin.events[0].name);
                Assert.equal(2, sharedChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, sharedChannelPlugin.events[0].data.sampled);

                appInsightsSharedCore.getPlugin(oldTrackPlugin.identifier).setEnabled(false);

                appInsightsCore.track({
                    name: "MyCustomEvent2"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent2"
                });

                Assert.equal(3, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent2", coreChannelPlugin.events[2].name);
                Assert.equal(undefined, (coreChannelPlugin.events[2].data || {}).trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[2].data.sampled);

                Assert.equal(2, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent2", sharedChannelPlugin.events[1].name);
                Assert.equal(undefined, (sharedChannelPlugin.events[1].data || {}).trackPlugin, "The track plugin should not have been applied to the shared instance");
                Assert.equal(true, sharedChannelPlugin.events[1].data.sampled);
            }
        });

        this.testCase({
            name: "Dynamic disable: Initialization with plugins and disable core but not old trackPlugin",
            test: () => {

                const coreChannelPlugin = new TestChannelPlugin();
                const sharedChannelPlugin = new TestChannelPlugin();

                const oldTrackPlugin = new OldTrackPlugin();

                const appInsightsCore = new AppInsightsCore();
                const appInsightsSharedCore = new AppInsightsCore();
                const config: IConfiguration = {
                    instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41"
                };
                try {
                    appInsightsCore.initialize(config, [coreChannelPlugin, new TestPlugin(), oldTrackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                Assert.equal(1, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal(0, coreChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[0].data.sampled);

                try {
                    appInsightsSharedCore.initialize(config, [sharedChannelPlugin, new TestPlugin(), oldTrackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                // The 2nd usage of the trackPlugin doesn't call initialize so we won't have any additional event (from the initialize of trackPlugin)
                Assert.equal(0, sharedChannelPlugin.events.length, "We should have a track call");

                let testTrackPlugin = appInsightsCore.getPlugin(oldTrackPlugin.identifier);
                Assert.ok(testTrackPlugin != null, "Track plugin should be returned");
                Assert.equal(oldTrackPlugin, testTrackPlugin.plugin, "The returned plugin should be the same instance");

                let testSharedTrackPlugin = appInsightsSharedCore.getPlugin(oldTrackPlugin.identifier);
                Assert.ok(testSharedTrackPlugin != null, "Shared Track plugin should be returned");
                Assert.equal(oldTrackPlugin, testSharedTrackPlugin.plugin, "The returned Shared plugin should be the same instance");

                appInsightsCore.track({
                    name: "MyCustomEvent"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent"
                });

                Assert.equal(2, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent", coreChannelPlugin.events[1].name);
                Assert.equal(1, coreChannelPlugin.events[1].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[1].data.sampled);

                Assert.equal(1, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent", sharedChannelPlugin.events[0].name);
                Assert.equal(2, sharedChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, sharedChannelPlugin.events[0].data.sampled);

                appInsightsCore.getPlugin(oldTrackPlugin.identifier).setEnabled(false);

                appInsightsCore.track({
                    name: "MyCustomEvent2"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent2"
                });

                Assert.equal(3, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent2", coreChannelPlugin.events[2].name);
                Assert.equal(undefined, (coreChannelPlugin.events[2].data || {}).trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[2].data.sampled);

                Assert.equal(2, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent2", sharedChannelPlugin.events[1].name);
                Assert.equal(undefined, (sharedChannelPlugin.events[1].data || {}).trackPlugin, "The track plugin should not have been applied to the shared instance");
                Assert.equal(true, sharedChannelPlugin.events[1].data.sampled);
            }
        });

        this.testCase({
            name: "Dynamic unload: Initialization and unload with Channel",
            test: () => {

                const samplingPlugin = new TestSamplingPlugin();
                const channelPlugin = new TestChannelPlugin();

                const appInsightsCore = new AppInsightsCore();
                const config: IConfiguration = {
                    instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41"
                };
                try {
                    appInsightsCore.initialize(config, [channelPlugin]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                let testSender = appInsightsCore.getPlugin("TestSender");
                Assert.ok(testSender != null, "Sender should be returned");

                Assert.equal(channelPlugin, testSender.plugin, "The returned plugin should be the instance we passed in");

                let unloadComplete = false;
                appInsightsCore.unload(false, () => {
                    unloadComplete = true;
                });

                Assert.equal(true, unloadComplete, "Unload should have been completed synchronously");
                Assert.equal(true, channelPlugin.isTearDownInvoked, "Teardown should have been called");
                Assert.equal(false, appInsightsCore.isInitialized(), "Core should be no longer initialized");
                Assert.equal(null, appInsightsCore.getPlugin("TestSender"), "Sender should no longer be loaded");
            }
        });

        this.testCase({
            name: "Dynamic unload: Initialization and unload with plugins",
            test: () => {

                const samplingPlugin = new TestSamplingPlugin();
                const channelPlugin = new TestChannelPlugin();
                const testPlugin = new TestPlugin();
                const trackPlugin = new TrackPlugin();

                const appInsightsCore = new AppInsightsCore();
                const config: IConfiguration = {
                    instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41"
                };
                try {
                    appInsightsCore.initialize(config, [channelPlugin, testPlugin, trackPlugin, samplingPlugin]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                let testSender = appInsightsCore.getPlugin("TestSender");
                Assert.ok(testSender != null, "Sender should be returned");

                Assert.equal(channelPlugin, testSender.plugin, "The returned plugin should be the instance we passed in");
                Assert.equal(samplingPlugin, appInsightsCore.getPlugin(samplingPlugin.identifier).plugin, "Sampling Plugin");
                Assert.equal(testPlugin, appInsightsCore.getPlugin(testPlugin.identifier).plugin, "testPlugin Plugin");
                Assert.equal(trackPlugin, appInsightsCore.getPlugin(trackPlugin.identifier).plugin, "trackPlugin Plugin");

                let unloadComplete = false;
                appInsightsCore.unload(false, () => {
                    unloadComplete = true;
                });

                Assert.equal(true, unloadComplete, "Unload should have been completed synchronously");
                Assert.equal(true, channelPlugin.isTearDownInvoked, "Teardown should have been called");
                Assert.equal(false, appInsightsCore.isInitialized(), "Core should be no longer initialized");
                Assert.equal(false, trackPlugin.isInitialized(), "trackPlugin should be no longer initialized");
                Assert.equal(null, appInsightsCore.getPlugin(channelPlugin.identifier), "Sender should no longer be loaded");
                Assert.equal(null, appInsightsCore.getPlugin(samplingPlugin.identifier), "Sampling Plugin");
                Assert.equal(null, appInsightsCore.getPlugin(testPlugin.identifier), "testPlugin Plugin");
                Assert.equal(null, appInsightsCore.getPlugin(trackPlugin.identifier), "trackPlugin Plugin");
            }
        });

        this.testCase({
            name: "Dynamic remove/unload: Initialization with plugins and unload trackPlugin",
            test: () => {

                const samplingPlugin = new TestSamplingPlugin();
                const channelPlugin = new TestChannelPlugin();
                const testPlugin = new TestPlugin();
                const trackPlugin = new TrackPlugin();

                const appInsightsCore = new AppInsightsCore();
                const config: IConfiguration = {
                    instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41",
                    loggingLevelConsole: 2
                };
                try {
                    appInsightsCore.initialize(config, [channelPlugin, testPlugin, trackPlugin, samplingPlugin]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                let testSender = appInsightsCore.getPlugin("TestSender");
                Assert.ok(testSender != null, "Sender should be returned");

                Assert.equal(channelPlugin, testSender.plugin, "The returned plugin should be the instance we passed in");
                Assert.equal(samplingPlugin, appInsightsCore.getPlugin(samplingPlugin.identifier).plugin, "Sampling Plugin");
                Assert.equal(testPlugin, appInsightsCore.getPlugin(testPlugin.identifier).plugin, "testPlugin Plugin");
                Assert.equal(trackPlugin, appInsightsCore.getPlugin(trackPlugin.identifier).plugin, "trackPlugin Plugin");

                Assert.equal(1, channelPlugin.events.length, "We should have a track call");
                Assert.equal(0, channelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, channelPlugin.events[0].data.sampled);
                appInsightsCore.track({
                    name: "MyCustomEvent"
                });
                Assert.equal(2, channelPlugin.events.length, "We should have a track call");
                Assert.equal(1, channelPlugin.events[1].data.trackPlugin);
                Assert.equal(true, channelPlugin.events[1].data.sampled);

                // Unload the track plugin
                let removed = false;
                appInsightsCore.getPlugin(trackPlugin.identifier).remove(false, () => {
                    removed = true;
                });
                Assert.equal(true, removed, "Track Plugin should have been removed");

                // Configuration should not have changed
                Assert.equal(2, appInsightsCore.logger.consoleLoggingLevel(), "Validate the Console Logging Level")

                appInsightsCore.track({
                    name: "MyCustomEvent2"
                });
                Assert.equal(3, channelPlugin.events.length, "We should have a track call");
                Assert.equal(undefined, (channelPlugin.events[2].data || {}).trackPlugin);
                Assert.equal(null, appInsightsCore.getPlugin(trackPlugin.identifier), "trackPlugin Plugin");
                Assert.equal(true, channelPlugin.events[2].data.sampled);

                let unloadComplete = false;
                appInsightsCore.unload(false, () => {
                    unloadComplete = true;
                });

                Assert.equal(true, unloadComplete, "Unload should have been completed synchronously");
                Assert.equal(true, channelPlugin.isTearDownInvoked, "Teardown should have been called");
                Assert.equal(false, appInsightsCore.isInitialized(), "Core should be no longer initialized");
                Assert.equal(false, trackPlugin.isInitialized(), "trackPlugin should be no longer initialized");
                Assert.equal(null, appInsightsCore.getPlugin(channelPlugin.identifier), "Sender should no longer be loaded");
                Assert.equal(null, appInsightsCore.getPlugin(samplingPlugin.identifier), "Sampling Plugin");
                Assert.equal(null, appInsightsCore.getPlugin(testPlugin.identifier), "testPlugin Plugin");
                Assert.equal(null, appInsightsCore.getPlugin(trackPlugin.identifier), "trackPlugin Plugin");
            }
        });

        this.testCase({
            name: "Dynamic remove/add/unload: Initialization with plugins and unload and reload samplingPlugin",
            test: () => {

                const samplingPlugin = new TestSamplingPlugin();
                const channelPlugin = new TestChannelPlugin();
                const testPlugin = new TestPlugin();
                const trackPlugin = new TrackPlugin();

                const appInsightsCore = new AppInsightsCore();
                const config: IConfiguration = {
                    instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41"
                };
                try {
                    appInsightsCore.initialize(config, [channelPlugin, testPlugin, trackPlugin, samplingPlugin]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                let testSender = appInsightsCore.getPlugin("TestSender");
                Assert.ok(testSender != null, "Sender should be returned");

                Assert.equal(channelPlugin, testSender.plugin, "The returned plugin should be the instance we passed in");
                Assert.equal(samplingPlugin, appInsightsCore.getPlugin(samplingPlugin.identifier).plugin, "Sampling Plugin");
                Assert.equal(testPlugin, appInsightsCore.getPlugin(testPlugin.identifier).plugin, "testPlugin Plugin");
                Assert.equal(trackPlugin, appInsightsCore.getPlugin(trackPlugin.identifier).plugin, "trackPlugin Plugin");

                Assert.equal(1, channelPlugin.events.length, "We should have a track call");
                Assert.equal(0, channelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, channelPlugin.events[0].data.sampled);

                appInsightsCore.track({
                    name: "MyCustomEvent"
                });
                Assert.equal(2, channelPlugin.events.length, "We should have a track call");
                Assert.equal(1, channelPlugin.events[1].data.trackPlugin);
                Assert.equal(true, channelPlugin.events[1].data.sampled);

                // Unload the track plugin
                let removed = false;
                appInsightsCore.getPlugin(samplingPlugin.identifier).remove(false, () => {
                    removed = true;
                });
                Assert.equal(true, removed, "Track Plugin should have been removed");
                Assert.equal(null, appInsightsCore.getPlugin(samplingPlugin.identifier), "samplingPlugin Plugin");

                appInsightsCore.track({
                    name: "MyCustomEvent2"
                });
                Assert.equal(3, channelPlugin.events.length, "We should have a track call");
                Assert.equal(2, channelPlugin.events[2].data.trackPlugin);
                Assert.equal(undefined, (channelPlugin.events[2].data || {}).sampled);

                let pluginAdded = false;
                appInsightsCore.addPlugin(samplingPlugin, false, false, (added) => {
                    pluginAdded = added;
                });

                Assert.equal(true, pluginAdded, "sampling plugin should have been re-added");
                Assert.equal(samplingPlugin, appInsightsCore.getPlugin(samplingPlugin.identifier).plugin, "Sampling Plugin should be present again");

                appInsightsCore.track({
                    name: "MyCustomEvent3"
                });
                Assert.equal(4, channelPlugin.events.length, "We should have a track call - " + dumpObj(channelPlugin.events));
                Assert.equal(3, channelPlugin.events[3].data.trackPlugin);
                Assert.equal(true, channelPlugin.events[3].data.sampled);

                let newSamplingPlugin = new TestSamplingPlugin();
                let replacedPlugin = false;
                appInsightsCore.addPlugin(newSamplingPlugin, false, false, (added) => {
                    replacedPlugin = added;
                });

                Assert.equal(false, replacedPlugin, "sampling plugin should NOT have been replaced");
                Assert.equal(samplingPlugin, appInsightsCore.getPlugin(samplingPlugin.identifier).plugin, "Sampling Plugin should be present again");

                appInsightsCore.track({
                    name: "MyCustomEvent4"
                });
                Assert.equal(5, channelPlugin.events.length, "We should have a track call");
                Assert.equal(4, channelPlugin.events[4].data.trackPlugin);
                Assert.equal(true, channelPlugin.events[4].data.sampled);

                replacedPlugin = false;
                appInsightsCore.addPlugin(newSamplingPlugin, true, false, (added) => {
                    replacedPlugin = added;
                });

                Assert.equal(true, replacedPlugin, "sampling plugin should have been replaced");
                Assert.equal(newSamplingPlugin, appInsightsCore.getPlugin(samplingPlugin.identifier).plugin, "New Sampling Plugin should be present");

                appInsightsCore.track({
                    name: "MyCustomEvent5"
                });
                Assert.equal(6, channelPlugin.events.length, "We should have a track call");
                Assert.equal(5, channelPlugin.events[5].data.trackPlugin);
                Assert.equal(true, channelPlugin.events[5].data.sampled);

                samplingPlugin.isSampledOut = true;

                appInsightsCore.track({
                    name: "MyCustomEvent6"
                });
                Assert.equal(7, channelPlugin.events.length, "We should have a track call");
                Assert.equal(6, channelPlugin.events[6].data.trackPlugin);
                Assert.equal(true, channelPlugin.events[6].data.sampled, "Should still have been sampled");

                newSamplingPlugin.isSampledOut = true;

                appInsightsCore.track({
                    name: "MyCustomEvent7"
                });
                Assert.equal(7, channelPlugin.events.length, "The event should have been sampled out");
                Assert.equal(6, channelPlugin.events[6].data.trackPlugin);
                Assert.equal(true, channelPlugin.events[6].data.sampled, "Should still have been sampled");

            }
        });

        this.testCase({
            name: "Dynamic shared remove: Initialization with plugins and unload shared trackPlugin only",
            test: () => {

                const coreChannelPlugin = new TestChannelPlugin();
                const sharedChannelPlugin = new TestChannelPlugin();

                const trackPlugin = new TrackPlugin();

                const appInsightsCore = new AppInsightsCore();
                const appInsightsSharedCore = new AppInsightsCore();
                const config: IConfiguration = {
                    instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41"
                };
                try {
                    appInsightsCore.initialize(config, [coreChannelPlugin, new TestPlugin(), trackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                Assert.equal(1, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal(0, coreChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[0].data.sampled);

                try {
                    appInsightsSharedCore.initialize(config, [sharedChannelPlugin, new TestPlugin(), trackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                // The 2nd usage of the trackPlugin doesn't call initialize so we won't have any additional event (from the initialize of trackPlugin)
                Assert.equal(0, sharedChannelPlugin.events.length, "We should have a track call");

                let testTrackPlugin = appInsightsCore.getPlugin(trackPlugin.identifier);
                Assert.ok(testTrackPlugin != null, "Track plugin should be returned");
                Assert.equal(trackPlugin, testTrackPlugin.plugin, "The returned plugin should be the same instance");

                let testSharedTrackPlugin = appInsightsSharedCore.getPlugin(trackPlugin.identifier);
                Assert.ok(testSharedTrackPlugin != null, "Shared Track plugin should be returned");
                Assert.equal(trackPlugin, testSharedTrackPlugin.plugin, "The returned Shared plugin should be the same instance");

                appInsightsCore.track({
                    name: "MyCustomEvent"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent"
                });

                Assert.equal(2, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent", coreChannelPlugin.events[1].name);
                Assert.equal(1, coreChannelPlugin.events[1].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[1].data.sampled);

                Assert.equal(1, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent", sharedChannelPlugin.events[0].name);
                Assert.equal(2, sharedChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, sharedChannelPlugin.events[0].data.sampled);

                // Unload shared instance track plugin
                let removed = false;
                appInsightsSharedCore.getPlugin(trackPlugin.identifier).remove(false, () => {
                    removed = true;
                });
                Assert.equal(true, removed, "Shared Track Plugin should have been removed");
                Assert.equal(true, trackPlugin.isInitialized(), "But should not have been un-initialized");

                Assert.equal(trackPlugin, appInsightsCore.getPlugin(trackPlugin.identifier).plugin, "The returned plugin should be the same instance");
                Assert.equal(null, appInsightsSharedCore.getPlugin(trackPlugin.identifier), "The returned Shared plugin should not be present");

                appInsightsCore.track({
                    name: "MyCustomEvent2"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent2"
                });

                Assert.equal(3, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent2", coreChannelPlugin.events[2].name);
                Assert.equal(3, coreChannelPlugin.events[2].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[2].data.sampled);

                Assert.equal(2, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent2", sharedChannelPlugin.events[1].name);
                Assert.equal(undefined, (sharedChannelPlugin.events[1].data || {}).trackPlugin, "The track plugin should not have been applied to the shared instance");
                Assert.equal(true, sharedChannelPlugin.events[1].data.sampled);
            }
        });

        this.testCase({
            name: "Dynamic shared remove: Initialization with plugins and unload core but not trackPlugin",
            test: () => {

                const coreChannelPlugin = new TestChannelPlugin();
                const sharedChannelPlugin = new TestChannelPlugin();

                const trackPlugin = new TrackPlugin();

                const appInsightsCore = new AppInsightsCore();
                const appInsightsSharedCore = new AppInsightsCore();
                const config: IConfiguration = {
                    instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41"
                };
                try {
                    appInsightsCore.initialize(config, [coreChannelPlugin, new TestPlugin(), trackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                Assert.equal(1, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal(0, coreChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[0].data.sampled);

                try {
                    appInsightsSharedCore.initialize(config, [sharedChannelPlugin, new TestPlugin(), trackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                // The 2nd usage of the trackPlugin doesn't call initialize so we won't have any additional event (from the initialize of trackPlugin)
                Assert.equal(0, sharedChannelPlugin.events.length, "We should have a track call");

                let testTrackPlugin = appInsightsCore.getPlugin(trackPlugin.identifier);
                Assert.ok(testTrackPlugin != null, "Track plugin should be returned");
                Assert.equal(trackPlugin, testTrackPlugin.plugin, "The returned plugin should be the same instance");

                let testSharedTrackPlugin = appInsightsSharedCore.getPlugin(trackPlugin.identifier);
                Assert.ok(testSharedTrackPlugin != null, "Shared Track plugin should be returned");
                Assert.equal(trackPlugin, testSharedTrackPlugin.plugin, "The returned Shared plugin should be the same instance");

                appInsightsCore.track({
                    name: "MyCustomEvent"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent"
                });

                Assert.equal(2, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent", coreChannelPlugin.events[1].name);
                Assert.equal(1, coreChannelPlugin.events[1].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[1].data.sampled);

                Assert.equal(1, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent", sharedChannelPlugin.events[0].name);
                Assert.equal(2, sharedChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, sharedChannelPlugin.events[0].data.sampled);

                // Unload shared instance track plugin
                let removed = false;
                appInsightsCore.getPlugin(trackPlugin.identifier).remove(false, () => {
                    removed = true;
                });
                Assert.equal(true, removed, "Shared Track Plugin should have been removed");
                Assert.equal(false, trackPlugin.isInitialized(), "But should not have been un-initialized");

                Assert.equal(null, appInsightsCore.getPlugin(trackPlugin.identifier), "The returned core plugin should no longer be present");
                Assert.equal(trackPlugin, appInsightsSharedCore.getPlugin(trackPlugin.identifier).plugin, "The returned Shared plugin should be present");

                appInsightsCore.track({
                    name: "MyCustomEvent2"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent2"
                });

                Assert.equal(3, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent2", coreChannelPlugin.events[2].name);
                Assert.equal(undefined, (coreChannelPlugin.events[2].data || {}).trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[2].data.sampled);

                Assert.equal(2, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent2", sharedChannelPlugin.events[1].name);
                Assert.equal(undefined, (sharedChannelPlugin.events[1].data || {}).trackPlugin, "The track plugin should not have been applied to the shared instance");
                Assert.equal(true, sharedChannelPlugin.events[1].data.sampled);
            }
        });

        this.testCase({
            name: "Dynamic shared remove: Initialization with plugins and unload shared old trackPlugin only",
            test: () => {

                const coreChannelPlugin = new TestChannelPlugin();
                const sharedChannelPlugin = new TestChannelPlugin();

                const oldTrackPlugin = new OldTrackPlugin();

                const appInsightsCore = new AppInsightsCore();
                const appInsightsSharedCore = new AppInsightsCore();
                const config: IConfiguration = {
                    instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41"
                };
                try {
                    appInsightsCore.initialize(config, [coreChannelPlugin, new TestPlugin(), oldTrackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                Assert.equal(1, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal(0, coreChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[0].data.sampled);

                try {
                    appInsightsSharedCore.initialize(config, [sharedChannelPlugin, new TestPlugin(), oldTrackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                // The 2nd usage of the trackPlugin doesn't call initialize so we won't have any additional event (from the initialize of trackPlugin)
                Assert.equal(0, sharedChannelPlugin.events.length, "We should have a track call");

                let testTrackPlugin = appInsightsCore.getPlugin(oldTrackPlugin.identifier);
                Assert.ok(testTrackPlugin != null, "Track plugin should be returned");
                Assert.equal(oldTrackPlugin, testTrackPlugin.plugin, "The returned plugin should be the same instance");

                let testSharedTrackPlugin = appInsightsSharedCore.getPlugin(oldTrackPlugin.identifier);
                Assert.ok(testSharedTrackPlugin != null, "Shared Track plugin should be returned");
                Assert.equal(oldTrackPlugin, testSharedTrackPlugin.plugin, "The returned Shared plugin should be the same instance");

                appInsightsCore.track({
                    name: "MyCustomEvent"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent"
                });

                Assert.equal(2, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent", coreChannelPlugin.events[1].name);
                Assert.equal(1, coreChannelPlugin.events[1].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[1].data.sampled);

                Assert.equal(1, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent", sharedChannelPlugin.events[0].name);
                Assert.equal(2, sharedChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, sharedChannelPlugin.events[0].data.sampled);

                // Unload shared instance track plugin
                let removed = false;
                appInsightsSharedCore.getPlugin(oldTrackPlugin.identifier).remove(false, () => {
                    removed = true;
                });
                Assert.equal(true, removed, "Shared Track Plugin should have been removed");

                Assert.equal(oldTrackPlugin, appInsightsCore.getPlugin(oldTrackPlugin.identifier).plugin, "The returned plugin should be the same instance");
                Assert.equal(null, appInsightsSharedCore.getPlugin(oldTrackPlugin.identifier), "The returned Shared plugin should not be present");

                appInsightsCore.track({
                    name: "MyCustomEvent2"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent2"
                });

                Assert.equal(3, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent2", coreChannelPlugin.events[2].name);
                Assert.equal(3, coreChannelPlugin.events[2].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[2].data.sampled);

                Assert.equal(2, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent2", sharedChannelPlugin.events[1].name);
                Assert.equal(undefined, (sharedChannelPlugin.events[1].data || {}).trackPlugin, "The track plugin should not have been applied to the shared instance");
                Assert.equal(true, sharedChannelPlugin.events[1].data.sampled);
            }
        });

        this.testCase({
            name: "Dynamic shared remove: Initialization with plugins and unload core but not old trackPlugin",
            test: () => {

                const coreChannelPlugin = new TestChannelPlugin();
                const sharedChannelPlugin = new TestChannelPlugin();

                const oldTrackPlugin = new OldTrackPlugin();

                const appInsightsCore = new AppInsightsCore();
                const appInsightsSharedCore = new AppInsightsCore();
                const config: IConfiguration = {
                    instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41"
                };
                try {
                    appInsightsCore.initialize(config, [coreChannelPlugin, new TestPlugin(), oldTrackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                Assert.equal(1, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal(0, coreChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[0].data.sampled);

                try {
                    appInsightsSharedCore.initialize(config, [sharedChannelPlugin, new TestPlugin(), oldTrackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                // The 2nd usage of the trackPlugin doesn't call initialize so we won't have any additional event (from the initialize of trackPlugin)
                Assert.equal(0, sharedChannelPlugin.events.length, "We should have a track call");

                let testTrackPlugin = appInsightsCore.getPlugin(oldTrackPlugin.identifier);
                Assert.ok(testTrackPlugin != null, "Track plugin should be returned");
                Assert.equal(oldTrackPlugin, testTrackPlugin.plugin, "The returned plugin should be the same instance");

                let testSharedTrackPlugin = appInsightsSharedCore.getPlugin(oldTrackPlugin.identifier);
                Assert.ok(testSharedTrackPlugin != null, "Shared Track plugin should be returned");
                Assert.equal(oldTrackPlugin, testSharedTrackPlugin.plugin, "The returned Shared plugin should be the same instance");

                appInsightsCore.track({
                    name: "MyCustomEvent"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent"
                });

                Assert.equal(2, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent", coreChannelPlugin.events[1].name);
                Assert.equal(1, coreChannelPlugin.events[1].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[1].data.sampled);

                Assert.equal(1, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent", sharedChannelPlugin.events[0].name);
                Assert.equal(2, sharedChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, sharedChannelPlugin.events[0].data.sampled);

                // Unload shared instance track plugin
                let removed = false;
                appInsightsCore.getPlugin(oldTrackPlugin.identifier).remove(false, () => {
                    removed = true;
                });
                Assert.equal(true, removed, "Shared Track Plugin should have been removed");

                Assert.equal(null, appInsightsCore.getPlugin(oldTrackPlugin.identifier), "The returned core plugin should no longer be present");
                Assert.equal(oldTrackPlugin, appInsightsSharedCore.getPlugin(oldTrackPlugin.identifier).plugin, "The returned Shared plugin should be present");

                appInsightsCore.track({
                    name: "MyCustomEvent2"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent2"
                });

                Assert.equal(3, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent2", coreChannelPlugin.events[2].name);
                Assert.equal(undefined, (coreChannelPlugin.events[2].data || {}).trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[2].data.sampled);

                Assert.equal(2, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent2", sharedChannelPlugin.events[1].name);
                Assert.equal(undefined, (sharedChannelPlugin.events[1].data || {}).trackPlugin, "The track plugin should not have been applied to the shared instance");
                Assert.equal(true, sharedChannelPlugin.events[1].data.sampled);
            }
        });

        this.testCase({
            name: "Dynamic shared unload: Initialization with plugins and unload shared old trackPlugin only",
            test: () => {

                const coreChannelPlugin = new TestChannelPlugin();
                const sharedChannelPlugin = new TestChannelPlugin();

                const oldTrackPlugin = new OldTrackPlugin();

                const appInsightsCore = new AppInsightsCore();
                const appInsightsSharedCore = new AppInsightsCore();
                const config: IConfiguration = {
                    instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41"
                };
                try {
                    appInsightsCore.initialize(config, [coreChannelPlugin, new TestPlugin(), oldTrackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                Assert.equal(1, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal(0, coreChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[0].data.sampled);

                try {
                    appInsightsSharedCore.initialize(config, [sharedChannelPlugin, new TestPlugin(), oldTrackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                // The 2nd usage of the trackPlugin doesn't call initialize so we won't have any additional event (from the initialize of trackPlugin)
                Assert.equal(0, sharedChannelPlugin.events.length, "We should have a track call");

                let testTrackPlugin = appInsightsCore.getPlugin(oldTrackPlugin.identifier);
                Assert.ok(testTrackPlugin != null, "Track plugin should be returned");
                Assert.equal(oldTrackPlugin, testTrackPlugin.plugin, "The returned plugin should be the same instance");

                let testSharedTrackPlugin = appInsightsSharedCore.getPlugin(oldTrackPlugin.identifier);
                Assert.ok(testSharedTrackPlugin != null, "Shared Track plugin should be returned");
                Assert.equal(oldTrackPlugin, testSharedTrackPlugin.plugin, "The returned Shared plugin should be the same instance");

                appInsightsCore.track({
                    name: "MyCustomEvent"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent"
                });

                Assert.equal(2, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent", coreChannelPlugin.events[1].name);
                Assert.equal(1, coreChannelPlugin.events[1].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[1].data.sampled);

                Assert.equal(1, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent", sharedChannelPlugin.events[0].name);
                Assert.equal(2, sharedChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, sharedChannelPlugin.events[0].data.sampled);

                // Unload shared instance track plugin
                let removed = false;
                appInsightsSharedCore.unload(false, () => {
                    removed = true;
                });
                Assert.equal(true, removed, "Shared Track Plugin should have been removed");

                Assert.equal(oldTrackPlugin, appInsightsCore.getPlugin(oldTrackPlugin.identifier).plugin, "The returned plugin should be the same instance");
                Assert.equal(null, appInsightsSharedCore.getPlugin(oldTrackPlugin.identifier), "The returned Shared plugin should not be present");

                appInsightsCore.track({
                    name: "MyCustomEvent2"
                });

                Assert.equal(3, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent2", coreChannelPlugin.events[2].name);
                Assert.equal(3, coreChannelPlugin.events[2].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[2].data.sampled);
            }
        });

        this.testCase({
            name: "Dynamic shared unload: Initialization with plugins and unload core but not old trackPlugin",
            test: () => {

                const coreChannelPlugin = new TestChannelPlugin();
                const sharedChannelPlugin = new TestChannelPlugin();

                const oldTrackPlugin = new OldTrackPlugin();

                const appInsightsCore = new AppInsightsCore();
                const appInsightsSharedCore = new AppInsightsCore();
                const config: IConfiguration = {
                    instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41"
                };
                try {
                    appInsightsCore.initialize(config, [coreChannelPlugin, new TestPlugin(), oldTrackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                Assert.equal(1, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal(0, coreChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[0].data.sampled);

                try {
                    appInsightsSharedCore.initialize(config, [sharedChannelPlugin, new TestPlugin(), oldTrackPlugin, new TestSamplingPlugin()]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                // The 2nd usage of the trackPlugin doesn't call initialize so we won't have any additional event (from the initialize of trackPlugin)
                Assert.equal(0, sharedChannelPlugin.events.length, "We should have a track call");

                let testTrackPlugin = appInsightsCore.getPlugin(oldTrackPlugin.identifier);
                Assert.ok(testTrackPlugin != null, "Track plugin should be returned");
                Assert.equal(oldTrackPlugin, testTrackPlugin.plugin, "The returned plugin should be the same instance");

                let testSharedTrackPlugin = appInsightsSharedCore.getPlugin(oldTrackPlugin.identifier);
                Assert.ok(testSharedTrackPlugin != null, "Shared Track plugin should be returned");
                Assert.equal(oldTrackPlugin, testSharedTrackPlugin.plugin, "The returned Shared plugin should be the same instance");

                appInsightsCore.track({
                    name: "MyCustomEvent"
                });

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent"
                });

                Assert.equal(2, coreChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MyCustomEvent", coreChannelPlugin.events[1].name);
                Assert.equal(1, coreChannelPlugin.events[1].data.trackPlugin);
                Assert.equal(true, coreChannelPlugin.events[1].data.sampled);

                Assert.equal(1, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent", sharedChannelPlugin.events[0].name);
                Assert.equal(2, sharedChannelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, sharedChannelPlugin.events[0].data.sampled);

                // Unload shared instance track plugin
                let removed = false;
                appInsightsCore.unload(false, () => {
                    removed = true;
                });
                Assert.equal(true, removed, "Shared Track Plugin should have been removed");

                Assert.equal(null, appInsightsCore.getPlugin(oldTrackPlugin.identifier), "The returned core plugin should no longer be present");
                Assert.equal(oldTrackPlugin, appInsightsSharedCore.getPlugin(oldTrackPlugin.identifier).plugin, "The returned Shared plugin should be present");

                appInsightsSharedCore.track({
                    name: "MySharedCustomEvent2"
                });

                Assert.equal(2, sharedChannelPlugin.events.length, "We should have a track call");
                Assert.equal("MySharedCustomEvent2", sharedChannelPlugin.events[1].name);
                Assert.equal(undefined, (sharedChannelPlugin.events[1].data || {}).trackPlugin, "The track plugin should not have been applied to the shared instance");
                Assert.equal(true, sharedChannelPlugin.events[1].data.sampled);
            }
        });
    }
}

/**
 * Test plugin doesn't implement the teardown "unload" function
 */
class TestSamplingPlugin implements ITelemetryPlugin {
    public processTelemetry: (env: ITelemetryItem) => void;
    public initialize: (config: IConfiguration) => void;
    public identifier: string = "AzureSamplingPlugin";
    /** @deprecated - Use processNext() function of the passed IProcessTelemetryContext instead */
    public setNextPlugin?: (next: ITelemetryPlugin) => void;
    public priority: number = 5;
    public version = "1.0.31-Beta";
    public nextPlugin: ITelemetryPlugin;
    public isSampledOut: boolean = false;
    public teardownCalled: boolean = false;
    private _validateItem = false;

    constructor(validateItem: boolean = false) {
        this.processTelemetry = this._processTelemetry.bind(this);
        this.initialize = this._start.bind(this);
        this.setNextPlugin = this._setNextPlugin.bind(this);
        this._validateItem = validateItem;
    }

    public teardown() {
        this.teardownCalled = true;
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

        let data = env.data = (env.data || {});
        data.sampled = true;

        if (!this.isSampledOut) {
            this.nextPlugin?.processTelemetry(env);
        }
    }

    private _start(config: IConfiguration) {
        if (!config) {
            throw Error("required configuration missing");
        }

        const pluginConfig = config.extensions ? config.extensions[this.identifier] : null;
        this.isSampledOut = pluginConfig ? pluginConfig.isSampledOut : false;
    }

    private _setNextPlugin(next: ITelemetryPlugin): void {
        this.nextPlugin = next;
    }
}

class TrackPlugin extends BaseTelemetryPlugin {
    public identifier: string = "TrackPlugin";
    public version: string = "1.0.31-Beta";
    public priority = 2;
    public isInitialized: any;
    private _config: IConfiguration;
    public index: number = 0;

    public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) {
        super.initialize(config, core, extensions, pluginChain)
        this._config = config;
        core.track({ name: 'TestEvent1' });
    }

    public processTelemetry(evt: ITelemetryItem, itemCtx: IProcessTelemetryContext) {
        let data = evt.data = (evt.data || {});
        data.trackPlugin = this.index++;
        itemCtx.processNext(evt);
    }
}
