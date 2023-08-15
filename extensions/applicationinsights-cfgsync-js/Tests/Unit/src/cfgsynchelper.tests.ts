import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { NonOverrideCfg } from "../../../src/Interfaces/ICfgSyncConfig";
import { AppInsightsCore, CdnFeatureMode, FeatureOptInMode, IAppInsightsCore, IConfiguration, IFeatureOptIn, IFeatureOptInDetails, INotificationManager, IPlugin, ITelemetryItem, PerfManager } from "@microsoft/applicationinsights-core-js";
import { IConfig, IStorageBuffer } from "@microsoft/applicationinsights-common";
import { getConfigFromCdn, replaceByNonOverrideCfg, shouldOptInFeature } from "../../../src/CfgSyncHelperFuncs";
import { ICookieMgrConfig } from "@microsoft/applicationinsights-core-js/src/applicationinsights-core-js";
import { ICfgSyncCdnConfig } from "../../../src/Interfaces/ICfgSyncCdnConfig";

export class CfgSyncHelperTests extends AITestClass {

 

    constructor(emulateIe?: boolean) {
        super("CfgSyncHelperTests", emulateIe);
    }

    public testInitialize() {
    }

    public testCleanup() {
    }

    public registerTests() {
        this.testCase({
            name: "CfgSyncPluginHelper: replaceByNonOverrideCfg should work with flat-level config",
            useFakeTimers: true,
            test: () => {
                let testFunc = (core: IAppInsightsCore, notificationManager: INotificationManager) => {
                    return new PerfManager(notificationManager);
                }
                let config = {
                    instrumentationKey: "Test-iKey",
                    maxMessageLimit: 100,
                    loggingLevelConsole: 0,
                    endpointUrl: "testurl",
                    loggingLevelTelemetry: 0,
                    disableInstrumentationKeyValidation: true,
                    enablePerfMgr: false,
                    createPerfMgr: testFunc,
                    perfEvtsSendAll: true,
                    idLength: 100,
                    cookieDomain: "test",
                    cookiePath: "test",
                    disableCookiesUsage: true,
                    disablePageUnloadEvents: ["eve1", "eve2"]
                } as IConfig & IConfiguration;

                let newConfig = {
                    instrumentationKey: "Test-iKey123",
                    maxMessageLimit: 1000,
                    loggingLevelConsole: 1,
                    endpointUrl: "testurl123",
                    loggingLevelTelemetry: 1,
                    disableInstrumentationKeyValidation: false,
                    enablePerfMgr: true,
                    perfEvtsSendAll: false,
                    idLength: 10,
                    cookieDomain: "test123",
                    cookiePath: "test123",
                    disableCookiesUsage: true,
                    disablePageUnloadEvents: ["eve123", "eve223"]
                } as IConfig & IConfiguration;
                
                let nonoverrideCfg = {
                    instrumentationKey: true,
                    maxMessageLimit: true,
                    loggingLevelConsole: true,
                    endpointUrl: undefined,
                    loggingLevelTelemetry: false,
                    disableInstrumentationKeyValidation: true,
                    enablePerfMgr: true,
                    createPerfMgr: true,
                    perfEvtsSendAll: true,
                    idLength: true,
                    cookieDomain: true,
                    cookiePath: false,
                    disableCookiesUsage: true,
                    disablePageUnloadEvents: true
                } as NonOverrideCfg;

                let  expectedNewCfg = {
                    endpointUrl:"testurl123",
                    loggingLevelTelemetry: 1,
                    cookiePath:"test123"
                }

                let expectedCoreCfg = {
                    instrumentationKey:"Test-iKey",
                    maxMessageLimit: 100,
                    loggingLevelConsole:0,
                    endpointUrl:"testurl123",
                    loggingLevelTelemetry: 1,
                    disableInstrumentationKeyValidation: true,
                    enablePerfMgr: false,
                    perfEvtsSendAll: true,
                    idLength: 100,
                    cookieDomain: "test",
                    cookiePath: "test123",
                    disableCookiesUsage: true,
                    disablePageUnloadEvents:["eve1","eve2"],
                    cookieCfg:{},
                    extensions:[{isFlushInvoked:false,isTearDownInvoked:false,isResumeInvoked:false,isPauseInvoked:false,identifier:"Sender",priority:1001}],
                    channels:[],
                    extensionConfig:{},
                    enableDebug: false
                }
               
                let core = new AppInsightsCore();
                this.onDone(() => {
                    core.unload(false);
                });
                let channel = new ChannelPlugin();
                core.initialize(config, [channel]);
                let coreCfg = core.config;
                let newCfg = replaceByNonOverrideCfg(newConfig, nonoverrideCfg, 0, 4);
                Assert.deepEqual(JSON.stringify(newCfg), JSON.stringify(expectedNewCfg), "only expected configs are changed under new config");

                core.updateCfg(newCfg);
                this.clock.tick(1);
                coreCfg = core.config;
                Assert.deepEqual(JSON.stringify(coreCfg), JSON.stringify(expectedCoreCfg), "core config should be updated as expected");

            }

        });

        this.testCase({
            name: "CfgSyncPluginHelper: replaceByNonOverrideCfg should work with 2 nested levels config",
            useFakeTimers: true,
            test: () => {
                let cookieCfg = {
                    enabled: false,
                    domain: "test",
                    path: "testpath",
                    ignoreCookies: ["test1", "test2"],
                    getCookie: (name) => {
                        let theValue = name || "";
                        return theValue + "Test";
                    }
                } as ICookieMgrConfig;
                let newCookieCfg = {
                    enabled: true,
                    domain: "test123",
                    path: "testpath123",
                    ignoreCookies: ["test1123", "test2123"],
                    getCookie: (name) => {
                        let theValue = name || "";
                        return theValue + "Test123";
                    },
                    setCookie: (name, value) => {
                        name = value;
                    },
                    delCookie: (name) => {
                        return null;
                    }
                } as ICookieMgrConfig;
                let config = {
                    instrumentationKey: "Test-iKey",
                    endpointUrl: "testurl",
                    maxMessageLimit: 100,
                    disablePageUnloadEvents: ["eve1", "eve2"],
                    cookieCfg: cookieCfg
                } as IConfig & IConfiguration;

                let newConfig = {
                    instrumentationKey: "Test-iKey123",
                    endpointUrl: "testurl123",
                    maxMessageLimit: 1000,
                    cookieCfg: newCookieCfg,
                    disablePageUnloadEvents: ["eve123", "eve223"]
                } as IConfig & IConfiguration;
                
                let nonoverrideCfg = {
                    instrumentationKey: true,
                    endpointUrl: true,
                    cookieCfg: {
                        enabled: true,
                        domain: true,
                        getCookie: true
                    }
                } as NonOverrideCfg;

                let  expectedNewCfg = {
                    maxMessageLimit: 1000,
                    cookieCfg: {
                        path: "testpath123",
                        ignoreCookies: ["test1123", "test2123"],
                        setCookie: (name, value) => {
                            name = value;
                        },
                        delCookie: (name) => {
                            return null;
                        }
                    },
                    disablePageUnloadEvents: ["eve123", "eve223"]
                }
               
                let core = new AppInsightsCore();
                this.onDone(() => {
                    core.unload(false);
                });
                let channel = new ChannelPlugin();
                core.initialize(config, [channel]);
                let coreCfg = core.config;
                let newCfg = replaceByNonOverrideCfg(newConfig, nonoverrideCfg, 0, 4);
                Assert.deepEqual(JSON.stringify(newCfg), JSON.stringify(expectedNewCfg), "only expected configs are changed under new config");

                core.updateCfg(newCfg);
                this.clock.tick(1);
                coreCfg = core.config;
                let ikey = coreCfg.instrumentationKey;
                let endpoint = coreCfg.endpointUrl;
                let maxMessageLimit = coreCfg.maxMessageLimit;
                let disablePageUnloadEvents = coreCfg.disablePageUnloadEvents;
                Assert.deepEqual(ikey, "Test-iKey", "core config ikey should not be updated");
                Assert.deepEqual(endpoint, "testurl", "core config endpoint url should not be updated");
                Assert.deepEqual(maxMessageLimit, 1000, "core config maxMessageLimit url should be updated");
                Assert.deepEqual(disablePageUnloadEvents, ["eve123", "eve223"], "core config disablePageUnloadEvents should be updated");

                let coreCookieCfg = core.config.cookieCfg || {};
                Assert.ok(coreCookieCfg, "cookie config should exist");
                let enabled = coreCookieCfg.enabled;
                Assert.equal(enabled, false, "cookie config enabled should not be udpated");
                let path = coreCookieCfg.path;
                Assert.equal(path, "testpath123", "cookie config path should be udpated");
                let domain = coreCookieCfg.domain;
                Assert.equal(domain, "test", "cookie config domain should not be udpated");
                let cookie = coreCfg.cookieCfg;
                let getFunc = cookie?.getCookie;
                let val = getFunc && getFunc("");
                Assert.equal(val, "Test", "cookie config domain should not be udpated");
            }

        });

        this.testCase({
            name: "CfgSyncPluginHelper: replaceByNonOverrideCfg should work with 3 & 4 nested levels config",
            useFakeTimers: true,
            test: () => {
                let storageBuffer = {
                    getItem: (logger: any, name: string) => {
                        return "test"
                    },
                    setItem: (logger: any, name: string, data: string) => {
                        return true;
                    }
                } as IStorageBuffer;

                let newStorageBuffer = {
                    getItem: (logger: any, name: string) => {
                        return "test123"
                    },
                    setItem: (logger: any, name: string, data: string) => {
                        return false;
                    }
                } as IStorageBuffer;

                let config = {
                    instrumentationKey: "Test-iKey",
                    maxMessageLimit: 100,
                    extensionConfig: {
                        ["ApplicationInsightsAnalytics"]: {
                            emitLineDelimitedJson: true,
                            sessionRenewalMs: 100,
                            bufferOverride: storageBuffer
                        } as IConfig
                    }
                } as IConfiguration;

                let newConfig = {
                    instrumentationKey: "Test-iKey123",
                    maxMessageLimit: 1000,
                    extensionConfig: {
                        ["ApplicationInsightsAnalytics"]: {
                            emitLineDelimitedJson: false,
                            sessionRenewalMs: 1000,
                            bufferOverride: newStorageBuffer
                        } as IConfig
                    }
                } as IConfiguration;
                
                let nonoverrideCfg = {
                    instrumentationKey: true,
                    extensionConfig: {
                        ["ApplicationInsightsAnalytics"]: {
                            emitLineDelimitedJson: true,
                            bufferOverride: {
                                getItem: true
                            }
                        }
                    }
                } as NonOverrideCfg;
               
                let core = new AppInsightsCore();
                this.onDone(() => {
                    core.unload(false);
                });
                let channel = new ChannelPlugin();
                core.initialize(config, [channel]);
                let coreCfg = core.config;
                let newCfg = replaceByNonOverrideCfg(newConfig, nonoverrideCfg, 0, 4);
                let newCfgIkey = newCfg.instrumentationKey;
                Assert.deepEqual(newCfgIkey, undefined, "new config ikey should be deleted");
                let newMsgLimit = newCfg.maxMessageLimit;
                Assert.deepEqual(newMsgLimit, 1000, "new config maxMessageLimit should not be deleted");
                let newExtConfig = newCfg.extensionConfig || {};
                Assert.ok(newExtConfig, "new ext config should not be deleted");
                let newPluginConfig = newExtConfig["ApplicationInsightsAnalytics"] || {};
                Assert.ok(newPluginConfig, "new plugin config should not be deleted");
                Assert.ok(!newPluginConfig.emitLineDelimitedJson, "new plugin config emitLineDelimitedJson should be updated");
                Assert.deepEqual(newPluginConfig.sessionRenewalMs, 1000, "new plugin config sessionRenewalMs should not be deleted");
                let newBuffer = newPluginConfig.bufferOverride || {};
                Assert.ok(newBuffer, "new plugin config bufferOverride should not be deleted");
                Assert.deepEqual(newBuffer.getItem, undefined, "new bufferOveride getItem should be deleted");
                let setItem = newBuffer && newBuffer.setItem;
                Assert.deepEqual(setItem(null, "name", "data"), false, "new bufferOveride setItem should not be deleted");
                

                core.updateCfg(newCfg);
                this.clock.tick(1);
                coreCfg = core.config;
                let ikey = coreCfg.instrumentationKey;
                Assert.deepEqual(ikey, "Test-iKey", "core config ikey should not be updated");
                let coreMsgLimit = coreCfg.maxMessageLimit;
                Assert.deepEqual(coreMsgLimit, 1000, "core config maxMessageLimit should not be deleted");
                let coreExtConfig = coreCfg.extensionConfig || {};
                Assert.ok(coreExtConfig, "core ext config should not be deleted");
                let corePluginConfig = coreExtConfig["ApplicationInsightsAnalytics"] || {};
                Assert.ok(corePluginConfig, "core plugin config should not be deleted");
                Assert.ok(corePluginConfig.emitLineDelimitedJson, "core plugin config emitLineDelimitedJson should not be updated");
                Assert.deepEqual(corePluginConfig.sessionRenewalMs, 1000, "core plugin config sessionRenewalMs should not be deleted");
                let coreBuffer = corePluginConfig.bufferOverride || {};
                Assert.ok(coreBuffer, "core plugin config bufferOverride should not be deleted");
                let coreGetItem = coreBuffer && coreBuffer.getItem;
                Assert.ok(coreGetItem, "core plugin config getItem should not be deleted");
                Assert.deepEqual( coreGetItem && coreGetItem(null, "test"), "test", "core bufferOveride getItem should not be updated");
                let coreSetItem = coreBuffer && coreBuffer.setItem;
                Assert.ok(coreSetItem, "core plugin config setItem should not be deleted");
                Assert.deepEqual(coreSetItem(null, "name", "data"), false, "new bufferOveride setItem should be updated");
            }

        });

        this.testCase({
            name: "CfgSyncPluginHelper: replaceByNonOverrideCfg should work with max nested level config",
            useFakeTimers: true,
            test: () => {
             
                let newCookieCfg = {
                    enabled: true,
                    domain: "test123",
                    path: "testpath123",
                    ignoreCookies: ["test1123", "test2123"],
                    getCookie: (name) => {
                        let theValue = name || "";
                        return theValue + "Test123";
                    },
                    setCookie: (name, value) => {
                        name = value;
                    },
                    delCookie: (name) => {
                        return null;
                    }
                } as ICookieMgrConfig;

                let newConfig = {
                    instrumentationKey: "Test-iKey123",
                    maxMessageLimit: 1000,
                    cookieCfg: newCookieCfg,
                    disablePageUnloadEvents: ["eve123", "eve223"]
                } as IConfig & IConfiguration;
                
                let nonoverrideCfg = {
                    instrumentationKey: true,
                    cookieCfg: {
                        enabled: true,
                        domain: true,
                        getCookie: true
                    },
                    disablePageUnloadEvents: true
                } as NonOverrideCfg;
               
                let newCfg = replaceByNonOverrideCfg(newConfig, nonoverrideCfg, 0, 0);
                Assert.deepEqual(newCfg.instrumentationKey, undefined, "instrumentationKey should be deleted");
                Assert.deepEqual(newCfg.maxMessageLimit, 1000, "maxMessageLimit should not be deleted");
                Assert.deepEqual(newCfg.disablePageUnloadEvents, undefined, "disablePageUnloadEvents should be deleted");
                Assert.deepEqual(newCfg.cookieCfg, null, "cookieCfg should exceed max level");


                let storageBuffer = {
                    getItem: (logger: any, name: string) => {
                        return "test"
                    },
                    setItem: (logger: any, name: string, data: string) => {
                        return true;
                    }
                } as IStorageBuffer;
                let newConfig2 = {
                    instrumentationKey: "Test-iKey",
                    maxMessageLimit: 100,
                    extensionConfig: {
                        ["ApplicationInsightsAnalytics"]: {
                            emitLineDelimitedJson: true,
                            sessionRenewalMs: 100,
                            bufferOverride: storageBuffer
                        } as IConfig
                    }
                } as IConfiguration;
                let nonoverrideCfg2 = {
                    instrumentationKey: true,
                    extensionConfig: {
                        ["ApplicationInsightsAnalytics"]: {
                            emitLineDelimitedJson: true,
                            bufferOverride: {
                                getItem: true
                            }
                        }
                    }
                } as NonOverrideCfg;
                let newCfg2 = replaceByNonOverrideCfg(newConfig2, nonoverrideCfg2, 0, 2);
                Assert.deepEqual(newCfg2.instrumentationKey, undefined, "instrumentationKey should be deleted");
                let extCfg = newCfg2.extensionConfig || {};
                Assert.ok(extCfg, "ext config should not be deleted");
                let pluginCfg = extCfg.ApplicationInsightsAnalytics || null;
                Assert.ok(pluginCfg, "plugin config should not be deleted");
                Assert.deepEqual(pluginCfg.emitLineDelimitedJson, undefined, "emitLineDelimitedJson should be deleted");
                Assert.deepEqual(pluginCfg.sessionRenewalMs, 100, " sessionRenewalMs should not be deleted");
                Assert.deepEqual(pluginCfg.bufferOverride, null, "bufferOverride should exceed max level");

            }

        });

        this.testCase({
            name: "CfgSyncPluginHelper: shouldOptInFeature should work as expected with empty or undefiend or cdn config is disabled",
            useFakeTimers: true,
            test: () => {

                //Case1: cdn cfg and custom cfg are both undefined or empty
                let featureValue = shouldOptInFeature("enableWParam");
                Assert.deepEqual(null, featureValue, "feature value should be null when cfg are undefined case1");

                featureValue = shouldOptInFeature("enableWParam", {}, {});
                Assert.deepEqual(null, featureValue, "feature value should be null when cfg are empty case1");


                //Case2: custom cfg is undefined or empty
                let cdnConfig = {
                    enabled: false
                } as ICfgSyncCdnConfig;
                featureValue = shouldOptInFeature("enableWParam", cdnConfig);
                Assert.deepEqual(null, featureValue, "feature value should be null when custom cfg is undefined and cdn config is disabled case2");
                cdnConfig = {
                    enabled: true
                } as ICfgSyncCdnConfig;
                featureValue = shouldOptInFeature("enableWParam", cdnConfig, {});
                Assert.deepEqual(null, featureValue, "feature value should be null when custom cfg is empty and cdn config is enabled case2");
                cdnConfig = {
                    enabled: true,
                    featureOptIn:{["enableWParam"]: {mode: CdnFeatureMode.enable}},
                    config: {
                        maxMessageLimit: 10
                    }
                } as ICfgSyncCdnConfig;
                featureValue = shouldOptInFeature("enableWParam", cdnConfig);
                Assert.deepEqual(null, featureValue, "feature value should be null when custom cfg is undefined case2");
                featureValue = shouldOptInFeature("enableWP", cdnConfig);
                Assert.deepEqual(null, featureValue, "feature value should be null field is not defined case2");
                

                //Case3: cdn config is undefined or empty
                let customFeatureOptIn = {
                    ["enableWParam"]: {mode: FeatureOptInMode.enable, cfgValue: true} as IFeatureOptInDetails
                }as IFeatureOptIn;
                featureValue = shouldOptInFeature("enableWParam", {}, customFeatureOptIn);
                Assert.deepEqual(null, featureValue, "feature value should be null case3");


                //Case4: cdn config is disbaled
                cdnConfig = {
                    enabled: false,
                    featureOptIn:{["enableWParam"]: {mode: CdnFeatureMode.disable}},
                    config: {
                        maxMessageLimit: 10
                    }
                } as ICfgSyncCdnConfig;
                customFeatureOptIn = {
                    ["enableWParam"]: {mode: FeatureOptInMode.enable, cfgValue: false} as IFeatureOptInDetails
                }as IFeatureOptIn;
                featureValue = shouldOptInFeature("enableWParam", cdnConfig, customFeatureOptIn);
                Assert.deepEqual(null, featureValue, "feature value should be null case4");
            }
        });

        this.testCase({
            name: "CfgSyncPluginHelper: shouldOptInFeature should work with cdn mode set enabled and custom mode set to enable",
            useFakeTimers: true,
            test: () => {
                let field = "enableWParam"
                let cdnConfig = {
                    enabled: true,
                    featureOptIn:{[field]: {mode: CdnFeatureMode.enable, value: false}},
                    config: {
                        maxMessageLimit: 10
                    }
                } as ICfgSyncCdnConfig;

                // case 1
                let customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.enable} as IFeatureOptInDetails
                } as IFeatureOptIn;
                let featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(false, featureValue, "feature value should be cdn value case1");

                // case 2
                customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.enable, cfgValue: true} as IFeatureOptInDetails
                } as IFeatureOptIn;
                featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(true, featureValue, "feature value should be custom value case2");

                // case 3
                customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.enable, blockCdnCfg: true} as IFeatureOptInDetails
                } as IFeatureOptIn;
                featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(undefined, featureValue, "feature value should be custom value case3");

                //case 4
                cdnConfig = {
                    enabled: true,
                    featureOptIn:{[field]: {mode: CdnFeatureMode.enable}},
                    config: {
                        maxMessageLimit: 10
                    }
                } as ICfgSyncCdnConfig;
                customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.enable} as IFeatureOptInDetails
                } as IFeatureOptIn;
                featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(undefined, featureValue, "feature value should be undefined case4");
            }
        });

        this.testCase({
            name: "CfgSyncPluginHelper: shouldOptInFeature should work with cdn mode set enabled and custom mode set to none",
            useFakeTimers: true,
            test: () => {
                let field = "enableWParam"
                let cdnConfig = {
                    enabled: true,
                    featureOptIn:{[field]: {mode: CdnFeatureMode.enable, value: false}},
                    config: {
                        maxMessageLimit: 10
                    }
                } as ICfgSyncCdnConfig;

                // case 1
                let customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.none} as IFeatureOptInDetails
                } as IFeatureOptIn;
                let featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(false, featureValue, "feature value should be cdn value case1");

                // case 2
                customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.none, cfgValue: true} as IFeatureOptInDetails
                } as IFeatureOptIn;
                featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(false, featureValue, "feature value should be cdn value case2");
                
                //case 3
                cdnConfig = {
                    enabled: true,
                    featureOptIn:{[field]: {mode: CdnFeatureMode.enable}},
                    config: {
                        maxMessageLimit: 10
                    }
                } as ICfgSyncCdnConfig;
                customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.none, cfgValue: true} as IFeatureOptInDetails
                } as IFeatureOptIn;
                featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(true, featureValue, "feature value should be custom value case3");

                // case 4
                customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.none, blockCdnCfg: true} as IFeatureOptInDetails
                } as IFeatureOptIn;
                featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(undefined, featureValue, "feature value should be custom value case4");
            }
        });

        this.testCase({
            name: "CfgSyncPluginHelper: shouldOptInFeature should work with cdn mode set enabled and custom mode set to disable",
            useFakeTimers: true,
            test: () => {
                let field = "enableWParam"
                let cdnConfig = {
                    enabled: true,
                    featureOptIn:{[field]: {mode: CdnFeatureMode.enable, value: false}},
                    config: {
                        maxMessageLimit: 10
                    }
                } as ICfgSyncCdnConfig;

                // case 1
                let customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.disable} as IFeatureOptInDetails
                } as IFeatureOptIn;
                let featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(undefined, featureValue, "feature value should be undefined case1");

                // case 2
                customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.disable, cfgValue: true} as IFeatureOptInDetails
                } as IFeatureOptIn;
                featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(true, featureValue, "feature value should be true case2");

            }
        });

        this.testCase({
            name: "CfgSyncPluginHelper: shouldOptInFeature should work with cdn mode set to force",
            useFakeTimers: true,
            test: () => {
                let field = "enableWParam"
                let cdnConfig = {
                    enabled: true,
                    featureOptIn:{[field]: {mode: CdnFeatureMode.force, value: false}},
                    config: {
                        maxMessageLimit: 10
                    }
                } as ICfgSyncCdnConfig;

                // case 1
                let customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.disable, cfgValue: true} as IFeatureOptInDetails
                } as IFeatureOptIn;
                let featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(false, featureValue, "feature value should be cdn value case1");

                // case 2
                customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.disable, blockCdnCfg: true} as IFeatureOptInDetails
                } as IFeatureOptIn;
                featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(undefined, featureValue, "feature value should be custom value case2");

                // case 3
                customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.enable, cfgValue: true} as IFeatureOptInDetails
                } as IFeatureOptIn;
                featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(false, featureValue, "feature value should be cdn value case3");

                // case 4
                customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.enable, cfgValue: true, blockCdnCfg: true} as IFeatureOptInDetails
                } as IFeatureOptIn;
                featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(true, featureValue, "feature value should be custom value case4");
                
            }
        });

        this.testCase({
            name: "CfgSyncPluginHelper: shouldOptInFeature should work with cdn mode set to none or disable",
            useFakeTimers: true,
            test: () => {
                let field = "enableWParam"
                let cdnConfig = {
                    enabled: true,
                    featureOptIn:{[field]: {mode: CdnFeatureMode.disable, value: false}},
                    config: {
                        maxMessageLimit: 10
                    }
                } as ICfgSyncCdnConfig;

                // case 1
                let customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.none} as IFeatureOptInDetails
                } as IFeatureOptIn;
                let featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(false, featureValue, "feature value should be custom value case1");

                // case 2
                customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.enable, cfgValue: true} as IFeatureOptInDetails
                } as IFeatureOptIn;
                featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(false, featureValue, "feature value should be custom value case2");

                // case 2-1
                customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.disable, cfgValue: true} as IFeatureOptInDetails
                } as IFeatureOptIn;
                featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(false, featureValue, "feature value should be custom value case2-1");
                
                //case 3
                cdnConfig = {
                    enabled: true,
                    featureOptIn:{[field]: {mode: CdnFeatureMode.none}},
                    config: {
                        maxMessageLimit: 10
                    }
                } as ICfgSyncCdnConfig;
                customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.disable} as IFeatureOptInDetails
                } as IFeatureOptIn;
                featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(undefined, featureValue, "feature value should be custom value case3");

                // case 4
                customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.none, cfgValue: true} as IFeatureOptInDetails
                } as IFeatureOptIn;
                featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(true, featureValue, "feature value should be custom value case4");

                // case 5
                customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.enable, cfgValue: true} as IFeatureOptInDetails
                } as IFeatureOptIn;
                featureValue = shouldOptInFeature(field, cdnConfig, customFeatureOptIn);
                Assert.deepEqual(true, featureValue, "feature value should be custom value case5");
            }
        });


        this.testCase({
            name: "CfgSyncPluginHelper: getConfigFromCdn should get config correctly with none custom opt-in",
            useFakeTimers: true,
            test: () => {
                let core = new AppInsightsCore();
                let channel = new ChannelPlugin()
                this.onDone(() => {
                    core.unload(false);
                });
                let field = "enableWParam";
                let cdnConfig = {
                    enabled: true,
                    featureOptIn:{[field]: {mode: CdnFeatureMode.enable, value: false}},
                    config: {
                        maxMessageLimit: 10
                    }
                } as ICfgSyncCdnConfig;

                let config = {instrumentationKey: "test"} as IConfiguration;
                core.initialize(config, [channel]);

                let actualCdnCfg = getConfigFromCdn(cdnConfig, core);
                Assert.deepEqual(cdnConfig.config, actualCdnCfg, "cdn config should not contain feature");

            }
        });

        this.testCase({
            name: "CfgSyncPluginHelper: getConfigFromCdn should get config correctly with custom opt-in",
            useFakeTimers: true,
            test: () => {
                let core = new AppInsightsCore();
                let channel = new ChannelPlugin()
                this.onDone(() => {
                    core.unload(false);
                });
                let field = "enableWParam";
                let cdnConfig = {
                    enabled: true,
                    featureOptIn:{[field]: {mode: CdnFeatureMode.enable, value: false}},
                    config: {
                        maxMessageLimit: 10
                    }
                } as ICfgSyncCdnConfig;

                let customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.enable} as IFeatureOptInDetails
                } as IFeatureOptIn;
                let config = {instrumentationKey: "test", featureOptIn: customFeatureOptIn} as IConfiguration;
                core.initialize(config, [channel]);

                let actualCdnCfg = getConfigFromCdn(cdnConfig, core);
                let expectedCfg = {
                    maxMessageLimit: 10,
                    [field]: false
                }
                Assert.deepEqual(expectedCfg, actualCdnCfg, "cdn config should contain feature");
                
            }
        });

        this.testCase({
            name: "CfgSyncPluginHelper: getConfigFromCdn should override config correctly with custom opt-in",
            useFakeTimers: true,
            test: () => {
                let core = new AppInsightsCore();
                let channel = new ChannelPlugin()
                this.onDone(() => {
                    core.unload(false);
                });
                let field = "enableWParam";
                let cdnConfig = {
                    enabled: true,
                    featureOptIn:{[field]: {mode: CdnFeatureMode.enable, value: false}},
                    config: {
                        maxMessageLimit: 10,
                        [field]: true
                    }
                } as ICfgSyncCdnConfig;

                let customFeatureOptIn = {
                    [field]: {mode: FeatureOptInMode.enable} as IFeatureOptInDetails
                } as IFeatureOptIn;
                let config = {instrumentationKey: "test", featureOptIn: customFeatureOptIn} as IConfiguration;
                core.initialize(config, [channel]);

                let actualCdnCfg = getConfigFromCdn(cdnConfig, core);
                let expectedCfg = {
                    maxMessageLimit: 10,
                    [field]: false
                }
                Assert.deepEqual(expectedCfg, actualCdnCfg, "cdn config should contain feature");
                
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

    public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) {
    }

    private _processTelemetry(env: ITelemetryItem) {

    }
}

