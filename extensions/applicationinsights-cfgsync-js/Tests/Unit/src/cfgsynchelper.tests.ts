import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { NonOverrideCfg } from "../../../src/Interfaces/ICfgSyncConfig";
import { IConfiguration, ICookieMgrConfig } from "@microsoft/applicationinsights-core-js";
import { IConfig, IStorageBuffer } from "@microsoft/applicationinsights-common";
import { replaceByNonOverrideCfg } from "../../../src/CfgSyncHelperFuncs";


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

                let newCfg = replaceByNonOverrideCfg(newConfig, nonoverrideCfg, 0, 4);
                Assert.deepEqual(JSON.stringify(newCfg), JSON.stringify(expectedNewCfg), "only expected configs are changed under new config");

            }

        });

        this.testCase({
            name: "CfgSyncPluginHelper: replaceByNonOverrideCfg should work with 2 nested levels config",
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
     
                let newCfg = replaceByNonOverrideCfg(newConfig, nonoverrideCfg, 0, 4);
                Assert.deepEqual(JSON.stringify(newCfg), JSON.stringify(expectedNewCfg), "only expected configs are changed under new config");

            }

        });

        this.testCase({
            name: "CfgSyncPluginHelper: replaceByNonOverrideCfg should work with 3 & 4 nested levels config",
            useFakeTimers: true,
            test: () => {

                let newStorageBuffer = {
                    getItem: (logger: any, name: string) => {
                        return "test123"
                    },
                    setItem: (logger: any, name: string, data: string) => {
                        return false;
                    }
                } as IStorageBuffer;

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

    }
}
