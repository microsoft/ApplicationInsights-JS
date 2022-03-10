import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { AppInsightsCore } from "../../../src/JavaScriptSDK/AppInsightsCore";
import { IChannelControls } from "../../../src/JavaScriptSDK.Interfaces/IChannelControls";
import { _InternalMessageId, LoggingSeverity } from "../../../src/JavaScriptSDK.Enums/LoggingEnums";
import { _InternalLogMessage, DiagnosticLogger } from "../../../src/JavaScriptSDK/DiagnosticLogger";
import { IConfiguration } from "../../../src/JavaScriptSDK.Interfaces/IConfiguration";
import { IPlugin, ITelemetryPlugin } from "../../../src/JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { ITelemetryItem } from "../../../src/JavaScriptSDK.Interfaces/ITelemetryItem";
import { BaseTelemetryPlugin } from "../../../src/JavaScriptSDK/BaseTelemetryPlugin";
import { IAppInsightsCore } from "../../../src/JavaScriptSDK.Interfaces/IAppInsightsCore";
import { ITelemetryPluginChain } from "../../../src/JavaScriptSDK.Interfaces/ITelemetryPluginChain";
import { IProcessTelemetryContext } from "../../../src/JavaScriptSDK.Interfaces/IProcessTelemetryContext";

const AIInternalMessagePrefix = "AITR_";
const MaxInt32 = 0xFFFFFFFF;

export class DynamicTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "ApplicationInsightsCore: Initialization with plugins and disable shared trackPlugin",
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
            name: "ApplicationInsightsCore: Initialization with plugins and disable core but not trackPlugin",
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
            name: "ApplicationInsightsCore: Initialization with plugins and disable shared old trackPlugin",
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
            name: "ApplicationInsightsCore: Initialization with plugins and disable core but not old trackPlugin",
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
    }
}

/**
 * Test plugin doesn't implement the teardown "unload" function
 */
class TestSamplingPlugin implements ITelemetryPlugin {
    public processTelemetry: (env: ITelemetryItem) => void;
    public initialize: (config: IConfiguration) => void;
    public identifier: string = "AzureSamplingPlugin";
    public setNextPlugin: (next: ITelemetryPlugin) => void;
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
            this.nextPlugin.processTelemetry(env);
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

class TestChannelPlugin implements IChannelControls {
    public _nextPlugin: ITelemetryPlugin;
    public isFlushInvoked = false;
    public isUnloadInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;
    public version: string = "1.0.33-Beta";

    public processTelemetry;

    public identifier = "TestSender";

    public priority: number = 1001;
    public events: ITelemetryItem[] = [];

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
        this.events.push(env);

        // Just calling processTelemetry as this is the original design of the Plugins (as opposed to the newer processNext())
        this._nextPlugin.processTelemetry(env);
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

class OldTrackPlugin implements ITelemetryPlugin {
    public identifier: string = "OldTrackPlugin";
    public priority = 2;
    public isInitialized: any;
    private _config: IConfiguration;
    public index: number = 0;

    public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) {
        this._config = config;
        core.track({ name: 'TestEvent1' });
    }

    public processTelemetry(evt: ITelemetryItem, itemCtx: IProcessTelemetryContext) {
        let data = evt.data = (evt.data || {});
        data.trackPlugin = this.index++;
        itemCtx.processNext(evt);
    }
}
