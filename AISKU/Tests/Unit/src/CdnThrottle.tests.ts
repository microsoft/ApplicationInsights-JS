import { ApplicationInsights, ApplicationInsightsContainer, IApplicationInsights, IConfig, IConfiguration, LoggingSeverity, Snippet, _eInternalMessageId } from '../../../src/applicationinsights-web'
import { AITestClass, Assert, IFetchArgs, PollingAssert} from '@microsoft/ai-test-framework';
import { IThrottleInterval, IThrottleLimit, IThrottleMgrConfig } from '@microsoft/applicationinsights-common';
import { SinonSpy } from 'sinon';
import { AppInsightsSku } from '../../../src/AISku';
import { createSnippetV5 } from './testSnippetV5';
import { FeatureOptInMode, getGlobal, getGlobalInst, isFunction, newId } from '@microsoft/applicationinsights-core-js';
import { createSnippetV6 } from './testSnippetV6';
import { CfgSyncPlugin, ICfgSyncConfig, ICfgSyncMode } from '@microsoft/applicationinsights-cfgsync-js';
import { createSyncPromise } from '@nevware21/ts-async';

const TestInstrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';

const tconfig = {
    disabled: false,
    limit: {
        samplingRate: 1,
        maxSendNumber:100
    } as IThrottleLimit,
    interval: {
        monthInterval: 1,
        daysOfMonth: [1], // must add here
        dayInterval: undefined
    } as IThrottleInterval
} as IThrottleMgrConfig;

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

const config = {
    instrumentationKey:"testIkey",
    enableAjaxPerfTracking: true,
    throttleMgrCfg: {
        109: { 
            disabled: false,
            limit: { 
                samplingRate: 1000000,
                maxSendNumber: 1
            },
            interval: {
                monthInterval: 1,
                daysOfMonth:[1]
            }
        },
        106: { 
            disabled: false,
            limit: { 
                samplingRate: 1000000,
                maxSendNumber: 1
            },
            interval: {
                monthInterval: 1,
                daysOfMonth:[1]
            }
        }
    }
} as IConfiguration & IConfig;

const cdnOptinConfig = {
    instrumentationKey:"testIkey",
    enableAjaxPerfTracking: true,
    throttleMgrCfg: {
        109: { 
            disabled: true,
            limit: { 
                samplingRate: 1000000,
                maxSendNumber: 1
            },
            interval: {
                monthInterval: 1,
                daysOfMonth:[1]
            }
        },
        106: { 
            disabled: true,
            limit: { 
                samplingRate: 1000000,
                maxSendNumber: 1
            },
            interval: {
                monthInterval: 1,
                daysOfMonth:[1]
            }
        }
    }
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
                config: config
            } as ICfgSyncConfig;
            let cdnFeatureOptInCfg = {
                enabled: true,
                config: cdnOptinConfig
            } as ICfgSyncConfig;
            doc["res"] = new (doc as any).Response(JSON.stringify(cdnCfg), {
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
        this.testCaseAsync({
            name: "CfgSyncPlugin: customer enable ikey messsage change, new config fetch from config url overwrite throttle setting and send message",
            stepDelay: 10,
            useFakeTimers: true,
            steps: [ () => {
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
                        extensionConfig : {["AppInsightsCfgSyncPlugin"] :  {
                            syncMode: ICfgSyncMode.Receive,
                            cfgUrl: "testurl"
                        }}
                    }
                });
                this.init.loadAppInsights();
                this._ai = this.init;
            }].concat(PollingAssert.createPollingAssert(() => {
   
                if (this.fetchStub.called){
                    let core = this._ai['core'];
                    let _logger = core.logger;
                    let loggingSpy = this.sandbox.stub(_logger, 'throwInternal');
                    Assert.ok(!loggingSpy.called);

                    // now enable feature
                    this.init.config.featureOptIn = {["iKeyUsage"]: {mode: FeatureOptInMode.enable}};
                    this.clock.tick(1);
                    Assert.ok(loggingSpy.called);
                    Assert.equal(_eInternalMessageId.InstrumentationKeyDeprecation, loggingSpy.args[0][1]);
                    let message= loggingSpy.args[0][2];
                    Assert.ok(message.includes("Instrumentation key"));
                    return true;
                }
                return false;
                
            }, "response received", 60, 1000) as any)
        });
         this.testCaseAsync({
            name: "CfgSyncPlugin: customer didn't set throttle config, successfully fetch from config url",
            stepDelay: 10,
            useFakeTimers: true,
            steps: [ () => {
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
            }].concat(PollingAssert.createPollingAssert(() => {
   
                if (this.fetchStub.called){
                    let plugin = this._ai.appInsights['core'].getPlugin<CfgSyncPlugin>(this.identifier).plugin;
                    let newCfg = plugin.getCfg();
                    Assert.equal(JSON.stringify(newCfg.throttleMgrCfg), JSON.stringify(config.throttleMgrCfg));
                    // cdn should not be changed
                    let cdnCfg = this.init.config.throttleMgrCfg[_eInternalMessageId.CdnDeprecation];
                    Assert.equal(JSON.stringify(cdnCfg), JSON.stringify(default_throttle_config));
                    return true;
                }
                return false;
                
            }, "response received", 60, 1000) as any)
        });

        this.testCaseAsync({
            name: "CfgSyncPlugin: customer set throttle config, new config fetch from config url could overwrite original one",
            stepDelay: 10,
            useFakeTimers: true,
            steps: [ () => {
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
            }].concat(PollingAssert.createPollingAssert(() => {
   
                if (this.fetchStub.called){
                    let plugin = this._ai.appInsights['core'].getPlugin<CfgSyncPlugin>(this.identifier).plugin;
                    let newCfg = plugin.getCfg();
                    Assert.equal(JSON.stringify(newCfg.throttleMgrCfg), JSON.stringify(config.throttleMgrCfg));
                    // cdn should not be overwritten
                    let cdnCfg = this.init.config.throttleMgrCfg[_eInternalMessageId.CdnDeprecation];
                    Assert.equal(JSON.stringify(cdnCfg), JSON.stringify(default_throttle_config));
                    let ikeyCfg = this.init.config.throttleMgrCfg[_eInternalMessageId.InstrumentationKeyDeprecation];
                    Assert.equal(JSON.stringify(ikeyCfg), JSON.stringify(config.throttleMgrCfg[_eInternalMessageId.InstrumentationKeyDeprecation]));
                    return true;
                }
                return false;
            }, "response received", 60, 1000) as any)
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