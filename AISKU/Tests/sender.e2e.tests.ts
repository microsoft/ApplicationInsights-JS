/// <reference path='./TestFramework/Common.ts' />
"use strict"
import { Initialization } from '../Initialization'
import { ApplicationInsights } from 'applicationinsights-analytics-js';
import { Sender } from 'applicationinsights-channel-js';

export class SenderE2ETests extends TestClass {
    private readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private readonly _bufferName = 'AI_buffer';
    private readonly _sentBufferName = 'AI_sentBuffer';
    
    private _ai: ApplicationInsights;
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
            (<any>sinon.fakeServer).restore();
            this.useFakeTimers = false;
            this.clock.restore();

            var init = new Initialization({
                config: {
                    instrumentationKey: this._instrumentationKey,
                    extensionConfig: {
                        'AppInsightsChannelPlugin': {
                            maxBatchInterval: 2000,
                            maxBatchSizeInBytes: 10*1024*1024 // 10 MB
                        }
                    }
                },
                queue: []
            });
            this._ai = init.loadAppInsights();

            // Setup Sinon stuff
            this._sender = this._ai.core['_extensions'][2].channelQueue[0][0];
            this._sender._buffer.clear();
            this.errorSpy = this.sandbox.spy(this._sender, '_onError');
            this.successSpy = this.sandbox.spy(this._sender, '_onSuccess');
            this.loggingSpy = this.sandbox.stub(this._ai.core.logger, 'throwInternal');
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
            .concat(<any>PollingAssert.createPollingAssert(() => this.successSpy.called && this.isSessionSentEmpty(), "SentBuffer Session storage is empty", 5, 1000))
            .concat(<any>PollingAssert.createPollingAssert(() => this.successSpy.called && this.isSessionEmpty(), "Buffer Session storage is empty", 5, 1000))
        });
    }

    private addTrackEndpointTests(): void {
        const SENT_ITEMS: number = 100;
        const SENT_TYPES: number = 4;
        const OFFSET: number = 1; // from trackPageView

        this.testCaseAsync({
            name: 'EndpointTests: telemetry sent to endpoint fills to maxBatchSize',
            stepDelay: this.delay,
            steps: [
                () => {
                    for (var i = 0; i < SENT_ITEMS; i++) {
                        this._ai.trackException({error: new Error()});
                        this._ai.trackMetric({name: "test", average: Math.round(100 * Math.random())});
                        this._ai.trackTrace({message: "test"});
                        this._ai.trackPageView({name: `${i}`});
                    }
                }
            ]
            .concat(this.waitForResponse())
            .concat(this.boilerPlateAsserts)
            .concat(<any>PollingAssert.createPollingAssert(() => {
                let currentCount: number = 0;

                if (this.successSpy.called) {
                    this.successSpy.args.forEach(call => {
                        const acceptedItems = call[1];
                        currentCount += acceptedItems; // number of accepted items
                    });
                    return currentCount === SENT_ITEMS * SENT_TYPES + OFFSET;
                }

                return false;
            }, `Backend accepts ${SENT_ITEMS} items`, 5, 1000))
            .concat(<any>PollingAssert.createPollingAssert(() => {
                return this.successSpy.calledOnce;
            }, "Tracks are sent in ONE batch", 5, 1000))
        });
    }

    private waitForResponse() {
        return <any>PollingAssert.createPollingAssert(() => {
            return (this.successSpy.called || this.errorSpy.called);
        }, "Wait for response" + new Date().toISOString(), 5, 1000)
    }

    private boilerPlateAsserts() {
        Assert.ok(this.successSpy.called, "success");
        Assert.ok(!this.errorSpy.called, "no error sending");
        Assert.ok(this.clearSpy.called, "clearSent called");
        var isValidCallCount = this.loggingSpy.callCount === 0;
        Assert.ok(isValidCallCount, "logging spy was called 0 time(s)");
        if (!isValidCallCount) {
            while (this.loggingSpy.args.length) {
                Assert.ok(false, "[warning thrown]: " + this.loggingSpy.args.pop());
            }
        }
    }

    private isSessionEmpty(): boolean {
        let buffer: string = (<any>this._sender)._buffer.getBuffer(this._bufferName);
        return buffer.length === 0;
    }

    private isSessionSentEmpty(): boolean {
        let buffer: string = (<any>this._sender)._buffer.getBuffer(this._sentBufferName);
        return buffer.length === 0;
    }
}
