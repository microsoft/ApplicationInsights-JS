import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import {
    AppInsightsCore, BaseTelemetryPlugin, IAppInsightsCore, IChannelControls, IConfiguration, IPlugin,
    IProcessTelemetryContext, ITelemetryItem, TraceDataType
} from "@microsoft/applicationinsights-core-js";
import { OtlpChannel } from "../../../src/OtlpChannel";

const IKEY = "09465199-12AA-4124-817F-544738CC7C41";

/**
 * A stand in for another channel in the same queue. Real channels such as the Application Insights
 * `Sender` (priority 1001), the 1DS `PostChannel` (1011) and the `OfflineChannel` (1000) all call
 * `processNext`, which is what allows a downstream channel to be chained after them.
 */
class ForwardingChannel extends BaseTelemetryPlugin implements IChannelControls {
    public identifier: string;
    public priority: number;
    public received: ITelemetryItem[] = [];
    public version = "1.0.0";

    constructor(identifier: string, priority: number) {
        super();
        this.identifier = identifier;
        this.priority = priority;
    }

    public processTelemetry(item: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        this.received.push(item);
        this.processNext(item, itemCtx);
    }

    public pause() {}
    public resume() {}

    // Returning true promises the caller that the callback will be invoked, so it must actually be
    // invoked or core.unload() waits for a flush that never completes
    public flush(isAsync?: boolean, callBack?: (flushComplete?: boolean) => void) {
        callBack && callBack(true);
        return true;
    }
}

/**
 * A channel that consumes the item instead of forwarding it, which is what the offline channel does
 * while the browser is offline.
 */
class TerminalChannel extends BaseTelemetryPlugin implements IChannelControls {
    public identifier: string;
    public priority: number;
    public received: ITelemetryItem[] = [];
    public version = "1.0.0";

    constructor(identifier: string, priority: number) {
        super();
        this.identifier = identifier;
        this.priority = priority;
    }

    public processTelemetry(item: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        this.received.push(item);
        // Deliberately does not call processNext
    }

    public pause() {}
    public resume() {}

    public flush(isAsync?: boolean, callBack?: (flushComplete?: boolean) => void) {
        callBack && callBack(true);
        return true;
    }
}

class TestSender {
    public payloads: any[] = [];
    public sendPOST = (payload: any, oncomplete: any) => {
        this.payloads.push(payload);
        oncomplete(200, {}, "{}", payload);
    };
}

function traceItem(message: string): ITelemetryItem {
    return {
        name: "Microsoft.ApplicationInsights.Message",
        iKey: IKEY,
        baseType: TraceDataType,
        baseData: { message: message }
    };
}

/**
 * Verifies that the OTLP channel behaves correctly when a custom SKU places it behind other channels
 * in the same channel queue, for example `OfflineChannel -> OtlpChannel`.
 */
export class ChannelChainTests extends AITestClass {

    private _core: AppInsightsCore;
    private _otlp: OtlpChannel;
    private _sender: TestSender;

    public testInitialize() {
        super.testInitialize();
        this._core = new AppInsightsCore();
        this._otlp = new OtlpChannel();
        this._sender = new TestSender();
    }

    public testFinishedCleanup() {
        if (this._otlp && this._otlp.isInitialized()) {
            this._otlp.pause();
        }

        if (this._core && this._core.isInitialized()) {
            this._core.unload(false);
        }

        this._core = null;
        this._otlp = null;
        this._sender = null;

        super.testFinishedCleanup();
    }

    private _init(channels: IChannelControls[], extra?: any) {
        let extConfig: any = {};
        extConfig[this._otlp.identifier] = {
            endpointUrl: "https://collector.example.com",
            httpXHROverride: this._sender,
            maxBatchInterval: 1000
        };

        if (extra) {
            for (let key in extra) {
                if (Object.prototype.hasOwnProperty.call(extra, key)) {
                    extConfig[key] = extra[key];
                }
            }
        }

        this._core.initialize({
            instrumentationKey: IKEY,
            channels: [channels],
            extensionConfig: extConfig
        } as IConfiguration, []);
    }

    public registerTests() {

        this.testCase({
            name: "The OTLP channel sorts last, after every other shipped channel priority",
            test: () => {
                // Offline = 1000, Sender = 1001, LocalStorage = 1009, PostChannel = 1011, Tee = 999
                let offline = new ForwardingChannel("OfflineChannel", 1000);
                let sender = new ForwardingChannel("AppInsightsChannelPlugin", 1001);
                let post = new ForwardingChannel("PostChannel", 1011);

                // Supplied deliberately out of order
                this._init([post, this._otlp, offline, sender]);

                let ordered = this._core.getChannels();
                let identifiers: string[] = [];
                for (let lp = 0; lp < ordered.length; lp++) {
                    identifiers.push(ordered[lp].identifier);
                }

                Assert.deepEqual(
                    ["OfflineChannel", "AppInsightsChannelPlugin", "PostChannel", "OtlpChannel"],
                    identifiers,
                    "The channels are ordered by priority and the OTLP channel is last");
            }
        });

        this.testCase({
            name: "A custom SKU of OfflineChannel -> OtlpChannel delivers telemetry to the OTLP channel",
            useFakeTimers: true,
            test: () => {
                let offline = new ForwardingChannel("OfflineChannel", 1000);
                this._init([offline, this._otlp]);

                this._core.track(traceItem("hello"));
                this.clock.tick(1001);

                Assert.equal(1, offline.received.length, "The offline channel received the item first");
                Assert.equal(1, this._sender.payloads.length, "The OTLP channel exported the item");

                let body = JSON.parse(this._sender.payloads[0].data);
                Assert.equal(1, body.resourceLogs[0].scopeLogs[0].logRecords.length, "One record was exported");
            }
        });

        this.testCase({
            name: "The OTLP channel works behind several chained channels at once",
            useFakeTimers: true,
            test: () => {
                let offline = new ForwardingChannel("OfflineChannel", 1000);
                let sender = new ForwardingChannel("AppInsightsChannelPlugin", 1001);
                let post = new ForwardingChannel("PostChannel", 1011);

                this._init([offline, sender, post, this._otlp]);

                this._core.track(traceItem("hello"));
                this.clock.tick(1001);

                Assert.equal(1, offline.received.length, "The offline channel saw it");
                Assert.equal(1, sender.received.length, "The sender saw it");
                Assert.equal(1, post.received.length, "The post channel saw it");
                Assert.equal(1, this._sender.payloads.length, "The OTLP channel still exported it");
            }
        });

        this.testCase({
            name: "A preceding channel that consumes the item starves the OTLP channel",
            useFakeTimers: true,
            test: () => {
                // This is exactly what the offline channel does while the browser is offline: it
                // caches the item and returns without calling processNext. Anything chained after it
                // therefore receives nothing, which is why the offline channel has to be told to
                // treat the OTLP channel as its online channel (see primaryOnlineChannelId).
                let terminal = new TerminalChannel("OfflineChannel", 1000);
                this._init([terminal, this._otlp]);

                this._core.track(traceItem("hello"));
                this.clock.tick(5000);

                Assert.equal(1, terminal.received.length, "The upstream channel consumed the item");
                Assert.equal(0, this._sender.payloads.length,
                    "Nothing reached the OTLP channel, because the item was never forwarded");
            }
        });

        this.testCase({
            name: "The OTLP channel is discoverable by identifier so it can be a primaryOnlineChannelId",
            test: () => {
                // The offline channel resolves its online channel with core.getPlugin(<identifier>)
                // and then calls getOfflineSupport() on it, so both must work for a custom SKU that
                // configures `primaryOnlineChannelId: ["OtlpChannel"]`.
                let offline = new ForwardingChannel("OfflineChannel", 1000);
                this._init([offline, this._otlp]);

                let found = this._core.getPlugin<IChannelControls>("OtlpChannel");
                Assert.ok(!!found && !!found.plugin, "The OTLP channel is resolvable by identifier");
                Assert.equal("OtlpChannel", found.plugin.identifier, "The identifier matches");
                Assert.ok(found.plugin.isInitialized(), "It reports as initialized");
                Assert.equal("function", typeof found.plugin.getOfflineSupport,
                    "It exposes getOfflineSupport, which the offline channel requires");

                let support = found.plugin.getOfflineSupport();
                Assert.ok(!!support, "Offline support is returned");
                Assert.equal("https://collector.example.com/v1/traces", support.getUrl(),
                    "The offline channel would persist against the OTLP endpoint");
                Assert.ok(!!support.serialize(traceItem("hello")), "An item can be serialized for storage");
            }
        });

        this.testCase({
            name: "Placing the OTLP channel before another channel still forwards the item onward",
            useFakeTimers: true,
            test: () => {
                // The OTLP channel calls processNext, so it never starves anything chained after it
                // even if a SKU orders it unusually.
                let downstream = new ForwardingChannel("Downstream", 1031);
                this._init([this._otlp, downstream]);

                this._core.track(traceItem("hello"));
                this.clock.tick(1001);

                Assert.equal(1, downstream.received.length,
                    "The channel after the OTLP channel still received the item");
                Assert.equal(1, this._sender.payloads.length, "And the OTLP channel exported it");
            }
        });

        this.testCase({
            name: "consumeEvents stops the OTLP channel forwarding, for SKUs where it is genuinely last",
            useFakeTimers: true,
            test: () => {
                let downstream = new ForwardingChannel("Downstream", 1031);
                this._init([this._otlp, downstream], {
                    ["OtlpChannel"]: {
                        endpointUrl: "https://collector.example.com",
                        httpXHROverride: this._sender,
                        maxBatchInterval: 1000,
                        consumeEvents: true
                    }
                });

                this._core.track(traceItem("hello"));
                this.clock.tick(1001);

                Assert.equal(0, downstream.received.length, "The item was consumed as configured");
                Assert.equal(1, this._sender.payloads.length, "The OTLP channel still exported it");
            }
        });
    }
}
