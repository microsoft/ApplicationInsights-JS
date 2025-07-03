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
                    samplingPercentage: 50,
                    sessionRenewalMs: 1800000,
                    disableExceptionTracking: false
                };
                Assert.ok(testConfig.samplingPercentage === 50, "IAnalyticsConfig should be usable with analytics-specific properties");
            }
        });

        this.testCase({
            name: "IAnalyticsConfig: Interface contains specific analytics configuration properties",
            test: () => {
                // Create a test config that implements IAnalyticsConfig with proper analytics properties
                const testConfig: IAnalyticsConfig = {
                    sessionRenewalMs: 1800000,
                    sessionExpirationMs: 86400000,
                    disableExceptionTracking: false,
                    samplingPercentage: 75,
                    enableAutoRouteTracking: true,
                    isStorageUseDisabled: false,
                    enableDebug: false
                };

                // Verify analytics-specific properties are accessible
                Assert.equal(1800000, testConfig.sessionRenewalMs, "Should access sessionRenewalMs property");
                Assert.equal(75, testConfig.samplingPercentage, "Should access samplingPercentage property");
                Assert.equal(true, testConfig.enableAutoRouteTracking, "Should access enableAutoRouteTracking property");
                Assert.equal(false, testConfig.isStorageUseDisabled, "Should access isStorageUseDisabled property");
            }
        });

        this.testCase({
            name: "IAnalyticsConfig: Interface compatibility with existing functionality",
            test: () => {
                // Test that the interface doesn't break existing functionality
                // Use root configuration (IConfiguration) for ApplicationInsights initialization
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