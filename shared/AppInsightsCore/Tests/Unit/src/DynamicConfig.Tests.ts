import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { _eInternalMessageId } from "../../../src/JavaScriptSDK.Enums/LoggingEnums";
import { _InternalLogMessage } from "../../../src/JavaScriptSDK/DiagnosticLogger";
import { IConfigDefaults } from "../../../src/Config/IConfigDefaults";
import { IConfiguration } from "../../../src/JavaScriptSDK.Interfaces/IConfiguration";
import { getDynamicConfigHandler } from "../../../src/Config/DynamicSupport";
import { createDynamicConfig, onConfigChange } from "../../../src/Config/DynamicConfig";
import { arrForEach, dumpObj, isArray, isFunction, objForEachKey, objKeys, isPlainObject, objHasOwn } from "@nevware21/ts-utils";
import { IAppInsightsCore } from "../../../src/JavaScriptSDK.Interfaces/IAppInsightsCore";
import { INotificationManager } from "../../../src/JavaScriptSDK.Interfaces/INotificationManager";
import { IPerfManager } from "../../../src/JavaScriptSDK.Interfaces/IPerfManager";
import { AppInsightsCore } from "../../../src/applicationinsights-core-js";
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

function _expectException(cb: () => void, message: string) {
    try {
        cb();
        Assert.ok(false, "Expected an exception: " + (message || ""));
    } catch (e) {
        Assert.ok(true, message);
    }
}
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

        this.testCase({
            name: "Validate updating objects / arrays replaces the contents in-place",
            useFakeTimers: true,
            test: () => {
                let theConfig: any = {
                    instrumentationKey: "testiKey",
                    endpointUrl: "https://localhost:9001",
                    enableDebugExceptions: false,
                    loggingLevelConsole: 1,
                    extensionConfig: {
                        "test": {} as any
                    },
                    userCfg: {
                        userTest: {} as any
                    }
                };

                const channelPlugin = new TestChannelPlugin();
                let core = new AppInsightsCore();

                core.initialize(theConfig, [channelPlugin]);
                let cfg = core.config as any;

                // Grab a copy of the testExtCfg
                let testExtCfg = cfg.extensionConfig?.test;
                let userTestCfg = cfg.userCfg.userTest;

                let helloCfg: any = {
                    "hello": "World"
                };

                let myCfg: any = {
                    "my": "newCfg"
                };

                Assert.ok(!objHasOwn(cfg.extensionConfig!.test, "hello"), "The hello property should not exist");
                Assert.ok(!objHasOwn(testExtCfg, "hello"), "The hello property should not exist");

                // Assign the new config
                cfg.extensionConfig!.test = helloCfg;

                // Assign the new config to a new key
                cfg.extensionConfig!.newTest = helloCfg;

                // The test should now have "copied" the helloCfg
                Assert.ok(objHasOwn(cfg.extensionConfig!.test, "hello"), "The hello property should exist");
                Assert.equal("World", cfg.extensionConfig!.test.hello, "And should be assigned");
                Assert.ok(cfg.extensionConfig!.test !== helloCfg, "The new config should have copied but not directly referenced the helloCfg");

                // Check that the previously referenced config also has the value
                Assert.ok(objHasOwn(testExtCfg, "hello"), "The hello property should exist");
                Assert.equal("World", testExtCfg.hello, "And should be assigned");
                Assert.ok(cfg.extensionConfig!.test === testExtCfg, "The previous reference and the current value should still be the same instance");

                // The newTest element should refer to the helloCfg as it was NOT tagged as referenced
                Assert.ok(objHasOwn(cfg.extensionConfig!.newTest, "hello"), "The hello property should exist");
                Assert.equal("World", cfg.extensionConfig!.newTest.hello, "And should be assigned");
                Assert.ok(cfg.extensionConfig!.newTest === helloCfg, "The new config should have directly referenced the helloCfg as it was not previously present or referenced");

                // Final validation that test !== newTest
                Assert.ok(cfg.extensionConfig!.newTest !== cfg.extensionConfig!.test, "NewTest and old test should not reference the same instance");

                // Assign the new config
                cfg.extensionConfig!.test = myCfg;

                // The test should now have "copied" the helloCfg
                Assert.ok(objHasOwn(cfg.extensionConfig!.test, "hello"), "The hello property should still exist");
                Assert.equal(undefined, cfg.extensionConfig!.test.hello, "But hello should be undefined");

                Assert.ok(objHasOwn(cfg.extensionConfig!.test, "my"), "But the my property should");
                Assert.equal("newCfg", cfg.extensionConfig!.test.my, "And should be assigned");
                Assert.ok(cfg.extensionConfig!.test !== myCfg, "The new config should have copied but not directly referenced the helloCfg");

                // Check that the previously referenced config also has the value
                Assert.ok(objHasOwn(testExtCfg, "hello"), "The hello property should exist");
                Assert.equal(undefined, cfg.extensionConfig!.test.hello, "But hello should be undefined");

                Assert.ok(objHasOwn(testExtCfg, "my"), "The my property should exist");
                Assert.equal("newCfg", testExtCfg.my, "And should be assigned");
                Assert.ok(cfg.extensionConfig!.test === testExtCfg, "The previous reference and the current value should still be the same instance");

                // New Test should be unchanged
                // The newTest element should refer to the helloCfg as it was NOT tagged as referenced
                Assert.ok(objHasOwn(cfg.extensionConfig!.newTest, "hello"), "The hello property should exist");
                Assert.equal("World", cfg.extensionConfig!.newTest.hello, "And should be assigned");
                Assert.ok(cfg.extensionConfig!.newTest === helloCfg, "The new config should have directly referenced the helloCfg as it was not previously present or referenced");

                // Final validation that test !== newTest
                Assert.ok(cfg.extensionConfig!.newTest !== cfg.extensionConfig!.test, "NewTest and old test should not reference the same instance");

                // ---------------------------------------------------------
                // Validate that updating non-referenced objects replaces the object
                Assert.ok(!objHasOwn(cfg.userCfg.userTest, "hello"), "The hello property should not exist");
                Assert.ok(!objHasOwn(userTestCfg, "hello"), "The hello property should not exist");

                // Assign the new config
                cfg.userCfg!.userTest = helloCfg;

                // Assign the new config to a new key
                cfg.userCfg!.newTest = helloCfg;

                // The test should now have "copied" the helloCfg
                Assert.ok(objHasOwn(cfg.userCfg!.userTest, "hello"), "The hello property should exist");
                Assert.equal("World", cfg.userCfg!.userTest.hello, "And should be assigned");
                Assert.ok(cfg.userCfg!.userTest === helloCfg, "The new config should directly referenced the helloCfg");
                // The original reference obtained before updating the userCfg should not have changed
                Assert.ok(!objHasOwn(userTestCfg, "hello"), "The hello property should not exist");

                // The newTest element should refer to the helloCfg
                Assert.ok(objHasOwn(cfg.userCfg!.newTest, "hello"), "The hello property should exist");
                Assert.equal("World", cfg.userCfg!.newTest.hello, "And should be assigned");
                Assert.ok(cfg.userCfg!.newTest === helloCfg, "The new config should have directly referenced the helloCfg");

                // Final validation that test !== newTest
                Assert.ok(cfg.userCfg!.newTest === cfg.userCfg!.userTest, "NewTest and old test should reference the same instance");

                // Assign the new config
                cfg.userCfg!.userTest = myCfg;

                // The test should now have "copied" the helloCfg
                Assert.ok(!objHasOwn(cfg.userCfg!.userTest, "hello"), "The hello property should not exist");
                Assert.ok(objHasOwn(cfg.userCfg!.userTest, "my"), "The my property should exist");
                Assert.equal("newCfg", cfg.userCfg!.userTest.my, "And should be assigned");
                Assert.ok(cfg.userCfg!.userTest === myCfg, "The new config should directly referenced the myCfg");

                // The original reference obtained before updating the userCfg should not have changed
                Assert.ok(!objHasOwn(userTestCfg, "hello"), "The hello property should not exist");
                Assert.ok(!objHasOwn(userTestCfg, "my"), "The my property should not exist");

                // The newTest element should still reference the helloCfg
                Assert.ok(objHasOwn(cfg.userCfg!.newTest, "hello"), "The hello property should exist");
                Assert.equal("World", cfg.userCfg!.newTest.hello, "And should be assigned");
                Assert.ok(cfg.userCfg!.newTest === helloCfg, "The new config should have directly referenced the helloCfg");

                // Final validation that test !== newTest
                Assert.ok(cfg.userCfg!.newTest !== cfg.userCfg!.test, "NewTest and old test should not reference the same instance");
            }
        });

        this.testCase({
            name: "Validate read-only",
            useFakeTimers: true,
            test: () => {
                let theConfig: any = {
                    instrumentationKey: "testiKey",
                    endpointUrl: "https://localhost:9001",
                    enableDebugExceptions: false,
                    loggingLevelConsole: 1,
                    extensionConfig: {
                        "test": {} as any
                    },
                    anArray: [ 1, 2, 3 ]
                };

                let handler = createDynamicConfig(theConfig, undefined, undefined, true);

                handler.rdOnly(theConfig, "instrumentationKey");
                _expectException(() => {
                    theConfig.instrumentationKey = "newTestKey";
                }, "Should not be able to re-assign instrumentationKey");

                // Re-Assigning with the same value doesn't cause an exception
                theConfig.instrumentationKey = "testiKey";

                handler.rdOnly(theConfig, "extensionConfig");
                _expectException(() => {
                    theConfig.extensionConfig = {};
                }, "Should not be able to re-assign extensionConfig");

                // Assigning a property to a read-only property is allowed
                theConfig.extensionConfig.hello = "World";
                Assert.equal("World", theConfig.extensionConfig.hello, "Hello should be assigned")
                Assert.deepEqual({}, theConfig.extensionConfig.test, "test should be assigned")

                handler.rdOnly(theConfig, "anArray");
                _expectException(() => {
                    theConfig.anArray = [];
                }, "Should not be able to re-assign anArray");

                // Assigning a property to a read-only property is allowed
                theConfig.anArray.hello = "World";
                Assert.equal("World", theConfig.anArray.hello, "Hello should be assigned")
                theConfig.anArray[0] = 0;
                Assert.equal(0, theConfig.anArray[0], "0");
                Assert.equal(2, theConfig.anArray[1], "2");
                Assert.equal(3, theConfig.anArray[2], "3");
            }
        });

        this.testCase({
            name: "Validate updating referenced objects / arrays with non object or null / undefined",
            useFakeTimers: true,
            test: () => {
                let expectedUserCfg = {
                    userTest: {} as any
                };

                let theConfig: any = {
                    instrumentationKey: "testiKey",
                    endpointUrl: "https://localhost:9001",
                    enableDebugExceptions: false,
                    loggingLevelConsole: 1,
                    extensionConfig: {
                        "test": {} as any
                    },
                    userCfg: {
                        userTest: {} as any
                    }
                };

                let handler = createDynamicConfig(theConfig, {});
                let config = handler.cfg;
                let userCfg = handler.ref(theConfig, "userCfg");

                Assert.deepEqual(expectedUserCfg, userCfg, "Validate that the expected user Cfg")
                Assert.ok(userCfg === config.userCfg, "Validate userCfg reference is as expected")

                // Assign the referenced object with null / undefined
                config.userCfg = null;
                Assert.deepEqual({ userTest: undefined }, config.userCfg);
                Assert.ok(userCfg === config.userCfg, "The previous referenced value should still match");

                config.userCfg = undefined;
                Assert.deepEqual({ userTest: undefined }, config.userCfg);
                Assert.ok(userCfg === config.userCfg, "The previous referenced value should still match");

                // Assign back to an object (should become automatically referenced)
                config.userCfg = {};
                Assert.deepEqual({ userTest: undefined }, config.userCfg);
                Assert.ok(userCfg === config.userCfg, "The previous referenced value should still match");
                
                // Grab a reference and update
                userCfg = config.userCfg;
                Assert.ok(userCfg === config.userCfg, "References should now match");

                config.userCfg = { hello: "World" };
                Assert.ok(userCfg === config.userCfg, "References should still match");
                Assert.ok(objHasOwn(config.userCfg, "hello"), "Direct config reference should have the new property");
                Assert.equal("World", config.userCfg.hello);
                Assert.ok(objHasOwn(userCfg, "hello"), "previous reference should have the new property");
                Assert.equal("World", userCfg.hello);

                config.userCfg = expectedUserCfg;
                Assert.ok(userCfg === config.userCfg, "References should still match");
                Assert.ok(objHasOwn(config.userCfg, "userTest"), "Direct config reference should have the new property");
                Assert.ok(objHasOwn(config.userCfg, "hello"), "Direct config reference should have the new property");
                Assert.equal(undefined, config.userCfg.hello);
                Assert.deepEqual({}, config.userCfg.userTest);
                Assert.ok(objHasOwn(userCfg, "userTest"), "Direct config reference should have the new property");
                Assert.ok(objHasOwn(userCfg, "hello"), "previous reference should have the new property");
                Assert.equal(undefined, userCfg.hello);
                Assert.deepEqual({}, userCfg.userTest);

                // ---------------------------------------------------------------------
                // Now try deleting the key, which will also drop the previous reference
                // ---------------------------------------------------------------------
                delete config.userCfg;
                Assert.ok(!objHasOwn(config, "userCfg"), "userCfg is no longer present");
                Assert.equal(undefined, config.userCfg, "Validate that the config.userCfg was removed");
                Assert.ok(userCfg !== config.userCfg, "Validate userCfg reference should no longer match");

                // Assign the referenced object with null / undefined
                config.userCfg = null;
                Assert.ok(objHasOwn(config, "userCfg"), "userCfg is present");
                Assert.equal(null, config.userCfg, "Validate that the config.userCfg is null");
                Assert.ok(userCfg !== config.userCfg, "Validate userCfg reference should no longer match");

                config.userCfg = undefined;
                Assert.ok(objHasOwn(config, "userCfg"), "userCfg is present");
                Assert.equal(undefined, config.userCfg, "Validate that the config.userCfg is undefined");
                Assert.ok(userCfg !== config.userCfg, "The previous referenced value should still match");

                // Assign back to an object (should become automatically referenced)
                config.userCfg = {};
                Assert.deepEqual({}, config.userCfg);

                // Grab a reference and update
                userCfg = config.userCfg;
                Assert.ok(userCfg === config.userCfg, "References should now match");

                config.userCfg = { hello: "World" };
                Assert.ok(userCfg !== config.userCfg, "References should not match");
                Assert.ok(objHasOwn(config.userCfg, "hello"), "Direct config reference should have the new property");
                Assert.equal("World", config.userCfg.hello);
                Assert.ok(!objHasOwn(userCfg, "hello"), "previous reference should have the new property");
                Assert.equal(undefined, userCfg.hello);
            }
        });

        this.testCase({
            name: "Validate updating initial referenced undefined value with objects / arrays with non object or null / undefined",
            useFakeTimers: true,
            test: () => {
                let expectedUserCfg = {
                    userTest: {} as any
                };

                let theConfig: any = {
                    instrumentationKey: "testiKey",
                    endpointUrl: "https://localhost:9001",
                    enableDebugExceptions: false,
                    loggingLevelConsole: 1,
                    userCfg: undefined
                };

                let handler = createDynamicConfig(theConfig, {});
                let config = handler.cfg;

                let userCfg = handler.ref(theConfig, "userCfg");

                Assert.equal(undefined, config.userCfg, "Check that the userCfg value is as expected");
                Assert.deepEqual(undefined, userCfg, "Validate that the expected user Cfg")
                Assert.ok(userCfg === config.userCfg, "Validate userCfg reference is as expected")

                // Assign the referenced object with null / undefined
                config.userCfg = null;
                Assert.equal(null, config.userCfg);
                Assert.ok(userCfg !== config.userCfg, "The previous referenced value should no longer match");

                config.userCfg = undefined;
                Assert.equal(undefined, config.userCfg);
                Assert.ok(userCfg === config.userCfg, "The previous referenced value should no longer match");

                // Assign back to an object (should become automatically referenced)
                config.userCfg = {};
                Assert.equal(0, objKeys(config.userCfg), "Check the number of keys");
                Assert.ok(userCfg !== config.userCfg, "The previous referenced value should no longer match");
                
                // Grab a reference and update
                userCfg = config.userCfg;
                Assert.ok(userCfg === config.userCfg, "References should now match");

                config.userCfg = { hello: "World" };
                Assert.ok(userCfg === config.userCfg, "References should still match");
                Assert.ok(objHasOwn(config.userCfg, "hello"), "Direct config reference should have the new property")
                Assert.equal("World", config.userCfg.hello);
                Assert.ok(objHasOwn(userCfg, "hello"), "previous reference should have the new property")
                Assert.equal("World", userCfg.hello);

                config.userCfg = expectedUserCfg;
                Assert.ok(userCfg === config.userCfg, "References should still match");
                Assert.ok(objHasOwn(config.userCfg, "userTest"), "Direct config reference should have the new property")
                Assert.ok(objHasOwn(config.userCfg, "hello"), "Direct config reference should have the new property")
                Assert.equal(undefined, config.userCfg.hello);
                Assert.deepEqual({}, config.userCfg.userTest);
                Assert.ok(objHasOwn(userCfg, "userTest"), "Direct config reference should have the new property")
                Assert.ok(objHasOwn(userCfg, "hello"), "previous reference should have the new property")
                Assert.equal(undefined, userCfg.hello);
                Assert.deepEqual({}, userCfg.userTest);

                // ---------------------------------------------------------------------
                // Now try deleting the key, which will also drop the previous reference
                // ---------------------------------------------------------------------
                delete config.userCfg;
                Assert.ok(!objHasOwn(config, "userCfg"), "userCfg is no longer present");
                Assert.equal(undefined, config.userCfg, "Validate that the config.userCfg was removed");
                Assert.ok(userCfg !== config.userCfg, "Validate userCfg reference should no longer match");

                // Assign the referenced object with null / undefined
                config.userCfg = null;
                Assert.ok(objHasOwn(config, "userCfg"), "userCfg is present");
                Assert.equal(null, config.userCfg, "Validate that the config.userCfg is null");
                Assert.ok(userCfg !== config.userCfg, "Validate userCfg reference should no longer match");

                config.userCfg = undefined;
                Assert.ok(objHasOwn(config, "userCfg"), "userCfg is present");
                Assert.equal(undefined, config.userCfg, "Validate that the config.userCfg is undefined");
                Assert.ok(userCfg !== config.userCfg, "The previous referenced value should still match");

                // Assign back to an object (should become automatically referenced)
                config.userCfg = {};
                Assert.deepEqual({}, config.userCfg);

                // Grab a reference and update
                userCfg = config.userCfg;
                Assert.ok(userCfg === config.userCfg, "References should now match");

                config.userCfg = { hello: "World" };
                Assert.ok(userCfg !== config.userCfg, "References should not match");
                Assert.ok(objHasOwn(config.userCfg, "hello"), "Direct config reference should have the new property");
                Assert.equal("World", config.userCfg.hello);
                Assert.ok(!objHasOwn(userCfg, "hello"), "previous reference should have the new property");
                Assert.equal(undefined, userCfg.hello);
            }
        });

        this.testCase({
            name: "Validate setting defaults when partial values are provided",
            useFakeTimers: true,
            test: () => {
                let theConfig: any = {
                    instrumentationKey: "testiKey",
                    endpointUrl: "https://localhost:9001",
                    enableDebugExceptions: false,
                    loggingLevelConsole: 1,
                    userCfg: undefined,
                    extensionConfig: {
                        myExtension: {
                            value1: "Hello",
                            subValue1: {
                                sub1: "World"
                            }
                        },
                        partialConfig: {
                            p1: {
                                v1: "Back"
                            }
                        }
                    }
                };

                const channelPlugin = new TestChannelPlugin();
                let core = new AppInsightsCore();

                core.initialize(theConfig, [channelPlugin]);

                let handler = getDynamicConfigHandler(core.config);
                let config = handler!.cfg;

                let expectedExtCfg: any = {
                    myExtension: {
                        value1: "Hello",
                        subValue1: {
                            sub1: "World"
                        },
                    },
                    partialConfig: {
                        p1: {
                            v1: "Back"
                        }
                    }
                }
                Assert.deepEqual(expectedExtCfg, config.extensionConfig, "Check the extension Config")

                let newExtensionCfg: IConfigDefaults<any> = {
                    extensionConfig: { 
                        mrg: true, v: {
                            anotherPlugin: {
                                newValue1: "foo",
                                subValue2: {
                                    v: {
                                        sub2: "bar",
                                        sub3: {
                                            v: "fred"
                                        }
                                    }
                                }
                            },
                            partialConfig: {
                                mrg: true,
                                v: {
                                    p1: {
                                        v1: "Back"
                                    }
                                }
                            }
                        }
                    }
                }
                handler?.setDf(config, newExtensionCfg);

                expectedExtCfg = {
                    myExtension: {
                        value1: "Hello",
                        subValue1: {
                            sub1: "World"
                        }
                    },
                    anotherPlugin:  {
                        newValue1: "foo",
                        subValue2: {
                            sub2: "bar",
                            sub3: "fred"
                        }
                    },
                    partialConfig: {
                        p1: {
                            v1: "Back"
                        }
                    }
                }
                Assert.deepEqual(expectedExtCfg, config.extensionConfig, "Check the extension Config")
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
