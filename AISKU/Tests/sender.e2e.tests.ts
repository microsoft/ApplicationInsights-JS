/// <reference path='./TestFramework/Common.ts' />
"use strict"
import { ApplicationInsights, IApplicationInsights } from '../src/applicationinsights-web'
import { Sender } from '@microsoft/applicationinsights-channel-js';

export class SenderE2ETests extends TestClass {
    private readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private readonly _bufferName = 'AI_buffer';
    private readonly _sentBufferName = 'AI_sentBuffer';

    private _ai: IApplicationInsights;
    private _sender: Sender;

    // Sinon
    private errorSpy: SinonSpy;
    private successSpy: SinonSpy;
    private loggingSpy: SinonSpy;
    private clearSpy: SinonSpy;

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
                    loggingLevelConsole: 999,
                    extensionConfig: {
                        'AppInsightsChannelPlugin': {
                            maxBatchInterval: 2000,
                            maxBatchSizeInBytes: 10*1024*1024 // 10 MB
                        }
                    }
                },
                queue: [],
                version: 2.0
            });
            this._ai = init.loadAppInsights();

            // Setup Sinon stuff
            this._sender = this._ai.appInsights.core['_channelController'].channelQueue[0][0];
            this._sender._buffer.clear();
            this.errorSpy = this.sandbox.spy(this._sender, '_onError');
            this.successSpy = this.sandbox.spy(this._sender, '_onSuccess');
            this.loggingSpy = this.sandbox.stub(this._ai.appInsights.core.logger, 'throwInternal');
            this.clearSpy = this.sandbox.spy(this._sender._buffer, 'clearSent');
        } catch (e) {
            console.error('Failed to initialize');
        }
    }

    public testCleanup() {
        this.useFakeServer = true;
        this.useFakeTimers = true;

        this.successSpy.restore();
    }

    public registerTests() {
        this.addAsyncTests();
        this.addTrackEndpointTests();
        this.addRetryTests();
    }

    private addRetryTests() {
        let handle;
        this.testCaseAsync({
            name: 'Offline: offline telemetry is retried',
            stepDelay: this.delay,
            steps: [
                () => {
                    handle = setInterval(() => {this._ai.trackTrace({message: 'intermittent message'})}, 500);
                    Assert.ok(true, 'sent event');
                }
            ]
            .concat(this.waitForResponse())
            .concat(this.boilerPlateAsserts)
            .concat(PollingAssert.createPollingAssert(() => {
                let currentCount: number = 0;

                if (this.successSpy.called) {
                    this.successSpy.args.forEach(call => {
                        const acceptedItems = call[1];
                        currentCount += acceptedItems; // number of accepted items
                    });
                    console.log('currentCount', currentCount);
                    return currentCount >= 20;
                }

                return false;
            }, 'All items are sent', 600, 1000) as any)
            .concat(() => {
                clearInterval(handle);
                Assert.ok(true, 'handle cleared');
            })
        });
    }

    private addAsyncTests(): void {
        this.testCaseAsync({
            name: 'SendBuffer: Session storage is cleared after a send',
            stepDelay: this.delay,
            steps: [
                () => {
                    this._ai.trackTrace({message: 'test trace'});
                }
            ]
            .concat(this.waitForResponse())
            .concat(this.boilerPlateAsserts)
            .concat(PollingAssert.createPollingAssert(() => this.successSpy.called && this.isSessionSentEmpty(), "SentBuffer Session storage is empty", 15, 1000) as any)
            .concat(PollingAssert.createPollingAssert(() => this.successSpy.called && this.isSessionEmpty(), "Buffer Session storage is empty", 15, 1000) as any)
        });
    }

    private addTrackEndpointTests(): void {
        const SENT_ITEMS: number = 100;
        const SENT_TYPES: number = 4;

        this.testCaseAsync({
            name: 'EndpointTests: telemetry sent to endpoint fills to maxBatchSize',
            stepDelay: this.delay,
            steps: [
                () => {
                    for (let i = 0; i < SENT_ITEMS; i++) {
                        this._ai.trackException({error: new Error()});
                        this._ai.trackMetric({name: "test", average: Math.round(100 * Math.random())});
                        this._ai.trackTrace({message: "test"});
                        this._ai.trackTrace({message: "test2"});
                    }
                }
            ]
            .concat(this.waitForResponse())
            .concat(this.boilerPlateAsserts)
            .concat(PollingAssert.createPollingAssert(() => {
                let currentCount: number = 0;

                if (this.successSpy.called) {
                    this.successSpy.args.forEach(call => {
                        const acceptedItems = call[1];
                        currentCount += acceptedItems; // number of accepted items
                    });
                    return currentCount === SENT_ITEMS * SENT_TYPES;
                }

                return false;
            }, `Backend accepts ${SENT_ITEMS} items`, 15, 1000) as any)
            .concat(PollingAssert.createPollingAssert(() => {
                return this.successSpy.calledOnce;
            }, "Tracks are sent in ONE batch", 15, 1000) as any)
        });
    }

    private waitForResponse() {
        return PollingAssert.createPollingAssert(() => {
            return (this.successSpy.called || this.errorSpy.called);
        }, "Wait for response" + new Date().toISOString(), 15, 1000) as any
    }

    private boilerPlateAsserts() {
        Assert.ok(this.successSpy.called, "success");
        Assert.ok(!this.errorSpy.called, "no error sending");
        Assert.ok(this.clearSpy.called, "clearSent called");
        const isValidCallCount = this.loggingSpy.callCount === 0;
        Assert.ok(isValidCallCount, "logging spy was called 0 time(s)");
        if (!isValidCallCount) {
            while (this.loggingSpy.args.length) {
                Assert.ok(false, "[warning thrown]: " + this.loggingSpy.args.pop());
            }
        }
    }

    private isSessionEmpty(): boolean {
        const buffer: string = (this._sender as any)._buffer.getBuffer(this._bufferName);
        return buffer.length === 0;
    }

    private isSessionSentEmpty(): boolean {
        const buffer: string = (this._sender as any)._buffer.getBuffer(this._sentBufferName);
        return buffer.length === 0;
    }
}
