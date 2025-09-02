import { ApplicationInsights, IApplicationInsights, LoggingSeverity, _eInternalMessageId } from '../../../src/applicationinsights-web'
import { Sender } from '@microsoft/applicationinsights-channel-js';
import { AITestClass, Assert, PollingAssert } from '@microsoft/ai-test-framework';
import { SinonSpy } from 'sinon';
import { newId } from '@microsoft/applicationinsights-core-js';
import { BreezeChannelIdentifier } from '@microsoft/applicationinsights-common';

export class SanitizerE2ETests extends AITestClass {
    private readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';

    private _ai: IApplicationInsights;

    // Sinon
    private errorSpy: SinonSpy;
    private successSpy: SinonSpy;
    private loggingSpy: SinonSpy;

    private delay = 100;

    constructor() {
        super("SanitizerE2ETests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
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
            const sender: Sender = this._ai.getPlugin<Sender>(BreezeChannelIdentifier).plugin;
            this.errorSpy = this.sandbox.spy(sender, '_onError');
            this.successSpy = this.sandbox.spy(sender, '_onSuccess');
            this.loggingSpy = this.sandbox.stub(this._ai.appInsights.core.logger, 'throwInternal');
        } catch (e) {
            console.error('Failed to initialize');
        }
    }

    public testFinishedCleanup(): void {
        if (this._ai && this._ai.unload) {
            // force unload
            this._ai.unload(false);
        }
    }

    public registerTests() {
        this.addAsyncTests();
    }

    private addAsyncTests(): void {
        const boilerPlateAsserts = () => {
            Assert.ok(this.successSpy.called, "success");
            Assert.ok(!this.errorSpy.called, "no error sending");
        }

        this.testCase({
            name: "SanitizerE2ETests: RDD Telemetry sanitizes long names",
            test: () => {
                return this._asyncQueue().add(() => {
                    this._ai.trackDependencyData({
                        id: newId(),
                        name: new Array(1234).join("a"), // exceeds max of 1024
                        responseCode: 200
                    });
                })
                .add(PollingAssert.asyncTaskPollingAssert(() => {
                    Assert.ok(true, "waiting for response " + new Date().toISOString());
                    return (this.successSpy.called || this.errorSpy.called);
                }, "Wait for response") as any)
                .add(() => {
                    boilerPlateAsserts();
                })
                .add(() => {
                    Assert.ok(this.loggingSpy.called);
                    Assert.equal(LoggingSeverity.WARNING, this.loggingSpy.args[0][0]);
                    Assert.equal(_eInternalMessageId.StringValueTooLong, this.loggingSpy.args[0][1]);
                });
            }
        })

        this.testCase({
            name: "Sanitizer2ETests: Data platform accepts sanitized names",
            test: () => {
                return this._asyncQueue().add(() => {

                    const properties = {
                        "property1%^~`": "hello",
                        "property2*&#+": "world"
                    };

                    const measurements = {
                        "measurement@|": 300
                    };

                    this._ai.trackMetric({name: "test", average: 5});
                })
                .add(PollingAssert.asyncTaskPollingAssert(() => {
                    Assert.ok(true, "waiting for response " + new Date().toISOString());
                    return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
                }, "Wait for response") as any)
                .add(() => {
                    boilerPlateAsserts();
                });
            }
        });

        this.testCase({
            name: "Sanitizer2ETests: Data platform accepts legal charater set names",
            test: () => {
                return this._asyncQueue().add(() => {
                    const properties = {
                        "abcdefghijklmnopqrstuvwxyz": "hello",
                        "ABCDEFGHIJKLMNOPQRSTUVWXYZ": "world"
                    };

                    const measurements = {
                        "(1234567890/ \_-.)": 300
                    };

                    this._ai.trackMetric({name: "test", average: 5});
                })
                .add(PollingAssert.asyncTaskPollingAssert(() => {
                    Assert.ok(true, "waiting for response " + new Date().toISOString());
                    return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
                }, "Wait for response") as any)
                .add(() => {
                    boilerPlateAsserts();
                });
            }
        });

        this.testCase({
            name: "Sanitizer2ETests: Data platform accepts up to 150 charaters for names",
            test: () => {
                return this._asyncQueue().add(() => {
                    const len = 150;
                    const name = new Array(len + 1).join('a');

                    this._ai.trackMetric({name, average: 5});
                })
                .add(PollingAssert.asyncTaskPollingAssert(() => {
                    Assert.ok(true, "waiting for response " + new Date().toISOString());
                    return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
                }, "Wait for response") as any)
                .add(() => {
                    boilerPlateAsserts();
                });
            }
        });

        this.testCase({
            name: "Sanitizer2ETests: Data platform accepts up to 1024 charaters for values",
            test: () => {
                return this._asyncQueue().add(() => {
                    const len = 1024;
                    const value = new Array(len + 1).join('a');

                    const properties = {
                        "testProp": value
                    };

                    this._ai.trackMetric({name: "test", average: 5});
                })
                .add(PollingAssert.asyncTaskPollingAssert(() => {
                    Assert.ok(true, "waiting for response " + new Date().toISOString());
                    return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
                }, "Wait for response") as any)
                .add(() => {
                    boilerPlateAsserts();
                });
            }
        });

        this.testCase({
            name: "Sanitizer2ETests: Data platform accepts up to 2048 characters for url",
            test: () => {
                return this._asyncQueue().add(() => {
                    const len = 2048;
                    let url = "http://hello.com/";
                    url = url + new Array(len - url.length + 1).join('a');

                    this._ai.trackPageView({name: "test", uri: url});
                })
                .add(PollingAssert.asyncTaskPollingAssert(() => {
                    Assert.ok(true, "waiting for response " + new Date().toISOString());
                    return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
                }, "Wait for response") as any)
                .add(() => {
                    boilerPlateAsserts();
                });
            }
        });

        this.testCase({
            name: "Sanitizer2ETests: Data platform accepts up to 32768 characters for messages",
            test: () => {
                return this._asyncQueue().add(() => {
                    const len = 32768;
                    const message = new Array(len + 1).join('a');

                    this._ai.trackTrace({message, severityLevel: 0});
                })
                .add(PollingAssert.asyncTaskPollingAssert(() => {
                    Assert.ok(true, "waiting for response " + new Date().toISOString());
                    return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
                }, "Wait for response") as any)
                .add(() => {
                    boilerPlateAsserts();
                });
            }
        });
    }
}
