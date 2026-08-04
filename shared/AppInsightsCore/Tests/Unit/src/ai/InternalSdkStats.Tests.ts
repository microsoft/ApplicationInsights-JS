import * as sinon from "sinon";
import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { IPayloadData } from "../../../../src/interfaces/ai/IXHROverride";
import { IStatsMgr } from "../../../../src/interfaces/ai/IStatsMgr";
import { AppInsightsCore } from "../../../../src/core/AppInsightsCore";
import { IConfiguration } from "../../../../src/interfaces/ai/IConfiguration";
import { createStatsMgr, getStatsCfgUrl, STATS_SDK_ENDPOINT_KEY } from "../../../../src/core/InternalSdkStats";
import { IInternalSdkStatsState } from "../../../../src/interfaces/ai/IInternalSdkStats";
import { ITelemetryItem } from "../../../../src/interfaces/ai/ITelemetryItem";
import { IPlugin } from "../../../../src/interfaces/ai/ITelemetryPlugin";
import { IAppInsightsCore } from "../../../../src/interfaces/ai/IAppInsightsCore";
import { FeatureOptInMode } from "../../../../src/enums/ai/FeatureOptInEnums";

const STATS_COLLECTION_SHORT_INTERVAL: number = 900; // 15 minutes
const STATS_TEST_CFG_URL = "https://data.stats.monitor.azure.com/cfg/v1.json";

export class InternalSdkStatsTests extends AITestClass {
    private _core: AppInsightsCore;
    private _config: IConfiguration;
    private _statsMgr: IStatsMgr;
    private _trackSpy: sinon.SinonSpy;

    constructor(emulateIe: boolean) {
        super("InternalSdkStatsTests", emulateIe);
    }

    public testInitialize() {
        let _self = this;
        super.testInitialize();
        
        _self._config = {
            instrumentationKey: "Test-iKey",
            disableInstrumentationKeyValidation: true,
            featureOptIn: {
                "InternalSdkStats": {
                    mode: FeatureOptInMode.enable
                }
            },
            stats: {
                shrtInt: STATS_COLLECTION_SHORT_INTERVAL,
                // The config url gates collection, without it nothing is collected or sent
                cfgUrl: STATS_TEST_CFG_URL,
                // Resolve the remote SDK Stats configuration synchronously (as enabled) so the tests
                // do not attempt a real network fetch of the cfg/v1.json endpoint.
                overrideCfgFn: (_cfgUrl: string, oncomplete: (result: { enabled: boolean, url: string } | null) => void) => {
                    oncomplete({ enabled: true, url: "data.stats.monitor.azure.com" });
                }
            }
        };
        
        _self._statsMgr = createStatsMgr();
        _self._core = new AppInsightsCore();
        // Initialize the core once here (with a minimal channel plugin) so the stats manager
        // can be enabled when init() is called - createStatsMgr().init() only hooks config
        // changes and enables the manager when the core is already initialized.
        _self._core.initialize(_self._config, [new ChannelPlugin()]);

        // Create spy for tracking telemetry
        _self._trackSpy = this.sandbox.spy(_self._core, "track");
    }

    public testCleanup() {
        super.testCleanup();
        if (this._core && this._core.isInitialized()) {
            this._core.unload(false);
        }
        this._core = null as any;
        this._statsMgr = null as any;
    }

    public registerTests() {

        this.testCase({
            name: "SDK Stats: Initialization",
            test: () => {
                // Test with no initialization
                Assert.equal(false, this._statsMgr.enabled, "SDK Stats manager should not be initialized by default");
                
                let internalSdkStatsState: IInternalSdkStatsState = {
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0",
                };
                Assert.equal(null, this._statsMgr.newInst(internalSdkStatsState), "SDK Stats should not be created before initialization");

                // Initialize
                this._statsMgr.init(this._core, "InternalSdkStats");
                Assert.equal(true, this._statsMgr.enabled, "SDK Stats manager should be initialized after initialization");

                let newInst = this._statsMgr.newInst(internalSdkStatsState);
                Assert.ok(!!newInst, "SDK Stats should be created after initialization");
                Assert.equal(true, newInst.enabled, "SDK Stats should be enabled after initialization");
                Assert.equal("https://example.endpoint.com", newInst.endpoint);
            }
        });

        this.testCase({
            name: "SDK Stats: count method tracks request metrics",
            useFakeTimers: true,
            test: () => {
                // Initialize SDK Stats manager
                this._statsMgr.init(this._core, "InternalSdkStats");
                
                // Create mock payload data with timing information
                const payloadData = {
                    urlString: "https://example.endpoint.com",
                    data: "testData",
                    headers: {},
                    timeout: 0,
                    disableXhrSync: false,
                    statsData: {
                        startTime: Date.now() // Simulated start time (numeric, used in duration arithmetic)
                    }
                } as IPayloadData;
                
                let internalSdkStatsState: IInternalSdkStatsState = {
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0",
                };
                let internalSdkStats = this._statsMgr.newInst(internalSdkStatsState);

                // Test successful request
                internalSdkStats.count(200, payloadData, "https://example.endpoint.com");
                
                // Test failed request
                internalSdkStats.count(500, payloadData, "https://example.endpoint.com");
                
                // Test throttled request
                internalSdkStats.count(429, payloadData, "https://example.endpoint.com");
                
                // Verify that track is called when the collection timer fires
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);
                
                // Verify that track was called
                Assert.ok(this._trackSpy.called, "track should be called when SDK Stats timer fires");
                
                // When the timer fires, multiple metrics should be sent
                Assert.ok(this._trackSpy.callCount >= 3, "Multiple metrics should be tracked");
            }
        });

        this.testCase({
            name: "SDK Stats: countException method tracks exceptions",
            useFakeTimers: true,
            test: () => {
                // Initialize SDK Stats manager
                this._statsMgr.init(this._core, "InternalSdkStats");

                let internalSdkStatsState: IInternalSdkStatsState = {
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0",
                };
                let internalSdkStats = this._statsMgr.newInst(internalSdkStatsState);
                
                // Count an exception
                internalSdkStats.countException("https://example.endpoint.com", "NetworkError");
                
                // Verify that track is called when the collection timer fires
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);
                
                // Verify that track was called
                Assert.ok(this._trackSpy.called, "track should be called when SDK Stats timer fires");
                
                // Check that exception metrics are tracked
                let foundExceptionMetric = false;
                for (let i = 0; i < this._trackSpy.callCount; i++) {
                    const call = this._trackSpy.getCall(i);
                    const item: ITelemetryItem = call.args[0];
                    if (item.baseData &&
                        item.baseData.properties &&
                        item.baseData.properties.exceptionType === "NetworkError") {
                        foundExceptionMetric = true;
                        break;
                    }
                }
                
                Assert.ok(foundExceptionMetric, "Exception metrics should be tracked");
            }
        });

        this.testCase({
            name: "SDK Stats: does not send metrics for different endpoints",
            useFakeTimers: true,
            test: () => {
                // Initialize SDK Stats manager for a specific endpoint
                this._statsMgr.init(this._core, "InternalSdkStats");
                
                // Create mock payload data
                const payloadData = {
                    urlString: "https://example.endpoint.com",
                    data: "testData",
                    headers: {},
                    timeout: 0,
                    disableXhrSync: false,
                    statsData: {
                        startTime: Date.now()
                    }
                } as IPayloadData;
                
                let internalSdkStatsState: IInternalSdkStatsState = {
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0",
                };
                let internalSdkStats = this._statsMgr.newInst(internalSdkStatsState);

                // Set up spies to check internal calls
                const countSpy = this.sandbox.spy(internalSdkStats, "count");
                
                // Count metrics for a different endpoint
                internalSdkStats.count(200, payloadData, "https://different.endpoint.com");

                // Verify that track is called when the collection timer fires
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);
                // The count method was called, but it should return early
                Assert.equal(1, countSpy.callCount, "count method should be called");
                Assert.equal(0, this._trackSpy.callCount, "track should not be called for different endpoint");
            }
        });

        this.testCase({
            name: "SDK Stats: test dynamic configuration changes",
            useFakeTimers: true,
            test: () => {
                // Setup core with internalSdkStats enabled (guard against re-initialization since the
                // core is now initialized in testInitialize())
                if (!this._core.isInitialized()) {
                    this._core.initialize(this._config, [new ChannelPlugin()]);
                }
                // Initialize SDK Stats manager for a specific endpoint
                this._statsMgr.init(this._core, "InternalSdkStats");
                this._core.setStatsMgr(this._statsMgr);

                let internalSdkStatsState: IInternalSdkStatsState = {
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0",
                };

                // Verify that SDK Stats is created
                const internalSdkStats = this._core.getSdkStats(internalSdkStatsState);
                Assert.ok(!!internalSdkStats, "InternalSdkStats should be created");
                
                // Explicitly disable SDK Stats
                this._core.config.featureOptIn["InternalSdkStats"].mode = FeatureOptInMode.disable;
                this.clock.tick(1); // Allow time for config changes to propagate
                
                // Verify that SDK Stats is removed
                const updatedInternalSdkStats = this._core.getSdkStats(internalSdkStatsState);
                Assert.ok(!updatedInternalSdkStats, "SDK Stats should be removed when disabled");
                
                // Re-enable SDK Stats
                this._core.config.featureOptIn["InternalSdkStats"].mode = FeatureOptInMode.enable;
                this.clock.tick(1); // Allow time for config changes to propagate
                
                // Verify that SDK Stats is created again
                const reenabledInternalSdkStats = this._core.getSdkStats(internalSdkStatsState);
                Assert.ok(reenabledInternalSdkStats, "SDK Stats should be recreated when re-enabled");

                // FeatureOptInMode.none falls back to the SDK default state (enabled), so SDK Stats stays enabled
                this._core.config.featureOptIn["InternalSdkStats"].mode = FeatureOptInMode.none;
                this.clock.tick(1); // Allow time for config changes to propagate
                
                // Verify that SDK Stats remains enabled (none defaults to enabled)
                Assert.ok(!!this._core.getSdkStats(internalSdkStatsState), "SDK Stats should remain enabled when mode is none (defaults to enabled)");

                // Explicitly disable again before testing the null case
                this._core.config.featureOptIn["InternalSdkStats"].mode = FeatureOptInMode.disable;
                this.clock.tick(1); // Allow time for config changes to propagate
                Assert.ok(!this._core.getSdkStats(internalSdkStatsState), "SDK Stats should be removed when disabled");

                // A null mode also falls back to the SDK default state (enabled)
                this._core.config.featureOptIn["InternalSdkStats"].mode = null;
                this.clock.tick(1); // Allow time for config changes to propagate
                
                // Verify that SDK Stats is recreated (null defaults to enabled)
                Assert.ok(!!this._core.getSdkStats(internalSdkStatsState), "SDK Stats should remain enabled when mode is null (defaults to enabled)");
            }
        });

        this.testCase({
            name: "SDK Stats: routes events to the remote configured SDK Stats endpoint",
            useFakeTimers: true,
            test: () => {
                this._statsMgr.init(this._core, "InternalSdkStats");

                const payloadData = {
                    urlString: "https://example.endpoint.com",
                    data: "testData",
                    headers: {},
                    timeout: 0,
                    disableXhrSync: false,
                    statsData: {
                        startTime: Date.now()
                    }
                } as IPayloadData;

                let internalSdkStatsState: IInternalSdkStatsState = {
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0",
                };
                let internalSdkStats = this._statsMgr.newInst(internalSdkStatsState);
                internalSdkStats.count(200, payloadData, "https://example.endpoint.com");

                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.ok(this._trackSpy.called, "track should be called when SDK Stats timer fires");

                // The host returned by the remote configuration (data.stats.monitor.azure.com) should be
                // combined with the /v2/track path to form the SDK Stats ingestion endpoint.
                let foundEndpoint = false;
                for (let i = 0; i < this._trackSpy.callCount; i++) {
                    const item: ITelemetryItem = this._trackSpy.getCall(i).args[0];
                    if (item.data && item.data[STATS_SDK_ENDPOINT_KEY] === "https://data.stats.monitor.azure.com/v2/track") {
                        foundEndpoint = true;
                        break;
                    }
                }

                Assert.ok(foundEndpoint, "SDK Stats events should be routed to the remote configured ingestion endpoint");
            }
        });

        this.testCase({
            name: "SDK Stats: does not send when the remote configuration is disabled",
            useFakeTimers: true,
            test: () => {
                // Override the remote SDK Stats configuration to report collection as disabled
                this._core.config.stats.overrideCfgFn = (_cfgUrl: string, oncomplete: (result: { enabled: boolean, url: string } | null) => void) => {
                    oncomplete({ enabled: false, url: "data.stats.monitor.azure.com" });
                };
                this.clock.tick(1); // Allow the config change to propagate

                this._statsMgr.init(this._core, "InternalSdkStats");

                const payloadData = {
                    urlString: "https://example.endpoint.com",
                    data: "testData",
                    headers: {},
                    timeout: 0,
                    disableXhrSync: false,
                    statsData: {
                        startTime: Date.now()
                    }
                } as IPayloadData;

                let internalSdkStatsState: IInternalSdkStatsState = {
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0",
                };
                let internalSdkStats = this._statsMgr.newInst(internalSdkStatsState);
                internalSdkStats.count(200, payloadData, "https://example.endpoint.com");

                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.equal(0, this._trackSpy.callCount, "track should not be called when the remote configuration disables SDK Stats");
            }
        });

        this.testCase({
            name: "SDK Stats: manager enables by default when config.stats is not provided",
            test: () => {
                // A core without an explicit config.stats should still enable the manager, because the
                // manager seeds an (empty) stats config default.
                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "Test-iKey",
                    disableInstrumentationKeyValidation: true
                } as IConfiguration, [new ChannelPlugin()]);

                let statsMgr = createStatsMgr();
                let hook = statsMgr.init(core, "InternalSdkStats");

                Assert.equal(true, statsMgr.enabled, "Manager should be enabled by default via the seeded stats config");

                hook && hook.rm();
                core.unload(false);
            }
        });

        this.testCase({
            name: "SDK Stats: does not send when no cfgUrl has been configured",
            useFakeTimers: true,
            test: () => {
                // Remove the configured cfg url, without it there is nothing to resolve so nothing is sent
                this._core.config.stats.cfgUrl = null;
                this.clock.tick(1); // Allow the config change to propagate

                this._statsMgr.init(this._core, "InternalSdkStats");

                let internalSdkStats = this._statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                });
                internalSdkStats.countException("https://example.endpoint.com", "NetworkError");

                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.equal(0, this._trackSpy.callCount, "track should not be called when no cfgUrl is configured");
            }
        });

        this.testCase({
            name: "SDK Stats: starts sending once the cfgUrl arrives from the dynamic config",
            useFakeTimers: true,
            test: () => {
                // Simulate the CDN configuration arriving after initialization by starting without a url
                this._core.config.stats.cfgUrl = null;
                this.clock.tick(1);

                this._statsMgr.init(this._core, "InternalSdkStats");

                let internalSdkStats = this._statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                });
                internalSdkStats.countException("https://example.endpoint.com", "NetworkError");

                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);
                Assert.equal(0, this._trackSpy.callCount, "Nothing should be sent before the cfgUrl is available");

                // The CDN / dynamic config now supplies the url
                this._core.config.stats.cfgUrl = STATS_TEST_CFG_URL;
                this.clock.tick(1); // Allow the config change to propagate

                internalSdkStats.countException("https://example.endpoint.com", "NetworkError");
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.ok(this._trackSpy.called, "SDK Stats should be sent once the cfgUrl is supplied by the config");
            }
        });

        this.testCase({
            name: "SDK Stats: getStatsCfgUrl derives the EU url and requires a configured url",
            test: () => {
                Assert.equal(null, getStatsCfgUrl("https://westeurope.in.applicationinsights.azure.com/", null),
                    "No configured url should resolve to null");
                Assert.equal(null, getStatsCfgUrl("https://eastus.in.applicationinsights.azure.com/", undefined),
                    "No configured url should resolve to null");

                Assert.equal(STATS_TEST_CFG_URL, getStatsCfgUrl("https://eastus.in.applicationinsights.azure.com/", STATS_TEST_CFG_URL),
                    "A non-EU endpoint should use the configured url as-is");
                Assert.equal("https://eu-data.stats.monitor.azure.com/cfg/v1.json",
                    getStatsCfgUrl("https://westeurope.in.applicationinsights.azure.com/", STATS_TEST_CFG_URL),
                    "An EU endpoint should have the eu- prefix inserted in front of the host");
                Assert.equal("https://eu-data.stats.monitor.azure.com/cfg/v1.json",
                    getStatsCfgUrl("https://westeurope-5.in.applicationinsights.azure.com/", STATS_TEST_CFG_URL),
                    "An EU region replica endpoint should also resolve to the EU url");
                Assert.equal("eu-data.stats.monitor.azure.com/cfg/v1.json",
                    getStatsCfgUrl("https://northeurope.in.applicationinsights.azure.com/", "data.stats.monitor.azure.com/cfg/v1.json"),
                    "A configured url without a scheme should still get the eu- prefix");
            }
        });
    }
}

class ChannelPlugin implements IPlugin {
    public isFlushInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;

    public identifier = "Sender";
    public priority: number = 1001;

    constructor() {
        this.processTelemetry = this._processTelemetry.bind(this);
    }
    
    public pause(): void {
        this.isPauseInvoked = true;
    }

    public resume(): void {
        this.isResumeInvoked = true;
    }

    public teardown(): void {
        this.isTearDownInvoked = true;
    }

    flush(async?: boolean, callBack?: () => void): void {
        this.isFlushInvoked = true;
        if (callBack) {
            callBack();
        }
    }

    public processTelemetry(env: ITelemetryItem) {}

    setNextPlugin(next: any) {
        // no next setup
    }

    public initialize = (config: IConfiguration, core: IAppInsightsCore, plugin: IPlugin[]) => {
    }

    private _processTelemetry(env: ITelemetryItem) {
    }
}

class CustomTestError extends Error {
    constructor(message = "") {
        super(message);
        this.name = "CustomTestError";
        this.message = message + " -- test error.";
    }
}
