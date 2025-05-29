import { AITestClass, Assert, PollingAssert } from "@microsoft/ai-test-framework";
import { AppInsightsCore, createStatsMgr, eStatsType, FeatureOptInMode, getWindow, IPayloadData, ISdkStatsState, IStatsMgr, ITelemetryItem, IUnloadHook, TransportType } from "@microsoft/applicationinsights-core-js";
import { Sender } from "../../../src/Sender";
import { SinonSpy, SinonStub } from "sinon";
import { ISenderConfig } from "../../../types/applicationinsights-channel-js";
import { isBeaconApiSupported } from "@microsoft/applicationinsights-common";

export class SdkStatsTests extends AITestClass {
    private _core: AppInsightsCore;
    private _sender: Sender;
    private _statsMgr: IStatsMgr;
    private _statsMgrUnloadHook: IUnloadHook | null;
    private sdkStatsCountSpy: SinonSpy;
    private fetchStub: sinon.SinonStub;
    private beaconStub: sinon.SinonStub;
    private trackSpy: SinonSpy;

    public testInitialize() {
        this._core = new AppInsightsCore();
        this._sender = new Sender();
        this._statsMgr = createStatsMgr();
    }

    public testFinishedCleanup() {
        if (this._sender && this._sender.isInitialized()) {
            this._sender.pause();
            this._sender._buffer.clear();
            this._sender.teardown();
        }
        this._sender = null;
        this._core = null;
        this._statsMgr = null;
        if (this._statsMgrUnloadHook) {
            this._statsMgrUnloadHook.rm();
            this._statsMgrUnloadHook = null;
        }
        if (this.sdkStatsCountSpy) {
            this.sdkStatsCountSpy.restore();
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
            _sdk: { 
                stats: {
                    shrtInt: 900,
                    endCfg: [
                        { 
                            type: 0,
                            keyMap: [
                                {
                                    key: "stats-key1",
                                    match: [ "https://example.endpoint.com" ]
                                }
                            ]
                        }
                    ]
                }
            },
            extensionConfig: { [sender.identifier]: config }
        };

        let statsMgr = createStatsMgr();
        // Initialize
        let unloadHook = statsMgr.init(this._core, {
            feature: "SdkStats",
            getCfg: (core, cfg) => {
                return cfg?._sdk?.stats;
            }
        });
        
        core.initialize(coreConfig, [sender]);
        core.setStatsMgr(statsMgr);

        this.sdkStatsCountSpy = this.sandbox.spy(core.getSdkStats(), "count");
        this.trackSpy = this.sandbox.spy(core, "track");

        this.onDone(() => {
            sender.teardown();
        });

        return { core, sender, statsMgr, unloadHook };
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
        this.clock.tick(900000); // Simulate time passing for sdk stats to be sent
    }

    private assertSdkStatsCall(statusCode: number, eventName: string) {
        Assert.equal(this.sdkStatsCountSpy.callCount, 1, "SdkStats count should be called once");
        Assert.equal(this.sdkStatsCountSpy.firstCall.args[0], statusCode, `SdkStats count should be called with status ${statusCode}`);
        const data = JSON.stringify(this.sdkStatsCountSpy.firstCall.args[1]);
        Assert.ok(data.includes("startTime"), "SdkStats count should be called with startTime set");
        const sdkStatsEvent = this.trackSpy.firstCall.args[0];
        Assert.equal(sdkStatsEvent.baseType, "MetricData", "SdkStats event should be of type MetricData");
        Assert.equal(sdkStatsEvent.baseData.name, eventName, `SdkStats event should be of type ${eventName}`);
    }

    public registerTests() {
        this.testCase({
            name: "SdkStats initializes when stats is true",
            test: () => {
                const config = {
                    instrumentationKey: "Test-iKey",
                    featureOptIn: {
                        "SdkStats": {
                            mode: FeatureOptInMode.enable
                        }
                    },
                    _sdk: { 
                        stats: {
                            shrtInt: 900,
                            endCfg: [
                                { 
                                    type: 0,
                                    keyMap: [
                                        {
                                            key: "stats-key1",
                                            match: [ "https://example.endpoint.com" ]
                                        }
                                    ]
                                }
                            ]
                        }
                    },
                };

                this._core.initialize(config, [this._sender]);
                this._statsMgrUnloadHook = this._statsMgr.init(this._core, {
                    feature: "SdkStats",
                    getCfg: (core, cfg) => {
                        return cfg?._sdk?.stats;
                    }
                });
                let sdkStatsState: ISdkStatsState = {
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0",
                    type: eStatsType.SDK
                };   

                const sdkStats = this._core.getSdkStats(sdkStatsState);

                QUnit.assert.ok(sdkStats, "SdkStats is initialized");
                QUnit.assert.ok(sdkStats.enabled, "SdkStats is marked as initialized");
            }
        });

        this.testCaseAsync({
            name: "SdkStats increments success count when fetch sender is called once",
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
                if (this.sdkStatsCountSpy.called && this.fetchStub.called) {
                    this.assertSdkStatsCall(200, "Request_Success_Count");
                    return true;
                }
                return false;
            }, "Waiting for fetch sender and SdkStats count to be called") as any)
        });

        this.testCaseAsync({
            name: "SdkStats increments throttle count when fetch sender is called with status 439",
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
                if (this.sdkStatsCountSpy.called && this.fetchStub.called) {
                    this.assertSdkStatsCall(439, "Throttle_Count");
                    return true;
                }
                return false;
            }, "Waiting for fetch sender and SdkStats count to be called") as any)
        });

        this.testCaseAsync({
            name: "SdkStats increments success count for beacon sender",
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
                if (this.sdkStatsCountSpy.called) {
                    this.assertSdkStatsCall(200, "Request_Success_Count");
                    return true;
                }
                return false;
            }, "Waiting for beacon sender and SdkStats count to be called") as any)
        });
    

    this.testCaseAsync({
        name: "SdkStats increments success count for xhr sender",
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
            if (this.sdkStatsCountSpy.called) {
                this.assertSdkStatsCall(200, "Request_Success_Count");
                console.log("SdkStats count called with success count for xhr sender");
                return true;
            }
            return false;
        }, "Waiting for xhr sender and SdkStats count to be called", 60, 1000) as any)
    });
}
}