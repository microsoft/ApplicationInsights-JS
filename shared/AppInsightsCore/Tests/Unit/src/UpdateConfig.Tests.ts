import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { dumpObj } from "@nevware21/ts-utils";
import { AppInsightsCore } from "../../../src/core/AppInsightsCore";
import { _eInternalMessageId } from "../../../src/enums/ai/LoggingEnums";
import { _InternalLogMessage } from "../../../src/diagnostics/DiagnosticLogger";
import { IConfiguration } from "../../../src/interfaces/ai/IConfiguration";
import { OldTrackPlugin, TestChannelPlugin, TestPlugin, TestSamplingPlugin, TrackPlugin } from "./TestPlugins";

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
                    disableCookiesUsage: true,
                    extensions: []          // Try and replace the extensions
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
                Assert.equal(4, appInsightsCore.config.extensions!.length, dumpObj(appInsightsCore.config.extensions));

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
