import { AITestClass, Assert, PollingAssert } from "@microsoft/ai-test-framework";
import {
    AppInsightsCore, createStatsMgr, FeatureOptInMode, IAppInsightsCore, IConfiguration, IInternalSdkStatsState,
    isBeaconsSupported, IStatsMgr, ITelemetryItem, TransportType
} from "@microsoft/applicationinsights-core-js";
import { objDefine } from "@nevware21/ts-utils";
import { SinonSpy } from "sinon";
import { Sender } from "../../../src/Sender";
import { ISenderConfig } from "../../../types/applicationinsights-channel-js";

const STATS_TEST_CFG_URL = "https://tst-data.stats.monitor.azure.com/cfg/v1.json";
const STATS_TEST_HOST = "tst-data.stats.monitor.azure.com";

export class InternalSdkStatsTests extends AITestClass {
    private _core: AppInsightsCore;
    private _sender: Sender;
    private _statsMgr: IStatsMgr;
    private internalSdkStatsCountSpy: SinonSpy;

    public testInitialize() {
        this._core = new AppInsightsCore();
        this._sender = new Sender();
        this._statsMgr = createStatsMgr();
        this.onDone(() => {
            if (this._core.isInitialized()) {
                this._sender.pause();
                this._sender._buffer.clear();
                this._core.unload(false);
            }
        });
    }

    private createStatsCore(config: IConfiguration): IAppInsightsCore {
        return {
            config,
            isInitialized: () => true,
            track: (item: ITelemetryItem) => {
            },
            unload: () => {
            }
        } as any;
    }

    private initializeCoreAndSender(config: Partial<ISenderConfig>, instrumentationKey: string) {
        const sender = new Sender();
        const core = new AppInsightsCore();
        this.onDone(() => {
            if (core.isInitialized()) {
                sender.pause();
                sender._buffer.clear();
                core.unload(false);
            }
        });
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
        core.addUnloadHook(unloadHook);
        core.setStatsMgr(statsMgr);

        let internalSdkStatsState: IInternalSdkStatsState = {
            cKey: instrumentationKey,
            endpoint: config.endpointUrl,
            sdkVer: "javascript:3.4.3:snp6"
        };

        this.internalSdkStatsCountSpy = this.sandbox.spy(core.getSdkStats(internalSdkStatsState), "count");
        return { core, sender, statsMgr, unloadHook };
    }

    private createSenderConfig(transportType: TransportType): Partial<ISenderConfig> {
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
        sender.processTelemetry(telemetryItem, null);
        sender.flush();
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
                this._core.addUnloadHook(this._statsMgr.init(
                    this._core, (statsConfig) => this.createStatsCore(statsConfig), "InternalSdkStats"
                ));
                this._core.setStatsMgr(this._statsMgr);
                let internalSdkStatsState: IInternalSdkStatsState = {
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                };

                const internalSdkStats = this._core.getSdkStats(internalSdkStatsState);

                QUnit.assert.ok(internalSdkStats, "SDK Stats is initialized");
                QUnit.assert.ok(internalSdkStats.enabled, "SDK Stats is marked as initialized");
            }
        });

        this.testCase({
            name: "SDK Stats increments success count when fetch sender is called once",
            useFakeTimers: true,
            useFakeServer: true,
            test: () => {
                const fetchCalls = this.hookFetch((resolve) => {
                    resolve(new Response("{}", { status: 200, statusText: "OK" }));
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
                return this._asyncQueue().add(PollingAssert.asyncTaskPollingAssert(() => {
                    return this.internalSdkStatsCountSpy.called && fetchCalls.length > 0;
                }, "Waiting for fetch sender and SDK Stats count to be called", 30, 100)).add(() => {
                    Assert.equal(1, fetchCalls.length, "Fetch sender should be called once");
                    this.assertInternalSdkStatsCall(200);
                });
            }
        });

        this.testCase({
            name: "SDK Stats increments throttle count when fetch sender is called with status 439",
            useFakeTimers: true,
            test: () => {
                const fetchCalls = this.hookFetch((resolve) => {
                    resolve(new Response("{}", { status: 439, statusText: "Too Many Requests" }));
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
                return this._asyncQueue().add(PollingAssert.asyncTaskPollingAssert(() => {
                    return this.internalSdkStatsCountSpy.called && fetchCalls.length > 0;
                }, "Waiting for fetch sender and SDK Stats count to be called", 30, 100)).add(() => {
                    Assert.equal(1, fetchCalls.length, "Fetch sender should be called once");
                    this.assertInternalSdkStatsCall(439);
                });
            }
        });

        this.testCase({
            name: "SDK Stats increments success count for beacon sender",
            useFakeTimers: true,
            test: () => {
                const config = this.createSenderConfig(TransportType.Beacon);
                const { sender } = this.initializeCoreAndSender(config, "000e0000-e000-0000-a000-000000000000");

                const telemetryItem: ITelemetryItem = {
                    name: "fake item",
                    iKey: "testIkey2;ingestionendpoint=testUrl1",
                    baseType: "some type",
                    baseData: {}
                };
                const beaconCalls = this.hookSendBeacon(() => {});
                QUnit.assert.ok(isBeaconsSupported(), "Beacon API is supported");
                this.processTelemetryAndFlush(sender, telemetryItem);
                return this._asyncQueue().add(PollingAssert.asyncTaskPollingAssert(() => {
                    return this.internalSdkStatsCountSpy.called && beaconCalls.length > 0;
                }, "Waiting for beacon sender and SDK Stats count to be called", 30, 100)).add(() => {
                    Assert.equal(1, beaconCalls.length, "Beacon sender should be called once");
                    this.assertInternalSdkStatsCall(200);
                });
            }
        });
    

        this.testCase({
            name: "SDK Stats ignores pending XHR responses after core unload",
            useFakeTimers: true,
            useFakeServer: true,
            fakeServerAutoRespond: false,
            test: () => {
                const config = this.createSenderConfig(TransportType.Xhr);
                const { core, sender } = this.initializeCoreAndSender(config, "000e0000-e000-0000-a000-000000000000");
                const getStatsSpy = this.sandbox.spy(core, "getSdkStats");
                const successSpy = this.sandbox.spy(sender, "_onSuccess");
                const telemetryItem: ITelemetryItem = {
                    name: "pending item",
                    baseType: "EventData",
                    baseData: { name: "pending item" }
                };

                this.processTelemetryAndFlush(sender, telemetryItem);
                this.processTelemetryAndFlush(sender, telemetryItem);
                const requests = this.activeXhrRequests;
                Assert.equal(2, requests.length, "Two XHR requests should be pending");
                for (let lp = 0; lp < requests.length; lp++) {
                    objDefine(requests[lp], "responseURL", { v: config.endpointUrl });
                }

                sender.pause();
                sender._buffer.clear();
                core.unload(false);
                Assert.equal(null, sender.core, "The sender core should be cleared during unload");

                // The first late response restores the endpoint, so the second reaches the SDK Stats lookup.
                requests[0].respond(200, {}, "");
                requests[1].respond(200, {}, "");
                Assert.equal(2, successSpy.callCount, "Both late responses should complete without throwing");
                Assert.equal(0, getStatsSpy.callCount, "Late responses should not access the unloaded stats manager");
                Assert.equal(0, this.internalSdkStatsCountSpy.callCount, "Late responses should not record SDK Stats");
            }
        });

        this.testCase({
            name: "SDK Stats increments success count for xhr sender",
            useFakeTimers: true,
            useFakeServer: true,
            fakeServerAutoRespond: true,
            test: () => {
                let config: Partial<ISenderConfig> = this.createSenderConfig(TransportType.Xhr);
                config.disableSendBeaconSplit = true;
                const { sender } = this.initializeCoreAndSender(config, "000e0000-e000-0000-a000-000000000000");

                const telemetryItem: ITelemetryItem = {
                    name: "fake item",
                    iKey: "testIkey2;ingestionendpoint=testUrl1",
                    baseType: "some type",
                    baseData: {}
                };
                this.processTelemetryAndFlush(sender, telemetryItem);
                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender is called");
                return this._asyncQueue().add(PollingAssert.asyncTaskPollingAssert(() => {
                    return this.internalSdkStatsCountSpy.called;
                }, "Waiting for xhr sender and SDK Stats count to be called", 60, 1000)).add(() => {
                    this.assertInternalSdkStatsCall(200);
                });
            }
        });
    }
}
