import { AppInsightsSku as ApplicationInsights } from "../../../src/AISku";
import { IConfig } from "@microsoft/otel-core-js";
import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { utlRemoveSessionStorage } from "@microsoft/otel-core-js";
import { AppInsightsCore, IConfiguration, isFunction, onConfigChange } from "@microsoft/otel-core-js";

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
                let theConfig: IConfiguration & IConfig = {
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
                
                let handler = onConfigChange(theConfig, (details) => {
                    onChangeCalled++;
                    Assert.equal(TestInstrumentationKey, details.cfg.instrumentationKey, "Expect the iKey to be set");
                    if (details.cfg.samplingPercentage !== undefined) {
                        Assert.equal(expectedSamplingPercentage, details.cfg.samplingPercentage, "Expect the sampling percentage to be set");
                    }
                });

                // Initial call should happen
                Assert.equal(1, onChangeCalled, "OnCfgChange was called exactly once initially");
                let initialCallCount = onChangeCalled;

                // Change a config value
                expectedSamplingPercentage = 75;
                (theConfig as any).samplingPercentage = expectedSamplingPercentage;

                // Wait for the change to propagate
                this.clock.tick(1);
                Assert.ok(onChangeCalled > initialCallCount, "Expected the onChanged was called when config changed");

                // Remove the handler
                handler.rm();
                let callCountBeforeRemoval = onChangeCalled;
                
                expectedSamplingPercentage = 25;
                (theConfig as any).samplingPercentage = expectedSamplingPercentage;

                this.clock.tick(1);
                Assert.equal(callCountBeforeRemoval, onChangeCalled, "Expected the onChanged was not called after handler removal");
            }
        });
    }
}