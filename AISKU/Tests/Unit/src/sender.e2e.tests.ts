import { ApplicationInsights, IApplicationInsights } from '../../../src/applicationinsights-web'
import { Sender } from '@microsoft/applicationinsights-channel-js';
import { BreezeChannelIdentifier, utlGetSessionStorage, utlRemoveSessionStorage } from '@microsoft/applicationinsights-common';
import { ActiveStatus, dumpObj, getJSON, isArray } from '@microsoft/applicationinsights-core-js';
import { SinonSpy } from 'sinon';
import { Assert, AITestClass, PollingAssert} from "@microsoft/ai-test-framework"
import { createAsyncResolvedPromise } from '@nevware21/ts-async';

export class SenderE2ETests extends AITestClass {
    private readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private readonly _bufferName = 'AI_buffer_1';
    private readonly _sentBufferName = 'AI_sentBuffer_1';

    private _ai: IApplicationInsights;
    private _sender: Sender;

    // Sinon
    private errorSpy: SinonSpy;
    private successSpy: SinonSpy;
    private loggingSpy: SinonSpy;
    private clearSpy: SinonSpy;

    private delay = 100;

    constructor() {
        super("SenderE2ETests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
            const init = new ApplicationInsights({
                config: {
                    instrumentationKey: this._instrumentationKey,
                    loggingLevelConsole: 999,
                    extensionConfig: {
                        'AppInsightsChannelPlugin': {
                            maxBatchInterval: 2000,
                            maxBatchSizeInBytes: 10*1024*1024 // 10 MB
                        },
                        ["AppInsightsCfgSyncPlugin"]: {
                            cfgUrl: ""
                        }
                        
                    }
                },
                queue: [],
                version: 2.0
            });
            this._ai = init.loadAppInsights();

            // Setup Sinon stuff
            this._sender = this._ai.getPlugin<Sender>(BreezeChannelIdentifier).plugin;
            this._sender._buffer.clear();
            this.errorSpy = this.sandbox.spy(this._sender, '_onError');
            this.successSpy = this.sandbox.spy(this._sender, '_onSuccess');
            this.loggingSpy = this.sandbox.stub(this._ai.appInsights.core.logger, 'throwInternal');
            this.clearSpy = this.sandbox.spy(this._sender._buffer, 'clearSent');
        } catch (e) {
            console.error('Failed to initialize');
        }
    }

    public testFinishedCleanup(): void {
        if (this._ai && this._ai.unload) {
            this._ai.unload(false);
        }
    }
    
    public testCleanup() {
        utlRemoveSessionStorage(null as any, "AI_sentBuffer", );
        utlRemoveSessionStorage(null as any, "AI_buffer", );

        this.successSpy.restore();
    }

    public registerTests() {
        this.addAsyncTests();
        this.addTrackEndpointTests();
        this.addRetryTests();
    }

    private addRetryTests() {
        let handle;
        this.testCase({
            name: 'Offline: offline telemetry is retried',
            pollDelay: this.delay,
            test: () => {
                handle = setInterval(() => {this._ai.trackTrace({message: 'intermittent message'})}, 500);
                Assert.ok(true, 'sent event');

                return this._asyncQueue()
                    .concat(this.waitForResponse())
                    .concat(this.boilerPlateAsserts)
                    .concat(PollingAssert.asyncTaskPollingAssert(() => {
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
                    });
            }
        });
    }

    private addAsyncTests(): void {
        this.testCase({
            name: 'SendBuffer: Session storage is cleared after a send',
            pollDelay: this.delay,
            timeout: 30000,
            test: () => {
                this._ai.trackTrace({message: 'test trace'});

                return this._asyncQueue()
                    .concat(this.waitForResponse())
                    .concat(this.boilerPlateAsserts)
                    .concat(PollingAssert.asyncTaskPollingAssert(() => this.successSpy.called && this.isSessionSentEmpty(), "SentBuffer Session storage is empty", 15, 1000))
                    .concat(PollingAssert.asyncTaskPollingAssert(() => this.successSpy.called && this.isSessionEmpty(), "Buffer Session storage is empty", 15, 1000));
            }
        });

        this.testCase({
            name: 'SendBuffer: Session storage is cleared after a send with cs promise',
            pollDelay: this.delay,
            test: () => {
                if (this._ai && this._ai.unload) {
                    this._ai.unload(false);
                }

                let csPromise = createAsyncResolvedPromise(`InstrumentationKey=${this._instrumentationKey}`);
                let  init = new ApplicationInsights({
                    config: {
                        connectionString: csPromise,
                        loggingLevelConsole: 999,
                        extensionConfig: {
                            'AppInsightsChannelPlugin': {
                                maxBatchInterval: 2000,
                                maxBatchSizeInBytes: 10*1024*1024 // 10 MB
                            },
                            ["AppInsightsCfgSyncPlugin"]: {
                                cfgUrl: ""
                            }
                            
                        }
                    },
                    queue: [],
                    version: 2.0
                });
                this._ai = init.loadAppInsights();
    
                // Setup Sinon stuff
                this._sender = this._ai.getPlugin<Sender>(BreezeChannelIdentifier).plugin;
                this._sender._buffer.clear();
                this.errorSpy = this.sandbox.spy(this._sender, '_onError');
                this.successSpy = this.sandbox.spy(this._sender, '_onSuccess');
                this.loggingSpy = this.sandbox.stub(this._ai.appInsights.core.logger, 'throwInternal');
                this.clearSpy = this.sandbox.spy(this._sender._buffer, 'clearSent');
                this._ai.trackTrace({message: 'test trace'});

                return this._asyncQueue()
                    .concat(PollingAssert.asyncTaskPollingAssert(() => {
                        let core = this._ai.appInsights.core
                        let activeStatus = core.activeStatus && core.activeStatus();
                    
                        if (activeStatus === ActiveStatus.ACTIVE ) {
                            Assert.equal(this._instrumentationKey, core.config.instrumentationKey, "ikey should be set");
                            return true;
                        }
                        return false;
                    }, "Wait for promise response" + new Date().toISOString(), 60, 1000))
                    .concat(this.waitForResponse())
                    .concat(this.boilerPlateAsserts)
                    .concat(PollingAssert.asyncTaskPollingAssert(() => this.successSpy.called && this.isSessionSentEmpty(), "SentBuffer Session storage is empty", 15, 1000))
                    .concat(PollingAssert.asyncTaskPollingAssert(() => this.successSpy.called && this.isSessionEmpty(), "Buffer Session storage is empty", 15, 1000));
            }
        });
    }

    private addTrackEndpointTests(): void {
        const SENT_ITEMS: number = 100;
        const SENT_TYPES: number = 4;

        this.testCase({
            name: 'EndpointTests: telemetry sent to endpoint fills to maxBatchSize',
            pollDelay: this.delay,
            test: () => {
                for (let i = 0; i < SENT_ITEMS; i++) {
                    this._ai.trackException({error: new Error()});
                    this._ai.trackMetric({name: "test", average: Math.round(100 * Math.random())});
                    this._ai.trackTrace({message: "test"});
                    this._ai.trackTrace({message: "test2"});
                }

                // Wait for the response
                return this._asyncQueue()
                    .concat(this.waitForResponse())
                    .concat(this.boilerPlateAsserts)
                    .concat(PollingAssert.asyncTaskPollingAssert(() => {
                        let currentCount: number = 0;

                        if (this.successSpy.called) {
                            this.successSpy.args.forEach(call => {
                                const acceptedItems = call[1];
                                currentCount += acceptedItems; // number of accepted items
                            });
                            return currentCount === SENT_ITEMS * SENT_TYPES;
                        }

                        return false;
                    }, `Backend accepts ${SENT_ITEMS} items`, 15, 1000))
                    .concat(PollingAssert.asyncTaskPollingAssert(() => {
                        return this.successSpy.calledOnce;
                    }, "Tracks are sent in ONE batch", 15, 1000));
                }
        });
    }

    private waitForResponse() {
        // Wait for the successSpy or errorSpy to be called
        return PollingAssert.asyncTaskPollingAssert(() => {
            return (this.successSpy.called || this.errorSpy.called);
        }, "Wait for response" + new Date().toISOString(), 15, 1000);
    }

    private boilerPlateAsserts() {
        Assert.ok(this.successSpy.called, "success");
        Assert.ok(!this.errorSpy.called, "no error sending");
        Assert.ok(this.clearSpy.called, "clearSent called");
        const isValidCallCount = this.loggingSpy.callCount === 0;
        Assert.ok(isValidCallCount, "logging spy was called 0 time(s)");
        if (!isValidCallCount) {
            while (this.loggingSpy.args.length) {
                Assert.ok(false, "[warning thrown]: " + dumpObj(this.loggingSpy.args.pop()));
            }
        }
    }

    private isSessionEmpty(): boolean {
        const buffer = this._getBuffer(this._bufferName);
        return buffer.length === 0;
    }

    private isSessionSentEmpty(): boolean {
        const buffer = this._getBuffer(this._sentBufferName);
        return buffer.length === 0;
    }

    private _getBuffer(key: string): string[] {
        let prefixedKey = key;
        try {
            const bufferJson = utlGetSessionStorage(null, key);
            if (bufferJson) {
                let buffer: string[] = getJSON().parse(bufferJson);
                if (buffer && isArray(buffer)) {
                    return buffer;
                }
            }
        } catch (e) {
            console.error("_getBuffer" + e);
        }

        return [];
    }
}
