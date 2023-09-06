import { ApplicationInsights, IApplicationInsights, LoggingSeverity, _eInternalMessageId } from '../../../src/applicationinsights-web'
import { Sender } from '@microsoft/applicationinsights-channel-js';
import { AITestClass, Assert, PollingAssert } from '@microsoft/ai-test-framework';
import { SinonSpy } from 'sinon';
import { newId } from '@microsoft/applicationinsights-core-js';
import { BreezeChannelIdentifier } from '@microsoft/applicationinsights-common';

export class ThrottleSentMessage extends AITestClass {
    private readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';

    private _ai: IApplicationInsights;

    // Sinon
    private errorSpy: SinonSpy;
    private successSpy: SinonSpy;
    private loggingSpy: SinonSpy;

    private delay = 100;

    constructor() {
        super("ThrottleSentMessage");
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

        this.testCaseAsync({
            name: "ThrottleSentMessage: RDD Telemetry sanitizes long names",
            stepDelay: this.delay,
            steps: [
                () => {
                    this._ai.trackDependencyData({
                        id: newId(),
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
                    Assert.equal(_eInternalMessageId.StringValueTooLong, this.loggingSpy.args[0][1]);
                })
        })
    }
}
