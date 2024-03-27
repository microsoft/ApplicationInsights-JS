/**
 * @copyright Microsoft 2024
 */

import { Assert, AITestClass } from '@microsoft/ai-test-framework';
import { IOSPluginConfiguration, OsPlugin } from '../../../src/applicationinsights-osplugin-js';
import { createAsyncPromise, ResolvePromiseHandler, RejectPromiseHandler } from "@nevware21/ts-async";
import {getWindow, AppInsightsCore, IChannelControls, ITelemetryPlugin,
    IConfiguration, ITelemetryItem} from "@microsoft/applicationinsights-core-js";

const defaultmaxTimeout = 5000;
const _platformVersion =  {"brands":[{"brand":"Chromium","version":"122"}, 
{"brand":"Microsoft Edge","version":"122"}],"mobile":false,"platform":"Windows",
"platformVersion":"15.0.0"}
interface CustomNavigator extends Navigator {
    userAgentData?: {
        getHighEntropyValues?: (args: any[]) => Promise<any>;
    };
}

export class OsPluginTest extends AITestClass {

    private _config;
    private _plugin: OsPlugin;
    private _core: AppInsightsCore;
    private _channelExtension: IChannelControls;
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
                Assert.deepEqual(this._osConfig.maxTimeout, this._core.config.extensionConfig[this._plugin.identifier].maxTimeout, "maxTimeout should be changed");
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
                let event = {
                    name: 'testEvent',
                    baseType: 'testBaseType',
                    baseData: {}
                };
                this._core.track(event);
                Assert.equal(this._channelSpy.called, false);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[2], true);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1].length, 1);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1][0].item.name, event.name);
                this.clock.tick(defaultmaxTimeout);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1].length, 0);
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
                let event = {
                    name: 'testEvent',
                    baseType: 'testBaseType',
                    baseData: {}
                };
                this._core.track(event);
                Assert.equal(this._channelSpy.called, false);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[2], true);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1].length, 1);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1][0].item.name, event.name);
                this._resolvedGetHighEntrophyPromise(_platformVersion);
                this.clock.tick(1);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1].length, 0);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[2], false);
                Assert.equal(this._channelSpy.called, true);
                let telemetry = this._channelSpy.getCall(0).args[0];
                Assert.equal(JSON.stringify(telemetry).includes("osVer"), true, "before timeout, get os version");
                Assert.deepEqual(telemetry.ext.os, _platformVersion.platform, "OS should be changed");
                Assert.deepEqual(telemetry.ext.osVer, 11, "windows 11 is detected");
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
                let event = {
                    name: 'testEvent',
                    baseType: 'testBaseType',
                    baseData: {}
                };
                this._core.track(event);
                Assert.equal(this._channelSpy.called, false);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[2], true);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1].length, 1);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1][0].item.name, event.name);
                this._rejectedGetHighEntrophyPromise(new Error("error"));
                this.clock.tick(1);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1].length, 0);
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
                };;
                this._core.initialize(config, [plugin, this._testChannelPlugin]);
                let event = {
                    name: 'testEvent',
                    baseType: 'testBaseType',
                    baseData: {}
                };
                this._core.track(event);
                Assert.equal(this._channelSpy.called, false);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[2], true);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1].length, 1);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1][0].item.name, event.name);
                this.clock.tick(500);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1].length, 1);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[2], true);
                this.clock.tick(500);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1].length, 0);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[2], false);
                Assert.equal(this._channelSpy.called, true);
                let telemetry = this._channelSpy.getCall(0).args[0];
                Assert.equal(JSON.stringify(telemetry).includes("osVer"), false, "timeout would not get os version");
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
                };;
                this._core.initialize(config, [plugin, this._testChannelPlugin]);
                let event = {
                    name: 'testEvent',
                    baseType: 'testBaseType',
                    baseData: {}
                };
                this._core.track(event);
                Assert.equal(this._channelSpy.called, false);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[2], true);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1].length, 1);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1][0].item.name, event.name);
                this.clock.tick(1200);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1].length, 0);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[2], false);
                Assert.equal(this._channelSpy.called, true);
                let telemetry = this._channelSpy.getCall(0).args[0];
                Assert.equal(JSON.stringify(telemetry).includes("osVer"), false, "timeout would not get os version");

                // send another event
                this._core.track(event);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[2], false);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1].length, 0);
                this._resolvedGetHighEntrophyPromise(_platformVersion);
                this.clock.tick(1);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1].length, 0);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[2], false);
                Assert.equal(this._channelSpy.called, true);
                telemetry = this._channelSpy.getCall(0).args[0];
                Assert.equal(JSON.stringify(telemetry).includes("osVer"), false, "second event should not attempt to get os version");
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
                let event = {
                    name: 'testEvent',
                    baseType: 'testBaseType',
                    baseData: {}
                };
                this._core.track(event);
                Assert.equal(this._channelSpy.called, false);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[2], true);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1].length, 1);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1][0].item.name, event.name);
                this._resolvedGetHighEntrophyPromise(_platformVersion);
                this.clock.tick(1);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1].length, 0);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[2], false);
                Assert.equal(this._channelSpy.called, true);
                let telemetry = this._channelSpy.getCall(0).args[0];
                Assert.deepEqual(telemetry.ext.os, _platformVersion.platform, "OS should be changed");
                Assert.deepEqual(telemetry.ext.osVer, 11, "windows 11 is detected");
                let storedOs = JSON.parse(sessionStorage.getItem("ai_osplugin"));
                QUnit.assert.equal(storedOs.platform, _platformVersion.platform, "os is stored in session storage");
                QUnit.assert.equal(storedOs.platformVersion, 11, "os ver is stored in session storage");
                // send another event
                this._core.track(event);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[2], false);
                Assert.equal(this._plugin["_getDbgPlgTargets"]()[1].length, 0);
                Assert.equal(this._channelSpy.called, true);
                telemetry = this._channelSpy.getCall(0).args[0];
                Assert.equal(JSON.stringify(telemetry).includes("osVer"), true, "before timeout, get os version");
                Assert.deepEqual(telemetry.ext.os, _platformVersion.platform, "OS should be changed");
                Assert.deepEqual(telemetry.ext.osVer, 11, "Windows 11 is detected");
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
