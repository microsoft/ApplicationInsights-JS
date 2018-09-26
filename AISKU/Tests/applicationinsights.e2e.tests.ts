/// <reference path='./TestFramework/Common.ts' />
import { Initialization } from '../Initialization'
import { ApplicationInsights } from 'applicationinsights-analytics-js';
import { Sender } from 'applicationinsights-channel-js';

export class ApplicationInsightsTests extends TestClass {
    private static readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private static readonly _expectedTrackMethods = [
        "startTrackPage",
        "stopTrackPage",
        "trackException",
        "trackMetric",
        "trackPageView",
        "trackTrace"
    ];
    
    private _ai: ApplicationInsights;
    private _aiName: string = 'ApplicationInsightsAnalytics';

    // Sinon
    private errorSpy: SinonSpy;
    private successSpy: SinonSpy;
    private loggingSpy: SinonSpy;

    public testInitialize() {
        try {
            this.useFakeServer = false;
            (<any>sinon.fakeServer).restore();
            this.useFakeTimers = false;
            this.clock.restore();

            var init = new Initialization({
                config: {
                    instrumentationKey: ApplicationInsightsTests._instrumentationKey,
                    extensionConfig: {
                        'AppInsightsChannelPlugin': {
                            maxBatchInterval: 2000
                        }
                    }
                },
                queue: []
            });
            this._ai = init.loadAppInsights();

            // Setup Sinon stuff
            const sender: Sender = this._ai.core['_extensions'][2].channelQueue[0][0];
            this.errorSpy = this.sandbox.spy(sender, '_onError');
            this.successSpy = this.sandbox.spy(sender, '_onSuccess');
            this.loggingSpy = this.sandbox.stub(this._ai.core.logger, 'throwInternal');
        } catch (e) {
            console.error('Failed to initialize');
        }
    }

    public testCleanup() {
        this.useFakeServer = true;
        this.useFakeTimers = true;
    }

    public registerTests() {
        this.addGenericE2ETests();
        this.addAnalyticsApiTests();
        this.addAsyncTests();
    }

    public addGenericE2ETests(): void {
        this.testCase({
            name: 'E2E.GenericTests: ApplicationInsightsAnalytics is loaded correctly',
            test: () => {
                Assert.ok(this._ai, 'App Analytics exists');
                Assert.equal(true, this._ai['_isInitialized'], 'App Analytics is initialized');

                // Assert.deepEqual(this._ai, window[this._aiName], 'AI is available from window');

                Assert.ok(this._ai.core, 'Core exists');
                Assert.equal(true, this._ai.core['_isInitialized'], 
                'Core is initialized');
            }
        });
    }

    public addAnalyticsApiTests(): void {
        this.testCase({
            name: 'E2E.AnalyticsApiTests: Public Members exist',
            test: () => {
                ApplicationInsightsTests._expectedTrackMethods.forEach(method => {
                    Assert.ok(this._ai[method], `${method} exists`);
                    Assert.equal('function', typeof this._ai[method], `${method} is a function`);
                });
            }
        });
    }

    public addAsyncTests(): void {
        var boilerPlateAsserts = () => {
            Assert.ok(this.successSpy.called, "success");
            Assert.ok(!this.errorSpy.called, "no error sending");
            var isValidCallCount = this.loggingSpy.callCount === 0;
            Assert.ok(isValidCallCount, "logging spy was called 0 time(s)");
            if (!isValidCallCount) {
                while (this.loggingSpy.args.length) {
                    Assert.ok(false, "[warning thrown]: " + this.loggingSpy.args.pop());
                }
            }
        }
        var asserts: any = (expectedCount: number) => [() => {
            var message = "polling: " + new Date().toISOString();
            Assert.ok(true, message);
            console.log(message);
    
            if (this.successSpy.called) {
                boilerPlateAsserts();
                this.testCleanup();
            } else if (this.errorSpy.called || this.loggingSpy.called) {
                boilerPlateAsserts();
            }
        },
        (PollingAssert.createPollingAssert(() => {
            Assert.ok(true, "* checking success spy " + new Date().toISOString());

            if(this.successSpy.called) {
                let currentCount: number = 0;
                this.successSpy.args.forEach(call => {
                    currentCount += call[1];
                });
                console.log('curr: ' + currentCount + ' exp: ' + expectedCount);
                return currentCount === expectedCount;
            } else {
                return false;
            }
        }, "sender succeeded", 10, 1000))];

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackTrace sends to backend',
            stepDelay: 1,
            steps: [() => {
                this._ai.trackTrace({message: 'trace'});
            }].concat(asserts(1))
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException sends to backend',
            stepDelay: 1,
            steps: [() => {
                let exception: Error = null;
                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    exception = e;
                    this._ai.trackException({error: exception});
                }
                Assert.ok(exception);
            }].concat(asserts(1))
        });

        this.testCaseAsync({
            name: "TelemetryContext: track metric",
            stepDelay: 1,
            steps: [
                () => {
                    console.log("* calling trackMetric " + new Date().toISOString());
                    for (var i = 0; i < 100; i++) {
                        this._ai.trackMetric({name: "test" + i, average: Math.round(100 * Math.random())});
                    }
                    console.log("* done calling trackMetric " + new Date().toISOString());
                }
            ].concat(asserts(100))
        });

        this.testCaseAsync({
            name: "TelemetryContext: track page view",
            stepDelay: 1,
            steps: [
                () => {
                    this._ai.trackPageView({}); // sends 2
                }
            ].concat(asserts(2))
        });

        this.testCaseAsync({
            name: "TelemetryContext: track all types in batch",
            stepDelay: 1,
            steps: [
                () => {
                    var exception = null;
                    try {
                        window["a"]["b"]();
                    } catch (e) {
                        exception = e;
                    }

                    Assert.ok(exception);

                    this._ai.trackException({error: exception});
                    this._ai.trackMetric({name: "test", average: Math.round(100 * Math.random())});
                    this._ai.trackTrace({message: "test"});
                    this._ai.trackPageView({}); // sends 2
                }
            ].concat(asserts(5))
        });

        this.testCaseAsync({
            name: "TelemetryContext: track all types in a large batch",
            stepDelay: 1,
            steps: [
                () => {
                    var exception = null;
                    try {
                        window["a"]["b"]();
                    } catch (e) {
                        exception = e;
                    }
                    Assert.ok(exception);

                    for (var i = 0; i < 100; i++) {
                        this._ai.trackException({error: exception});
                        this._ai.trackMetric({name: "test", average: Math.round(100 * Math.random())});
                        this._ai.trackTrace({message: "test"});
                        this._ai.trackPageView({name: `${i}`}); // sends 2 1st time
                    }
                }
            ].concat(asserts(401))
        });
    }
}
