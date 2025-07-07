import { ApplicationInsights, ApplicationInsightsContainer, IApplicationInsights, IConfig, IConfiguration, LoggingSeverity, Snippet, _eInternalMessageId } from '../../../src/applicationinsights-web'
import { AITestClass, Assert, IFetchArgs, PollingAssert} from '@microsoft/ai-test-framework';
import { IThrottleInterval, IThrottleLimit, IThrottleMgrConfig } from '@microsoft/applicationinsights-common';
import { SinonSpy } from 'sinon';
import { AppInsightsSku } from '../../../src/AISku';
import { createSnippetV5 } from './testSnippetV5';
import { CdnFeatureMode, FeatureOptInMode, getGlobal, getGlobalInst, isFunction, newId } from '@microsoft/applicationinsights-core-js';
import { createSnippetV6 } from './testSnippetV6';
import { CfgSyncPlugin, ICfgSyncConfig, ICfgSyncMode } from '@microsoft/applicationinsights-cfgsync-js';
import { createSyncPromise } from '@nevware21/ts-async';
import { ICfgSyncCdnConfig } from '@microsoft/applicationinsights-cfgsync-js/src/Interfaces/ICfgSyncCdnConfig';


const TestInstrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';

const default_throttle_config = {
    disabled: true,
    limit: {
        samplingRate: 100,
        maxSendNumber: 1
    },
    interval: {
        monthInterval: 3,
        daysOfMonth: [28]
    }
} as IThrottleMgrConfig;

const throttleCfg = {
    109: { 
        disabled: false,
        limit: { 
            samplingRate: 1000000,
            maxSendNumber: 2
        },
        interval: {
            monthInterval: 2,
            daysOfMonth:[1]
        }
    },
    106: { 
        disabled: false,
        limit: { 
            samplingRate: 1000000,
            maxSendNumber: 2
        },
        interval: {
            monthInterval: 2,
            daysOfMonth:[1]
        }
    }
}

const throttleCfgDisable = {
    109: { 
        disabled: true,
        limit: { 
            samplingRate: 1000000,
            maxSendNumber: 4
        },
        interval: {
            monthInterval: 4,
            daysOfMonth:[1]
        }
    },
    106: { 
        disabled: true,
        limit: { 
            samplingRate: 1000000,
            maxSendNumber: 4
        },
        interval: {
            monthInterval: 4,
            daysOfMonth:[1]
        }
    }
}

const sampleConfig = {
    instrumentationKey:"testIkey",
    enableAjaxPerfTracking: true,
    throttleMgrCfg: throttleCfg
} as IConfiguration & IConfig;


export class CdnThrottle extends AITestClass {
    private _ai: AppInsightsSku;
    private getAi: ApplicationInsights;
    private _config: IConfiguration | IConfig;
    private identifier: string;
    private fetchStub: any;
    init: ApplicationInsights;
    private res: any;
    private _fetch: any;
    loggingSpy: any;

    constructor() {
        super("CdnThrottle");
    }

    public _getTestConfig() {
        let config: IConfiguration | IConfig = {
            instrumentationKey: TestInstrumentationKey,
            featureOptIn : {["iKeyUsage"]: {mode: FeatureOptInMode.enable}},
            extensionConfig : {["AppInsightsCfgSyncPlugin"] :  {
                syncMode: ICfgSyncMode.Receive,
                cfgUrl: "testurl"
            }}
        };
        return config;
    }

    public testInitialize() {
        try {
            if (window.localStorage){
                window.localStorage.clear();
            }
            this.identifier = "AppInsightsCfgSyncPlugin";
            this._config = this._getTestConfig();
            this._fetch = getGlobalInst("fetch");
            let doc = getGlobal();
            let cdnCfg = {
                enabled: true,
                config: sampleConfig
            } as ICfgSyncConfig;
            let cdnFeatureOptInCfg = {
                enabled: true,
                featureOptIn:{
                    ["enableWParamFeature"]: {mode: CdnFeatureMode.enable, onCfg: {["maxMessageLimit"]: 11}, offCfg: {["maxMessageLimit"]: 12}},
                    ["iKeyUsage"]: {
                    mode: CdnFeatureMode.enable,
                    onCfg: {
                        "throttleMgrCfg.106.disabled":false,
                        "throttleMgrCfg.109.disabled":false,
                    },
                    offCfg: {
                        "throttleMgrCfg.106.disabled":true,
                        "throttleMgrCfg.109.disabled":true,
                    }},
                    ["zipPayload"]: {
                        mode: CdnFeatureMode.enable},
                },
                config: {
                    maxMessageLimit: 10,
                    throttleMgrCfg: throttleCfgDisable,
                    
                }
            } as ICfgSyncConfig;
            doc["res"] = new (doc as any).Response(JSON.stringify(cdnCfg), {
                status: 200,
                headers: { "Content-type": "application/json" }
            });
            doc["res2"] = new (doc as any).Response(JSON.stringify(cdnFeatureOptInCfg), {
                status: 200,
                headers: { "Content-type": "application/json" }
            });
        } catch (e) {
            console.error('Failed to initialize', e.message);
        }
    }

    public testFinishedCleanup(): void {
        if (this._ai) {
            this._ai.unload(false);
        }   
        this.fetchStub = null;
        getGlobal().fetch = this._fetch;
        if (window.localStorage){
            window.localStorage.clear();
        }
    }

    public registerTests() {
        this.testCase({
            name: "CfgSyncPlugin: customer enable ikey messsage change, new config fetch from config url overwrite throttle setting and send message",
            useFakeTimers: true,
            test: () => {
                return this._asyncQueue().add(() => {
                    let doc = getGlobal();
                    hookFetch((resolve) => { // global instance cannot access test private instance
                        AITestClass.orgSetTimeout(function() {
                            resolve( doc["res"]);
                        }, 0);
                    });
                    this.fetchStub = this.sandbox.spy((doc as any), "fetch");
                    this.init = new ApplicationInsights({
                        config:   {
                            instrumentationKey: TestInstrumentationKey,
                            featureOptIn : {["iKeyUsage"]: {mode: FeatureOptInMode.disable}},
                            extensionConfig : {["AppInsightsCfgSyncPlugin"] :  {
                                syncMode: ICfgSyncMode.Receive,
                                cfgUrl: "testurl"
                            }}
                        }
                    });
                    this.init.loadAppInsights();
                    this._ai = this.init;
                })
                .concat(PollingAssert.createPollingAssert(() => {
                    if (this.fetchStub.called){
                        let core = this._ai['core'];
                        let _logger = core.logger;
                        let loggingSpy = this.sandbox.stub(_logger, 'throwInternal');
                        Assert.equal(loggingSpy.called, 0);

                        // now enable feature
                        this.init.config.featureOptIn = {["iKeyUsage"]: {mode: FeatureOptInMode.enable}};
                        this.clock.tick(1);
                        Assert.equal(loggingSpy.called, 1);
                        Assert.equal(_eInternalMessageId.InstrumentationKeyDeprecation, loggingSpy.args[0][1]);
                        let message= loggingSpy.args[0][2];
                        Assert.ok(message.includes("Instrumentation key"));
                        return true;
                    }
                    return false;
                    
                }, "response received", 60, 1000) as any);
            }
        });
         this.testCase({
            name: "CfgSyncPlugin: customer didn't set throttle config, successfully fetch from config url",
            useFakeTimers: true,
            test: () => {
                return this._asyncQueue().add(() => {
                    let doc = getGlobal();
                    hookFetch((resolve) => { // global instance cannot access test private instance
                        AITestClass.orgSetTimeout(function() {
                            resolve( doc["res"]);
                        }, 0);
                    });

                    this.fetchStub = this.sandbox.spy((doc as any), "fetch");
                    this.init = new ApplicationInsights({
                        config: this._config,
                    });
                    this.init.loadAppInsights();
                    this._ai = this.init;
                })
                .concat(PollingAssert.createPollingAssert(() => {
       
                    if (this.fetchStub.called){
                        let plugin = this._ai.appInsights['core'].getPlugin<CfgSyncPlugin>(this.identifier).plugin;
                        let newCfg = plugin.getCfg();
                        Assert.equal(JSON.stringify(newCfg.throttleMgrCfg), JSON.stringify(sampleConfig.throttleMgrCfg));
                        // cdn should not be changed
                        let cdnCfg = this.init.config.throttleMgrCfg[_eInternalMessageId.CdnDeprecation];
                        Assert.equal(JSON.stringify(cdnCfg), JSON.stringify(default_throttle_config));
                        return true;
                    }
                    return false;
                    
                }, "response received", 60, 1000) as any);
            }
        });

        this.testCase({
            name: "CfgSyncPlugin: customer didn't set feature opt in, successfully get aisku default and fetch from config url, get disable zip config to be true",
            useFakeTimers: true,
            test: () => {
                return this._asyncQueue().add(() => {
                    let doc = getGlobal();
                    hookFetch((resolve) => { // global instance cannot access test private instance
                        AITestClass.orgSetTimeout(function() {
                            resolve( doc["res2"]);
                        }, 0);
                    });

                    let noSetconfig = {
                        instrumentationKey: TestInstrumentationKey,
                        extensionConfig : {["AppInsightsCfgSyncPlugin"] :  {
                            syncMode: ICfgSyncMode.Receive,
                            cfgUrl: "testurl"
                        }}
                    };

                    this.fetchStub = this.sandbox.spy((doc as any), "fetch");
                    this.init = new ApplicationInsights({
                        config: noSetconfig,
                    });
                    this.init.loadAppInsights();
                    this._ai = this.init;
                })
                .concat(PollingAssert.createPollingAssert(() => {
                    if (this.fetchStub.called){
                        let newCfg = this._ai.config;
                        Assert.equal(newCfg.featureOptIn["zipPayload"]["mode"], FeatureOptInMode.enable); // aisku default is none, overwrite to true by cdn config
                        return true;
                    }
                    return false;
                }, "response received", 60, 1000) as any);
            }
        });

        this.testCase({
            name: "CfgSyncPlugin: customer set throttle config, new config fetch from config url could overwrite original one",
            useFakeTimers: true,
            test: () => {
                return this._asyncQueue().add(() => {
                    let doc = getGlobal();
                    hookFetch((resolve) => { // global instance cannot access test private instance
                        AITestClass.orgSetTimeout(function() {
                            resolve( doc["res"]);
                        }, 0);
                    });

                    this.fetchStub = this.sandbox.spy((doc as any), "fetch");
                    let config =  {
                        instrumentationKey: TestInstrumentationKey,
                        featureOptIn : {["iKeyUsage"]: {mode: FeatureOptInMode.enable}},
                        throttleMgrCfg: {
                            109: { 
                                disabled: false,
                                limit: { 
                                    samplingRate: 50,
                                    maxSendNumber: 1
                                },
                                interval: {
                                    daysOfMonth:[1],
                                    monthInterval: 1
                                }
                            }
                        },
                        extensionConfig : {["AppInsightsCfgSyncPlugin"] :  {
                            syncMode: ICfgSyncMode.Receive,
                            cfgUrl: "testurl"
                        }}
                    };
                    
                    this.init = new ApplicationInsights({
                        config: config,
                    });
                    this.init.loadAppInsights();
                    this._ai = this.init;
                })
                .concat(PollingAssert.createPollingAssert(() => {
       
                    if (this.fetchStub.called){
                        let plugin = this._ai.appInsights['core'].getPlugin<CfgSyncPlugin>(this.identifier).plugin;
                        let newCfg = plugin.getCfg();
                        Assert.equal(JSON.stringify(newCfg.throttleMgrCfg), JSON.stringify(sampleConfig.throttleMgrCfg));
                        // cdn should not be overwritten
                        let cdnCfg = this.init.config.throttleMgrCfg[_eInternalMessageId.CdnDeprecation];
                        Assert.equal(JSON.stringify(cdnCfg), JSON.stringify(default_throttle_config));
                        let ikeyCfg = this.init.config.throttleMgrCfg[_eInternalMessageId.InstrumentationKeyDeprecation];
                        Assert.equal(JSON.stringify(ikeyCfg), JSON.stringify(sampleConfig.throttleMgrCfg[_eInternalMessageId.InstrumentationKeyDeprecation]));
                        return true;
                    }
                    return false;
                }, "response received", 60, 1000) as any);
            }
        });

        this.testCase({
            name: "CfgSyncPlugin: customer enable feature opt in, then the config in cdn feature opt in is applied",
            useFakeTimers: true,
            test: () => {
                return this._asyncQueue().add(() => {
                    let doc = getGlobal();
                    hookFetch((resolve) => { // global instance cannot access test private instance
                        AITestClass.orgSetTimeout(function() {
                            resolve( doc["res2"]);
                        }, 0);
                    });
                    this.fetchStub = this.sandbox.spy((doc as any), "fetch");
                    this.init = new ApplicationInsights({
                        config:   {
                            instrumentationKey: TestInstrumentationKey,
                            extensionConfig : {["AppInsightsCfgSyncPlugin"] :  {
                                syncMode: ICfgSyncMode.Receive,
                                cfgUrl: "testurl"
                            }},
                            featureOptIn : {["iKeyUsage"]: {mode: FeatureOptInMode.enable}, 
                            ["enableWParamFeature"]: {mode: FeatureOptInMode.enable}}
                        }
                    });
                    this.init.loadAppInsights();
                    this._ai = this.init;
                })
                .concat(PollingAssert.createPollingAssert(() => {
       
                    if (this.fetchStub.called){
                        Assert.equal(this.init.config.throttleMgrCfg[_eInternalMessageId.InstrumentationKeyDeprecation].disabled, false);
                        Assert.equal(this.init.config.throttleMgrCfg[_eInternalMessageId.CdnDeprecation].disabled, true);
                        Assert.equal(this.init.config.throttleMgrCfg[_eInternalMessageId.InstrumentationKeyDeprecation].limit?.maxSendNumber, throttleCfgDisable[_eInternalMessageId.InstrumentationKeyDeprecation].limit?.maxSendNumber);
                        return true;
                    }
                    return false;
                }, "response received", 60, 1000) as any);
            }
        });

        this.testCase({
            name: "CfgSyncPlugin: customer disable feature opt in, the origin config on cdn will apply",
            useFakeTimers: true,
            test: () => {
                return this._asyncQueue().add(() => {
                    let doc = getGlobal();
                    hookFetch((resolve) => { // global instance cannot access test private instance
                        AITestClass.orgSetTimeout(function() {
                            resolve( doc["res2"]);
                        }, 0);
                    });
                    this.fetchStub = this.sandbox.spy((doc as any), "fetch");
                    this.init = new ApplicationInsights({
                        config:   {
                            instrumentationKey: TestInstrumentationKey,
                            extensionConfig : {["AppInsightsCfgSyncPlugin"] :  {
                                syncMode: ICfgSyncMode.Receive,
                                cfgUrl: "testurl"
                            }},
                            featureOptIn : {
                            ["enableWParamFeature"]: {mode: FeatureOptInMode.enable}}
                        }
                    });
                    this.init.loadAppInsights();
                    this._ai = this.init;
                })
                .concat(PollingAssert.createPollingAssert(() => {
                    if (this.fetchStub.called){
                        Assert.equal(this.init.config.throttleMgrCfg[_eInternalMessageId.InstrumentationKeyDeprecation].disabled, true);
                        Assert.equal(this.init.config.throttleMgrCfg[_eInternalMessageId.CdnDeprecation].disabled, true);
                        Assert.equal(this.init.config.throttleMgrCfg[_eInternalMessageId.InstrumentationKeyDeprecation].limit?.maxSendNumber, throttleCfgDisable[_eInternalMessageId.InstrumentationKeyDeprecation].limit?.maxSendNumber);
                        return true;
                    }
                    return false;
                }, "response received", 60, 1000) as any);
            }
        });
       
       
    }
}

function hookFetch<T>(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): IFetchArgs[] {
    let calls:IFetchArgs[] = [];
    let global = getGlobal() as any;
    global.fetch = function(input: RequestInfo, init?: RequestInit) {
        calls.push({
            input,
            init
        });
        return createSyncPromise(executor);
    }

    return calls;
}