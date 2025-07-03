import { ApplicationInsights, IAnalyticsConfig, IAppInsights, IConfig, ApplicationAnalytics } from "../../../src/applicationinsights-web";
import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { AnalyticsPluginIdentifier, utlRemoveSessionStorage } from "@microsoft/applicationinsights-common";
import { AppInsightsCore, IConfiguration, isFunction, onConfigChange } from "@microsoft/applicationinsights-core-js";
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
                Assert.equal(50, testConfig.samplingPercentage, "IAnalyticsConfig should be usable with analytics-specific properties");
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
                Assert.ok(isFunction(init.trackEvent), "trackEvent should be available");
                Assert.ok(isFunction(init.trackPageView), "trackPageView should be available");
                Assert.ok(isFunction(init.trackException), "trackException should be available");
                Assert.ok(isFunction(init.trackTrace), "trackTrace should be available");
                Assert.ok(isFunction(init.trackMetric), "trackMetric should be available");
                Assert.ok(isFunction(init.trackDependencyData), "trackDependencyData should be available");
            }
        });

        this.testCase({
            name: "IAnalyticsConfig: onConfigChange integration test",
            useFakeTimers: true,
            test: () => {
                let theConfig: IConfiguration = {
                    instrumentationKey: TestInstrumentationKey,
                    samplingPercentage: 50
                };

                const core = new AppInsightsCore();
                const init = new ApplicationInsights({
                    config: theConfig
                });
                this.onDone(() => {
                    if (init && init.unload) {
                        init.unload(false);
                    }
                });
                
                init.loadAppInsights();
                let onChangeCalled = 0;
                let expectedSamplingPercentage = 50;
                
                let handler = core.onCfgChange((details) => {
                    onChangeCalled++;
                    Assert.equal(TestInstrumentationKey, details.cfg.instrumentationKey, "Expect the iKey to be set");
                    if (details.cfg.samplingPercentage !== undefined) {
                        Assert.equal(expectedSamplingPercentage, details.cfg.samplingPercentage, "Expect the sampling percentage to be set");
                    }
                });

                // Initial call should happen
                Assert.ok(onChangeCalled >= 1, "OnCfgChange was called initially");
                let initialCallCount = onChangeCalled;

                // Change a config value
                expectedSamplingPercentage = 75;
                core.config.samplingPercentage = expectedSamplingPercentage;

                // Wait for the change to propagate
                this.clock.tick(1);
                Assert.ok(onChangeCalled > initialCallCount, "Expected the onChanged was called when config changed");

                // Remove the handler
                handler.rm();
                let callCountBeforeRemoval = onChangeCalled;
                
                expectedSamplingPercentage = 25;
                core.config.samplingPercentage = expectedSamplingPercentage;

                this.clock.tick(1);
                Assert.equal(callCountBeforeRemoval, onChangeCalled, "Expected the onChanged was not called after handler removal");
            }
        });
    }
}