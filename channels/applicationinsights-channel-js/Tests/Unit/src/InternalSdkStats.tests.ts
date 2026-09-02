import { AITestClass, Assert, PollingAssert } from "@microsoft/ai-test-framework";
import {
    AppInsightsCore, createStatsMgr, FeatureOptInMode, getWindow, IAppInsightsCore, IConfiguration, IPayloadData, IInternalSdkStatsState,
    IStatsMgr, ITelemetryItem, IUnloadHook, TransportType
} from "@microsoft/applicationinsights-core-js";
import { Sender } from "../../../src/Sender";
import { SinonSpy, SinonStub } from "sinon";
import { ISenderConfig } from "../../../types/applicationinsights-channel-js";
import { isBeaconsSupported } from "@microsoft/applicationinsights-core-js";

const STATS_TEST_CFG_URL = "https://tst-data.stats.monitor.azure.com/cfg/v1.json";
const STATS_TEST_HOST = "tst-data.stats.monitor.azure.com";

function _clearStatsStorage() {
    try {
        let storage = typeof sessionStorage !== "undefined" ? sessionStorage : null;
        if (storage) {
            let keys: string[] = [];
            for (let lp = 0; lp < storage.length; lp++) {
                let key = storage.key(lp);
                if (key && key.indexOf("000e0000-e000-0000-a000-000000000000:") === 0) {
                    keys.push(key);
                }
            }

            for (let lp = 0; lp < keys.length; lp++) {
                storage.removeItem(keys[lp]);
            }
        }
    } catch (e) {
        // Session storage may be unavailable.
    }
}

export class InternalSdkStatsTests extends AITestClass {
    private _core: AppInsightsCore;
    private _sender: Sender;
    private _statsMgr: IStatsMgr;
    private _statsMgrUnloadHook: IUnloadHook | null;
    private internalSdkStatsCountSpy: SinonSpy;
    private fetchStub: sinon.SinonStub;
    private beaconStub: sinon.SinonStub;
    private statsCore: IAppInsightsCore;

    public testInitialize() {
        _clearStatsStorage();
        this._core = new AppInsightsCore();
        this._sender = new Sender();
        this._statsMgr = createStatsMgr();
    }

    public testFinishedCleanup() {
        _clearStatsStorage();
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
        if (this.internalSdkStatsCountSpy) {
            this.internalSdkStatsCountSpy.restore();
        }
        if (this.fetchStub) {
            this.fetchStub.restore();
        }
        if (this.beaconStub) {
            this.beaconStub.restore();
        }
        if (this.statsCore) {
            this.statsCore.unload(false);
        }
    }

    private createStatsCore(config: IConfiguration): IAppInsightsCore {
        this.statsCore = {
            config,
            isInitialized: () => true,
            track: (item: ITelemetryItem) => {
            },
            unload: () => {
            }
        } as any;
        return this.statsCore;
    }

    private initializeCoreAndSender(config: any, instrumentationKey: string) {
        const sender = new Sender();
        const core = new AppInsightsCore();
        const coreConfig = {
            instrumentationKey,
            stats: {
                shrtInt: 900,
                // The config url gates collection, without it nothing is collected or sent
                cfgUrl: STATS_TEST_CFG_URL,
                iKey: "Stats-Test-iKey",
                snp: "6",
                // Resolve the remote SDK Stats configuration synchronously (as enabled) so the tests
                // do not depend on a network fetch of the cfg/v1.json endpoint.
                overrideCfgFn: (_cfgUrl: string, oncomplete: (result: { enabled: boolean, url: string } | null) => void) => {
                    oncomplete({ enabled: true, url: STATS_TEST_HOST });
                }
            },
            extensionConfig: { [sender.identifier]: config }
        };

        let statsMgr = createStatsMgr();
        // Initialize the core first, then init the manager against that same (now initialized)
        // core so it can enable itself (createStatsMgr().init() only enables once the core is initialized).
        core.initialize(coreConfig, [sender]);
        let unloadHook = statsMgr.init(core, (config) => this.createStatsCore(config), "InternalSdkStats");
        core.setStatsMgr(statsMgr);
        this._statsMgrUnloadHook = unloadHook;

        let internalSdkStatsState: IInternalSdkStatsState = {
            cKey: instrumentationKey,
            endpoint: config.endpointUrl,
            sdkVer: "javascript:3.4.3:snp6",
        };

        this.internalSdkStatsCountSpy = this.sandbox.spy(core.getSdkStats(internalSdkStatsState), "count");
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
    }

    private assertInternalSdkStatsCall(statusCode: number) {
        Assert.equal(this.internalSdkStatsCountSpy.callCount, 1, "SDK Stats count should be called once");
        Assert.equal(this.internalSdkStatsCountSpy.firstCall.args[0], statusCode, `InternalSdkStats count should be called with status ${statusCode}`);
        const data = JSON.stringify(this.internalSdkStatsCountSpy.firstCall.args[1]);
        Assert.ok(data.includes("startTime"), "SDK Stats count should be called with startTime set");
    }

    public registerTests() {
        this.testCase({
            name: "SDK Stats initializes when stats is true",
            test: () => {
                const config = {
                    instrumentationKey: "Test-iKey",
                    featureOptIn: {
                        "InternalSdkStats": {
                            mode: FeatureOptInMode.enable
                        }
                    },
                    stats: {
                        shrtInt: 900,
                        cfgUrl: STATS_TEST_CFG_URL,
                        iKey: "Stats-Test-iKey",
                        overrideCfgFn: (_cfgUrl: string, oncomplete: (result: { enabled: boolean, url: string } | null) => void) => {
                            oncomplete({ enabled: true, url: STATS_TEST_HOST });
                        }
                    }

                };

                this._core.initialize(config, [this._sender]);
                this._statsMgrUnloadHook = this._statsMgr.init(
                    this._core, (statsConfig) => this.createStatsCore(statsConfig), "InternalSdkStats"
                );
                this._core.setStatsMgr(this._statsMgr);
                let internalSdkStatsState: IInternalSdkStatsState = {
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0",
                };

                const internalSdkStats = this._core.getSdkStats(internalSdkStatsState);

                QUnit.assert.ok(internalSdkStats, "SDK Stats is initialized");
                QUnit.assert.ok(internalSdkStats.enabled, "SDK Stats is marked as initialized");
            }
        });

        this.testCaseAsync({
            name: "SDK Stats increments success count when fetch sender is called once",
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
                if (this.internalSdkStatsCountSpy.called && this.fetchStub.called) {
                    this.assertInternalSdkStatsCall(200);
                    return true;
                }
                return false;
            }, "Waiting for fetch sender and SDK Stats count to be called") as any)
        });

        this.testCaseAsync({
            name: "SDK Stats increments throttle count when fetch sender is called with status 439",
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
                if (this.internalSdkStatsCountSpy.called && this.fetchStub.called) {
                    this.assertInternalSdkStatsCall(439);
                    return true;
                }
                return false;
            }, "Waiting for fetch sender and SDK Stats count to be called") as any)
        });

        this.testCaseAsync({
            name: "SDK Stats increments success count for beacon sender",
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
                    QUnit.assert.ok(isBeaconsSupported(), "Beacon API is supported");
                    this.processTelemetryAndFlush(sender, telemetryItem);
                }
            ].concat(PollingAssert.createPollingAssert(() => {
                if (this.internalSdkStatsCountSpy.called) {
                    this.assertInternalSdkStatsCall(200);
                    return true;
                }
                return false;
            }, "Waiting for beacon sender and SDK Stats count to be called") as any)
        });
    

        this.testCaseAsync({
            name: "SDK Stats increments success count for xhr sender",
            useFakeTimers: true,
            useFakeServer: true,
            stepDelay: 100,
            fakeServerAutoRespond: true,
            steps: [
                () => {
                    let window = getWindow();
                    let fakeXMLHttpRequest = (window as any).XMLHttpRequest; // why we do this?
                    let config: any = this.createSenderConfig(TransportType.Xhr);
                    config.disableSendBeaconSplit = true;
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
                if (this.internalSdkStatsCountSpy.called) {
                    this.assertInternalSdkStatsCall(200);
                    console.log("SDK Stats count called with success count for xhr sender");
                    return true;
                }
                return false;
            }, "Waiting for xhr sender and SDK Stats count to be called", 60, 1000) as any)
        });
    }
}
