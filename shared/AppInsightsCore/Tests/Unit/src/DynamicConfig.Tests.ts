import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { _eInternalMessageId } from "../../../src/JavaScriptSDK.Enums/LoggingEnums";
import { _InternalLogMessage } from "../../../src/JavaScriptSDK/DiagnosticLogger";
import { IConfigDefaults } from "../../../src/Config/IConfigDefaults";
import { IConfiguration } from "../../../src/JavaScriptSDK.Interfaces/IConfiguration";
import { getDynamicConfigHandler } from "../../../src/Config/DynamicSupport";
import { createDynamicConfig, onConfigChange } from "../../../src/Config/DynamicConfig";
import { arrForEach, dumpObj, isArray, isFunction, objForEachKey, objKeys, isPlainObject } from "@nevware21/ts-utils";
import { IAppInsightsCore } from "../../../src/JavaScriptSDK.Interfaces/IAppInsightsCore";
import { INotificationManager } from "../../../src/JavaScriptSDK.Interfaces/INotificationManager";
import { IPerfManager } from "../../../src/JavaScriptSDK.Interfaces/IPerfManager";
import { AppInsightsCore, setEnableEnvMocks } from "../../../src/applicationinsights-core-js";
import { ITelemetryItem } from "../../../src/JavaScriptSDK.Interfaces/ITelemetryItem";
import { ITelemetryPluginChain } from "../../../src/JavaScriptSDK.Interfaces/ITelemetryPluginChain";
import { ITelemetryPlugin } from "../../../src/JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { IChannelControls } from "../../../src/JavaScriptSDK.Interfaces/IChannelControls";

type NoRepeats<T extends readonly any[]> = { [M in keyof T]: { [N in keyof T]:
    N extends M ? never : T[M] extends T[N] ? unknown : never
}[number] extends never ? T[M] : never }

const verifyArray = <T>() => <U extends NoRepeats<U> & readonly T[]>(
    u: (U | [never]) & ([T] extends [U[number]] ? unknown : never)
) => u;

export class DynamicConfigTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "Create Dynamic Config - not in place",
            test: () => {
                let theConfig: IConfiguration = {
                    instrumentationKey: "testiKey",
                    extensionConfig: {},
                    extensions: [],
                    createPerfMgr: createPerfMgr
                };

                const theDefaults: IConfigDefaults<IConfiguration> = {
                    endpointUrl: "https://localhost:9001"
                };

                let dynamicHandler = createDynamicConfig(theConfig, theDefaults, null, false);
                let dynamicConfig = dynamicHandler.cfg;

                Assert.equal(dynamicHandler, getDynamicConfigHandler(dynamicConfig), "The dynamic handler is returned when using the config to find it");
                Assert.equal(dynamicHandler, getDynamicConfigHandler(dynamicHandler), "The dynamic handler is returned when using itself to find it");
                Assert.ok(!!dynamicHandler, "The config should have a dynamic config handler");
                Assert.notEqual(dynamicConfig, theConfig, "The object should have been applied in-place");
                Assert.notEqual(dynamicHandler.cfg, theConfig, "The handler should point to the config");

                objForEachKey(theConfig, (key, value) => {
                    Assert.ok(!getDynamicConfigHandler(value), "The original value for \"" + key + "\" should not be dynamic - " + dumpObj(value));
                    let newValue = dynamicConfig[key];
                    assertSameValues(value, newValue, "Check that the resulting property is the same - " + dumpObj(newValue));
                });

                objForEachKey(theDefaults, (key, value) => {
                    Assert.ok(!getDynamicConfigHandler(value), "The original default value for " + key + " should not be dynamic - " + dumpObj(value));
                    let newValue = dynamicConfig[key];
                    assertSameValues(value, newValue, "Check that the resulting property is the same");
                });

                Assert.equal("testiKey", dynamicConfig.instrumentationKey, "Expect the iKey to be set");
                Assert.equal("https://localhost:9001", dynamicConfig.endpointUrl, "Expect the endpoint to be set");

                dynamicConfig.instrumentationKey = "newIkey";
                Assert.equal("newIkey", dynamicConfig.instrumentationKey, "Expect the iKey to be changed");
                Assert.equal("https://localhost:9001", dynamicConfig.endpointUrl, "Expect the endpoint to be set");

                dynamicConfig.endpointUrl = "https://newendpoint.localhost:9001";
                Assert.equal("newIkey", dynamicConfig.instrumentationKey, "Expect the iKey to be changed");
                Assert.equal("https://newendpoint.localhost:9001", dynamicConfig.endpointUrl, "Expect the endpoint to be changed");
            }
        });

        this.testCase({
            name: "Create Dynamic Config - in place (default)",
            test: () => {
                let theConfig: IConfiguration = {
                    instrumentationKey: "testiKey",
                    extensionConfig: {},
                    extensions: [],
                    createPerfMgr: createPerfMgr
                };

                const theDefaults: IConfigDefaults<IConfiguration> = {
                    endpointUrl: "https://localhost:9001",
                    cookieCfg: {
                        enabled: undefined,
                        domain: "test",
                        path: "/mypath"
                    }
                };

                let dynamicHandler = createDynamicConfig(theConfig, theDefaults);
                let dynamicConfig = dynamicHandler.cfg;

                Assert.equal(dynamicHandler, getDynamicConfigHandler(dynamicConfig), "The dynamic handler be returned when using the config to find it");
                Assert.equal(dynamicHandler, getDynamicConfigHandler(dynamicHandler), "The dynamic handler be returned when using itself to find it");

                Assert.ok(!!dynamicHandler, "The config should have a dynamic config handler");
                Assert.equal(dynamicConfig, theConfig, "The object should have been applied in-place");
                Assert.equal(dynamicHandler?.cfg, theConfig, "The handler should point to the config");

                objForEachKey(theConfig, (key, value) => {
                    if (isFunction(value)) {
                        // functions should not have a handler
                        Assert.ok(!getDynamicConfigHandler(value), "The original value for \"" + key + "\" should not be dynamic - " + dumpObj(value));
                    } else if (isPlainObject(value) || isArray(value)) {
                        Assert.ok(getDynamicConfigHandler(value), "The original value for \"" + key + "\" should dynamic - " + dumpObj(value));
                    } else {
                        // non-objects don't have a handler
                        Assert.ok(!getDynamicConfigHandler(value), "The original value for \"" + key + "\" should not be dynamic - " + dumpObj(value));
                    }

                    let newValue = dynamicConfig[key];
                    Assert.strictEqual(value, newValue, "Check that the resulting property is the same strict value - " + dumpObj(newValue));
                    assertSameValues(value, newValue, "Check that the resulting property is the same - " + dumpObj(newValue));
                });

                objForEachKey(theDefaults, (key, value) => {
                    Assert.ok(!getDynamicConfigHandler(value), "The original default value for " + key + " should never be dynamic - " + dumpObj(value));
                    let newValue = dynamicConfig[key];
                    assertSameValues(value, newValue, "Check that the resulting property is the same");
                });

                Assert.equal("testiKey", theConfig.instrumentationKey, "Expect the iKey to be set");
                Assert.equal("https://localhost:9001", theConfig.endpointUrl, "Expect the endpoint to be set");

                theConfig.instrumentationKey = "newIkey";
                Assert.equal("newIkey", theConfig.instrumentationKey, "Expect the iKey to be changed");
                Assert.equal("https://localhost:9001", theConfig.endpointUrl, "Expect the endpoint to be set");

                theConfig.endpointUrl = "https://newendpoint.localhost:9001";
                Assert.equal("newIkey", theConfig.instrumentationKey, "Expect the iKey to be changed");
                Assert.equal("https://newendpoint.localhost:9001", theConfig.endpointUrl, "Expect the endpoint to be changed");
            }
        });

        this.testCase({
            name: "Apply Defaults",
            test: () => {
                let theConfig: IConfiguration = {
                    instrumentationKey: "testiKey",
                    extensionConfig: []
                };

                const theDefaults: IConfigDefaults<IConfiguration> = {
                    endpointUrl: "https://localhost:9001"
                };

                // Creates a dynamic config as a side-effect
                let dynamicConfig = createDynamicConfig(theConfig, theDefaults).cfg;

                // default values should never be changed to dynamic
                objForEachKey(theDefaults, (key, value) => {
                    Assert.ok(!getDynamicConfigHandler(value), "The original default value for " + key + " should never be dynamic - " + dumpObj(value));
                    let newValue = dynamicConfig[key];
                    if (isPlainObject(value) || isArray(value)) {
                        Assert.notStrictEqual(value, newValue, "The default value should have been copied to just assigned");
                    }
                    assertSameValues(value, newValue, "Check that the resulting property is the same");
                });

                let dynamicHandler = getDynamicConfigHandler(dynamicConfig);
                Assert.ok(!!dynamicHandler, "The config should have a dynamic config handler");
                Assert.equal(dynamicConfig, theConfig, "The object should have been applied in-place");
                Assert.equal(dynamicHandler?.cfg, theConfig, "The handler should point to the config");

                Assert.equal("testiKey", theConfig.instrumentationKey, "Expect the iKey to be set");
                Assert.equal("https://localhost:9001", theConfig.endpointUrl, "Expect the endpoint to be set");

                theConfig.instrumentationKey = "newIkey";
                Assert.equal("newIkey", theConfig.instrumentationKey, "Expect the iKey to be changed");
                Assert.equal("https://localhost:9001", theConfig.endpointUrl, "Expect the endpoint to be set");

                theConfig.endpointUrl = "https://newendpoint.localhost:9001";
                Assert.equal("newIkey", theConfig.instrumentationKey, "Expect the iKey to be changed");
                Assert.equal("https://newendpoint.localhost:9001", theConfig.endpointUrl, "Expect the endpoint to be changed");
            }
        });

        this.testCase({
            name: "onConfigChange called when changed",
            test: () => {
                let theConfig: IConfiguration = {
                    instrumentationKey: "testiKey"
                };

                const theDefaults: IConfigDefaults<IConfiguration> = {
                    endpointUrl: "https://localhost:9001"
                };

                let dynamicHandler = createDynamicConfig(theConfig, theDefaults);
                let dynamicConfig = dynamicHandler.cfg;
                Assert.ok(!!dynamicHandler, "The config should have a dynamic config handler");
                Assert.equal(dynamicConfig, theConfig, "The object should have been applied in-place");
                Assert.equal(dynamicHandler?.cfg, theConfig, "The handler should point to the config");

                let expectediKey = "testiKey";
                let expectedEndpointUrl = "https://localhost:9001";
                let onChangeCalled = 0;
                let onChange = onConfigChange(dynamicConfig, (details) => {
                    onChangeCalled ++;
                    Assert.equal(theConfig, details.cfg, "The original config and the details cfg should be the same");
                    Assert.equal(expectediKey, details.cfg.instrumentationKey, "Expect the iKey to be set");
                    Assert.equal(expectedEndpointUrl, details.cfg.endpointUrl, "Expect the endpoint to be set");
                });

                Assert.equal(1, onChangeCalled, "Expected the onChanged was called");

                expectediKey = "newIKey";
                theConfig.instrumentationKey = expectediKey;

                Assert.equal(1, onChangeCalled, "Expected the onChanged was called");
                dynamicHandler?.notify();
                Assert.equal(2, onChangeCalled, "Expected the onChanged was called again");

                expectedEndpointUrl = "https://newendpoint.localhost:9001";
                theConfig.endpointUrl = expectedEndpointUrl;

                Assert.equal(2, onChangeCalled, "Expected the onChanged was called");
                dynamicHandler?.notify();
                Assert.equal(3, onChangeCalled, "Expected the onChanged was called again");
                Assert.equal("newIKey", theConfig.instrumentationKey, "Expect the iKey to be changed");
                Assert.equal("https://newendpoint.localhost:9001", theConfig.endpointUrl, "Expect the endpoint to be changed");
            }
        });

        this.testCase({
            name: "onConfigChange only called once even when multiple configs referenced",
            test: () => {
                let theConfig: IConfiguration = {
                    instrumentationKey: "testiKey"
                };

                const theDefaults: IConfigDefaults<IConfiguration> = {
                    endpointUrl: "https://localhost:9001"
                };

                let dynamicHandler = createDynamicConfig(theConfig, theDefaults);
                let dynamicConfig = dynamicHandler.cfg;
                Assert.ok(!!dynamicHandler, "The config should have a dynamic config handler");
                Assert.equal(dynamicConfig, theConfig, "The object should have been applied in-place");
                Assert.equal(dynamicHandler?.cfg, theConfig, "The handler should point to the config");

                let expectediKey = "testiKey";
                let expectedEndpointUrl = "https://localhost:9001";
                let onChangeCalled = 0;
                let onChange = onConfigChange(dynamicConfig, (details) => {
                    onChangeCalled ++;
                    Assert.equal(theConfig, details.cfg, "The original config and the details cfg should be the same");
                    Assert.equal(expectediKey, details.cfg.instrumentationKey, "Expect the iKey to be set");
                    Assert.equal(expectedEndpointUrl, details.cfg.endpointUrl, "Expect the endpoint to be set");
                });

                Assert.equal(1, onChangeCalled, "Expected the onChanged was called");

                expectediKey = "newIKey";
                theConfig.instrumentationKey = expectediKey;

                expectedEndpointUrl = "https://newendpoint.localhost:9001";
                theConfig.endpointUrl = expectedEndpointUrl;

                Assert.equal(1, onChangeCalled, "Expected the onChanged was only called once");
                dynamicHandler?.notify();

                Assert.equal(2, onChangeCalled, "Expected the onChanged to have not been called once the 1 additional time");
                dynamicHandler?.notify();
                Assert.equal(2, onChangeCalled, "Expected the onChanged was not called again");
                Assert.equal("newIKey", theConfig.instrumentationKey, "Expect the iKey to be changed");
                Assert.equal("https://newendpoint.localhost:9001", theConfig.endpointUrl, "Expect the endpoint to be changed");
            }
        });

        this.testCase({
            name: "onConfigChange removal",
            test: () => {
                let theConfig: IConfiguration = {
                    instrumentationKey: "testiKey"
                };

                const theDefaults: IConfigDefaults<IConfiguration> = {
                    endpointUrl: "https://localhost:9001"
                };

                let dynamicConfig = createDynamicConfig(theConfig, theDefaults).cfg;
                let dynamicHandler = getDynamicConfigHandler(dynamicConfig);
                Assert.ok(!!dynamicHandler, "The config should have a dynamic config handler");
                Assert.equal(dynamicConfig, theConfig, "The object should have been applied in-place");
                Assert.equal(dynamicHandler?.cfg, theConfig, "The handler should point to the config");

                let onChangeCalled = 0;
                let onChange = onConfigChange(theConfig, () => {
                    onChangeCalled ++;
                    Assert.equal("testiKey", theConfig.instrumentationKey, "Expect the iKey to be set");
                    Assert.equal("https://localhost:9001", theConfig.endpointUrl, "Expect the endpoint to be set");
                });

                Assert.equal(1, onChangeCalled, "Expected the onChanged was called");
                onChange.rm();

                theConfig.instrumentationKey = "newIkey";
                Assert.equal("newIkey", theConfig.instrumentationKey, "Expect the iKey to be changed");
                Assert.equal("https://localhost:9001", theConfig.endpointUrl, "Expect the endpoint to be set");

                theConfig.endpointUrl = "https://newendpoint.localhost:9001";
                Assert.equal("newIkey", theConfig.instrumentationKey, "Expect the iKey to be changed");
                Assert.equal("https://newendpoint.localhost:9001", theConfig.endpointUrl, "Expect the endpoint to be changed");
            }
        });

        this.testCase({
            name: "onConfigChange called when changed via timeout",
            useFakeTimers: true,
            test: () => {
                let theConfig: IConfiguration = {
                    instrumentationKey: "testiKey"
                };

                const theDefaults: IConfigDefaults<IConfiguration> = {
                    endpointUrl: "https://localhost:9001"
                };

                let dynamicHandler = createDynamicConfig(theConfig, theDefaults);
                let dynamicConfig = dynamicHandler.cfg;
                Assert.ok(!!dynamicHandler, "The config should have a dynamic config handler");
                Assert.equal(dynamicConfig, theConfig, "The object should have been applied in-place");
                Assert.equal(dynamicHandler?.cfg, theConfig, "The handler should point to the config");

                let expectediKey = "testiKey";
                let expectedEndpointUrl = "https://localhost:9001";
                let onChangeCalled = 0;
                let onChange = onConfigChange(dynamicConfig, (details) => {
                    onChangeCalled ++;
                    Assert.equal(theConfig, details.cfg, "The original config and the details cfg should be the same");
                    Assert.equal(expectediKey, details.cfg.instrumentationKey, "Expect the iKey to be set");
                    Assert.equal(expectedEndpointUrl, details.cfg.endpointUrl, "Expect the endpoint to be set");
                });

                Assert.equal(1, onChangeCalled, "Expected the onChanged was called");

                expectediKey = "newIKey";
                theConfig.instrumentationKey = expectediKey;

                Assert.equal(1, onChangeCalled, "Expected the onChanged was only called for the first instance");
                this.clock.tick(1);         // This should cause the notifications to occur
                Assert.equal(2, onChangeCalled, "Expected the onChanged was called again");

                // explicitly call notify (nothing should get called)
                dynamicHandler?.notify();
                Assert.equal(2, onChangeCalled, "Expected the onChanged was called again");

                expectedEndpointUrl = "https://newendpoint.localhost:9001";
                theConfig.endpointUrl = expectedEndpointUrl;

                Assert.equal(2, onChangeCalled, "Expected the onChanged was called");
                this.clock.tick(1);         // This should cause the notifications to occur
                Assert.equal(3, onChangeCalled, "Expected the onChanged was called again");

                dynamicHandler?.notify();
                Assert.equal(3, onChangeCalled, "Expected the onChanged was called again");
                Assert.equal("newIKey", theConfig.instrumentationKey, "Expect the iKey to be changed");
                Assert.equal("https://newendpoint.localhost:9001", theConfig.endpointUrl, "Expect the endpoint to be changed");
            }
        });

        this.testCase({
            name: "onCfgChange usage before initialization",
            useFakeTimers: true,
            test: () => {
                let theConfig: IConfiguration = {
                    instrumentationKey: "testiKey",
                    endpointUrl: "https://localhost:9001"
                };

                const channelPlugin = new TestChannelPlugin();
                let core = new AppInsightsCore();
                let expectediKey = theConfig.instrumentationKey;
                let expectedEndpointUrl = theConfig.endpointUrl;

                let onChangeCalled = 0;
                let handler = core.onCfgChange((details) => {
                    onChangeCalled ++;
                    Assert.equal(expectediKey, details.cfg.instrumentationKey, "Expect the iKey to be set");
                    Assert.equal(expectedEndpointUrl, details.cfg.endpointUrl, "Expect the endpoint to be set");
                });

                Assert.equal(0, onChangeCalled, "OnCfgChange was not called");

                core.initialize(theConfig, [channelPlugin]);
                Assert.equal(1, onChangeCalled, "OnCfgChange was not called");

                expectediKey = "newIKey";
                core.config.instrumentationKey = expectediKey;

                Assert.equal(1, onChangeCalled, "Expected the onChanged was called");
                this.clock.tick(1);
                Assert.equal(2, onChangeCalled, "Expected the onChanged was called again");

                // Remove the handler
                handler.rm();
                expectediKey = "newIKey2";
                core.config.instrumentationKey = expectediKey;

                Assert.equal(2, onChangeCalled, "Expected the onChanged was called");
                this.clock.tick(1);
                Assert.equal(2, onChangeCalled, "Expected the onChanged was not called again");
            }
        });

        this.testCase({
            name: "onCfgChange usage before initialization and removed before initialization",
            test: () => {
                let theConfig: IConfiguration = {
                    instrumentationKey: "testiKey",
                    endpointUrl: "https://localhost:9001"
                };

                const channelPlugin = new TestChannelPlugin();
                let core = new AppInsightsCore();
                let expectediKey = theConfig.instrumentationKey;
                let expectedEndpointUrl = theConfig.endpointUrl;

                let onChangeCalled = 0;
                let handler = core.onCfgChange((details) => {
                    onChangeCalled ++;
                    Assert.equal(expectediKey, details.cfg.instrumentationKey, "Expect the iKey to be set");
                    Assert.equal(expectedEndpointUrl, details.cfg.endpointUrl, "Expect the endpoint to be set");
                });

                Assert.equal(0, onChangeCalled, "OnCfgChange was not called");
                handler.rm();

                core.initialize(theConfig, [channelPlugin]);
                Assert.equal(0, onChangeCalled, "OnCfgChange was not called");
            }
        });

        this.testCase({
            name: "onCfgChange usage after initialization",
            useFakeTimers: true,
            test: () => {
                let theConfig: IConfiguration = {
                    instrumentationKey: "testiKey",
                    endpointUrl: "https://localhost:9001"
                };

                const channelPlugin = new TestChannelPlugin();
                let core = new AppInsightsCore();
                let expectediKey = theConfig.instrumentationKey;
                let expectedEndpointUrl = theConfig.endpointUrl;

                core.initialize(theConfig, [channelPlugin]);
                let onChangeCalled = 0;
                let handler = core.onCfgChange((details) => {
                    onChangeCalled ++;
                    Assert.equal(expectediKey, details.cfg.instrumentationKey, "Expect the iKey to be set");
                    Assert.equal(expectedEndpointUrl, details.cfg.endpointUrl, "Expect the endpoint to be set");
                });

                Assert.equal(1, onChangeCalled, "OnCfgChange was not called");

                expectediKey = "newIKey";
                core.config.instrumentationKey = expectediKey;

                Assert.equal(1, onChangeCalled, "Expected the onChanged was called");
                this.clock.tick(1);
                Assert.equal(2, onChangeCalled, "Expected the onChanged was called again");

                // Remove the handler
                handler.rm();
                expectediKey = "newIKey2";
                core.config.instrumentationKey = expectediKey;

                Assert.equal(2, onChangeCalled, "Expected the onChanged was called");
                this.clock.tick(1);
                Assert.equal(2, onChangeCalled, "Expected the onChanged was not called again");
            }
        });


        this.testCase({
            name: "onCfgChange only calls accessed changes",
            useFakeTimers: true,
            test: () => {
                let theConfig: IConfiguration = {
                    instrumentationKey: "testiKey",
                    endpointUrl: "https://localhost:9001",
                    enableDebugExceptions: false,
                    loggingLevelConsole: 1
                };

                const channelPlugin = new TestChannelPlugin();
                let core = new AppInsightsCore();
                let expectedEnableDebugExceptions = theConfig.enableDebugExceptions;
                let expectedLoggingLevel = theConfig.loggingLevelConsole;

                core.initialize(theConfig, [channelPlugin]);
                let onChangeCalled = 0;
                let handler = core.onCfgChange((details) => {
                    onChangeCalled ++;
                    Assert.equal(expectedEnableDebugExceptions, details.cfg.enableDebugExceptions, "Expect the endpoint to be set");
                    if (details.cfg.enableDebugExceptions) {
                        Assert.equal(expectedLoggingLevel, details.cfg.loggingLevelConsole, "Expected the logging level console")
                    }
                });

                Assert.equal(1, onChangeCalled, "OnCfgChange was not called");

                // This should not trigger the listener as enableDebugExceptions was false
                expectedLoggingLevel = 99;
                core.config.loggingLevelConsole = expectedLoggingLevel;

                this.clock.tick(10);
                Assert.equal(1, onChangeCalled, "listener should not have been called as enableDebugExceptions was false");

                // Enable Debug extensions
                expectedEnableDebugExceptions = true;
                core.config.enableDebugExceptions = expectedEnableDebugExceptions;
                this.clock.tick(10);
                Assert.equal(2, onChangeCalled, "listener should have been called enableDebugExceptions");

                // This should trigger the listener as enableDebugExceptions was false
                expectedLoggingLevel = 2;
                core.config.loggingLevelConsole = expectedLoggingLevel;

                this.clock.tick(10);
                Assert.equal(3, onChangeCalled, "listener should have been called as enableDebugExceptions was true");

                // Disable Debug extensions again
                expectedEnableDebugExceptions = false;
                core.config.enableDebugExceptions = expectedEnableDebugExceptions;
                this.clock.tick(10);
                Assert.equal(4, onChangeCalled, "listener should have been called enableDebugExceptions");

                // This should not call trigger the listener as enableDebugExceptions was false
                expectedLoggingLevel = 42;
                core.config.loggingLevelConsole = expectedLoggingLevel;

                this.clock.tick(10);
                Assert.equal(4, onChangeCalled, "listener should have been called as enableDebugExceptions was disabled");
            }
        });

        function createPerfMgr(core: IAppInsightsCore, manager: INotificationManager): IPerfManager {
            return createPerfMgr(core, manager);
        }

        function assertSameValues(expected: any, actual: any, message: string) {
            if (isFunction(expected)) {
                // Functions should not be copied
                Assert.equal(expected, actual, message + " " + dumpObj(actual));
            } else if (isArray(expected)) {
                Assert.equal(expected.length, actual.length, message + " (length) " + dumpObj(actual));
                arrForEach(expected, (value, idx) => {
                    Assert.equal(value, actual[idx], message + " - " + idx + " " + dumpObj(actual));
                    if (isPlainObject(value)) {
                        assertSameValues(expected, actual, message +  " [" + idx + "]");
                    }
                });
            } else if (isPlainObject(expected)) {
                Assert.equal(objKeys(expected).length, objKeys(actual).length, message + " - same number of keys " + dumpObj(actual));
                objForEachKey(expected, (key, value) => {
                    Assert.equal(value, actual[key], message + " - " + key + " " + dumpObj(actual));
                    if (isPlainObject(value)) {
                        assertSameValues(expected, actual, message +  " [" + key + "]");
                    }
                });
            } else {
                // Not an object so just validate directly
                Assert.equal(expected, actual, message);
            }
        }
    }
}

class TestChannelPlugin implements IChannelControls {
    public _nextPlugin: ITelemetryPlugin | ITelemetryPluginChain;
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

    public setNextPlugin(next: ITelemetryPlugin | ITelemetryPluginChain): void {
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
