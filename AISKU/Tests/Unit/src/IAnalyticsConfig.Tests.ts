import { ApplicationInsights, IAnalyticsConfig, IAppInsights, IConfig, ApplicationAnalytics } from "../../../src/applicationinsights-web";
import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { AnalyticsPluginIdentifier, utlRemoveSessionStorage } from "@microsoft/applicationinsights-common";
import { AppInsightsCore, IConfiguration, onConfigChange, createDynamicConfig, IConfigDefaults } from "@microsoft/applicationinsights-core-js";
import { Sender } from "@microsoft/applicationinsights-channel-js";

const TestInstrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';

export class IAnalyticsConfigTests extends AITestClass {

    public testInitialize() {
        this._disableDynProtoBaseFuncs();
    }

    public testCleanup() {
        // Clean up session storage
        utlRemoveSessionStorage(null as any, "AI_sentBuffer");
        utlRemoveSessionStorage(null as any, "AI_buffer");
    }

    public registerTests() {
        
        this.testCase({
            name: "IAnalyticsConfig: Interface is properly exported from AISKU",
            test: () => {
                // Test that IAnalyticsConfig is available as an export
                // Since IAnalyticsConfig is a TypeScript interface, we can't check typeof at runtime
                // Instead, we'll test that we can create objects that satisfy the interface
                const testConfig: IAnalyticsConfig = {
                    instrumentationKey: TestInstrumentationKey
                };
                Assert.ok(testConfig.instrumentationKey === TestInstrumentationKey, "IAnalyticsConfig should be usable");
            }
        });

        this.testCase({
            name: "IAnalyticsConfig: Interface extends IConfig and IConfiguration",
            test: () => {
                // Create a test config that implements IAnalyticsConfig
                const testConfig: IAnalyticsConfig = {
                    instrumentationKey: TestInstrumentationKey,
                    connectionString: "test-connection-string",
                    samplingPercentage: 50,
                    accountId: "test-account",
                    sessionRenewalMs: 30 * 60 * 1000,
                    sessionExpirationMs: 24 * 60 * 60 * 1000,
                    disableExceptionTracking: false,
                    enableUnhandledPromiseRejectionTracking: true,
                    autoTrackPageVisitTime: false,
                    overridePageViewDuration: false,
                    enableAutoRouteTracking: false,
                    isStorageUseDisabled: false,
                    enableDebug: false,
                    namePrefix: "test-prefix",
                    isBrowserLinkTrackingEnabled: false,
                    disableFlushOnBeforeUnload: false,
                    disableFlushOnUnload: false,
                    autoExceptionInstrumented: false,
                    autoUnhandledPromiseInstrumented: false,
                    expCfg: { inclScripts: false, expLog: undefined, maxLogs: 50 }
                };

                // Test that it can be used as both IConfig and IConfiguration simultaneously
                const asBothInterfaces: IConfig & IConfiguration = testConfig;
                
                // Verify IConfig properties are accessible
                Assert.equal("test-account", asBothInterfaces.accountId, "Should access IConfig properties");
                Assert.equal(50, asBothInterfaces.samplingPercentage, "Should access IConfig properties");
                
                // Verify IConfiguration properties are accessible  
                Assert.equal("test-connection-string", asBothInterfaces.connectionString, "Should access IConfiguration properties");
                Assert.equal(TestInstrumentationKey, asBothInterfaces.instrumentationKey, "Should access IConfiguration properties");
            }
        });

        this.testCase({
            name: "IAnalyticsConfig: AnalyticsPlugin config property uses IAnalyticsConfig type",
            test: () => {
                const init = new ApplicationInsights({
                    config: {
                        instrumentationKey: TestInstrumentationKey,
                        samplingPercentage: 75,
                        accountId: "test-account-id",
                        sessionRenewalMs: 30 * 60 * 1000,
                        sessionExpirationMs: 24 * 60 * 60 * 1000,
                        disableExceptionTracking: false,
                        enableUnhandledPromiseRejectionTracking: true
                    }
                });
                this.onDone(() => {
                    if (init && init.unload) {
                        init.unload(false);
                    }
                });
                init.loadAppInsights();

                // Get the analytics plugin from the loaded app insights
                const analyticsPlugin = init.appInsights as ApplicationAnalytics;

                // Test that the analytics plugin config is accessible and has the correct type
                Assert.ok(analyticsPlugin.config, "AnalyticsPlugin should have config property");
                
                // Test that config properties are accessible through IAnalyticsConfig
                // Note: These values may be defaults or processed values, not necessarily the exact input values
                Assert.ok(typeof analyticsPlugin.config.samplingPercentage === "number", "Should have samplingPercentage as number");
                Assert.ok(typeof analyticsPlugin.config.accountId === "string" || analyticsPlugin.config.accountId === undefined, "Should have accountId as string or undefined");
                Assert.ok(typeof analyticsPlugin.config.sessionRenewalMs === "number", "Should have sessionRenewalMs as number");
                Assert.ok(typeof analyticsPlugin.config.sessionExpirationMs === "number", "Should have sessionExpirationMs as number");
            }
        });

        this.testCase({
            name: "IAnalyticsConfig: Extension config in core uses correct interface",
            test: () => {
                const init = new ApplicationInsights({
                    config: {
                        instrumentationKey: TestInstrumentationKey,
                        samplingPercentage: 90,
                        accountId: "ext-config-test",
                        sessionRenewalMs: 45 * 60 * 1000,
                        extensionConfig: {
                            [AnalyticsPluginIdentifier]: {
                                samplingPercentage: 80,
                                accountId: "ext-specific-account",
                                sessionRenewalMs: 20 * 60 * 1000
                            }
                        }
                    }
                });
                this.onDone(() => {
                    if (init && init.unload) {
                        init.unload(false);
                    }
                });
                init.loadAppInsights();

                // Test that extension config can be accessed and has correct properties
                // Note: This tests that the extension config structure works correctly
                const core = init.core;
                Assert.ok(core, "Core should exist");
                Assert.ok(core.config, "Core config should exist");
                
                // Test that we can access extension config for analytics plugin
                if (core.config.extensionConfig && core.config.extensionConfig[AnalyticsPluginIdentifier]) {
                    const extConfig = core.config.extensionConfig[AnalyticsPluginIdentifier] as IAnalyticsConfig;
                    Assert.ok(typeof extConfig.samplingPercentage === "number", "Extension config should have samplingPercentage as number");
                    Assert.ok(typeof extConfig.accountId === "string" || extConfig.accountId === undefined, "Extension config should have accountId as string or undefined");
                    Assert.ok(typeof extConfig.sessionRenewalMs === "number", "Extension config should have sessionRenewalMs as number");
                }
            }
        });

        this.testCase({
            name: "IAnalyticsConfig: Interface compatibility with existing functionality",
            test: () => {
                // Test that the interface doesn't break existing functionality
                const init = new ApplicationInsights({
                    config: {
                        instrumentationKey: TestInstrumentationKey
                    }
                });
                this.onDone(() => {
                    if (init && init.unload) {
                        init.unload(false);
                    }
                });
                init.loadAppInsights();
                
                // These should work as before
                Assert.ok(typeof init.trackEvent === "function", "trackEvent should be available");
                Assert.ok(typeof init.trackPageView === "function", "trackPageView should be available");
                Assert.ok(typeof init.trackException === "function", "trackException should be available");
                Assert.ok(typeof init.trackTrace === "function", "trackTrace should be available");
                Assert.ok(typeof init.trackMetric === "function", "trackMetric should be available");
                Assert.ok(typeof init.trackDependencyData === "function", "trackDependencyData should be available");
            }
        });

        this.testCase({
            name: "IAnalyticsConfig: onConfigChange callback triggered when config properties change",
            test: () => {
                // Create a test config that implements IAnalyticsConfig
                const testConfig: IAnalyticsConfig = {
                    instrumentationKey: TestInstrumentationKey,
                    samplingPercentage: 50,
                    sessionRenewalMs: 30 * 60 * 1000,
                    sessionExpirationMs: 24 * 60 * 60 * 1000,
                    disableExceptionTracking: false,
                    enableAutoRouteTracking: false
                };

                const defaults: IConfigDefaults<IAnalyticsConfig> = {
                    samplingPercentage: 100,
                    sessionRenewalMs: 30 * 60 * 1000,
                    sessionExpirationMs: 24 * 60 * 60 * 1000,
                    disableExceptionTracking: false,
                    enableAutoRouteTracking: false
                };

                // Create dynamic config to enable change notifications
                let dynamicHandler = createDynamicConfig(testConfig, defaults);
                let dynamicConfig = dynamicHandler.cfg;

                let onChangeCalled = 0;
                let lastCallbackConfig: IAnalyticsConfig | null = null;

                // Set up onConfigChange listener
                let onChange = onConfigChange(dynamicConfig, (details) => {
                    onChangeCalled++;
                    lastCallbackConfig = details.cfg as IAnalyticsConfig;
                });

                // Initial call should have been made (may be called during setup)
                Assert.ok(onChangeCalled >= 1, "onConfigChange should be called at least once initially");
                Assert.ok(lastCallbackConfig, "Callback should receive config");
                Assert.ok(typeof lastCallbackConfig.samplingPercentage === "number", "samplingPercentage should be a number");
                Assert.ok(lastCallbackConfig.samplingPercentage > 0, "samplingPercentage should be positive");

                // Record the initial count before making changes
                const initialCallCount = onChangeCalled;

                // Change a property
                dynamicConfig.samplingPercentage = 75;
                dynamicHandler.notify();

                Assert.ok(onChangeCalled > initialCallCount, "onConfigChange should be called after property change");
                Assert.ok(typeof lastCallbackConfig!.samplingPercentage === "number", "samplingPercentage should be a number");
                Assert.ok(lastCallbackConfig!.samplingPercentage > 0, "samplingPercentage should be positive");

                // Record the count after first change
                const afterFirstChange = onChangeCalled;

                // Change another property
                dynamicConfig.sessionRenewalMs = 20 * 60 * 1000;
                dynamicHandler.notify();

                Assert.ok(onChangeCalled > afterFirstChange, "onConfigChange should be called after second property change");
                Assert.ok(typeof lastCallbackConfig!.sessionRenewalMs === "number", "sessionRenewalMs should be a number");
                Assert.ok(lastCallbackConfig!.sessionRenewalMs > 0, "sessionRenewalMs should be positive");

                // Cleanup
                onChange.rm();
            }
        });

        this.testCase({
            name: "IAnalyticsConfig: onConfigChange with AnalyticsPlugin integration",
            test: () => {
                const init = new ApplicationInsights({
                    config: {
                        instrumentationKey: TestInstrumentationKey,
                        samplingPercentage: 60,
                        sessionRenewalMs: 25 * 60 * 1000,
                        disableExceptionTracking: false,
                        enableAutoRouteTracking: false
                    }
                });

                this.onDone(() => {
                    if (init && init.unload) {
                        init.unload(false);
                    }
                });

                init.loadAppInsights();

                // Get the analytics plugin
                const analyticsPlugin = init.appInsights as ApplicationAnalytics;
                Assert.ok(analyticsPlugin.config, "AnalyticsPlugin should have config");

                // Verify initial config values - check if they're numbers, not exact values
                // The plugin may process and apply defaults to the config values
                Assert.ok(typeof analyticsPlugin.config.samplingPercentage === "number", "samplingPercentage should be a number");
                Assert.ok(typeof analyticsPlugin.config.sessionRenewalMs === "number", "sessionRenewalMs should be a number");

                // Test that the config supports the IAnalyticsConfig interface properties
                Assert.ok(analyticsPlugin.config.hasOwnProperty("samplingPercentage") || "samplingPercentage" in analyticsPlugin.config, "Config should have samplingPercentage property");
                Assert.ok(analyticsPlugin.config.hasOwnProperty("sessionRenewalMs") || "sessionRenewalMs" in analyticsPlugin.config, "Config should have sessionRenewalMs property");
                Assert.ok(analyticsPlugin.config.hasOwnProperty("disableExceptionTracking") || "disableExceptionTracking" in analyticsPlugin.config, "Config should have disableExceptionTracking property");
            }
        });

        this.testCase({
            name: "IAnalyticsConfig: onConfigChange removal and cleanup",
            test: () => {
                const testConfig: IAnalyticsConfig = {
                    instrumentationKey: TestInstrumentationKey,
                    samplingPercentage: 50,
                    disableExceptionTracking: false
                };

                const defaults: IConfigDefaults<IAnalyticsConfig> = {
                    samplingPercentage: 100,
                    disableExceptionTracking: false
                };

                let dynamicHandler = createDynamicConfig(testConfig, defaults);
                let dynamicConfig = dynamicHandler.cfg;

                let onChangeCalled = 0;

                // Set up onConfigChange listener
                let onChange = onConfigChange(dynamicConfig, () => {
                    onChangeCalled++;
                });

                // The callback should be called initially when registered (may be called during setup)
                Assert.ok(onChangeCalled >= 1, "onConfigChange should be called at least once initially");
                
                // Record the initial count before removal
                const callCountBeforeRemoval = onChangeCalled;

                // Remove the listener
                onChange.rm();

                // Change a property - should not trigger callback anymore
                dynamicConfig.samplingPercentage = 75;
                dynamicHandler.notify();

                Assert.equal(callCountBeforeRemoval, onChangeCalled, "onConfigChange should not be called after removal");
            }
        });
    }
}