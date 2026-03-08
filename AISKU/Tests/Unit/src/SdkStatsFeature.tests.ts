import { ApplicationInsights, IConfig, IConfiguration } from '../../../src/applicationinsights-web';
import { AITestClass, Assert } from '@microsoft/ai-test-framework';
import { FeatureOptInMode, ISdkStatsNotifCbk, onConfigChange } from '@microsoft/applicationinsights-core-js';
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
        this._testSdkStatsDynamicEnableDisable();
        this._testSdkStatsConfigDefaults();
        this._testSdkStatsDynamicConfigChanges();
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
                Assert.ok(config.sdkStats, "sdkStats config should exist after initialization");
                Assert.equal("JavaScript", config.sdkStats!.lang, "lang should default to JavaScript");
                Assert.equal(900000, config.sdkStats!.int, "int should default to 900000 (15 minutes)");
            }
        });

        this.testCase({
            name: "SdkStatsFeature: user-provided sdkStats config is preserved",
            useFakeTimers: true,
            test: () => {
                let ai = this._createAi({
                    sdkStats: {
                        lang: "CustomLang",
                        ver: "1.0.0",
                        int: 60000
                    }
                });
                this.clock.tick(1);

                let config = ai.config;
                Assert.ok(config.sdkStats, "sdkStats config should exist");
                Assert.equal("CustomLang", config.sdkStats!.lang, "User-provided lang should be preserved");
                Assert.equal("1.0.0", config.sdkStats!.ver, "User-provided ver should be preserved");
                Assert.equal(60000, config.sdkStats!.int, "User-provided int should be preserved");
            }
        });
    }

    private _testSdkStatsDynamicConfigChanges() {
        this.testCase({
            name: "SdkStatsFeature: changing sdkStats.lang dynamically triggers config change",
            useFakeTimers: true,
            test: () => {
                let ai = this._createAi();
                this.clock.tick(1);

                let onChangeCalled = 0;
                let expectedLang = "JavaScript";

                let handler = onConfigChange(ai.config as any, (details: any) => {
                    onChangeCalled++;
                    if (details.cfg.sdkStats) {
                        Assert.equal(expectedLang, details.cfg.sdkStats.lang,
                            "sdkStats.lang should be " + expectedLang + " in onChange callback");
                    }
                });

                Assert.equal(1, onChangeCalled, "onConfigChange should fire once initially");

                // Change lang
                expectedLang = "TypeScript";
                ai.config.sdkStats!.lang = "TypeScript";
                this.clock.tick(1);
                Assert.equal(2, onChangeCalled, "onConfigChange should fire again after changing lang");

                handler.rm();
            }
        });

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
            name: "SdkStatsFeature: changing sdkStats.ver dynamically triggers config change",
            useFakeTimers: true,
            test: () => {
                let ai = this._createAi();
                this.clock.tick(1);

                let onChangeCalled = 0;
                let observedVer: string | undefined;

                let handler = onConfigChange(ai.config as any, (details: any) => {
                    onChangeCalled++;
                    if (details.cfg.sdkStats) {
                        observedVer = details.cfg.sdkStats.ver;
                    }
                });

                Assert.equal(1, onChangeCalled, "onConfigChange should fire once initially");

                ai.config.sdkStats!.ver = "4.0.0";
                this.clock.tick(1);
                Assert.equal(2, onChangeCalled, "onConfigChange should fire again after changing ver");
                Assert.equal("4.0.0", observedVer, "ver should be 4.0.0 in callback");
                Assert.equal("4.0.0", ai.config.sdkStats!.ver, "ver should be updated to 4.0.0");

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
                let observedLang: string | undefined;
                let observedVer: string | undefined;
                let observedInt: number | undefined;

                let handler = onConfigChange(ai.config as any, (details: any) => {
                    onChangeCalled++;
                    if (details.cfg.sdkStats) {
                        observedLang = details.cfg.sdkStats.lang;
                        observedVer = details.cfg.sdkStats.ver;
                        observedInt = details.cfg.sdkStats.int;
                    }
                });

                Assert.equal(1, onChangeCalled, "onConfigChange should fire once initially");

                ai.config.sdkStats = {
                    lang: "Python",
                    ver: "2.0.0",
                    int: 30000
                };
                this.clock.tick(1);
                Assert.equal(2, onChangeCalled, "onConfigChange should fire after replacing sdkStats block");

                Assert.equal("Python", observedLang, "lang should be Python in callback");
                Assert.equal("2.0.0", observedVer, "ver should be 2.0.0 in callback");
                Assert.equal(30000, observedInt, "int should be 30000 in callback");

                handler.rm();
            }
        });
    }
}
