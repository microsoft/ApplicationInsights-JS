import * as sinon from "sinon";
import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { IPayloadData } from "../../../../src/interfaces/ai/IXHROverride";
import { IStatsMgr } from "../../../../src/interfaces/ai/IStatsMgr";
import { AppInsightsCore } from "../../../../src/core/AppInsightsCore";
import { IConfiguration } from "../../../../src/interfaces/ai/IConfiguration";
import { createStatsMgr, getStatsCfgUrl } from "../../../../src/core/InternalSdkStats";
import { IInternalSdkStatsState } from "../../../../src/interfaces/ai/IInternalSdkStats";
import { ITelemetryItem } from "../../../../src/interfaces/ai/ITelemetryItem";
import { IPlugin } from "../../../../src/interfaces/ai/ITelemetryPlugin";
import { IAppInsightsCore } from "../../../../src/interfaces/ai/IAppInsightsCore";
import { FeatureOptInMode } from "../../../../src/enums/ai/FeatureOptInEnums";
import { UseFeatureFn } from "../../../../src/interfaces/ai/IThrottleMgr";

const STATS_COLLECTION_SHORT_INTERVAL: number = 900; // 15 minutes
const STATS_TEST_CFG_URL = "https://tst-data.stats.monitor.azure.com/cfg/v1.json";
const STATS_TEST_HOST = "tst-data.stats.monitor.azure.com";
const STATS_TEST_IKEY = "Stats-Test-iKey";
function _clearStatsStorage() {
    try {
        let storage = typeof sessionStorage !== "undefined" ? sessionStorage : null;
        if (storage) {
            let keys: string[] = [];
            for (let lp = 0; lp < storage.length; lp++) {
                let key = storage.key(lp);
                if (key && key.indexOf("Test-iKey:") === 0) {
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

function _readStatsStorage(cKey: string, endpoint: string): any {
    try {
        let raw = sessionStorage.getItem(cKey + ":" + endpoint);
        let value = raw ? JSON.parse(raw) : null;
        return value ? { st: value[0], cnt: value[1] } : null;
    } catch (e) {
        return null;
    }
}

export class InternalSdkStatsTests extends AITestClass {
    private _core: AppInsightsCore;
    private _config: IConfiguration;
    private _statsMgr: IStatsMgr;
    private _trackSpy: sinon.SinonSpy;
    private _rootTrackSpy: sinon.SinonSpy;
    private _statsCoreConfigs: IConfiguration[];
    private _statsCores: AppInsightsCore[];

    constructor(emulateIe: boolean) {
        super("InternalSdkStatsTests", emulateIe);
    }

    public testInitialize() {
        let _self = this;
        super.testInitialize();

        _clearStatsStorage();

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
                iKey: STATS_TEST_IKEY,
                // Resolve the remote SDK Stats configuration synchronously (as enabled) so the tests
                // do not attempt a real network fetch of the cfg/v1.json endpoint.
                overrideCfgFn: (_cfgUrl: string, oncomplete: (result: { enabled: boolean, url: string } | null) => void) => {
                    oncomplete({ enabled: true, url: STATS_TEST_HOST });
                }
            }
        };
        
        _self._statsMgr = createStatsMgr();
        _self._core = new AppInsightsCore();
        _self._statsCoreConfigs = [];
        _self._statsCores = [];
        // Initialize the core once here (with a minimal channel plugin) so the stats manager
        // can be enabled when init() is called - createStatsMgr().init() only hooks config
        // changes and enables the manager when the core is already initialized.
        _self._core.initialize(_self._config, [new ChannelPlugin()]);

        _self._trackSpy = this.sandbox.spy();
        _self._rootTrackSpy = this.sandbox.spy(_self._core, "track");
    }

    public testCleanup() {
        super.testCleanup();
        if (this._core && this._core.isInitialized()) {
            this._core.unload(false);
        }
        for (let lp = 0; lp < this._statsCores.length; lp++) {
            this._statsCores[lp].isInitialized() && this._statsCores[lp].unload(false);
        }
        this._core = null as any;
        this._statsMgr = null as any;
        this._statsCores = [];
        _clearStatsStorage();
    }

    private _createStatsCore(config: IConfiguration): IAppInsightsCore {
        let core = new AppInsightsCore();
        core.initialize(config, [new ChannelPlugin()]);
        let track = core.track;
        this.sandbox.stub(core, "track").callsFake((item: ITelemetryItem) => {
            this._trackSpy(item);
            track.call(core, item);
        });
        this._statsCoreConfigs.push(config);
        this._statsCores.push(core);
        return core;
    }

    private _initStatsMgr(
        core: IAppInsightsCore = this._core,
        featureName: string = "InternalSdkStats",
        useFeature?: UseFeatureFn
    ) {
        return this._statsMgr.init(core, (config) => this._createStatsCore(config), featureName, useFeature);
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
                this._initStatsMgr();
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
                this._initStatsMgr();
                
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
                this._initStatsMgr();

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
                this._initStatsMgr();
                
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
                this._initStatsMgr();
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
                this._initStatsMgr();

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
                Assert.equal(0, this._rootTrackSpy.callCount, "SDK Stats should not use the customer core");
                Assert.equal(STATS_TEST_IKEY, this._statsCoreConfigs[0].instrumentationKey,
                    "The isolated core should use the SDK Stats instrumentation key");
                Assert.equal("https://" + STATS_TEST_HOST + "/v2/track", this._statsCoreConfigs[0].endpointUrl,
                    "The isolated core should use the remote configured endpoint");
                Assert.equal(1, this._statsCoreConfigs.length, "One isolated core should handle the SDK Stats batch");

                for (let i = 0; i < this._trackSpy.callCount; i++) {
                    const item: ITelemetryItem = this._trackSpy.getCall(i).args[0];
                    Assert.equal(STATS_TEST_IKEY, item.iKey, "SDK Stats should use the configured instrumentation key");
                }
            }
        });

        this.testCase({
            name: "SDK Stats: does not send when the remote configuration is disabled",
            useFakeTimers: true,
            test: () => {
                // Override the remote SDK Stats configuration to report collection as disabled
                this._core.config.stats.overrideCfgFn = (_cfgUrl: string, oncomplete: (result: { enabled: boolean, url: string } | null) => void) => {
                    oncomplete({ enabled: false, url: STATS_TEST_HOST });
                };
                this.clock.tick(1); // Allow the config change to propagate

                this._initStatsMgr();

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
            name: "SDK Stats: customer telemetry initializers cannot inspect or modify SDK Stats",
            useFakeTimers: true,
            test: () => {
                let initializerCalls = 0;
                this._core.addTelemetryInitializer(() => {
                    initializerCalls++;
                    throw new Error("Customer initializer should not receive SDK Stats");
                });
                this._initStatsMgr();

                let internalSdkStats = this._statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                });
                internalSdkStats.countException("https://example.endpoint.com", "NetworkError");

                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.ok(this._trackSpy.called, "The isolated core should receive SDK Stats");
                Assert.equal(0, initializerCalls, "Customer telemetry initializers should not receive SDK Stats");
                Assert.equal(0, this._rootTrackSpy.callCount, "The customer core should not track SDK Stats");
            }
        });

        this.testCase({
            name: "SDK Stats: unloading the manager unloads the isolated core",
            useFakeTimers: true,
            test: () => {
                let hook = this._initStatsMgr();
                let internalSdkStats = this._statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                });
                internalSdkStats.countException("https://example.endpoint.com", "NetworkError");
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                let unloadSpy = this.sandbox.spy(this._statsCores[0], "unload");
                hook.rm();

                Assert.equal(1, unloadSpy.callCount, "The isolated core should be unloaded with the manager");
            }
        });

        this.testCase({
            name: "SDK Stats: invalidates the endpoint cache when cfgUrl changes",
            useFakeTimers: true,
            test: () => {
                let fetchedUrls: string[] = [];
                this._core.config.stats.overrideCfgFn = (cfgUrl, oncomplete) => {
                    fetchedUrls.push(cfgUrl);
                    oncomplete({ enabled: true, url: STATS_TEST_HOST });
                };
                this.clock.tick(1);

                this._initStatsMgr();

                let internalSdkStats = this._statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://westeurope.in.applicationinsights.azure.com",
                    sdkVer: "1.0.0"
                });

                Assert.equal("https://eu-tst-data.stats.monitor.azure.com/cfg/v1.json", fetchedUrls[0],
                    "The initial endpoint should use the configured EU url");

                this._core.config.stats.cfgUrl = "https://next.stats.monitor.azure.com/cfg/v1.json";
                this.clock.tick(1);

                internalSdkStats.countException("https://westeurope.in.applicationinsights.azure.com", "NetworkError");
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.equal("https://eu-next.stats.monitor.azure.com/cfg/v1.json", fetchedUrls[1],
                    "The updated cfgUrl should replace the cached endpoint");
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
                let hook = statsMgr.init(core, (config) => this._createStatsCore(config), "InternalSdkStats");

                Assert.equal(true, statsMgr.enabled, "Manager should be enabled by default via the seeded stats config");

                hook && hook.rm();
                core.unload(false);
            }
        });

        this.testCase({
            name: "SDK Stats: manager delegates generated events to the SKU feature throttle",
            useFakeTimers: true,
            test: () => {
                let featureUses = 0;
                this._initStatsMgr(this._core, "InternalSdkStats", (feature, callback, sdkDefaultState) => {
                    featureUses++;
                    Assert.equal("InternalSdkStats", feature, "The configured feature name should be checked");
                    Assert.equal(true, sdkDefaultState, "SDK Stats should remain enabled by default");
                    callback();
                    return {
                        isThrottled: true,
                        throttleNum: 1
                    };
                });

                let internalSdkStats = this._statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                });
                internalSdkStats.countException("https://example.endpoint.com", "NetworkError");
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.equal(true, this._statsMgr.enabled, "The feature throttle should not disable dynamic manager configuration");
                Assert.ok(featureUses > 0, "Generated SDK Stats events should use the feature throttle");
                Assert.ok(this._trackSpy.called, "The feature callback should perform the SDK Stats operation");
            }
        });

        this.testCase({
            name: "SDK Stats: queued feature operations retain their sampling percentage",
            useFakeTimers: true,
            test: () => {
                let featureCallback: () => void;
                this._initStatsMgr(this._core, "InternalSdkStats", (_feature, callback) => {
                    featureCallback = callback;
                    return null;
                });

                let internalSdkStats = this._statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                });
                internalSdkStats.countException("https://example.endpoint.com", "NetworkError");
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);
                Assert.ok(featureCallback, "The generated event should be queued by the feature throttle");
                Assert.equal(0, this._trackSpy.callCount, "The queued SDK Stats event should not be sent early");

                this._core.config.stats.samplingPercentage = 1;
                this.clock.tick(1);
                featureCallback();

                Assert.equal(1, this._trackSpy.callCount, "The feature callback should send the queued event");
                Assert.equal(100, this._trackSpy.firstCall.args[0].sampleRate,
                    "The queued event should retain the sampling percentage used for its sampling decision");
            }
        });

        this.testCase({
            name: "SDK Stats: sampling percentage defaults to 100 percent",
            useFakeTimers: true,
            test: () => {
                this._initStatsMgr();

                Assert.equal(100, this._core.config.stats.samplingPercentage,
                    "The default should be applied to the dynamic SDK Stats config");

                let internalSdkStats = this._statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                });
                internalSdkStats.countException("https://example.endpoint.com", "NetworkError");
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.equal(1, this._trackSpy.callCount, "The default should send every generated SDK Stats item");
                Assert.equal(100, this._trackSpy.firstCall.args[0].sampleRate,
                    "SDK Stats should include the default sampling percentage");
            }
        });

        this.testCase({
            name: "SDK Stats: sampling percentage dynamically controls generated telemetry",
            useFakeTimers: true,
            test: () => {
                this._core.config.stats.samplingPercentage = 0;
                this.clock.tick(1);
                this._initStatsMgr();

                let state = {
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                };

                Assert.equal(true, this._statsMgr.enabled, "A zero sampling percentage should not disable collection");
                let internalSdkStats = this._statsMgr.newInst(state);
                Assert.ok(internalSdkStats, "SDK Stats should still be collected at zero percent");
                internalSdkStats.countException(state.endpoint, "NetworkError");
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.equal(0, this._trackSpy.callCount, "A zero sampling percentage should drop generated SDK Stats");
                Assert.equal(0, this._statsCoreConfigs.length, "No isolated core should be needed when every item is sampled out");

                this._core.config.stats.samplingPercentage = 100;
                this.clock.tick(1);

                internalSdkStats.countException(state.endpoint, "NetworkError");
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.ok(this._trackSpy.called, "A dynamic sampling change should allow generated SDK Stats");
                Assert.equal(100, this._trackSpy.firstCall.args[0].sampleRate,
                    "SDK Stats should include the configured sampling percentage");

                let trackCount = this._trackSpy.callCount;
                this._core.config.stats.samplingPercentage = 0;
                this.clock.tick(1);
                internalSdkStats.countException(state.endpoint, "NetworkError");
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.equal(true, this._statsMgr.enabled, "Sampling changes should not disable collection");
                Assert.equal(trackCount, this._trackSpy.callCount, "A dynamic zero sampling percentage should drop generated SDK Stats");
            }
        });

        this.testCase({
            name: "SDK Stats: invalid sampling percentage defaults to 100 percent",
            useFakeTimers: true,
            test: () => {
                this._core.config.stats.samplingPercentage = 101;
                this.clock.tick(1);
                this._initStatsMgr();

                let internalSdkStats = this._statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                });
                internalSdkStats.countException("https://example.endpoint.com", "NetworkError");
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.equal(100, this._trackSpy.firstCall.args[0].sampleRate,
                    "Invalid sampling percentages should use the default");
            }
        });

        this.testCase({
            name: "SDK Stats: recreates the isolated core when its configuration changes",
            useFakeTimers: true,
            test: () => {
                this._initStatsMgr();
                let internalSdkStats = this._statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                });
                internalSdkStats.countException("https://example.endpoint.com", "NetworkError");
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                let unloadSpy = this.sandbox.spy(this._statsCores[0], "unload");
                this._core.config.stats.iKey = "Updated-Stats-iKey";
                this.clock.tick(1);

                internalSdkStats.countException("https://example.endpoint.com", "NetworkError");
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.equal(1, unloadSpy.callCount, "The previous isolated core should be unloaded");
                Assert.equal(2, this._statsCoreConfigs.length, "A new isolated core should be created");
                Assert.equal("Updated-Stats-iKey", this._statsCoreConfigs[1].instrumentationKey,
                    "The new isolated core should use the updated configuration");
            }
        });

        this.testCase({
            name: "SDK Stats: does not send when no cfgUrl has been configured",
            useFakeTimers: true,
            test: () => {
                // Remove the configured cfg url, without it there is nothing to resolve so nothing is sent
                this._core.config.stats.cfgUrl = null;
                this.clock.tick(1); // Allow the config change to propagate

                this._initStatsMgr();

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

                this._initStatsMgr();

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
            name: "SDK Stats: does not send until an instrumentation key is configured",
            useFakeTimers: true,
            test: () => {
                this._core.config.stats.iKey = null;
                this.clock.tick(1);

                this._initStatsMgr();

                let internalSdkStats = this._statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                });
                internalSdkStats.countException("https://example.endpoint.com", "NetworkError");

                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.equal(0, this._trackSpy.callCount, "Nothing should be sent without an instrumentation key");
                Assert.equal(1, _readStatsStorage("Test-iKey", "https://example.endpoint.com").cnt.exception["NetworkError"],
                    "Counters should remain persisted");

                this._core.config.stats.iKey = STATS_TEST_IKEY;
                this.clock.tick(1);
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.ok(this._trackSpy.called, "Persisted counters should be sent after the instrumentation key is configured");
            }
        });

        this.testCase({
            name: "SDK Stats: retains persisted counters while remote config is unresolved",
            useFakeTimers: true,
            test: () => {
                let completeFetch: (result: { enabled: boolean, url: string } | null) => void;
                this._core.config.stats.overrideCfgFn = (_cfgUrl, oncomplete) => {
                    completeFetch = oncomplete;
                };
                this.clock.tick(1);

                this._initStatsMgr();

                let internalSdkStats = this._statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                });
                internalSdkStats.countException("https://example.endpoint.com", "NetworkError");

                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.equal(0, this._trackSpy.callCount, "Nothing should be sent before remote config resolves");
                Assert.equal(0, this._statsCoreConfigs.length, "The isolated core should not be created before config resolves");
                Assert.equal(1, _readStatsStorage("Test-iKey", "https://example.endpoint.com").cnt.exception["NetworkError"],
                    "Unsent counters should remain persisted");

                completeFetch({ enabled: true, url: STATS_TEST_HOST });
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.ok(this._trackSpy.called, "Persisted counters should be sent on the next interval");
                Assert.equal(1, this._statsCoreConfigs.length, "The isolated core should be created after config resolves");
                Assert.equal(undefined, _readStatsStorage("Test-iKey", "https://example.endpoint.com").cnt.exception["NetworkError"],
                    "Counters should reset after they are processed");
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
                Assert.equal("https://eu-tst-data.stats.monitor.azure.com/cfg/v1.json",
                    getStatsCfgUrl("https://westeurope.in.applicationinsights.azure.com/", STATS_TEST_CFG_URL),
                    "An EU endpoint should have the eu- prefix inserted in front of the host");
                Assert.equal("https://eu-tst-data.stats.monitor.azure.com/cfg/v1.json",
                    getStatsCfgUrl("https://westeurope-5.in.applicationinsights.azure.com/", STATS_TEST_CFG_URL),
                    "An EU region replica endpoint should also resolve to the EU url");
                Assert.equal("https://eu-tst-data.stats.monitor.azure.com/cfg/v1.json",
                    getStatsCfgUrl("HTTPS://WESTEUROPE.in.applicationinsights.azure.com/", STATS_TEST_CFG_URL),
                    "EU endpoint matching should be case insensitive");
                Assert.equal("https://eu-tst-data.stats.monitor.azure.com/cfg/v1.json",
                    getStatsCfgUrl("westeurope.in.applicationinsights.azure.com/", STATS_TEST_CFG_URL),
                    "An EU endpoint without a scheme should resolve to the EU url");
                Assert.equal("https://eu-tst-data.stats.monitor.azure.com/cfg/v1.json",
                    getStatsCfgUrl("custom://westeurope.in.applicationinsights.azure.com/", STATS_TEST_CFG_URL),
                    "An EU endpoint with a custom scheme should resolve to the EU url");
                Assert.equal(STATS_TEST_CFG_URL,
                    getStatsCfgUrl("https://eastus.in.applicationinsights.azure.com/westeurope", STATS_TEST_CFG_URL),
                    "An EU region outside the host prefix should not resolve to the EU url");

                let euRegions = [
                    "francecentral", "francesouth", "germanywestcentral", "norwayeast",
                    "norwaywest", "swedencentral", "switzerlandnorth", "switzerlandwest", "uksouth", "ukwest"
                ];
                for (let lp = 0; lp < euRegions.length; lp++) {
                    Assert.equal("https://eu-tst-data.stats.monitor.azure.com/cfg/v1.json",
                        getStatsCfgUrl("https://" + euRegions[lp] + ".in.applicationinsights.azure.com/", STATS_TEST_CFG_URL),
                        euRegions[lp] + " should resolve to the EU url");
                }

                Assert.equal("eu-tst-data.stats.monitor.azure.com/cfg/v1.json",
                    getStatsCfgUrl("https://northeurope.in.applicationinsights.azure.com/", "tst-data.stats.monitor.azure.com/cfg/v1.json"),
                    "A configured url without a scheme should still get the eu- prefix");
            }
        });

        this.testCase({
            name: "SDK Stats: counters are persisted to session storage",
            useFakeTimers: true,
            test: () => {
                this._initStatsMgr();
                // Move off the fake timer epoch.
                this.clock.tick(1000);

                let internalSdkStats = this._statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                });

                internalSdkStats.count(200, { statsData: { startTime: Date.now() } } as any, "https://example.endpoint.com");
                internalSdkStats.count(400, { statsData: { startTime: Date.now() } } as any, "https://example.endpoint.com");
                internalSdkStats.count(500, { statsData: { startTime: Date.now() } } as any, "https://example.endpoint.com");
                internalSdkStats.countException("https://example.endpoint.com", "NetworkError");

                let stored = _readStatsStorage("Test-iKey", "https://example.endpoint.com");
                Assert.ok(!!stored, "The SDK Stats state should be persisted to session storage");
                Assert.equal(1000, stored.st, "The collection window start should be persisted");
                Assert.equal(1, stored.cnt.success, "The success count should be persisted");
                Assert.equal(3, stored.cnt.totalRequest, "The total request count should be persisted");
                Assert.equal(1, stored.cnt.failure["400"], "The failure count should be persisted");
                Assert.equal(1, stored.cnt.retry["500"], "The retry count should be persisted");
                Assert.equal(1, stored.cnt.exception["NetworkError"], "The exception count should be persisted");
            }
        });

        this.testCase({
            name: "SDK Stats: serialization failures do not break counter updates",
            useFakeTimers: true,
            test: () => {
                this._initStatsMgr();
                let internalSdkStats = this._statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                });
                let stringifyStub = this.sandbox.stub(JSON, "stringify").callsFake(() => {
                    throw new Error("Serialization failed");
                });
                let didThrow = false;

                try {
                    internalSdkStats.countException("https://example.endpoint.com", "NetworkError");
                } catch (e) {
                    didThrow = true;
                }
                stringifyStub.restore();

                Assert.equal(false, didThrow, "A serialization failure should not escape SDK Stats");
                Assert.equal(1, stringifyStub.callCount, "SDK Stats should attempt to persist the updated counters");

                internalSdkStats.countException("https://example.endpoint.com", "NetworkError");
                let stored = _readStatsStorage("Test-iKey", "https://example.endpoint.com");
                Assert.equal(2, stored.cnt.exception["NetworkError"],
                    "Counters updated before the serialization failure should be persisted by the next update");
            }
        });

        this.testCase({
            name: "SDK Stats: a new instance resumes the persisted counters and collection window",
            useFakeTimers: true,
            test: () => {
                this._initStatsMgr();

                let state = {
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                };

                // First page load.
                let first = this._statsMgr.newInst(state);
                first.countException("https://example.endpoint.com", "NetworkError");
                first.enabled = false;

                let windowStart = _readStatsStorage("Test-iKey", "https://example.endpoint.com").st;

                this.clock.tick((STATS_COLLECTION_SHORT_INTERVAL - 10) * 1000);

                // Second page load resumes the window.
                let second = this._statsMgr.newInst(state);
                Assert.equal(windowStart, _readStatsStorage("Test-iKey", "https://example.endpoint.com").st,
                    "The collection window should not be restarted by a new instance");

                second.countException("https://example.endpoint.com", "NetworkError");

                this.clock.tick(11 * 1000);

                Assert.ok(this._trackSpy.called, "The resumed window should complete after the remaining time");

                let exceptionCount = 0;
                for (let i = 0; i < this._trackSpy.callCount; i++) {
                    const item: ITelemetryItem = this._trackSpy.getCall(i).args[0];
                    if (item.name === "exception") {
                        exceptionCount = item.baseData.average;
                    }
                }

                Assert.equal(2, exceptionCount, "The counts from both instances should be accumulated into one window");
            }
        });

        this.testCase({
            name: "SDK Stats: the persisted counters are reset once the window is sent",
            useFakeTimers: true,
            test: () => {
                this._initStatsMgr();

                let internalSdkStats = this._statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                });

                internalSdkStats.countException("https://example.endpoint.com", "NetworkError");
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL * 1000 + 1);

                Assert.ok(this._trackSpy.called, "The window should have been sent");

                let stored = _readStatsStorage("Test-iKey", "https://example.endpoint.com");
                Assert.ok(!!stored, "The reset state should still be persisted");
                Assert.equal(0, stored.cnt.success, "The success count should be reset after sending");
                Assert.equal(undefined, stored.cnt.exception["NetworkError"], "The exception counts should be reset after sending");
            }
        });

        this.testCase({
            name: "SDK Stats: separate endpoints do not share persisted counters",
            useFakeTimers: true,
            test: () => {
                this._initStatsMgr();

                let first = this._statsMgr.newInst({ cKey: "Test-iKey", endpoint: "https://one.endpoint.com", sdkVer: "1.0.0" });
                let second = this._statsMgr.newInst({ cKey: "Test-iKey", endpoint: "https://two.endpoint.com", sdkVer: "1.0.0" });

                first.countException("https://one.endpoint.com", "NetworkError");
                second.countException("https://two.endpoint.com", "NetworkError");
                second.countException("https://two.endpoint.com", "NetworkError");

                Assert.equal(1, _readStatsStorage("Test-iKey", "https://one.endpoint.com").cnt.exception["NetworkError"],
                    "The first endpoint should only have its own counts");
                Assert.equal(2, _readStatsStorage("Test-iKey", "https://two.endpoint.com").cnt.exception["NetworkError"],
                    "The second endpoint should only have its own counts");
            }
        });

        this.testCase({
            name: "SDK Stats: defaults to a one hour collection interval",
            useFakeTimers: true,
            test: () => {
                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "Test-iKey",
                    disableInstrumentationKeyValidation: true,
                    stats: {
                        cfgUrl: STATS_TEST_CFG_URL,
                        iKey: STATS_TEST_IKEY,
                        overrideCfgFn: (_cfgUrl: string, oncomplete: (result: { enabled: boolean, url: string } | null) => void) => {
                            oncomplete({ enabled: true, url: STATS_TEST_HOST });
                        }
                    }
                } as IConfiguration, [new ChannelPlugin()]);

                let trackSpy = this.sandbox.spy(core, "track");
                let statsMgr = createStatsMgr();
                let hook = statsMgr.init(core, (config) => this._createStatsCore(config), "InternalSdkStats");

                let internalSdkStats = statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://hourly.endpoint.com",
                    sdkVer: "1.0.0"
                });
                internalSdkStats.countException("https://hourly.endpoint.com", "NetworkError");

                this.clock.tick(60 * 60 * 1000 - 1);
                Assert.equal(0, trackSpy.callCount, "Nothing should be sent before the one hour interval elapses");

                this.clock.tick(2);
                Assert.ok(this._trackSpy.called, "The stats should be sent once the one hour interval elapses");
                Assert.equal(0, trackSpy.callCount, "The customer core should not send SDK Stats");

                hook && hook.rm();
                core.unload(false);
            }
        });

        this.testCase({
            name: "SDK Stats: accepts a positive interval below one minute from dynamic config",
            useFakeTimers: true,
            test: () => {
                this._core.config.stats.shrtInt = 1;
                this.clock.tick(1); // Allow the config change to propagate

                this._initStatsMgr();

                let internalSdkStats = this._statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://short.endpoint.com",
                    sdkVer: "1.0.0"
                });
                internalSdkStats.countException("https://short.endpoint.com", "NetworkError");

                this.clock.tick(1001);

                Assert.ok(this._trackSpy.called, "A positive dynamic interval below one minute should be honored");
            }
        });

        this.testCase({
            name: "SDK Stats: reschedules an active window when the dynamic interval changes",
            useFakeTimers: true,
            test: () => {
                this._initStatsMgr();

                let internalSdkStats = this._statsMgr.newInst({
                    cKey: "Test-iKey",
                    endpoint: "https://dynamic.endpoint.com",
                    sdkVer: "1.0.0"
                });
                internalSdkStats.countException("https://dynamic.endpoint.com", "NetworkError");

                this.clock.tick(100 * 1000);
                this._core.config.stats.shrtInt = 120;
                this.clock.tick(1);

                this.clock.tick(20 * 1000 - 2);
                Assert.equal(0, this._trackSpy.callCount, "The updated interval should not fire early");

                this.clock.tick(2);
                Assert.ok(this._trackSpy.called, "The active window should use the updated interval");
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
