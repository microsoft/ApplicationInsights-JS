/// <reference path='./TestFramework/Common.ts' />
import { ApplicationInsights, IApplicationInsights, Util, LoggingSeverity, _InternalMessageId } from '../src/applicationinsights-web'
import { Sender } from '@microsoft/applicationinsights-channel-js';

export class SanitizerE2ETests extends TestClass {
    private readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';

    private _ai: IApplicationInsights;

    // Sinon
    private errorSpy: SinonSpy;
    private successSpy: SinonSpy;
    private loggingSpy: SinonSpy;

    private delay = 100;

    public testInitialize() {
        try{
            this.useFakeServer = false;
            (sinon.fakeServer as any).restore();
            this.useFakeTimers = false;
            this.clock.restore();

            const init = new ApplicationInsights({
                config: {
                    instrumentationKey: this._instrumentationKey,
                    extensionConfig: {
                        'AppInsightsChannelPlugin': {
                            maxBatchInterval: 500
                        }
                    }
                },
                queue: [],
                version: 2.0
            });
            this._ai = init.loadAppInsights();

            // Setup Sinon stuff
            const sender: Sender = this._ai.appInsights.core['_channelController'].channelQueue[0][0];
            this.errorSpy = this.sandbox.spy(sender, '_onError');
            this.successSpy = this.sandbox.spy(sender, '_onSuccess');
            this.loggingSpy = this.sandbox.stub(this._ai.appInsights.core.logger, 'throwInternal');
        } catch (e) {
            console.error('Failed to initialize');
        }
    }

    public testCleanup() {
        this.useFakeServer = true;
        this.useFakeTimers = true;
    }

    public registerTests() {
        this.addAsyncTests();
    }

    private addAsyncTests(): void {
        const boilerPlateAsserts = () => {
            Assert.ok(this.successSpy.called, "success");
            Assert.ok(!this.errorSpy.called, "no error sending");
        }

        this.testCaseAsync({
            name: "SanitizerE2ETests: RDD Telemetry sanitizes long names",
            stepDelay: this.delay,
            steps: [
                () => {
                    this._ai.trackDependencyData({
                        id: Util.newId(),
                        name: new Array(1234).join("a"), // exceeds max of 1024
                        responseCode: 200
                    });
                }
            ].concat(PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (this.successSpy.called || this.errorSpy.called);
            }, "Wait for response") as any)
                .concat(() => {
                    boilerPlateAsserts();
                })
                .concat(() => {
                    Assert.ok(this.loggingSpy.called);
                    Assert.equal(LoggingSeverity.WARNING, this.loggingSpy.args[0][0]);
                    Assert.equal(_InternalMessageId.StringValueTooLong, this.loggingSpy.args[0][1]);
                })
        })

        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts sanitized names",
            stepDelay: this.delay,
            steps: [
                () => {

                    const properties = {
                        "property1%^~`": "hello",
                        "property2*&#+": "world"
                    };

                    const measurements = {
                        "measurement@|": 300
                    };

                    this._ai.trackMetric({name: "test", average: 5});
                },
            ].concat(PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
            }, "Wait for response") as any)
                .concat(() => {
                    boilerPlateAsserts();
                })
        });

        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts legal charater set names",
            stepDelay: this.delay,
            steps: [
                () => {
                    const properties = {
                        "abcdefghijklmnopqrstuvwxyz": "hello",
                        "ABCDEFGHIJKLMNOPQRSTUVWXYZ": "world"
                    };

                    const measurements = {
                        "(1234567890/ \_-.)": 300
                    };

                    this._ai.trackMetric({name: "test", average: 5});
                },
            ].concat(PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
            }, "Wait for response") as any)
                .concat(() => {
                    boilerPlateAsserts();
                })
        });

        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts up to 150 charaters for names",
            stepDelay: this.delay,
            steps: [
                () => {
                    const len = 150;
                    const name = new Array(len + 1).join('a');

                    this._ai.trackMetric({name, average: 5});
                },
            ].concat(PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
            }, "Wait for response") as any)
                .concat(() => {
                    boilerPlateAsserts();
                })
        });

        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts up to 1024 charaters for values",
            stepDelay: this.delay,
            steps: [
                () => {
                    const len = 1024;
                    const value = new Array(len + 1).join('a');

                    const properties = {
                        "testProp": value
                    };

                    this._ai.trackMetric({name: "test", average: 5});
                },
            ].concat(PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
            }, "Wait for response") as any)
                .concat(() => {
                    boilerPlateAsserts();
                })
        });

        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts up to 2048 charaters for url",
            stepDelay: this.delay,
            steps: [
                () => {
                    const len = 2048;
                    let url = "http://hello.com/";
                    url = url + new Array(len - url.length + 1).join('a');

                    this._ai.trackPageView({name: "test", uri: url});
                },
            ].concat(PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
            }, "Wait for response") as any)
                .concat(() => {
                    boilerPlateAsserts();
                })
        });

        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts up to 32768 charaters for messages",
            stepDelay: this.delay,
            steps: [
                () => {
                    const len = 32768;
                    const message = new Array(len + 1).join('a');

                    this._ai.trackTrace({message, severityLevel: 0});
                },
            ].concat(PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
            }, "Wait for response") as any)
                .concat(() => {
                    boilerPlateAsserts();
                })
        });
    }
}
