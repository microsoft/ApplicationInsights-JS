import { ApplicationInsights, IConfig, IConfiguration } from '../../../src/applicationinsights-web';
import { AITestClass, Assert } from '@microsoft/ai-test-framework';
import {
    _eInternalMessageId, FeatureOptInMode, ISdkStatsNotifCbk, onConfigChange, STATS_SDK_FEATURE, ThrottleMgr
} from '@microsoft/applicationinsights-core-js';
import { AppInsightsSku } from '../../../src/AISku';
import { ICfgSyncMode } from '@microsoft/applicationinsights-cfgsync-js';

const TestInstrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
const TestConnectionString = "InstrumentationKey=" + TestInstrumentationKey;

export class SdkStatsFeatureTests extends AITestClass {
    private _ai: AppInsightsSku | null = null;

    constructor() {
        super("SdkStatsFeatureTests");
    }

    public testInitialize() {
        try {
            if (window.localStorage) {
                window.localStorage.clear();
            }
        } catch (e) {
            // ignore
        }
    }

    public testFinishedCleanup(): void {
        if (this._ai) {
            this._ai.unload(false);
            this._ai = null;
        }
        if (window.localStorage) {
            window.localStorage.clear();
        }
    }

    public registerTests() {
        this._testSdkStatsEnabledByDefault();
        this._testSdkStatsDisabledViaFeatureOptIn();
        this._testCustomerSdkStatsIgnoresInternalThrottle();
        this._testSdkStatsDynamicEnableDisable();
        this._testSdkStatsConfigDefaults();
        this._testSdkStatsDailyThrottle();
        this._testSdkStatsDynamicConfigChanges();
        this._testInternalSdkStatsDynamicConfigInitialization();
        this._testSnippetSdkVersion();
    }

    private _createAi(configOverrides?: Partial<IConfiguration & IConfig>): AppInsightsSku {
        let config: IConfiguration & IConfig = {
            connectionString: TestConnectionString,
            extensionConfig: {
                ["AppInsightsCfgSyncPlugin"]: {
                    syncMode: ICfgSyncMode.Receive,
                    cfgUrl: ""
                }
            }
        } as IConfiguration & IConfig;

        if (configOverrides) {
            for (let key in configOverrides) {
                if (configOverrides.hasOwnProperty(key)) {
                    (config as any)[key] = (configOverrides as any)[key];
                }
            }
        }

        let ai = new ApplicationInsights({ config: config });
        ai.loadAppInsights();
        this._ai = ai;
        return ai;
    }

    private _findSdkStatsListener(ai: AppInsightsSku): ISdkStatsNotifCbk | null {
        let core = ai["core"];
        let notifyMgr = core.getNotifyMgr();
        let listeners = (notifyMgr as any).listeners;
        if (listeners) {
            for (let i = 0; i < listeners.length; i++) {
                let listener = listeners[i];
                // The SDK stats listener has a flush and unload method
                if (listener && typeof listener.flush === "function" && typeof listener.unload === "function" &&
                    typeof listener.eventsSent === "function" && typeof listener.eventsRetry === "function") {
                    return listener as ISdkStatsNotifCbk;
                }
            }
        }
        return null;
    }

    private _testSdkStatsEnabledByDefault() {
        this.testCase({
            name: "SdkStatsFeature: SDK stats listener is added by default when featureOptIn is not specified",
            useFakeTimers: true,
            test: () => {
                let ai = this._createAi();
                this.clock.tick(1);

                let listener = this._findSdkStatsListener(ai);
                Assert.ok(listener, "SDK Stats listener should be added by default");
            }
        });

        this.testCase({
            name: "SdkStatsFeature: SDK stats listener is added when SdkStats feature is explicitly enabled",
            useFakeTimers: true,
            test: () => {
                let ai = this._createAi({
                    featureOptIn: {
                        ["SdkStats"]: { mode: FeatureOptInMode.enable }
                    }
                });
                this.clock.tick(1);

                let listener = this._findSdkStatsListener(ai);
                Assert.ok(listener, "SDK Stats listener should be present when explicitly enabled");
            }
        });
    }

    private _testSdkStatsDisabledViaFeatureOptIn() {
        this.testCase({
            name: "SdkStatsFeature: SDK stats listener is NOT added when SdkStats feature is disabled",
            useFakeTimers: true,
            test: () => {
                let ai = this._createAi({
                    featureOptIn: {
                        ["SdkStats"]: { mode: FeatureOptInMode.disable }
                    }
                });
                this.clock.tick(1);

                let listener = this._findSdkStatsListener(ai);
                Assert.ok(!listener, "SDK Stats listener should NOT be present when disabled");
            }
        });
    }

    private _testCustomerSdkStatsIgnoresInternalThrottle() {
        this.testCase({
            name: "SdkStatsFeature: dedicated SDK Stats throttle does not disable customer SDK Stats",
            useFakeTimers: true,
            test: () => {
                let ai = this._createAi({
                    throttleMgrCfg: {
                        [STATS_SDK_FEATURE]: {
                            disabled: false,
                            limit: {
                                samplingRate: 0
                            }
                        }
                    }
                });
                this.clock.tick(1);

                Assert.ok(this._findSdkStatsListener(ai),
                    "Customer SDK Stats should remain enabled when dedicated SDK Stats are throttled");
                Assert.ok(ai["core"].getSdkStats({
                    cKey: TestInstrumentationKey,
                    endpoint: "https://example.endpoint.com",
                    sdkVer: "1.0.0"
                }), "The throttle should apply to SDK Stats operations without disabling the manager");
            }
        });
    }

    private _testSdkStatsDynamicEnableDisable() {
        this.testCase({
            name: "SdkStatsFeature: disabling SdkStats feature dynamically removes the listener",
            useFakeTimers: true,
            test: () => {
                let ai = this._createAi();
                this.clock.tick(1);

                // Should be enabled by default
                let listener = this._findSdkStatsListener(ai);
                Assert.ok(listener, "SDK Stats listener should be present initially");

                // Disable the feature
                ai.config.featureOptIn = {
                    ["SdkStats"]: { mode: FeatureOptInMode.disable }
                };
                this.clock.tick(1);

                listener = this._findSdkStatsListener(ai);
                Assert.ok(!listener, "SDK Stats listener should be removed after disabling feature");
            }
        });

        this.testCase({
            name: "SdkStatsFeature: re-enabling SdkStats feature dynamically adds the listener back",
            useFakeTimers: true,
            test: () => {
                // Start with disabled
                let ai = this._createAi({
                    featureOptIn: {
                        ["SdkStats"]: { mode: FeatureOptInMode.disable }
                    }
                });
                this.clock.tick(1);

                let listener = this._findSdkStatsListener(ai);
                Assert.ok(!listener, "SDK Stats listener should NOT be present initially when disabled");

                // Re-enable the feature
                ai.config.featureOptIn = {
                    ["SdkStats"]: { mode: FeatureOptInMode.enable }
                };
                this.clock.tick(1);

                listener = this._findSdkStatsListener(ai);
                Assert.ok(listener, "SDK Stats listener should be added after re-enabling feature");
            }
        });

        this.testCase({
            name: "SdkStatsFeature: toggling SdkStats feature multiple times works correctly",
            useFakeTimers: true,
            test: () => {
                let ai = this._createAi();
                this.clock.tick(1);

                // Initially enabled
                Assert.ok(this._findSdkStatsListener(ai), "Listener should be present (initial)");

                // Disable
                ai.config.featureOptIn = { ["SdkStats"]: { mode: FeatureOptInMode.disable } };
                this.clock.tick(1);
                Assert.ok(!this._findSdkStatsListener(ai), "Listener should be removed after first disable");

                // Re-enable
                ai.config.featureOptIn = { ["SdkStats"]: { mode: FeatureOptInMode.enable } };
                this.clock.tick(1);
                Assert.ok(this._findSdkStatsListener(ai), "Listener should be present after re-enable");

                // Disable again
                ai.config.featureOptIn = { ["SdkStats"]: { mode: FeatureOptInMode.disable } };
                this.clock.tick(1);
                Assert.ok(!this._findSdkStatsListener(ai), "Listener should be removed after second disable");
            }
        });
    }

    private _testSdkStatsConfigDefaults() {
        this.testCase({
            name: "SdkStatsFeature: sdkStats config defaults are applied (lang and int)",
            useFakeTimers: true,
            test: () => {
                let ai = this._createAi();
                this.clock.tick(1);

                let config = ai.config;
                let statsThrottle = config.throttleMgrCfg[STATS_SDK_FEATURE];
                Assert.ok(config.sdkStats, "sdkStats config should exist after initialization");
                Assert.equal(900000, config.sdkStats.int, "int should default to 900000 (15 minutes)");
                Assert.equal(100, statsThrottle.limit.samplingRate,
                    "Dedicated SDK Stats throttle should use the legacy default sampling rate");
                Assert.equal(24 * 60 * 60 * 1000 / config.sdkStats.int,
                    statsThrottle.limit.maxSendNumber,
                    "Dedicated SDK Stats throttle should cover 96 reports at 15-minute intervals in one day");
                Assert.deepEqual({ dayInterval: 1 }, statsThrottle.interval,
                    "Dedicated SDK Stats should use a daily interval without quarterly date restrictions");
                Assert.deepEqual({ monthInterval: 3, daysOfMonth: [28] },
                    config.throttleMgrCfg[_eInternalMessageId.DefaultThrottleMsgKey].interval,
                    "Diagnostic messages should retain the quarterly interval");
            }
        });

        this.testCase({
            name: "SdkStatsFeature: user-provided sdkStats config is preserved",
            useFakeTimers: true,
            test: () => {
                let ai = this._createAi({
                    sdkStats: {
                        int: 60000
                    },
                    throttleMgrCfg: {
                        [STATS_SDK_FEATURE]: {
                            limit: {
                                maxSendNumber: 48
                            },
                            interval: {
                                dayInterval: 2
                            }
                        }
                    }
                });
                this.clock.tick(1);

                let config = ai.config;
                let statsThrottle = config.throttleMgrCfg[STATS_SDK_FEATURE];
                Assert.ok(config.sdkStats, "sdkStats config should exist");
                Assert.equal(60000, config.sdkStats.int, "User-provided int should be preserved");
                Assert.equal(48, statsThrottle.limit.maxSendNumber,
                    "User-provided maxSendNumber should be preserved");
                Assert.equal(2, statsThrottle.interval.dayInterval,
                    "User-provided dayInterval should be preserved");

                statsThrottle.limit.maxSendNumber = 192;
                statsThrottle.interval.dayInterval = 3;
                this.clock.tick(1);
                Assert.equal(192, statsThrottle.limit.maxSendNumber,
                    "maxSendNumber should support runtime updates");
                Assert.equal(3, statsThrottle.interval.dayInterval,
                    "dayInterval should support runtime updates");
            }
        });
    }

    private _testSdkStatsDailyThrottle() {
        this.testCase({
            name: "SdkStatsFeature: default throttle caps SDK Stats at 96 callbacks and permits sending the next day",
            useFakeTimers: true,
            test: () => {
                this.clock.setSystemTime(Date.UTC(2026, 8, 24, 12));
                localStorage.setItem("appInsightsThrottle-feature-" + STATS_SDK_FEATURE, JSON.stringify({
                    date: new Date(Date.UTC(2026, 8, 23, 12)),
                    count: 8832
                }));
                let ai = this._createAi({
                    throttleMgrCfg: {
                        [STATS_SDK_FEATURE]: {
                            limit: { samplingRate: 1000000 }
                        }
                    }
                });
                let throttleMgr = new ThrottleMgr(ai.core);
                throttleMgr.onReadyState(true);
                let calls = 0;
                const callback = () => {
                    calls++;
                };

                let result = throttleMgr.useFeature(STATS_SDK_FEATURE, callback, true);
                Assert.equal(true, result.isThrottled, "SDK Stats should be eligible on the 24th, not just the 28th");
                Assert.equal(96, result.throttleNum, "A quarterly backlog should be capped at the daily limit");
                Assert.equal(96, calls, "Only 96 callbacks should run");

                for (let lp = 0; lp < 100; lp++) {
                    throttleMgr.useFeature(STATS_SDK_FEATURE, callback, true);
                }
                Assert.equal(96, calls, "Subsequent attempts on the same UTC day should not run callbacks");

                this.clock.setSystemTime(Date.UTC(2026, 8, 25, 12));
                result = throttleMgr.useFeature(STATS_SDK_FEATURE, callback, true);
                Assert.equal(96, result.throttleNum, "The next UTC day should permit another capped flush");
                Assert.equal(192, calls, "Both daily flushes should respect the 96-callback limit");

                ai.config.throttleMgrCfg[STATS_SDK_FEATURE].interval.dayInterval = 2;
                this.clock.tick(1);
                this.clock.setSystemTime(Date.UTC(2026, 8, 26, 12));
                result = throttleMgr.useFeature(STATS_SDK_FEATURE, callback, true);
                Assert.equal(0, result.throttleNum, "The updated two-day interval should skip the next day");
                Assert.equal(192, calls, "An ineligible day should not run callbacks");

                this.clock.setSystemTime(Date.UTC(2026, 8, 27, 12));
                result = throttleMgr.useFeature(STATS_SDK_FEATURE, callback, true);
                Assert.equal(2, result.throttleNum, "The next eligible day should flush the accumulated attempts");
                Assert.equal(194, calls, "Runtime interval changes should affect callback eligibility");
            }
        });
    }

    private _testSdkStatsDynamicConfigChanges() {
        this.testCase({
            name: "SdkStatsFeature: changing sdkStats.int dynamically triggers config change",
            useFakeTimers: true,
            test: () => {
                let ai = this._createAi();
                this.clock.tick(1);

                let onChangeCalled = 0;
                let expectedInt = 900000;

                let handler = onConfigChange(ai.config as any, (details: any) => {
                    onChangeCalled++;
                    if (details.cfg.sdkStats) {
                        Assert.equal(expectedInt, details.cfg.sdkStats.int,
                            "sdkStats.int should be " + expectedInt + " in onChange callback");
                    }
                });

                Assert.equal(1, onChangeCalled, "onConfigChange should fire once initially");

                // Change interval
                expectedInt = 60000;
                ai.config.sdkStats!.int = 60000;
                this.clock.tick(1);
                Assert.equal(2, onChangeCalled, "onConfigChange should fire again after changing int");

                handler.rm();
            }
        });

        this.testCase({
            name: "SdkStatsFeature: replacing entire sdkStats object dynamically triggers config change",
            useFakeTimers: true,
            test: () => {
                let ai = this._createAi();
                this.clock.tick(1);

                let onChangeCalled = 0;
                let observedInt: number | undefined;

                let handler = onConfigChange(ai.config as any, (details: any) => {
                    onChangeCalled++;
                    if (details.cfg.sdkStats) {
                        observedInt = details.cfg.sdkStats.int;
                    }
                });

                Assert.equal(1, onChangeCalled, "onConfigChange should fire once initially");

                ai.config.sdkStats = {
                    int: 30000
                };
                this.clock.tick(1);
                Assert.equal(2, onChangeCalled, "onConfigChange should fire after replacing sdkStats block");

                Assert.equal(30000, observedInt, "int should be 30000 in callback");

                handler.rm();
            }
        });
    }

    private _testInternalSdkStatsDynamicConfigInitialization() {
        this.testCase({
            name: "SdkStatsFeature: internal SDK Stats initializes when dynamic configuration arrives after loadAppInsights",
            useFakeTimers: true,
            useFakeServer: true,
            test: () => {
                const cfgUrl = "https://tst-data.stats.monitor.azure.com/cfg/v1.json";
                const statsHost = "tst-data.stats.monitor.azure.com";
                const statsIKey = "000e0000-e000-0000-a000-000000000000";
                const state = {
                    cKey: TestInstrumentationKey,
                    endpoint: "https://dynamic-config.example.com/v2/track",
                    sdkVer: "1.0.0"
                };
                const storageKey = state.cKey + ":" + state.endpoint;
                sessionStorage.removeItem(storageKey);
                this.onDone(() => sessionStorage.removeItem(storageKey));
                this.hookSendBeacon(() => {});
                this.hookFetch((resolve) => resolve(new Response("{}", { status: 200 })));
                let xhrSendSpy = this.sandbox.spy(XMLHttpRequest.prototype, "send");

                let ai = this._createAi();
                this.clock.tick(1);

                Assert.ok(ai.config.stats, "loadAppInsights should seed the dynamic stats configuration");
                Assert.equal(undefined, ai.config.stats.cfgUrl, "The SDK Stats config URL should not be supplied initially");
                Assert.equal(undefined, ai.config.stats.iKey, "The SDK Stats instrumentation key should not be supplied initially");
                let stats = ai.core.getSdkStats(state);
                Assert.ok(stats && stats.enabled, "loadAppInsights should initialize the internal SDK Stats manager");
                stats.countException(state.endpoint, "NetworkError");
                this.clock.tick(1000);
                Assert.equal(0, this.activeXhrRequests.length, "SDK Stats should not send before configuration arrives");

                let fetchedUrls: string[] = [];
                ai.updateCfg({
                    stats: {
                        shrtInt: 1,
                        cfgUrl: cfgUrl,
                        iKey: statsIKey,
                        overrideCfgFn: (url, oncomplete) => {
                            fetchedUrls.push(url);
                            oncomplete({ enabled: true, url: statsHost });
                        }
                    },
                    throttleMgrCfg: {
                        [_eInternalMessageId.DefaultThrottleMsgKey]: { disabled: false },
                        [STATS_SDK_FEATURE]: {
                            limit: { samplingRate: 1000000 }
                        }
                    }
                });
                this.clock.tick(1002);

                Assert.deepEqual([cfgUrl], fetchedUrls,
                    "The existing manager should use the dynamically supplied config fetcher and URL");
                Assert.strictEqual(stats, ai.core.getSdkStats(state),
                    "Configuration should initialize sending without replacing the stats instance");
                let requests = this.activeXhrRequests;
                Assert.equal(1, requests.length, "The isolated SDK Stats sender should send the buffered counter");
                Assert.equal("https://" + statsHost + "/v2/track", requests[0].url, "SDK Stats should use the remote-configured endpoint");
                let payload = JSON.parse(xhrSendSpy.firstCall.args[0]);
                Assert.equal(statsIKey, payload[0].iKey, "SDK Stats should use the dynamically supplied instrumentation key");
                Assert.equal("exception", payload[0].data.baseData.metrics[0].name, "The buffered exception should be reported");
                Assert.equal(1, payload[0].data.baseData.metrics[0].value, "The buffered exception count should be preserved");
                requests[0].respond(200, {}, "");

                ai.config.featureOptIn = {
                    [STATS_SDK_FEATURE]: { mode: FeatureOptInMode.disable }
                };
                this.clock.tick(1);
                Assert.equal(null, ai.core.getSdkStats(state),
                    "Disabling the internal feature dynamically should remove its stats instance");
                Assert.equal(false, stats.enabled, "The previous stats instance should be stopped");

                ai.config.featureOptIn[STATS_SDK_FEATURE].mode = FeatureOptInMode.enable;
                this.clock.tick(1);
                let reenabledStats = ai.core.getSdkStats(state);
                Assert.ok(reenabledStats && reenabledStats.enabled, "Re-enabling the internal feature should initialize stats again");
            }
        });
    }

    private _testSnippetSdkVersion() {
        this.testCase({
            name: "SdkStatsFeature: snippet version is included in the SDK Stats version",
            useFakeTimers: true,
            test: () => {
                let config = {
                    connectionString: TestConnectionString,
                    stats: {},
                    extensionConfig: {
                        ["AppInsightsCfgSyncPlugin"]: {
                            syncMode: ICfgSyncMode.Receive,
                            cfgUrl: ""
                        }
                    }
                } as IConfiguration & IConfig;
                let ai = new AppInsightsSku({ config: config, sv: "6", queue: [] } as any);
                ai.loadAppInsights();
                this._ai = ai;
                this.clock.tick(1);

                Assert.equal("6", ai.config.stats.snp, "SDK Stats config should contain snippet version 6");
            }
        });
    }

}
