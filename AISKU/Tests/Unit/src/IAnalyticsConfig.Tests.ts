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
                    accountId: "test-account"
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