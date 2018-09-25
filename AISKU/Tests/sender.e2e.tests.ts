/// <reference path='./TestFramework/Common.ts' />
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
                            maxBatchInterval: 500
                        }
                    }
                },
                queue: []
            });
            this._ai = init.loadAppInsights();

            // Setup Sinon stuff
            this._sender = this._ai.core['_extensions'][2].channelQueue[0][0];
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
            .concat(<any>PollingAssert.createPollingAssert(() => this.isSessionSentEmpty(), "SentBuffer Session storage is empty", 5, 1000))
            .concat(<any>PollingAssert.createPollingAssert(() => this.isSessionEmpty(), "Buffer Session storage is empty", 5, 1000))
        })
    }

    private waitForResponse() {
        return <any>PollingAssert.createPollingAssert(() => {
            return (this.successSpy.called || this.errorSpy.called);
        }, "Wait for response" + new Date().toISOString(), 5, 1000)
    }

    private boilerPlateAsserts() {
        Assert.ok(this.successSpy.called, "success");
        Assert.ok(!this.errorSpy.called, "no error sending");
        Assert.ok(this.clearSpy.calledOnce, "clearSent called");
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
