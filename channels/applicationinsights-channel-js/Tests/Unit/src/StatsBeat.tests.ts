import { AITestClass, Assert, PollingAssert } from "@microsoft/ai-test-framework";
import { AppInsightsCore, getWindow, IPayloadData, ITelemetryItem, TransportType } from "@microsoft/applicationinsights-core-js";
import { Sender } from "../../../src/Sender";
import { SinonSpy, SinonStub } from "sinon";
import { ISenderConfig } from "../../../types/applicationinsights-channel-js";
import { isBeaconApiSupported } from "@microsoft/applicationinsights-common";

export class StatsbeatTests extends AITestClass {
    private _core: AppInsightsCore;
    private _sender: Sender;
    private statsbeatCountSpy: SinonSpy;
    private fetchStub: sinon.SinonStub;
    private beaconStub: sinon.SinonStub;
    private trackSpy: SinonSpy;

    public testInitialize() {
        this._core = new AppInsightsCore();
        this._sender = new Sender();
    }

    public testFinishedCleanup() {
        if (this._sender && this._sender.isInitialized()) {
            this._sender.pause();
            this._sender._buffer.clear();
            this._sender.teardown();
        }
        this._sender = null;
        this._core = null;
        if (this.statsbeatCountSpy) {
            this.statsbeatCountSpy.restore();
        }
        if (this.fetchStub) {
            this.fetchStub.restore();
        }
        if (this.beaconStub) {
            this.beaconStub.restore();
        }
        if (this.trackSpy) {
            this.trackSpy.restore();
        }
    }

    private initializeCoreAndSender(config: any, instrumentationKey: string) {
        const sender = new Sender();
        const core = new AppInsightsCore();
        const coreConfig = {
            instrumentationKey,
            _sdk: { stats: true },
            extensionConfig: { [sender.identifier]: config }
        };

        core.initialize(coreConfig, [sender]);
        this.statsbeatCountSpy = this.sandbox.spy(core.getStatsBeat(), "count");
        this.trackSpy = this.sandbox.spy(core, "track");

        this.onDone(() => {
            sender.teardown();
        });

        return { core, sender };
    }

    private createSenderConfig(transportType: TransportType) {
        return {
            endpointUrl: "https://test",
            emitLineDelimitedJson: false,
            maxBatchInterval: 15000,
            maxBatchSizeInBytes: 102400,
            disableTelemetry: false,
            enableSessionStorageBuffer: true,
            isRetryDisabled: false,
            isBeaconApiDisabled: false,
            disableXhr: false,
            onunloadDisableFetch: false,
            onunloadDisableBeacon: false,
            namePrefix: "",
            samplingPercentage: 100,
            customHeaders: [{ header: "header", value: "val" }],
            convertUndefined: "",
            eventsLimitInMem: 10000,
            transports: [transportType]
        };
    }

    private processTelemetryAndFlush(sender: Sender, telemetryItem: ITelemetryItem) {
        try {
            sender.processTelemetry(telemetryItem, null);
            sender.flush();
        } catch (e) {
            QUnit.assert.ok(false, "Unexpected error during telemetry processing");
        }
        this.clock.tick(900000); // Simulate time passing for statsbeat to be sent
    }

    private assertStatsbeatCall(statusCode: number, eventName: string) {
        Assert.equal(this.statsbeatCountSpy.callCount, 1, "Statsbeat count should be called once");
        Assert.equal(this.statsbeatCountSpy.firstCall.args[0], statusCode, `Statsbeat count should be called with status ${statusCode}`);
        const data = JSON.stringify(this.statsbeatCountSpy.firstCall.args[1]);
        Assert.ok(data.includes("startTime"), "Statsbeat count should be called with startTime set");
        const statsbeatEvent = this.trackSpy.firstCall.args[0];
        Assert.equal(statsbeatEvent.baseType, "MetricData", "Statsbeat event should be of type MetricData");
        Assert.equal(statsbeatEvent.baseData.name, eventName, `Statsbeat event should be of type ${eventName}`);
    }

    public registerTests() {
        this.testCase({
            name: "Statsbeat initializes when stats is true",
            test: () => {
                const config = {
                    _sdk: { stats: true },
                    instrumentationKey: "Test-iKey"
                };

                this._core.initialize(config, [this._sender]);
                const statsbeat = this._core.getStatsBeat();

                QUnit.assert.ok(statsbeat, "Statsbeat is initialized");
                QUnit.assert.ok(statsbeat.isInitialized(), "Statsbeat is marked as initialized");
            }
        });

        this.testCaseAsync({
            name: "Statsbeat increments success count when fetch sender is called once",
            useFakeTimers: true,
            useFakeServer: true,
            stepDelay: 100,
            steps: [
                () => {
                    this.fetchStub = this.sandbox.stub(window, "fetch").callsFake(() => { // only fetch is supported to stub, why?
                        return Promise.resolve(new Response("{}", { status: 200, statusText: "OK" }));
                    });

                    const config = this.createSenderConfig(TransportType.Fetch);
                    const { sender } = this.initializeCoreAndSender(config, "000e0000-e000-0000-a000-000000000000");

                    const telemetryItem: ITelemetryItem = {
                        name: "fake item",
                        iKey: "testIkey2;ingestionendpoint=testUrl1",
                        baseType: "some type",
                        baseData: {}
                    };

                    this.processTelemetryAndFlush(sender, telemetryItem);
                    
                }
            ].concat(PollingAssert.createPollingAssert(() => {
                if (this.statsbeatCountSpy.called && this.fetchStub.called) {
                    this.assertStatsbeatCall(200, "Request_Success_Count");
                    return true;
                }
                return false;
            }, "Waiting for fetch sender and Statsbeat count to be called") as any)
        });

        this.testCaseAsync({
            name: "Statsbeat increments retry count when fetch sender is called once",
            useFakeTimers: true,
            stepDelay: 100,
            steps: [
                () => {
                    this.fetchStub = this.sandbox.stub(window, "fetch").callsFake(() => {
                        return Promise.resolve(new Response("{}", { status: 439, statusText: "Too Many Requests" }));
                    });

                    const config = this.createSenderConfig(TransportType.Fetch);
                    const { sender } = this.initializeCoreAndSender(config, "000e0000-e000-0000-a000-000000000000");

                    const telemetryItem: ITelemetryItem = {
                        name: "fake item",
                        iKey: "testIkey2;ingestionendpoint=testUrl1",
                        baseType: "some type",
                        baseData: {}
                    };

                    this.processTelemetryAndFlush(sender, telemetryItem);
                }
            ].concat(PollingAssert.createPollingAssert(() => {
                if (this.statsbeatCountSpy.called && this.fetchStub.called) {
                    this.assertStatsbeatCall(400, "failure");
                    return true;
                }
                return false;
            }, "Waiting for fetch sender and Statsbeat count to be called") as any)
        });

        this.testCaseAsync({
            name: "Statsbeat increments success count for beacon sender",
            useFakeTimers: true,
            stepDelay: 100,
            steps: [
                () => {
                    const config = this.createSenderConfig(TransportType.Beacon);
                    const { sender } = this.initializeCoreAndSender(config, "000e0000-e000-0000-a000-000000000000");

                    const telemetryItem: ITelemetryItem = {
                        name: "fake item",
                        iKey: "testIkey2;ingestionendpoint=testUrl1",
                        baseType: "some type",
                        baseData: {}
                    };
                    let sendBeaconCalled = false;
                    this.hookSendBeacon((url: string) => {
                        sendBeaconCalled = true;
                        return true;
                    });
                    QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                    this.processTelemetryAndFlush(sender, telemetryItem);
                }
            ].concat(PollingAssert.createPollingAssert(() => {
                if (this.statsbeatCountSpy.called) {
                    this.assertStatsbeatCall(200, "Request_Success_Count");
                    return true;
                }
                return false;
            }, "Waiting for beacon sender and Statsbeat count to be called") as any)
        });
    

    this.testCaseAsync({
        name: "Statsbeat increments success count for xhr sender",
        useFakeTimers: true,
        useFakeServer: true,
        stepDelay: 100,
        fakeServerAutoRespond: true,
        steps: [
            () => {
                let window = getWindow();
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest; // why we do this?
                let config = this.createSenderConfig(TransportType.Xhr) && {disableSendBeaconSplit: true};
                const { sender } = this.initializeCoreAndSender(config, "000e0000-e000-0000-a000-000000000000");
                console.log("xhr sender called", this._getXhrRequests().length);

                const telemetryItem: ITelemetryItem = {
                    name: "fake item",
                    iKey: "testIkey2;ingestionendpoint=testUrl1",
                    baseType: "some type",
                    baseData: {}
                };
                this.processTelemetryAndFlush(sender, telemetryItem);
                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender is called");
                console.log("xhr sender is called", this._getXhrRequests().length);
                (window as any).XMLHttpRequest = fakeXMLHttpRequest;

            }
        ].concat(PollingAssert.createPollingAssert(() => {
            if (this.statsbeatCountSpy.called) {
                this.assertStatsbeatCall(200, "Request_Success_Count");
                console.log("Statsbeat count called with success count for xhr sender");
                return true;
            }
            return false;
        }, "Waiting for xhr sender and Statsbeat count to be called", 60, 1000) as any)
    });
}
}