/**
 * @copyright Microsoft 2024
 */

import { Assert, AITestClass } from '@microsoft/ai-test-framework';
import { IOSPluginConfiguration, OsPlugin } from '../../../src/applicationinsights-osplugin-js';
import { createAsyncPromise, ResolvePromiseHandler, RejectPromiseHandler } from "@nevware21/ts-async";
import {getWindow, AppInsightsCore, IChannelControls, ITelemetryPlugin,
    IConfiguration, ITelemetryItem, __getRegisteredEvents} from "@microsoft/applicationinsights-core-js";

const defaultmaxTimeout = 5000;
const _platformVersion =  {"brands":[{"brand":"Chromium","version":"122"}, 
{"brand":"Microsoft Edge","version":"122"}],"mobile":false,"platform":"Windows",
"platformVersion":"15.0.0"};

interface ITestConfig extends IConfiguration {
    endpointUrl?: string;
    disableFlushOnUnload?: boolean;
    isStorageUseDisabled?: boolean;
}

interface IOsState {
    platform?: string | null;
    platformVersion?: number | null;
}

interface IDbgTargets {
    osState: IOsState;
    queue: Array<{ item: ITelemetryItem }>;
    hasPendingTimeout: boolean;
}

interface CustomNavigator extends Navigator {
    userAgentData?: {
        getHighEntropyValues?: (args: any[]) => Promise<any>;
    };
}

export class OsPluginTest extends AITestClass {

    private _config: ITestConfig;
    private _plugin: OsPlugin;
    private _core: AppInsightsCore;
    private _osConfig: IOSPluginConfiguration = {
        maxTimeout: 6000, // set a big number to avoid timeout for test
        mergeOsNameVersion: false
    };
    private _testChannelPlugin: TestChannelPlugin;

    private _resolvedGetHighEntrophyPromise: ResolvePromiseHandler<any> | undefined;
    private _rejectedGetHighEntrophyPromise: RejectPromiseHandler | undefined;
    private _channelSpy: any;

    public testInitialize() {
        this._core = new AppInsightsCore();
        this._plugin = new OsPlugin();
        this._testChannelPlugin = new TestChannelPlugin();
        this._config = {
            instrumentationKey: 'testIkey',
            endpointUrl: 'testEndpoint',
            extensionConfig: []
        };

        let navigator = {
            userAgentData: {
                getHighEntropyValues: (args) => {
                    if (args[0] === "platformVersion") {
                        return createAsyncPromise((resolve, reject) => {
                            this._resolvedGetHighEntrophyPromise = resolve;
                            this._rejectedGetHighEntrophyPromise = reject;
                        });
                    }
                }
            }
        } as CustomNavigator;

        this.setNavigator(navigator, true);

        this._channelSpy = this.sandbox.spy(this._testChannelPlugin, 'processTelemetry');

    }

    private _getDbgTargets(): IDbgTargets {
        let dbgTargets = (this._plugin as any)["_getDbgPlgTargets"]();

        return {
            osState: dbgTargets[0],
            queue: dbgTargets[1],
            hasPendingTimeout: dbgTargets[2]
        };
    }

    private _resolveHighEntropy(result: any) {
        Assert.ok(!!this._resolvedGetHighEntrophyPromise, "expected getHighEntropyValues() to be pending");
        this._resolvedGetHighEntrophyPromise!(result);
    }

    private _rejectHighEntropy(error: Error) {
        Assert.ok(!!this._rejectedGetHighEntrophyPromise, "expected getHighEntropyValues() to be pending");
        this._rejectedGetHighEntrophyPromise!(error);
    }

    private _createTestEvent(): ITelemetryItem {
        return {
            name: 'testEvent',
            baseType: 'testBaseType',
            baseData: {}
        } as ITelemetryItem;
    }

    private _createPageHideEvent(): Event {
        if (typeof Event !== "undefined") {
            return new Event("pagehide");
        }

        let doc = document as any;
        let evt = doc.createEvent("Event");
        evt.initEvent("pagehide", true, true);
        return evt;
    }

    private _getRegisteredUnloadState() {
        let window = getWindow();
        let unloadPresent = false;
        let pageHidePresent = false;
        let visibilityChangePresent = false;

        let theEvents = __getRegisteredEvents(window);
        theEvents.forEach((theEvent) => {
            if (theEvent.name.startsWith("unload")) {
                unloadPresent = true;
            }

            if (theEvent.name.startsWith("pagehide")) {
                pageHidePresent = true;
            }

            if (theEvent.name.startsWith("visibilitychange")) {
                visibilityChangePresent = true;
            }
        });

        return {
            unloadPresent: unloadPresent,
            pageHidePresent: pageHidePresent,
            visibilityChangePresent: visibilityChangePresent
        };
    }

    public testFinishedCleanup(): void {
        let window = getWindow();
        let sessionStorage = window.sessionStorage;
        sessionStorage.clear();
        if (this._core && this._core.isInitialized()) {
            this._core.unload(false);
        }
    }

    public registerTests() {
        this.testCase({
            name: "OsPlugin: Dynamic and Default Configuration Tests",
            useFakeTimers: true,
            test: () => {
                let config = this._config;
                let plugin = this._plugin;
                config.extensionConfig = this._config.extensionConfig || {};
                config.extensionConfig[this._plugin.identifier] = this._osConfig;
                this._core.initialize(config, [plugin, this._testChannelPlugin]);
                this.clock.tick(100);
                Assert.deepEqual(this._osConfig.maxTimeout, this._core.config.extensionConfig![this._plugin.identifier].maxTimeout, "maxTimeout should be changed");
            }
        });

        this.testCase({
            name: "OsPlugin: initialize starts OS retrieval before first telemetry",
            useFakeTimers: true,
            test: () => {
                let config = this._config;
                config.extensionConfig = config.extensionConfig || {};
                config.extensionConfig[this._plugin.identifier] = this._osConfig;

                this._core.initialize(config, [this._plugin, this._testChannelPlugin]);

                let dbgTargets = this._getDbgTargets();
                Assert.equal(dbgTargets.hasPendingTimeout, true, "OS retrieval timer should start during initialize");
                Assert.equal(dbgTargets.queue.length, 0, "No telemetry should be queued before track() is called");
            }
        });

        this.testCase({
            name: "OsPlugin: Events will be queued if OS is not available and will be sent after timeout",
            useFakeTimers: true,
            test: () => {
                let config = this._config;
                let plugin = this._plugin;
                config.extensionConfig = this._config.extensionConfig || {};
                this._core.initialize(config, [plugin, this._testChannelPlugin]);
                let event = this._createTestEvent();
                this._core.track(event);
                Assert.equal(this._channelSpy.called, false);
                Assert.equal(this._getDbgTargets().hasPendingTimeout, true);
                Assert.equal(this._getDbgTargets().queue.length, 1);
                Assert.equal(this._getDbgTargets().queue[0].item.name, event.name);
                this.clock.tick(defaultmaxTimeout);
                Assert.equal(this._getDbgTargets().queue.length, 0);
                Assert.equal(this._channelSpy.called, true);
            }
        });

        this.testCase({
            name: "OsPlugin: Can get OS version from user agent and release the queue",
            useFakeTimers: true,
            test: () => {
                let config = this._config;
                let plugin = this._plugin;
                config.extensionConfig = this._config.extensionConfig || {};
                config.extensionConfig[this._plugin.identifier] = this._osConfig;
                this._core.initialize(config, [plugin, this._testChannelPlugin]);
                let event = this._createTestEvent();
                this._core.track(event);
                Assert.equal(this._channelSpy.called, false);
                Assert.equal(this._getDbgTargets().hasPendingTimeout, true);
                Assert.equal(this._getDbgTargets().queue.length, 1);
                Assert.equal(this._getDbgTargets().queue[0].item.name, event.name);
                this._resolveHighEntropy(_platformVersion);
                this.clock.tick(1);
                Assert.equal(this._getDbgTargets().queue.length, 0);
                Assert.equal(this._getDbgTargets().hasPendingTimeout, false);
                Assert.equal(this._channelSpy.called, true);
                let telemetry = this._channelSpy.getCall(0).args[0];
                console.log("telemetry", JSON.stringify(telemetry));
                Assert.deepEqual(telemetry.ext.os.name, _platformVersion.platform, "OS name should be set");
                Assert.deepEqual(telemetry.ext.os.ver, "11", "OS version should be set as string");
            }
        });

        this.testCase({
            name: "OsPlugin: Get reject from navigator, queue is released",
            useFakeTimers: true,
            test: () => {
                let config = this._config;
                let plugin = this._plugin;
                config.extensionConfig = this._config.extensionConfig || {};
                config.extensionConfig[this._plugin.identifier] = this._osConfig;
                this._core.initialize(config, [plugin, this._testChannelPlugin]);
                let event = this._createTestEvent();
                this._core.track(event);
                Assert.equal(this._channelSpy.called, false);
                Assert.equal(this._getDbgTargets().hasPendingTimeout, true);
                Assert.equal(this._getDbgTargets().queue.length, 1);
                Assert.equal(this._getDbgTargets().queue[0].item.name, event.name);
                this._rejectHighEntropy(new Error("error"));
                this.clock.tick(1);
                Assert.equal(this._getDbgTargets().queue.length, 0);
            }
        });

        this.testCase({
            name: "OsPlugin: Get OS version wait for too long, timeout will release the queue",
            useFakeTimers: true,
            test: () => {
                let config = this._config;
                let plugin = this._plugin;
                config.extensionConfig = this._config.extensionConfig || {};
                config.extensionConfig[this._plugin.identifier] = {
                    maxTimeout: 1000
                };
                this._core.initialize(config, [plugin, this._testChannelPlugin]);
                let event = this._createTestEvent();
                this._core.track(event);
                Assert.equal(this._channelSpy.called, false);
                Assert.equal(this._getDbgTargets().hasPendingTimeout, true);
                Assert.equal(this._getDbgTargets().queue.length, 1);
                Assert.equal(this._getDbgTargets().queue[0].item.name, event.name);
                this.clock.tick(500);
                Assert.equal(this._getDbgTargets().queue.length, 1);
                Assert.equal(this._getDbgTargets().hasPendingTimeout, true);
                this.clock.tick(500);
                Assert.equal(this._getDbgTargets().queue.length, 0);
                Assert.equal(this._getDbgTargets().hasPendingTimeout, false);
                Assert.equal(this._channelSpy.called, true);
                let telemetry = this._channelSpy.getCall(0).args[0];
                Assert.equal(JSON.stringify(telemetry).includes("osVer"), false, "timeout would not get os version");
            }
        });

        this.testCase({
            name: "OsPlugin: pagehide releases queued telemetry before timeout",
            useFakeTimers: true,
            test: () => {
                let config = this._config;
                config.extensionConfig = config.extensionConfig || {};
                config.extensionConfig[this._plugin.identifier] = this._osConfig;

                this._core.initialize(config, [this._plugin, this._testChannelPlugin]);

                let registeredEvents = this._getRegisteredUnloadState();

                Assert.ok(registeredEvents.unloadPresent, "unload listener should be registered while OS lookup is pending");
                Assert.ok(registeredEvents.pageHidePresent, "pagehide listener should be registered while OS lookup is pending");
                Assert.ok(registeredEvents.visibilityChangePresent, "visibilitychange listener should be registered while OS lookup is pending");

                let event = this._createTestEvent();
                this._core.track(event);
                Assert.equal(this._channelSpy.called, false, "event should remain queued before pagehide");
                Assert.equal(this._getDbgTargets().queue.length, 1, "one event should be queued");

                let window = getWindow();
                window.dispatchEvent(this._createPageHideEvent());

                Assert.equal(this._getDbgTargets().queue.length, 0, "queue should be released on pagehide");
                Assert.equal(this._channelSpy.called, true, "queued event should be sent on pagehide");
            }
        });

        this.testCase({
            name: "OsPlugin: event handlers are removed after getHighEntropyValues resolves",
            useFakeTimers: true,
            test: () => {
                let config = this._config;
                config.extensionConfig = config.extensionConfig || {};
                config.extensionConfig[this._plugin.identifier] = this._osConfig;

                this._core.initialize(config, [this._plugin, this._testChannelPlugin]);

                let registeredEvents = this._getRegisteredUnloadState();
                Assert.ok(registeredEvents.unloadPresent, "unload listener should be registered before OS lookup completes");
                Assert.ok(registeredEvents.pageHidePresent, "pagehide listener should be registered before OS lookup completes");
                Assert.ok(registeredEvents.visibilityChangePresent, "visibilitychange listener should be registered before OS lookup completes");

                this._core.track(this._createTestEvent());
                this._resolveHighEntropy(_platformVersion);
                this.clock.tick(1);

                registeredEvents = this._getRegisteredUnloadState();
                Assert.ok(!registeredEvents.unloadPresent, "unload listener should be removed after OS lookup completes");
                Assert.ok(!registeredEvents.pageHidePresent, "pagehide listener should be removed after OS lookup completes");
                Assert.ok(!registeredEvents.visibilityChangePresent, "visibilitychange listener should be removed after OS lookup completes");
            }
        });

        this.testCase({
            name: "OsPlugin: disableFlushOnUnload does not register unload listeners",
            useFakeTimers: true,
            test: () => {
                let config = this._config;
                config.disableFlushOnUnload = true;
                config.extensionConfig = config.extensionConfig || {};
                config.extensionConfig[this._plugin.identifier] = this._osConfig;

                this._core.initialize(config, [this._plugin, this._testChannelPlugin]);

                let registeredEvents = this._getRegisteredUnloadState();

                Assert.ok(!registeredEvents.unloadPresent, "unload listener should not be registered when disableFlushOnUnload is true");
                Assert.ok(!registeredEvents.pageHidePresent, "pagehide listener should not be registered when disableFlushOnUnload is true");
                Assert.ok(!registeredEvents.visibilityChangePresent, "visibilitychange listener should not be registered when disableFlushOnUnload is true");
                Assert.equal(this._getDbgTargets().hasPendingTimeout, true, "OS lookup should still start when unload flushing is disabled");
            }
        });

        this.testCase({
            name: "OsPlugin: If first telemetry didn't get the OS version, the following telemetry will not try again",
            useFakeTimers: true,
            test: () => {
                let config = this._config;
                let plugin = this._plugin;
                config.extensionConfig = this._config.extensionConfig || {};
                config.extensionConfig[this._plugin.identifier] = {
                    maxTimeout: 1000,
                    mergeOsNameVersion: false
                };
                this._core.initialize(config, [plugin, this._testChannelPlugin]);
                let event = this._createTestEvent();
                this._core.track(event);
                Assert.equal(this._channelSpy.called, false);
                Assert.equal(this._getDbgTargets().hasPendingTimeout, true);
                Assert.equal(this._getDbgTargets().queue.length, 1);
                Assert.equal(this._getDbgTargets().queue[0].item.name, event.name);
                this.clock.tick(1200);
                Assert.equal(this._getDbgTargets().queue.length, 0);
                Assert.equal(this._getDbgTargets().hasPendingTimeout, false);
                Assert.equal(this._channelSpy.called, true);
                let telemetry = this._channelSpy.getCall(0).args[0];
                Assert.equal(JSON.stringify(telemetry).includes("osVer"), false, "timeout would not get os version");

                // send another event
                this._core.track(event);
                Assert.equal(this._getDbgTargets().hasPendingTimeout, false);
                Assert.equal(this._getDbgTargets().queue.length, 0);
                this._resolveHighEntropy(_platformVersion);
                this.clock.tick(1);
                Assert.equal(this._getDbgTargets().queue.length, 0);
                Assert.equal(this._getDbgTargets().hasPendingTimeout, false);
                Assert.equal(this._channelSpy.called, true);
                telemetry = this._channelSpy.getCall(0).args[0];
                Assert.equal(JSON.stringify(telemetry).includes("osVer"), false, "second event should not attempt to get os version");
            }
        });

        this.testCase({
            name: "OsPlugin: cached OS is used immediately during initialize",
            useFakeTimers: true,
            test: () => {
                let window = getWindow();
                let sessionStorage = window.sessionStorage;
                sessionStorage.setItem("ai_osplugin", JSON.stringify({ platform: "Android", platformVersion: 14 }));

                let config = this._config;
                config.extensionConfig = config.extensionConfig || {};
                config.extensionConfig[this._plugin.identifier] = {
                    maxTimeout: 1000,
                    mergeOsNameVersion: false
                };

                this._core.initialize(config, [this._plugin, this._testChannelPlugin]);

                let registeredEvents = this._getRegisteredUnloadState();
                Assert.ok(!registeredEvents.unloadPresent, "cached OS should not register unload listeners");
                Assert.ok(!registeredEvents.pageHidePresent, "cached OS should not register pagehide listeners");
                Assert.ok(!registeredEvents.visibilityChangePresent, "cached OS should not register visibilitychange listeners");

                let dbgTargets = this._getDbgTargets();
                Assert.equal(dbgTargets.hasPendingTimeout, false, "cached OS should avoid startup lookup");
                Assert.deepEqual(dbgTargets.osState.platform, "Android", "cached platform should be loaded");
                Assert.deepEqual(dbgTargets.osState.platformVersion, 14, "cached platform version should be loaded");

                this._core.track(this._createTestEvent());

                Assert.equal(this._channelSpy.called, true, "event should be sent immediately from cached OS");
                let telemetry = this._channelSpy.getCall(0).args[0];
                Assert.deepEqual(telemetry.ext.os.name, "Android", "cached OS name should be applied to telemetry");
                Assert.deepEqual(telemetry.ext.os.ver, "14", "cached OS version should be applied as string");
            }
        });

        this.testCase({
            name: "OsPlugin: storage disabled ignores cached OS and does not overwrite session storage",
            useFakeTimers: true,
            test: () => {
                let window = getWindow();
                let sessionStorage = window.sessionStorage;
                sessionStorage.setItem("ai_osplugin", JSON.stringify({ platform: "CachedOS", platformVersion: 99 }));

                let config = this._config;
                config.isStorageUseDisabled = true;
                config.extensionConfig = config.extensionConfig || {};
                config.extensionConfig[this._plugin.identifier] = {
                    maxTimeout: 1000,
                    mergeOsNameVersion: false
                };

                this._core.initialize(config, [this._plugin, this._testChannelPlugin]);
                this._core.track(this._createTestEvent());

                Assert.equal(this._channelSpy.called, false, "cached OS should not be used when storage is disabled");
                Assert.equal(this._getDbgTargets().hasPendingTimeout, true, "OS lookup should still start when storage is disabled");
                Assert.equal(this._getDbgTargets().queue.length, 1, "event should remain queued until lookup resolves");

                this._resolveHighEntropy(_platformVersion);
                this.clock.tick(1);

                Assert.equal(this._channelSpy.called, true, "queued event should be released after lookup resolves");
                let telemetry = this._channelSpy.getCall(0).args[0];
                Assert.deepEqual(telemetry.ext.os.name, _platformVersion.platform, "navigator OS name should be applied");
                Assert.deepEqual(telemetry.ext.os.ver, "11", "navigator OS version should be applied as string");
                Assert.equal(sessionStorage.getItem("ai_osplugin"), JSON.stringify({ platform: "CachedOS", platformVersion: 99 }), "storage-disabled mode should not overwrite session storage");
            }
        });

        this.testCase({
            name: "OsPlugin: If first telemetryget the OS version, the following telemetry do not need to try again",
            useFakeTimers: true,
            test: () => {
                let window = getWindow();
                let sessionStorage = window.sessionStorage;
                QUnit.assert.ok(sessionStorage, "sessionStorage API is supported");
                sessionStorage.clear();
                let config = this._config;
                let plugin = this._plugin;
                config.extensionConfig = this._config.extensionConfig || {};
                config.extensionConfig[this._plugin.identifier] = {
                    maxTimeout: 1000,
                    mergeOsNameVersion: false
                };
                this._core.initialize(config, [plugin, this._testChannelPlugin]);
                let event = this._createTestEvent();
                this._core.track(event);
                Assert.equal(this._channelSpy.called, false);
                Assert.equal(this._getDbgTargets().hasPendingTimeout, true);
                Assert.equal(this._getDbgTargets().queue.length, 1);
                Assert.equal(this._getDbgTargets().queue[0].item.name, event.name);
                this._resolveHighEntropy(_platformVersion);
                this.clock.tick(1);
                Assert.equal(this._getDbgTargets().queue.length, 0);
                Assert.equal(this._getDbgTargets().hasPendingTimeout, false);
                Assert.equal(this._channelSpy.called, true);
                let telemetry = this._channelSpy.getCall(0).args[0];
                Assert.deepEqual(telemetry.ext.os.name, _platformVersion.platform, "OS name should be set");
                Assert.deepEqual(telemetry.ext.os.ver, "11", "OS version should be set as string");
                let storedOs = JSON.parse(sessionStorage.getItem("ai_osplugin") || "{}");
                QUnit.assert.equal(storedOs.platform, _platformVersion.platform, "os is stored in session storage");
                QUnit.assert.equal(storedOs.platformVersion, 11, "os ver is stored in session storage");
                // send another event
                this._core.track(event);
                Assert.equal(this._getDbgTargets().hasPendingTimeout, false);
                Assert.equal(this._getDbgTargets().queue.length, 0);
                Assert.equal(this._channelSpy.called, true);
                telemetry = this._channelSpy.getCall(0).args[0];
                Assert.deepEqual(telemetry.ext.os.name, _platformVersion.platform, "OS name should be set");
                Assert.deepEqual(telemetry.ext.os.ver, "11", "OS version should be set as string");
            }
        });

        this.testCase({
            name: "OsPlugin: test merged version",
            useFakeTimers: true,
            test: () => {
                let window = getWindow();
                let sessionStorage = window.sessionStorage;
                QUnit.assert.ok(sessionStorage, "sessionStorage API is supported");
                sessionStorage.clear();
                let config = this._config;
                let plugin = this._plugin;
                config.extensionConfig = this._config.extensionConfig || {};
                config.extensionConfig[this._plugin.identifier] = {
                    maxTimeout: 1000,
                    mergeOsNameVersion: true
                };
                this._core.initialize(config, [plugin, this._testChannelPlugin]);
                let event = this._createTestEvent();
                this._core.track(event);
                Assert.equal(this._channelSpy.called, false);
                Assert.equal(this._getDbgTargets().hasPendingTimeout, true);
                Assert.equal(this._getDbgTargets().queue.length, 1);
                Assert.equal(this._getDbgTargets().queue[0].item.name, event.name);
                this._resolveHighEntropy(_platformVersion);
                this.clock.tick(1);
                Assert.equal(this._getDbgTargets().queue.length, 0);
                Assert.equal(this._getDbgTargets().hasPendingTimeout, false);
                Assert.equal(this._channelSpy.called, true);
                let telemetry = this._channelSpy.getCall(0).args[0];
                Assert.deepEqual(telemetry.ext.os.osVer, "Windows11", "windows 11 is detected");
                let storedOs = JSON.parse(sessionStorage.getItem("ai_osplugin") || "{}");
                QUnit.assert.equal(storedOs.platform, _platformVersion.platform, "os is stored in session storage");
                QUnit.assert.equal(storedOs.platformVersion, 11, "os ver is stored in session storage");
                // send another event
                this._core.track(event);
                Assert.equal(this._getDbgTargets().hasPendingTimeout, false);
                Assert.equal(this._getDbgTargets().queue.length, 0);
                Assert.equal(this._channelSpy.called, true);
                telemetry = this._channelSpy.getCall(0).args[0];
                Assert.equal(JSON.stringify(telemetry).includes("osVer"), true, "before timeout, get os version");
                Assert.deepEqual(telemetry.ext.os.osVer, "Windows11", "windows 11 is detected");
            }
        });
    }
}

class TestChannelPlugin implements IChannelControls {

    public isFlushInvoked = false;
    public isUnloadInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;

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

    public processTelemetry;

    public identifier = "Sender";

    setNextPlugin(next: ITelemetryPlugin) {
        // no next setup
    }

    public priority: number = 1001;

    public initialize = (config: IConfiguration) => {
    }

    private _processTelemetry(env: ITelemetryItem) {
    }
}
