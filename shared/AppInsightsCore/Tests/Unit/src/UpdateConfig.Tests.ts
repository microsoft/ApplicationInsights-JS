import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { AppInsightsCore } from "../../../src/JavaScriptSDK/AppInsightsCore";
import { IChannelControls } from "../../../src/JavaScriptSDK.Interfaces/IChannelControls";
import { _eInternalMessageId } from "../../../src/JavaScriptSDK.Enums/LoggingEnums";
import { _InternalLogMessage } from "../../../src/JavaScriptSDK/DiagnosticLogger";
import { IConfiguration } from "../../../src/JavaScriptSDK.Interfaces/IConfiguration";
import { IPlugin, ITelemetryPlugin } from "../../../src/JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { ITelemetryItem } from "../../../src/JavaScriptSDK.Interfaces/ITelemetryItem";
import { BaseTelemetryPlugin } from "../../../src/JavaScriptSDK/BaseTelemetryPlugin";
import { IAppInsightsCore } from "../../../src/JavaScriptSDK.Interfaces/IAppInsightsCore";
import { ITelemetryPluginChain } from "../../../src/JavaScriptSDK.Interfaces/ITelemetryPluginChain";
import { IProcessTelemetryContext, IProcessTelemetryUpdateContext } from "../../../src/JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { ITelemetryUpdateState } from "../../../src/applicationinsights-core-js";
import { TelemetryUpdateReason } from "../../../types/applicationinsights-core-js";

const AIInternalMessagePrefix = "AITR_";
const MaxInt32 = 0xFFFFFFFF;

export class UpdateConfigTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "UpdateConfig: Initialization with plugins and disable shared trackPlugin",
            test: () => {
                const iKey1 = "09465199-12AA-4124-817F-544738CC7C41";
                const iKey2 = "00000000-1111-7777-8888-999999999999";
                const testEndpoint1 = "https://localhost:9001/TestEndpoint";

                const channelPlugin = new TestChannelPlugin();
                const trackPlugin = new TrackPlugin();
                const appInsightsCore = new AppInsightsCore();
                const testSamplingPlugin = new TestSamplingPlugin();

                const config: IConfiguration = {
                    instrumentationKey: iKey1
                };
                try {
                    appInsightsCore.initialize(config, [channelPlugin, new TestPlugin(), trackPlugin, testSamplingPlugin]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                Assert.equal(1, channelPlugin.events.length, "We should have a track call");
                Assert.equal(0, channelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, channelPlugin.events[0].data.sampled);

                Assert.equal(iKey1, appInsightsCore.config.instrumentationKey, "Test Core Instrumentation Key");
                Assert.equal(undefined, appInsightsCore.config.endpointUrl, "Test Core Endpoint 1");
                Assert.equal(true, appInsightsCore.getCookieMgr().isEnabled(), "Cookie Manager should be enabled");
                Assert.equal(0, appInsightsCore.logger.consoleLoggingLevel(), "Validate the Console Logging Level")

                Assert.equal(iKey1, trackPlugin._config.instrumentationKey, "Test plugin Instrumentation Key");
                Assert.equal(undefined, trackPlugin._config.endpointUrl, "Test plugin Endpoint 1");

                Assert.equal(undefined, testSamplingPlugin._updatedConfig, "Config has not been updated");

                appInsightsCore.updateCfg({
                    endpointUrl: "https://localhost:9001/TestEndpoint",
                    disableCookiesUsage: true
                }, true);

                Assert.equal(iKey1, appInsightsCore.config.instrumentationKey, "Test Core Instrumentation Key");
                Assert.equal(testEndpoint1, appInsightsCore.config.endpointUrl, "Test Core Endpoint 1");
                Assert.equal(false, appInsightsCore.getCookieMgr().isEnabled(), "Cookie Manager should be disabled");
                Assert.equal(0, appInsightsCore.logger.consoleLoggingLevel(), "Validate the Console Logging Level")

                Assert.equal(iKey1, trackPlugin._config.instrumentationKey, "Test plugin Instrumentation Key");
                Assert.equal(testEndpoint1, trackPlugin._config.endpointUrl, "Test plugin Endpoint 1");

                Assert.equal(appInsightsCore.config, testSamplingPlugin._updatedConfig, "Config has been updated to the same as the core");
                Assert.equal(iKey1, testSamplingPlugin._updatedConfig.instrumentationKey, "Test sampling Instrumentation Key");
                Assert.equal(testEndpoint1, testSamplingPlugin._updatedConfig.endpointUrl, "Test sampling Endpoint 1");

                appInsightsCore.updateCfg({
                    instrumentationKey: iKey2,
                    loggingLevelConsole: 2
                }, true);

                Assert.equal(iKey2, appInsightsCore.config.instrumentationKey, "Test Core Instrumentation Key");
                Assert.equal(testEndpoint1, appInsightsCore.config.endpointUrl, "Test Core Endpoint 1");
                Assert.equal(false, appInsightsCore.getCookieMgr().isEnabled(), "Cookie Manager should be disabled");
                Assert.equal(2, appInsightsCore.logger.consoleLoggingLevel(), "Validate the Console Logging Level")

                Assert.equal(iKey2, trackPlugin._config.instrumentationKey, "Test plugin Instrumentation Key");
                Assert.equal(testEndpoint1, trackPlugin._config.endpointUrl, "Test plugin Endpoint 1");

                Assert.equal(appInsightsCore.config, testSamplingPlugin._updatedConfig, "Config has been updated to the same as the core");
                Assert.equal(iKey2, testSamplingPlugin._updatedConfig.instrumentationKey, "Test sampling Instrumentation Key");
                Assert.equal(testEndpoint1, testSamplingPlugin._updatedConfig.endpointUrl, "Test sampling Endpoint 1");

                appInsightsCore.updateCfg({
                    instrumentationKey: iKey1
                }, false);

                Assert.equal(iKey1, appInsightsCore.config.instrumentationKey, "Test Core Instrumentation Key");
                Assert.equal(undefined, appInsightsCore.config.endpointUrl, "Test Core Endpoint 1");

                // Note the cookie manager "state" does not change from the previous state if no configuration is present
                Assert.equal(true, appInsightsCore.getCookieMgr().isEnabled(), "Cookie Manager should be enabled");
                Assert.equal(0, appInsightsCore.logger.consoleLoggingLevel(), "Validate the Console Logging Level");

                Assert.equal(iKey1, trackPlugin._config.instrumentationKey, "Test plugin Instrumentation Key");
                Assert.equal(undefined, trackPlugin._config.endpointUrl, "Test plugin Endpoint 1");

                Assert.equal(appInsightsCore.config, testSamplingPlugin._updatedConfig, "Config has been updated to the same as the core");
                Assert.equal(iKey1, testSamplingPlugin._updatedConfig.instrumentationKey, "Test sampling Instrumentation Key");
                Assert.equal(undefined, testSamplingPlugin._updatedConfig.endpointUrl, "Test sampling Endpoint 1");
            }
        });

        this.testCase({
            name: "UpdateConfig: Initialization with plugins and disable shared old trackPlugin",
            test: () => {
                const iKey1 = "09465199-12AA-4124-817F-544738CC7C41";
                const iKey2 = "00000000-1111-7777-8888-999999999999";
                const testEndpoint1 = "https://localhost:9001/TestEndpoint";

                const channelPlugin = new TestChannelPlugin();
                const trackPlugin = new OldTrackPlugin();
                const appInsightsCore = new AppInsightsCore();
                const testSamplingPlugin = new TestSamplingPlugin();

                const config: IConfiguration = {
                    instrumentationKey: iKey1
                };
                try {
                    appInsightsCore.initialize(config, [channelPlugin, new TestPlugin(), trackPlugin, testSamplingPlugin]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                Assert.equal(1, channelPlugin.events.length, "We should have a track call");
                Assert.equal(0, channelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, channelPlugin.events[0].data.sampled);

                Assert.equal(iKey1, appInsightsCore.config.instrumentationKey, "Test Core Instrumentation Key");
                Assert.equal(undefined, appInsightsCore.config.endpointUrl, "Test Core Endpoint 1");
                Assert.equal(true, appInsightsCore.getCookieMgr().isEnabled(), "Cookie Manager should be enabled");
                Assert.equal(0, appInsightsCore.logger.consoleLoggingLevel(), "Validate the Console Logging Level")

                Assert.equal(iKey1, trackPlugin._config.instrumentationKey, "Test plugin Instrumentation Key");
                Assert.equal(undefined, trackPlugin._config.endpointUrl, "Test plugin Endpoint 1");

                Assert.equal(undefined, testSamplingPlugin._updatedConfig, "Config has not been updated");

                appInsightsCore.updateCfg({
                    endpointUrl: "https://localhost:9001/TestEndpoint",
                    disableCookiesUsage: true
                }, true);

                Assert.equal(iKey1, appInsightsCore.config.instrumentationKey, "Test Core Instrumentation Key");
                Assert.equal(testEndpoint1, appInsightsCore.config.endpointUrl, "Test Core Endpoint 1");
                Assert.equal(false, appInsightsCore.getCookieMgr().isEnabled(), "Cookie Manager should be disabled");
                Assert.equal(0, appInsightsCore.logger.consoleLoggingLevel(), "Validate the Console Logging Level")

                Assert.equal(iKey1, trackPlugin._config.instrumentationKey, "Test plugin Instrumentation Key");
                Assert.equal(testEndpoint1, trackPlugin._config.endpointUrl, "Test plugin Endpoint 1");

                Assert.equal(appInsightsCore.config, testSamplingPlugin._updatedConfig, "Config has been updated to the same as the core");
                Assert.equal(iKey1, testSamplingPlugin._updatedConfig.instrumentationKey, "Test sampling Instrumentation Key");
                Assert.equal(testEndpoint1, testSamplingPlugin._updatedConfig.endpointUrl, "Test sampling Endpoint 1");

                appInsightsCore.updateCfg({
                    instrumentationKey: iKey2,
                    loggingLevelConsole: 2
                }, true);

                Assert.equal(iKey2, appInsightsCore.config.instrumentationKey, "Test Core Instrumentation Key");
                Assert.equal(testEndpoint1, appInsightsCore.config.endpointUrl, "Test Core Endpoint 1");
                Assert.equal(false, appInsightsCore.getCookieMgr().isEnabled(), "Cookie Manager should be disabled");
                Assert.equal(2, appInsightsCore.logger.consoleLoggingLevel(), "Validate the Console Logging Level")

                Assert.equal(iKey2, trackPlugin._config.instrumentationKey, "Test plugin Instrumentation Key");
                Assert.equal(testEndpoint1, trackPlugin._config.endpointUrl, "Test plugin Endpoint 1");

                Assert.equal(appInsightsCore.config, testSamplingPlugin._updatedConfig, "Config has been updated to the same as the core");
                Assert.equal(iKey2, testSamplingPlugin._updatedConfig.instrumentationKey, "Test sampling Instrumentation Key");
                Assert.equal(testEndpoint1, testSamplingPlugin._updatedConfig.endpointUrl, "Test sampling Endpoint 1");

                appInsightsCore.updateCfg({
                    instrumentationKey: iKey1
                }, false);

                Assert.equal(iKey1, appInsightsCore.config.instrumentationKey, "Test Core Instrumentation Key");
                Assert.equal(undefined, appInsightsCore.config.endpointUrl, "Test Core Endpoint 1");

                // Note the cookie manager "state" does not change from the previous state if no configuration is present
                Assert.equal(true, appInsightsCore.getCookieMgr().isEnabled(), "Cookie Manager should be enabled");
                Assert.equal(0, appInsightsCore.logger.consoleLoggingLevel(), "Validate the Console Logging Level");

                Assert.equal(iKey1, trackPlugin._config.instrumentationKey, "Test plugin Instrumentation Key");
                Assert.equal(undefined, trackPlugin._config.endpointUrl, "Test plugin Endpoint 1");

                Assert.equal(appInsightsCore.config, testSamplingPlugin._updatedConfig, "Config has been updated to the same as the core");
                Assert.equal(iKey1, testSamplingPlugin._updatedConfig.instrumentationKey, "Test sampling Instrumentation Key");
                Assert.equal(undefined, testSamplingPlugin._updatedConfig.endpointUrl, "Test sampling Endpoint 1");
            }
        });


        this.testCase({
            name: "UpdateConfig: Use updateCfg to update and object replaces the previous config",
            test: () => {
                const iKey1 = "09465199-12AA-4124-817F-544738CC7C41";
                const iKey2 = "00000000-1111-7777-8888-999999999999";
                const testEndpoint1 = "https://localhost:9001/TestEndpoint";

                const channelPlugin = new TestChannelPlugin();
                const trackPlugin = new OldTrackPlugin();
                const appInsightsCore = new AppInsightsCore();
                const testSamplingPlugin = new TestSamplingPlugin();

                function _setCookie() {

                }

                const config: IConfiguration = {
                    instrumentationKey: iKey1,
                    cookieCfg: {
                        setCookie: _setCookie
                    }
                };
                try {
                    appInsightsCore.initialize(config, [channelPlugin, new TestPlugin(), trackPlugin, testSamplingPlugin]);
                } catch (error) {
                    Assert.ok(false, "Everything should be initialized");
                }

                Assert.equal(1, channelPlugin.events.length, "We should have a track call");
                Assert.equal(0, channelPlugin.events[0].data.trackPlugin);
                Assert.equal(true, channelPlugin.events[0].data.sampled);

                Assert.equal(iKey1, appInsightsCore.config.instrumentationKey, "Test Core Instrumentation Key");
                Assert.equal(undefined, appInsightsCore.config.endpointUrl, "Test Core Endpoint 1");
                Assert.equal(true, appInsightsCore.getCookieMgr().isEnabled(), "Cookie Manager should be enabled");
                Assert.equal(0, appInsightsCore.logger.consoleLoggingLevel(), "Validate the Console Logging Level")
                Assert.equal(_setCookie, appInsightsCore.config.cookieCfg?.setCookie, "The Set cookie function should be as specified");
                Assert.equal(undefined, appInsightsCore.config.cookieCfg?.getCookie, "No Get cookie function was specified and the internal fallback is not exposed");

                Assert.equal(iKey1, trackPlugin._config.instrumentationKey, "Test plugin Instrumentation Key");
                Assert.equal(undefined, trackPlugin._config.endpointUrl, "Test plugin Endpoint 1");

                Assert.equal(undefined, testSamplingPlugin._updatedConfig, "Config has not been updated");

                appInsightsCore.updateCfg({
                    endpointUrl: "https://localhost:9001/TestEndpoint",
                    cookieCfg: {
                        enabled: true
                    }
                }, true);

                Assert.equal(iKey1, appInsightsCore.config.instrumentationKey, "Test Core Instrumentation Key");
                Assert.equal(testEndpoint1, appInsightsCore.config.endpointUrl, "Test Core Endpoint 1");
                Assert.equal(true, appInsightsCore.getCookieMgr().isEnabled(), "Cookie Manager should be enabled");
                Assert.equal(0, appInsightsCore.logger.consoleLoggingLevel(), "Validate the Console Logging Level")
                Assert.equal(_setCookie, appInsightsCore.config.cookieCfg?.setCookie, "The previous setCookie function should not have been replaced");
                Assert.equal(undefined, appInsightsCore.config.cookieCfg?.getCookie, "No Get cookie function was specified and the internal fallback is not exposed");

                Assert.equal(iKey1, trackPlugin._config.instrumentationKey, "Test plugin Instrumentation Key");
                Assert.equal(testEndpoint1, trackPlugin._config.endpointUrl, "Test plugin Endpoint 1");

                Assert.equal(appInsightsCore.config, testSamplingPlugin._updatedConfig, "Config has been updated to the same as the core");
                Assert.equal(iKey1, testSamplingPlugin._updatedConfig.instrumentationKey, "Test sampling Instrumentation Key");
                Assert.equal(testEndpoint1, testSamplingPlugin._updatedConfig.endpointUrl, "Test sampling Endpoint 1");
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
    public _updatedConfig: IConfiguration;
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

    public update(updateCtx: IProcessTelemetryUpdateContext, updateState: ITelemetryUpdateState) {
        if (updateState.reason & TelemetryUpdateReason.ConfigurationChanged) {
            this._updatedConfig = updateState.cfg;
        }
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
        this._nextPlugin?.processTelemetry(env);
    }
}

class TestPlugin implements IPlugin {
    public identifier: string = "TestPlugin";
    public version: string = "1.0.31-Beta";

    public _config: IConfiguration;

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
    public _config: IConfiguration;
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

    protected _doUpdate = (updateCtx?: IProcessTelemetryUpdateContext, updateState?: ITelemetryUpdateState, asyncCallback?: () => void) => {
        if (updateState.reason & TelemetryUpdateReason.ConfigurationChanged) {
            this._config = updateState.cfg;
        }
    }
}

class OldTrackPlugin implements ITelemetryPlugin {
    public identifier: string = "OldTrackPlugin";
    public priority = 2;
    public isInitialized: any;
    public _config: IConfiguration;
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
