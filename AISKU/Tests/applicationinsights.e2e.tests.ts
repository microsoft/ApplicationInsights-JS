/// <reference path='./TestFramework/Common.ts' />
import { AppInsightsSDK } from '../AppInsightsSDK'
import { IAppInsights } from 'applicationinsights-analytics-js';

export class ApplicationInsightsTests extends TestClass {
    private _ai: IAppInsights;
    private _aiName: string = 'AppInsights';

    public testInitialize() {
        try{
            this._ai = AppInsightsSDK.Initialize({instrumentationKey: 'abc'}, this._aiName);
        } catch (e) {
            console.error('Failed to initialize');
        }
    }

    public testCleanup() {
    }

    public registerTests() {
        // var boilerPlateAsserts = () => {
        //     Assert.ok(this.successSpy.called, "success");
        //     Assert.ok(!this.errorSpy.called, "no error sending");
        //     var isValidCallCount = this.loggingSpy.callCount === 0;
        //     Assert.ok(isValidCallCount, "logging spy was called 0 time(s)");
        //     if (!isValidCallCount) {
        //         while (this.loggingSpy.args.length) {
        //             Assert.ok(false, "[warning thrown]: " + this.loggingSpy.args.pop());
        //         }
        //     }
        // }

        // var asserts = [];
        // asserts.push(() => {
        //     var message = "polling: " + new Date().toISOString();
        //     Assert.ok(true, message);
        //     console.log(message);

        //     if (this.successSpy.called) {
        //         boilerPlateAsserts();
        //         this.testCleanup();
        //     } else if (this.errorSpy.called || this.loggingSpy.called) {
        //         boilerPlateAsserts();
        //     }
        // });

        this.testCase({
            name: 'E2E.GenericTests: ApplicationInsightsAnalytics is loaded correctly',
            test: () => {
                    Assert.ok(this._ai);
                    Assert.deepEqual(this._ai, window[this._aiName]);
                    Assert.ok(this._ai['core']);
                    Assert.equal(true, this._ai['core']['_isInitialized']);
                    Assert.equal(true, this._ai['appInsights']['_isInitialized']);
            }
        });

        this.addAnalyticsApiTests();
    }

    public addAnalyticsApiTests(): void {
        this.testCase({
            name: 'E2E.AnalyticsApiTests: Public Members exist',
            test: () => {
                Assert.ok(this._ai.trackTrace);
                Assert.ok(this._ai.trackException);
            }
        });

        this.testCase({
            name: 'E2E.AnalyicsApiTests: Track sends to backend',
            test: () => {
                // Act
                this._ai.trackTrace({message: 'Test message'});
                this._ai.trackMetric({name: 'test metric', average: 123});

                // Verify
                Assert.ok(true);
            }
        });
    }
}
