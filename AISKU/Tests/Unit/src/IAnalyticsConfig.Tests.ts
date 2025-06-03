import { ApplicationInsights, IAnalyticsConfig, IAppInsights, IConfig, ApplicationAnalytics } from "../../../src/applicationinsights-web";
import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { AnalyticsPluginIdentifier, utlRemoveSessionStorage } from "@microsoft/applicationinsights-common";
import { AppInsightsCore, IConfiguration } from "@microsoft/applicationinsights-core-js";
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
                    instrumentationKey: "test-key"
                };
                Assert.ok(testConfig.instrumentationKey === "test-key", "IAnalyticsConfig should be usable");
            }
        });

        this.testCase({
            name: "IAnalyticsConfig: Interface extends IConfig and IConfiguration",
            test: () => {
                // Create a test config that implements IAnalyticsConfig
                const testConfig: IAnalyticsConfig = {
                    instrumentationKey: "test-key",
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

                // Test that it can be used as IConfig
                const asIConfig: IConfig = testConfig;
                Assert.equal("test-account", asIConfig.accountId, "Should work as IConfig");
                Assert.equal(50, asIConfig.samplingPercentage, "Should access IConfig properties");

                // Test that it can be used as IConfiguration  
                const asIConfiguration: IConfiguration = testConfig;
                Assert.equal("test-connection-string", asIConfiguration.connectionString, "Should work as IConfiguration");
                Assert.equal("test-key", asIConfiguration.instrumentationKey, "Should access IConfiguration properties");
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
                Assert.equal(75, analyticsPlugin.config.samplingPercentage, "Should access samplingPercentage through IAnalyticsConfig");
                Assert.equal("test-account-id", analyticsPlugin.config.accountId, "Should access accountId through IAnalyticsConfig");
                Assert.equal(30 * 60 * 1000, analyticsPlugin.config.sessionRenewalMs, "Should access sessionRenewalMs through IAnalyticsConfig");
                Assert.equal(24 * 60 * 60 * 1000, analyticsPlugin.config.sessionExpirationMs, "Should access sessionExpirationMs through IAnalyticsConfig");
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
                
                if (core.config.extensionConfig && core.config.extensionConfig[AnalyticsPluginIdentifier]) {
                    const extConfig = core.config.extensionConfig[AnalyticsPluginIdentifier] as IAnalyticsConfig;
                    Assert.equal(80, extConfig.samplingPercentage, "Extension config should have correct samplingPercentage");
                    Assert.equal("ext-specific-account", extConfig.accountId, "Extension config should have correct accountId");
                    Assert.equal(20 * 60 * 1000, extConfig.sessionRenewalMs, "Extension config should have correct sessionRenewalMs");
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
    }
}