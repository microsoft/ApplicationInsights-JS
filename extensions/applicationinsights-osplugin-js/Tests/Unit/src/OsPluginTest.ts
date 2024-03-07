/**
 * @copyright Microsoft 2024
 */

import { Assert, AITestClass } from '@microsoft/ai-test-framework';
import { IOSPluginConfiguration, OsPlugin } from '../../../src/applicationinsights-osplugin-js';
import { 
    IExtendedConfiguration, AppInsightsCore, IChannelControls, ITelemetryItem, __getRegisteredEvents, 
    _IRegisteredEvents, blockDynamicConversion
} from '@microsoft/1ds-core-js';
import { createAsyncPromise, ResolvePromiseHandler, RejectPromiseHandler } from "@nevware21/ts-async";

const defaultgetOSTimeoutMs = 5000;
const _platformVersion =  {"brands":[{"brand":"Chromium","version":"122"}, 
{"brand":"Microsoft Edge","version":"122"}],"mobile":false,"platform":"Windows",
"platformVersion":"15.0.0"}
interface CustomNavigator extends Navigator {
    userAgentData?: {
        getHighEntropyValues?: (args: any[]) => Promise<any>;
    };
}

export class OsPluginTest extends AITestClass {

    private _config: IExtendedConfiguration;
    private _plugin: OsPlugin;
    private _core: AppInsightsCore;
    private _channelExtension: IChannelControls;
    private _osConfig: IOSPluginConfiguration = {
        getOSTimeoutMs: 6000 // set a big number to avoid timeout for test
    };

    private _resolvedGetHighEntrophyPromise: ResolvePromiseHandler<any> | undefined;
    private _rejectedGetHighEntrophyPromise: RejectPromiseHandler | undefined;

    public testInitialize() {
        this._core = new AppInsightsCore();
        this._plugin = new OsPlugin();
        this._config = {
            instrumentationKey: 'testIkey',
            endpointUrl: 'testEndpoint',
            extensionConfig: []
        };

        let navigator = {
            userAgentData: {
                getHighEntropyValues: (args) => {
                    return createAsyncPromise((resolve, reject) => {
                        this._resolvedGetHighEntrophyPromise = resolve;
                        this._rejectedGetHighEntrophyPromise = reject;
                    });
                }
            }
        } as CustomNavigator;

        this.setNavigator(navigator, true);
        this._channelExtension = blockDynamicConversion({
            pause: () => { },
            resume: () => { },
            teardown: () => { },
            flush: (async: any, callBack: any) => { },
            processTelemetry: (env: any) => { },
            setNextPlugin: (next: any) => { },
            initialize: (config: any, core: any, extensions: any) => { },
            identifier: "testChannel",
            priority: 1003
        });
    }

    public testFinishedCleanup(): void {
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
                this._core.initialize(config, [plugin, this._channelExtension]);
                this.clock.tick(100);
                Assert.deepEqual(this._osConfig.getOSTimeoutMs, this._core.config.extensionConfig[this._plugin.identifier].getOSTimeoutMs, "getOSTimeoutMs should be changed");
            }
        });

        this.testCase({
            name: "OsPlugin: Events will be queued if OS is not available and will be sent after timeout",
            useFakeTimers: true,
            test: () => {
                let config = this._config;
                let plugin = this._plugin;
                config.extensionConfig = this._config.extensionConfig || {};
                this._core.initialize(config, [plugin, this._channelExtension]);
                let channelSpy = this.sandbox.spy(this._channelExtension, 'processTelemetry');
                let event = {
                    name: 'testEvent',
                    baseType: 'testBaseType',
                    baseData: {}
                };
                this._core.track(event);
                Assert.equal(channelSpy.called, false);
                Assert.equal(this._plugin['_getOSInProgress'], true);
                Assert.equal(this._plugin['_eventQueue'].length, 1);
                Assert.equal(this._plugin['_eventQueue'][0].item.name, event.name);
                this.clock.tick(defaultgetOSTimeoutMs);
                Assert.equal(this._plugin['_eventQueue'].length, 0);
                Assert.equal(channelSpy.called, true);
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
                this._core.initialize(config, [plugin, this._channelExtension]);
                let channelSpy = this.sandbox.spy(this._channelExtension, 'processTelemetry');
                let event = {
                    name: 'testEvent',
                    baseType: 'testBaseType',
                    baseData: {}
                };
                this._core.track(event);
                Assert.equal(channelSpy.called, false);
                Assert.equal(this._plugin['_getOSInProgress'], true);
                Assert.equal(this._plugin['_eventQueue'].length, 1);
                Assert.equal(this._plugin['_eventQueue'][0].item.name, event.name);
                this._resolvedGetHighEntrophyPromise({ platformVersion: _platformVersion });
                this.clock.tick(1);
                Assert.equal(this._plugin['_eventQueue'].length, 0);
                Assert.equal(this._plugin['_getOSInProgress'], false);
                Assert.equal(channelSpy.called, true);
                let telemetry = channelSpy.getCall(0).args[0];
                console.log("telemetry: ", JSON.stringify(telemetry));
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
                this._core.initialize(config, [plugin, this._channelExtension]);
                let channelSpy = this.sandbox.spy(this._channelExtension, 'processTelemetry');
                let event = {
                    name: 'testEvent',
                    baseType: 'testBaseType',
                    baseData: {}
                };
                this._core.track(event);
                Assert.equal(channelSpy.called, false);
                Assert.equal(this._plugin['_getOSInProgress'], true);
                Assert.equal(this._plugin['_eventQueue'].length, 1);
                Assert.equal(this._plugin['_eventQueue'][0].item.name, event.name);
                this._rejectedGetHighEntrophyPromise(new Error("error"));
                this.clock.tick(1);
                Assert.equal(this._plugin['_eventQueue'].length, 0);
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
                    getOSTimeoutMs: 1000
                };;
                this._core.initialize(config, [plugin, this._channelExtension]);
                let channelSpy = this.sandbox.spy(this._channelExtension, 'processTelemetry');
                let event = {
                    name: 'testEvent',
                    baseType: 'testBaseType',
                    baseData: {}
                };
                this._core.track(event);
                Assert.equal(channelSpy.called, false);
                Assert.equal(this._plugin['_getOSInProgress'], true);
                Assert.equal(this._plugin['_eventQueue'].length, 1);
                Assert.equal(this._plugin['_eventQueue'][0].item.name, event.name);
                this.clock.tick(500);
                Assert.equal(this._plugin['_eventQueue'].length, 1);
                Assert.equal(this._plugin['_getOSInProgress'], true);
                this.clock.tick(500);
                Assert.equal(this._plugin['_eventQueue'].length, 0);
                Assert.equal(this._plugin['_getOSInProgress'], false);
                Assert.equal(channelSpy.called, true);
                let telemetry = channelSpy.getCall(0).args[0];
                console.log("telemetry: ", JSON.stringify(telemetry));
                Assert.equal(JSON.stringify(telemetry).includes("osVer"), false, "timeout would not get os version");
            }
        });

        this.testCase({
            name: "OsPlugin: If first telemetry didn't get the OS version, the following telemetry will try again",
            useFakeTimers: true,
            test: () => {
                let config = this._config;
                let plugin = this._plugin;
                config.extensionConfig = this._config.extensionConfig || {};
                config.extensionConfig[this._plugin.identifier] = {
                    getOSTimeoutMs: 1000
                };;
                this._core.initialize(config, [plugin, this._channelExtension]);
                let channelSpy = this.sandbox.spy(this._channelExtension, 'processTelemetry');
                let event = {
                    name: 'testEvent',
                    baseType: 'testBaseType',
                    baseData: {}
                };
                this._core.track(event);
                Assert.equal(channelSpy.called, false);
                Assert.equal(this._plugin['_getOSInProgress'], true);
                Assert.equal(this._plugin['_eventQueue'].length, 1);
                Assert.equal(this._plugin['_eventQueue'][0].item.name, event.name);
                this.clock.tick(1200);
                Assert.equal(this._plugin['_eventQueue'].length, 0);
                Assert.equal(this._plugin['_getOSInProgress'], false);
                Assert.equal(channelSpy.called, true);
                let telemetry = channelSpy.getCall(0).args[0];
                console.log("telemetry: ", JSON.stringify(telemetry));
                Assert.equal(JSON.stringify(telemetry).includes("osVer"), false, "timeout would not get os version");

                // send another event
                this._core.track(event);
                Assert.equal(this._plugin['_getOSInProgress'], true);
                Assert.equal(this._plugin['_eventQueue'].length, 1);
                this._resolvedGetHighEntrophyPromise({ platformVersion: _platformVersion });
                this.clock.tick(1);
                Assert.equal(this._plugin['_eventQueue'].length, 0);
                Assert.equal(this._plugin['_getOSInProgress'], false);
                Assert.equal(channelSpy.called, true);
                telemetry = channelSpy.getCall(0).args[0];
                console.log("telemetry: ", JSON.stringify(telemetry));
                Assert.equal(JSON.stringify(telemetry).includes("osVer"), true, "before timeout, get os version");
                Assert.deepEqual(telemetry.ext.os, _platformVersion.platform, "OS should be changed");
                Assert.deepEqual(telemetry.ext.osVer, 11, "windows 11 is detected");
            }
        });
    }
}
