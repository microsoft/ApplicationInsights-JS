import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import {
    AppInsightsCore, IPayloadData, IXHROverride, ITelemetryItem, MetricDataType, OnCompleteCallback, RequestDataType, TraceDataType
} from "@microsoft/applicationinsights-core-js";
import { OtlpChannel } from "../../../src/OtlpChannel";
import { getEndpointUrl, getRetryDelay, parsePartialSuccess } from "../../../src/OtlpHttpSender";
import { eOtlpSignal } from "../../../src/Enums";

const IKEY = "09465199-12AA-4124-817F-544738CC7C41";
const ENDPOINT = "https://collector.example.com";

interface ISentRequest {
    payload: IPayloadData;
    sync: boolean;
}

/**
 * A transport override that records what was sent and lets each test decide the response.
 */
class TestSender implements IXHROverride {
    public requests: ISentRequest[] = [];
    public status = 200;
    public response = "{}";
    public headers: { [key: string]: string } = {};
    public autoComplete = true;
    public throwOnSend = false;
    public pending: OnCompleteCallback[] = [];

    public sendPOST = (payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => {
        this.requests.push({ payload: payload, sync: !!sync });
        if (this.throwOnSend) {
            throw new Error("Test transport failure");
        }

        if (this.autoComplete) {
            oncomplete(this.status, this.headers, this.response, payload);
        } else {
            this.pending.push(oncomplete);
        }
    };

    public completeAll(status?: number, response?: string) {
        let pending = this.pending;
        this.pending = [];
        for (let lp = 0; lp < pending.length; lp++) {
            pending[lp](status === undefined ? this.status : status, this.headers,
                response === undefined ? this.response : response, null);
        }
    }

    public reset() {
        this.requests = [];
        this.pending = [];
        this.throwOnSend = false;
    }

    /**
     * Returns every record across every request that was sent.
     */
    public allRecords(): any[] {
        let records: any[] = [];
        for (let lp = 0; lp < this.requests.length; lp++) {
            let body = JSON.parse(this.requests[lp].payload.data as string);
            let resources = body.resourceSpans || body.resourceLogs || [];
            for (let r = 0; r < resources.length; r++) {
                let scopes = resources[r].scopeSpans || resources[r].scopeLogs || [];
                for (let s = 0; s < scopes.length; s++) {
                    let items = scopes[s].spans || scopes[s].logRecords || [];
                    for (let i = 0; i < items.length; i++) {
                        records.push(items[i]);
                    }
                }
            }
        }

        return records;
    }
}

function traceItem(message: string): ITelemetryItem {
    return {
        name: "Microsoft.ApplicationInsights.Message",
        iKey: IKEY,
        baseType: TraceDataType,
        baseData: { message: message }
    };
}

function requestItem(name: string): ITelemetryItem {
    return {
        name: "Microsoft.ApplicationInsights.Request",
        iKey: IKEY,
        baseType: RequestDataType,
        baseData: { id: "051581bf3cb55c13", name: name, duration: 10, success: true }
    };
}

function metricItem(name: string): ITelemetryItem {
    return {
        name: "Microsoft.ApplicationInsights.Metric",
        iKey: IKEY,
        baseType: MetricDataType,
        baseData: { metrics: [{ name: name, value: 1 }] }
    };
}

export class OtlpChannelTests extends AITestClass {

    private _core: AppInsightsCore;
    private _channel: OtlpChannel;
    private _sender: TestSender;

    public testInitialize() {
        super.testInitialize();
        this._core = new AppInsightsCore();
        this._channel = new OtlpChannel();
        this._sender = new TestSender();
    }

    public testFinishedCleanup() {
        // The core must always be unloaded, otherwise the event handlers and unload hooks it
        // registered leak into the next test and the framework validation will fail the run. This
        // must happen in testFinishedCleanup (not testCleanup) because the framework validates the
        // hooks immediately after testFinishedCleanup returns.
        if (this._channel && this._channel.isInitialized()) {
            this._channel.pause();
        }

        if (this._core && this._core.isInitialized()) {
            this._core.unload(false);
        }

        this._core = null;
        this._channel = null;
        this._sender = null;

        super.testFinishedCleanup();
    }

    private _init(config?: any) {
        let extConfig: any = {};
        extConfig[this._channel.identifier] = this._extend({
            endpointUrl: ENDPOINT,
            httpXHROverride: this._sender,
            maxBatchInterval: 1000
        }, config);

        this._core.initialize({
            instrumentationKey: IKEY,
            channels: [[this._channel]],
            extensionConfig: extConfig
        }, []);
    }

    private _extend(target: any, source: any): any {
        if (source) {
            for (let key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }

        return target;
    }

    public registerTests() {

        this.testCase({
            name: "The channel initializes as a channel with a unique priority",
            test: () => {
                this._init();

                Assert.equal("OtlpChannel", this._channel.identifier, "The identifier");
                Assert.ok(this._channel.priority >= 500, "A channel must have a priority of at least 500");
                Assert.equal(1021, this._channel.priority, "The documented priority");
                Assert.ok(this._channel.isInitialized(), "The channel is initialized");
            }
        });

        this.testCase({
            name: "Telemetry is converted and exported once the batch interval elapses",
            useFakeTimers: true,
            test: () => {
                this._init();

                this._core.track(traceItem("hello"));
                Assert.equal(0, this._sender.requests.length, "Nothing is sent before the interval elapses");

                this.clock.tick(1001);

                Assert.equal(1, this._sender.requests.length, "A single request is sent");
                let request = this._sender.requests[0];
                Assert.equal(ENDPOINT + "/v1/logs", request.payload.urlString, "A trace is sent to the logs endpoint");
                Assert.equal("application/json", request.payload.headers["Content-Type"], "The content type");

                let records = this._sender.allRecords();
                Assert.equal(1, records.length, "One record was exported");
                Assert.deepEqual({ stringValue: "hello" }, records[0].body, "The message survived the conversion");
            }
        });

        this.testCase({
            name: "Sampling matches Sender semantics and never samples out metrics",
            useFakeTimers: true,
            test: () => {
                this._init({
                    samplingPercentage: 0,
                    metricsAsLogs: true,
                    maxBatchInterval: 1000
                });

                let trace = traceItem("sampled out");
                trace.ext = { user: { id: "sampling-test-user" } };
                this._core.track(trace);
                this._core.track(metricItem("always retained"));
                this.clock.tick(1001);

                Assert.equal(1, this._sender.allRecords().length, "Only the metric was retained");
            }
        });

        this.testCase({
            name: "A request item is exported to the traces endpoint",
            useFakeTimers: true,
            test: () => {
                this._init();

                this._core.track(requestItem("GET /api"));
                this.clock.tick(1001);

                Assert.equal(1, this._sender.requests.length, "A single request is sent");
                Assert.equal(ENDPOINT + "/v1/traces", this._sender.requests[0].payload.urlString,
                    "A request is sent to the traces endpoint");
            }
        });

        this.testCase({
            name: "Spans and logs are sent to their own endpoints in separate requests",
            useFakeTimers: true,
            test: () => {
                this._init();

                this._core.track(requestItem("GET /api"));
                this._core.track(traceItem("hello"));
                this.clock.tick(1001);

                Assert.equal(2, this._sender.requests.length, "The two signals cannot share a request");

                let urls = [this._sender.requests[0].payload.urlString, this._sender.requests[1].payload.urlString];
                Assert.notEqual(-1, urls.indexOf(ENDPOINT + "/v1/traces"), "The traces endpoint was used");
                Assert.notEqual(-1, urls.indexOf(ENDPOINT + "/v1/logs"), "The logs endpoint was used");
            }
        });

        this.testCase({
            name: "Reaching the record limit triggers an immediate send",
            useFakeTimers: true,
            test: () => {
                this._init({ maxRecordsPerBatch: 3, maxBatchInterval: 60000 });

                this._core.track(traceItem("one"));
                this._core.track(traceItem("two"));
                Assert.equal(0, this._sender.requests.length, "Below the limit nothing is sent");

                this._core.track(traceItem("three"));
                Assert.equal(1, this._sender.requests.length, "Reaching the limit sends without waiting for the timer");
                Assert.equal(3, this._sender.allRecords().length, "All three records were sent");
            }
        });

        this.testCase({
            name: "Reaching the byte limit triggers an immediate send",
            useFakeTimers: true,
            test: () => {
                this._init({ maxBatchSizeInBytes: 200, maxRecordsPerBatch: 1000, maxBatchInterval: 60000 });

                let sent = false;
                for (let lp = 0; lp < 50 && !sent; lp++) {
                    this._core.track(traceItem("message number " + lp));
                    sent = this._sender.requests.length > 0;
                }

                Assert.ok(sent, "The byte limit eventually triggers a send");
            }
        });

        this.testCase({
            name: "The buffer is capped and the oldest records are dropped",
            useFakeTimers: true,
            test: () => {
                let discarded = 0;
                this._init({ eventsLimitInMem: 5, maxRecordsPerBatch: 1000, maxBatchSizeInBytes: 10000000,
                    maxBatchInterval: 60000 });

                this._core.addNotificationListener({
                    eventsDiscarded: (items: ITelemetryItem[]) => {
                        discarded += items.length;
                    }
                });

                for (let lp = 0; lp < 40; lp++) {
                    this._core.track(traceItem("message " + lp));
                }

                // The notification manager dispatches eventsDiscarded asynchronously through a 0ms
                // timer, so the clock has to be advanced before the listener will have been called.
                this.clock.tick(1);

                Assert.ok(discarded > 0, "Records were discarded once the in memory limit was reached");
            }
        });

        this.testCase({
            name: "pause buffers without sending and resume releases the buffer",
            useFakeTimers: true,
            test: () => {
                this._init();

                this._channel.pause();
                this._core.track(traceItem("hello"));
                this.clock.tick(5000);

                Assert.equal(0, this._sender.requests.length, "Nothing is sent while paused");

                this._channel.resume();
                this.clock.tick(1001);

                Assert.equal(1, this._sender.requests.length, "The buffered record is sent after resuming");
            }
        });

        this.testCase({
            name: "flush sends immediately and invokes the callback",
            useFakeTimers: true,
            test: () => {
                this._init({ maxBatchInterval: 60000 });

                this._core.track(traceItem("hello"));
                Assert.equal(0, this._sender.requests.length, "Nothing is sent before the flush");

                let completed = false;
                this._channel.flush(true, () => {
                    completed = true;
                });

                Assert.equal(1, this._sender.requests.length, "The flush sent the buffered record");
                Assert.ok(completed, "The callback was invoked");
            }
        });

        this.testCase({
            name: "The channel reports send notifications and idle state",
            useFakeTimers: true,
            test: () => {
                let sent = 0;
                let sendRequests = 0;
                this._init({ maxBatchInterval: 60000 });
                this._core.addNotificationListener({
                    eventsSent: (items: ITelemetryItem[]) => {
                        sent += items.length;
                    },
                    eventsSendRequest: () => {
                        sendRequests++;
                    }
                });

                Assert.ok(this._channel.isCompletelyIdle(), "The initialized channel is idle");
                this._core.track(traceItem("hello"));
                Assert.ok(!this._channel.isCompletelyIdle(), "A buffered item makes the channel busy");

                this._channel.flush(false);
                this.clock.tick(1);

                Assert.equal(1, sent, "The original item was reported as sent");
                Assert.equal(1, sendRequests, "The send request was reported");
                Assert.ok(this._channel.isCompletelyIdle(), "The channel is idle after the flush");
            }
        });

        this.testCase({
            name: "flush returns a promise when no callback is supplied",
            test: () => {
                this._init({ maxBatchInterval: 60000 });
                this._core.track(traceItem("hello"));

                let result = this._channel.flush(true);
                Assert.ok(!!result, "A result is returned");
                Assert.equal(1, this._sender.requests.length, "The buffered record was sent");

                return result as any;
            }
        });

        this.testCase({
            name: "onunloadFlush sends synchronously",
            useFakeTimers: true,
            test: () => {
                this._init({ maxBatchInterval: 60000 });

                this._core.track(traceItem("hello"));
                this._channel.onunloadFlush();

                Assert.equal(1, this._sender.requests.length, "The buffered record was sent during unload");
                Assert.ok(this._sender.requests[0].sync, "The unload send is synchronous");
            }
        });

        this.testCase({
            name: "The unload path performs no conversion work",
            useFakeTimers: true,
            test: () => {
                // Every record is converted and serialized as it arrives, so by the time the page is
                // unloading the payload is only a string join. Assert that the records really were
                // serialized up front rather than at send time.
                this._init({ maxBatchInterval: 60000, preSerialize: true });

                this._core.track(traceItem("hello"));

                let converted = false;
                let original = JSON.stringify;
                try {
                    // If the channel were converting at send time it would have to serialize a record
                    // object here; the only serialization allowed is of the already serialized
                    // fragments which happens through string concatenation instead.
                    (JSON as any).stringify = function (value: any) {
                        converted = true;
                        return original.apply(JSON, arguments as any);
                    };

                    this._channel.onunloadFlush();
                } finally {
                    (JSON as any).stringify = original;
                }

                Assert.equal(1, this._sender.requests.length, "The record was still sent");
                Assert.ok(!converted, "No record was serialized on the unload path");
            }
        });

        this.testCase({
            name: "A retryable failure re-queues the batch and it is retried",
            useFakeTimers: true,
            test: () => {
                this._init({ maxBatchInterval: 1000, maxRetryAttempts: 3 });
                this._sender.status = 503;

                this._core.track(traceItem("hello"));
                this.clock.tick(1001);

                Assert.equal(1, this._sender.requests.length, "The first attempt was made");

                // The retry uses an exponential backoff starting at ~1s (plus jitter)
                this._sender.status = 200;
                this.clock.tick(30000);

                Assert.ok(this._sender.requests.length > 1, "The batch was retried after the failure");
            }
        });

        this.testCase({
            name: "Custom retry codes and retry notifications are honored",
            useFakeTimers: true,
            test: () => {
                let retried = 0;
                this._init({ maxBatchInterval: 1000, maxRetryAttempts: 3, retryCodes: [418] });
                this._sender.status = 418;
                this._core.addNotificationListener({
                    eventsRetry: (items: ITelemetryItem[], status: number) => {
                        retried += status === 418 ? items.length : 0;
                    }
                });

                this.testCase({
                    name: "Retry attempts survive requeue and stop at the configured limit",
                    useFakeTimers: true,
                    test: () => {
                        let discarded = 0;
                        let completed = false;
                        this._init({ maxBatchInterval: 60000, maxRetryAttempts: 3 });
                        this._sender.status = 503;
                        this._core.addNotificationListener({
                            eventsDiscarded: (items: ITelemetryItem[]) => {
                                discarded += items.length;
                            }
                        });

                        this._core.track(traceItem("always fails"));
                        this._channel.flush(true, () => {
                            completed = true;
                        });

                        Assert.equal(1, this._sender.requests.length, "The initial attempt was made");
                        Assert.ok(!completed, "Flush waits while the batch is retryable");

                        this.clock.tick(180000);

                        Assert.equal(3, this._sender.requests.length, "The batch stopped at the configured attempt limit");
                        Assert.equal(1, discarded, "The exhausted batch was discarded");
                        Assert.ok(completed, "Flush completed after the final discard");
                    }
                });

                this._core.track(traceItem("hello"));
                this.clock.tick(1001);
                this._sender.status = 200;
                this.clock.tick(30000);

                Assert.ok(this._sender.requests.length > 1, "The configured status was retried");
                Assert.equal(1, retried, "The original item was reported as retried");
            }
        });

        this.testCase({
            name: "Unload retry attempts are honored",
            useFakeTimers: true,
            test: () => {
                let discarded = 0;
                this._init({ maxBatchInterval: 60000, maxUnloadRetryAttempts: 2 });
                this._sender.status = 503;
                this._core.addNotificationListener({
                    eventsDiscarded: (items: ITelemetryItem[]) => {
                        discarded += items.length;
                    }
                });

                this._core.track(traceItem("hello"));
                this._channel.onunloadFlush();
                this.clock.tick(1);

                Assert.equal(2, this._sender.requests.length, "The unload send used the configured attempt limit");
                Assert.equal(1, discarded, "The item was discarded after the retry limit");
            }
        });

        this.testCase({
            name: "A non retryable failure discards the batch",
            useFakeTimers: true,
            test: () => {
                let discarded = 0;
                this._init({ maxBatchInterval: 1000 });
                this._sender.status = 400;

                this._core.addNotificationListener({
                    eventsDiscarded: (items: ITelemetryItem[]) => {
                        discarded += items.length;
                    }
                });

                this._core.track(traceItem("hello"));
                this.clock.tick(1001);

                Assert.equal(1, this._sender.requests.length, "One attempt was made");

                this.clock.tick(60000);
                Assert.equal(1, this._sender.requests.length, "A 400 is not retried");
                Assert.equal(1, discarded, "The record was reported as discarded");
            }
        });

        this.testCase({
            name: "A partial success is not retried",
            useFakeTimers: true,
            test: () => {
                let discarded: ITelemetryItem[] = [];
                this._init({ maxBatchInterval: 1000 });
                this._sender.status = 200;
                this._sender.response = "{\"partialSuccess\":{\"rejectedLogRecords\":1,\"errorMessage\":\"bad\"}}";
                this._core.addNotificationListener({
                    eventsDiscarded: (items: ITelemetryItem[]) => {
                        discarded = discarded.concat(items);
                    }
                });

                this._core.track(traceItem("hello"));
                this.clock.tick(1001);

                Assert.equal(1, this._sender.requests.length, "One attempt was made");

                this.clock.tick(60000);
                Assert.equal(1, this._sender.requests.length, "A partial success is a success and must not be retried");
                Assert.equal(1, discarded.length, "The rejected count was reported as discarded");
                Assert.equal("Unknown", discarded[0].baseType, "No specific telemetry type is falsely attributed");
            }
        });

        this.testCase({
            name: "Asynchronous payload compression uses gzip when supported",
            test: () => {
                this._init({ maxBatchInterval: 60000, enablePayloadCompression: true });
                this._core.track(traceItem("hello"));

                let result = this._channel.flush(true) as any;
                return result.then(() => {
                    let compressionSupported = typeof (window as any).CompressionStream === "function";
                    Assert.equal(compressionSupported ? "gzip" : undefined,
                        this._sender.requests[0].payload.headers["Content-Encoding"],
                        "The payload compression matches platform support");
                });
            }
        });

        this.testCase({
            name: "A throwing compressed transport still completes the flush",
            test: () => {
                this._init({
                    maxBatchInterval: 60000,
                    maxRetryAttempts: 3,
                    isRetryDisabled: true,
                    enablePayloadCompression: true
                });
                this._sender.throwOnSend = true;
                this._core.track(traceItem("hello"));

                let result = this._channel.flush(true) as any;
                return result.then(() => {
                    Assert.equal(1, this._sender.requests.length, "The failed transport was called once");
                    Assert.ok(this._channel.isCompletelyIdle(), "The failed send did not strand in-flight work");
                });
            }
        });

        this.testCase({
            name: "disableTelemetry stops the export but items still flow down the chain",
            useFakeTimers: true,
            test: () => {
                this._init({ disableTelemetry: true });

                this._core.track(traceItem("hello"));
                this.clock.tick(5000);

                Assert.equal(0, this._sender.requests.length, "Nothing is exported");
            }
        });

        this.testCase({
            name: "Custom headers are applied to the request",
            useFakeTimers: true,
            test: () => {
                this._init({ headers: { "x-api-key": "secret-value" } });

                this._core.track(traceItem("hello"));
                this.clock.tick(1001);

                Assert.equal("secret-value", this._sender.requests[0].payload.headers["x-api-key"],
                    "The custom header is present");
                Assert.equal("application/json", this._sender.requests[0].payload.headers["Content-Type"],
                    "The content type is still set");
            }
        });

        this.testCase({
            name: "getOfflineSupport describes how to persist and replay a payload",
            test: () => {
                this._init();

                let support = this._channel.getOfflineSupport();
                Assert.ok(!!support, "Offline support is provided");
                Assert.equal(ENDPOINT + "/v1/traces", support.getUrl(), "The url");

                let serialized = support.serialize(traceItem("hello"));
                Assert.ok(!!serialized, "An item can be serialized");
                Assert.ok(serialized.indexOf("hello") !== -1, "The serialized record contains the message");

                let batched = support.batch([serialized, serialized]);
                Assert.equal(2, JSON.parse(batched).length, "Records can be batched and re-parsed");

                Assert.ok(support.shouldProcess(traceItem("hello")), "A trace is processed");
                Assert.ok(!support.shouldProcess({ name: "x" } as ITelemetryItem), "An item with no baseType is not");
            }
        });

        // ---------------------------------------------------------------------------------------
        // Dynamic configuration. The channel memoizes the resource, scope and conversion context for
        // performance, so every one of these asserts that the memoized state is invalidated.
        // ---------------------------------------------------------------------------------------

        this.testCase({
            name: "Dynamic config: changing endpointUrl redirects subsequent exports",
            useFakeTimers: true,
            test: () => {
                this._init();

                this._core.track(traceItem("first"));
                this.clock.tick(1001);
                Assert.equal(ENDPOINT + "/v1/logs", this._sender.requests[0].payload.urlString, "The initial endpoint");

                this._core.config.extensionConfig[this._channel.identifier].endpointUrl = "https://other.example.com";
                this.clock.tick(1);

                this._sender.reset();
                this._core.track(traceItem("second"));
                this.clock.tick(1001);

                Assert.equal("https://other.example.com/v1/logs", this._sender.requests[0].payload.urlString,
                    "The new endpoint is used");
            }
        });

        this.testCase({
            name: "Dynamic config: changing resourceAttributes invalidates the memoized resource",
            useFakeTimers: true,
            test: () => {
                this._init();

                this._core.track(traceItem("first"));
                this.clock.tick(1001);

                let body = JSON.parse(this._sender.requests[0].payload.data as string);
                let attributes = body.resourceLogs[0].resource.attributes;
                let found = false;
                for (let lp = 0; lp < attributes.length; lp++) {
                    if (attributes[lp].key === "deployment.environment") {
                        found = true;
                    }
                }
                Assert.ok(!found, "The attribute is not present initially");

                this._core.config.extensionConfig[this._channel.identifier].resourceAttributes =
                    { "deployment.environment": "production" };
                this.clock.tick(1);

                this._sender.reset();
                this._core.track(traceItem("second"));
                this.clock.tick(1001);

                body = JSON.parse(this._sender.requests[0].payload.data as string);
                attributes = body.resourceLogs[0].resource.attributes;
                found = false;
                for (let lp = 0; lp < attributes.length; lp++) {
                    if (attributes[lp].key === "deployment.environment" && attributes[lp].value.stringValue === "production") {
                        found = true;
                    }
                }

                Assert.ok(found, "The memoized resource was rebuilt with the new attribute");
            }
        });

        this.testCase({
            name: "Dynamic config: changing scopeName invalidates the memoized scope",
            useFakeTimers: true,
            test: () => {
                this._init();

                this._core.config.extensionConfig[this._channel.identifier].scopeName = "my-scope";
                this.clock.tick(1);

                this._core.track(traceItem("hello"));
                this.clock.tick(1001);

                let body = JSON.parse(this._sender.requests[0].payload.data as string);
                Assert.equal("my-scope", body.resourceLogs[0].scopeLogs[0].scope.name, "The new scope name is used");
            }
        });

        this.testCase({
            name: "Dynamic config: changing disableTelemetry takes effect at runtime",
            useFakeTimers: true,
            test: () => {
                this._init();

                this._core.config.extensionConfig[this._channel.identifier].disableTelemetry = true;
                this.clock.tick(1);

                this._core.track(traceItem("hello"));
                this.clock.tick(5000);
                Assert.equal(0, this._sender.requests.length, "Telemetry is no longer exported");

                this._core.config.extensionConfig[this._channel.identifier].disableTelemetry = false;
                this.clock.tick(1);

                this._core.track(traceItem("hello again"));
                this.clock.tick(1001);
                Assert.equal(1, this._sender.requests.length, "Telemetry is exported once re-enabled");
            }
        });

        this.testCase({
            name: "Dynamic config: changing pageViewAs changes the signal used",
            useFakeTimers: true,
            test: () => {
                this._init();

                this._core.config.extensionConfig[this._channel.identifier].pageViewAs = "log";
                this.clock.tick(1);

                this._core.track({
                    name: "Microsoft.ApplicationInsights.Pageview",
                    iKey: IKEY,
                    baseType: "PageviewData",
                    baseData: { id: "1", name: "Home", url: "https://example.com/", duration: 100 }
                } as ITelemetryItem);
                this.clock.tick(1001);

                Assert.equal(ENDPOINT + "/v1/logs", this._sender.requests[0].payload.urlString,
                    "The page view is now exported as a log");
            }
        });

        this.testCase({
            name: "Dynamic config: changing maxBatchInterval changes the send schedule",
            useFakeTimers: true,
            test: () => {
                this._init({ maxBatchInterval: 60000 });

                this._core.config.extensionConfig[this._channel.identifier].maxBatchInterval = 500;
                this.clock.tick(1);

                this._core.track(traceItem("hello"));
                this.clock.tick(501);

                Assert.equal(1, this._sender.requests.length, "The shorter interval is used");
            }
        });

        this.testCase({
            name: "teardown exports anything still buffered and releases the timers",
            useFakeTimers: true,
            test: () => {
                this._init({ maxBatchInterval: 60000 });

                this._core.track(traceItem("hello"));
                Assert.equal(0, this._sender.requests.length, "Nothing has been sent yet");

                this._core.unload(false);

                Assert.equal(1, this._sender.requests.length, "The buffered record was exported during teardown");
            }
        });

        // ---------------------------------------------------------------------------------------
        // Sender helpers
        // ---------------------------------------------------------------------------------------

        this.testCase({
            name: "getEndpointUrl appends the signal path and honours the explicit overrides",
            test: () => {
                Assert.equal("https://c.example.com/v1/traces", getEndpointUrl({ endpointUrl: "https://c.example.com" },
                    eOtlpSignal.Span), "The traces path is appended");
                Assert.equal("https://c.example.com/v1/logs", getEndpointUrl({ endpointUrl: "https://c.example.com" },
                    eOtlpSignal.Log), "The logs path is appended");
                Assert.equal("https://c.example.com/v1/traces", getEndpointUrl({ endpointUrl: "https://c.example.com/" },
                    eOtlpSignal.Span), "A trailing separator does not double up");
                Assert.equal("https://c.example.com/custom", getEndpointUrl(
                    { endpointUrl: "https://c.example.com", tracesEndpointUrl: "https://c.example.com/custom" },
                    eOtlpSignal.Span), "An explicit url is used verbatim");
                Assert.equal("", getEndpointUrl({}, eOtlpSignal.Span), "No endpoint produces an empty url");
            }
        });

        this.testCase({
            name: "parsePartialSuccess extracts the rejected count",
            test: () => {
                let result = parsePartialSuccess("{\"partialSuccess\":{\"rejectedSpans\":3,\"errorMessage\":\"nope\"}}");
                Assert.equal(3, result.rejected, "The rejected count");
                Assert.equal("nope", result.message, "The message");

                Assert.equal(0, parsePartialSuccess("{}").rejected, "An empty body reports nothing rejected");
                Assert.equal(0, parsePartialSuccess("not json").rejected, "A non JSON body does not throw");
                Assert.equal(0, parsePartialSuccess(null).rejected, "A missing body does not throw");
            }
        });

        this.testCase({
            name: "getRetryDelay backs off exponentially and honours Retry-After",
            test: () => {
                let first = getRetryDelay(1);
                let second = getRetryDelay(2);
                let third = getRetryDelay(3);

                Assert.ok(first >= 1000 && first <= 1250, "The first retry waits about a second");
                Assert.ok(second > first, "The delay grows with each attempt");
                Assert.ok(third > second, "The delay keeps growing");
                Assert.ok(getRetryDelay(20) <= 60000, "The delay is capped");

                Assert.equal(5000, getRetryDelay(1, "5"), "A numeric Retry-After is used as seconds");
                Assert.equal(60000, getRetryDelay(1, "600"), "A large Retry-After is capped");
            }
        });
    }
}
