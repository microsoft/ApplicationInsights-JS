import { Assert, AITestClass, PollingAssert } from "@microsoft/ai-test-framework";
import { AppInsightsCore, IAppInsightsCore, IPlugin, ITelemetryItem, getGlobal, getGlobalInst } from "@microsoft/applicationinsights-core-js";
import { IConfiguration } from "@microsoft/applicationinsights-core-js";
import { CfgSyncPlugin } from "../../../../applicationinsights-cfgsync-js/src/applicationinsights-cfgsync-js";
import { ICfgSyncConfig, ICfgSyncMode, NonOverrideCfg } from "../../../src/Interfaces/ICfgSyncConfig";
import { IConfig } from "@microsoft/applicationinsights-common";
import { createSyncPromise } from "@nevware21/ts-async";

export class CfgSyncPluginTests extends AITestClass {
    private core: AppInsightsCore;
    private _config: IConfiguration;
    private mainInst: CfgSyncPlugin;
    private identifier: string;
    private _channel: ChannelPlugin;
    private _context:any = {};
    private _fetch;

    constructor(emulateIe?: boolean) {
        super("CfgSyncPluginTests", emulateIe);
    }

    public testInitialize() {
        let _self = this;
        _self.mainInst = new CfgSyncPlugin();
        _self.identifier = _self.mainInst.identifier;
        _self._config = {
            instrumentationKey: "Test-iKey",
            disableInstrumentationKeyValidation: true,
            maxMessageLimit: 3000,
            enablePerfMgr: true,
            extensions: [_self.mainInst],
            extensionConfig: {
                [_self.identifier]: {
                    syncMode: ICfgSyncMode.Broadcast
                } as ICfgSyncConfig
            }
        };
        _self._channel = new ChannelPlugin();
        _self.core = new AppInsightsCore();
        this._fetch = getGlobalInst("fetch");
    }

    public testCleanup() {
        this.mainInst.teardown();
        this.core = null as any;
        this._config = null as any;
        this.mainInst = null as any;
        getGlobal().fetch = this._fetch;
        this._context = {};
    }

    public registerTests() {
        this.testCase({
            name: "CfgSyncPlugin: default config should be set from root",
            useFakeTimers: true,
            test: () => {
                let doc = getGlobal();
                let patchEvnSpy = this.sandbox.spy(doc, "dispatchEvent");
                this.onDone(() => {
                    this.core.unload(false);
                });
                this.core.initialize({instrumentationKey: "Test-iKey",  extensions: [this.mainInst], extensionConfig: {[this.identifier]: {}}}, [this._channel]);
                let defaultNonOverrideCfg: NonOverrideCfg = {instrumentationKey: true, connectionString: true, endpointUrl: true }
                let targets = this.mainInst["_getDbgPlgTargets"]();
                let extConfig = targets[3];
                Assert.ok(extConfig, "config is set");
                Assert.ok(!extConfig.customEvtName, "custom evtName is not set");
                Assert.ok(!extConfig.cfgUrl, "cfgUrl is not set");
                Assert.ok(!extConfig.overrideSyncFn, "overrideSyncFn is not set");
                Assert.ok(!extConfig.overrideFetchFn, "overrideFetchFn is not set");
                Assert.ok(!extConfig.onCfgChangeReceive, "onCfgChangeReceive is not set");
                Assert.equal(extConfig.scheduleFetchTimeout, 1800000, "scheduleFetchTimeout is set");
                Assert.deepEqual(extConfig.nonOverrideConfigs, defaultNonOverrideCfg, "NonOverrideCfg is set");
                Assert.equal(targets[0], true, "auto broadcast is on by default");
                Assert.equal(targets[1], false, "receive changes is off by default");
                Assert.equal(targets[2], "ai_cfgsync", "default event name is set by default");
                Assert.equal(patchEvnSpy.callCount, 1, "event is dispatched for one time");
                let curMainCfg = this.mainInst.getCfg();
                Assert.deepEqual(curMainCfg, this.core.config, "main config should be set");
            }

        });

        this.testCase({
            name: "CfgSyncPlugin: config should be set from root",
            useFakeTimers: true,
            test: () => {
                let doc = getGlobal();
                let patchEvnSpy = this.sandbox.spy(doc, "dispatchEvent");
                this.onDone(() => {
                    this.core.unload(false);
                });
                let called = 0;
                let send = 0;
                let change = 0;
                let overrideSyncFn = (config?:IConfiguration & IConfig, customDetails?: any) =>  {
                    called ++;
                    return true;
                }
                let onCompleteCallback = (status: number, response?: string, isAutoSync?: boolean) => {
                    return;
                };
                let sendGetFunction = (url: string, oncomplete: any, isAutoSync?: boolean) => {
                    send++;
                    return;
                };
                let onCfgChangeReceive = (event?: any) => {
                    change++;
                };
                let udfVal = undefined;
                let defaultNonOverrideCfg: NonOverrideCfg = {instrumentationKey: true, connectionString: true, endpointUrl: true, disableAjaxTracking: true}
                let cfg = {
                    syncMode: ICfgSyncMode.Receive,
                    customEvtName: "test",
                    cfgUrl: udfVal,
                    overrideSyncFn:  overrideSyncFn,
                    overrideFetchFn: sendGetFunction,
                    onCfgChangeReceive: onCfgChangeReceive,
                    scheduleFetchTimeout: 1800000,
                    nonOverrideConfigs: defaultNonOverrideCfg
                };
                this.core.initialize({instrumentationKey: "Test-iKey",  extensions: [this.mainInst], extensionConfig: {[this.identifier]: cfg}}, [this._channel]);
                
                let targets = this.mainInst["_getDbgPlgTargets"]();
                let extConfig = targets[3];
                Assert.ok(extConfig, "config is set");
                Assert.equal(extConfig.customEvtName, "test", "custom evtName is not set");
                Assert.ok(!extConfig.cfgUrl, "cfgUrl is not set");
                extConfig.overrideSyncFn();
                extConfig.overrideFetchFn("test", onCompleteCallback);
                extConfig.onCfgChangeReceive();
                Assert.equal(called, 1, "overrideSyncFn is set");
                Assert.equal(change, 1, "onCfgChangeReceive is set");
                Assert.equal(send, 1, "overrideFetchFn is set");
                Assert.equal(extConfig.scheduleFetchTimeout, 1800000, "scheduleFetchTimeout is set");
                Assert.deepEqual(extConfig.nonOverrideConfigs, defaultNonOverrideCfg, "NonOverrideCfg is set");
                Assert.equal(targets[0], false, "auto broadcast is off");
                Assert.equal(targets[1], true, "receive changes is on");
                Assert.equal(targets[2], "test", "event name is set");
                Assert.equal(patchEvnSpy.callCount, 0, "event should not be dispatched for one time");
                let curMainCfg = this.mainInst.getCfg();
                Assert.deepEqual(curMainCfg, this.core.config, "main config should be set");
            }

        });

        this.testCase({
            name: "CfgSyncPlugin: config should be set with sync mode to none",
            useFakeTimers: true,
            test: () => {
                let doc = getGlobal();
                let patchEvnSpy = this.sandbox.spy(doc, "dispatchEvent");
                this.onDone(() => {
                    this.core.unload(false);
                });
                this.core.initialize({instrumentationKey: "Test-iKey",  extensions: [this.mainInst], extensionConfig: {[this.identifier]: {syncMode: ICfgSyncMode.None}}}, [this._channel]);
                let defaultNonOverrideCfg: NonOverrideCfg = {instrumentationKey: true, connectionString: true, endpointUrl: true }
                let targets = this.mainInst["_getDbgPlgTargets"]();
                let extConfig = targets[3];
                Assert.ok(extConfig, "config is set");
                Assert.deepEqual(extConfig.nonOverrideConfigs, defaultNonOverrideCfg, "NonOverrideCfg is set");
                Assert.equal(targets[0], false, "auto broadcast is off");
                Assert.equal(targets[1], false, "receive changes is off");
                Assert.equal(targets[2], "ai_cfgsync", "default event name is set by default");
                Assert.equal(patchEvnSpy.callCount, 0, "event should not be dispatched for one time");
                let curMainCfg = this.mainInst.getCfg();
                Assert.deepEqual(curMainCfg, this.core.config, "main config should be set");
            }

        });

        this.testCase({
            name: "CfgSyncPlugin: eventListener should be set correctly to broadcast mode instacne",
            test: () => {
                let doc = getGlobal();
                let patchEvnSpy = this.sandbox.spy(doc, "dispatchEvent");
                let global = getGlobal();
                let eventListenerStub = this.sandbox.spy(global, "addEventListener");
                this.onDone(() => {
                    this.core.unload(false);
                });

                this.core.initialize(this._config, [this._channel]);
                let targets = this.mainInst["_getDbgPlgTargets"]();
                Assert.equal(targets[0], true, "auto broadcast is on by default");
                Assert.equal(targets[1], false, "receive changes is on");
                Assert.equal(targets[2], "ai_cfgsync", "default event name is set by default");
                Assert.equal(patchEvnSpy.callCount, 1, "event is dispatched");
                Assert.equal(eventListenerStub.callCount, 0, "event listener is not added to broadcase mode instance");

                this.mainInst.updateEventListenerName("test");
                targets = this.mainInst["_getDbgPlgTargets"]();
                Assert.equal(targets[2], "test", "event name should be changed");
                Assert.equal(patchEvnSpy.callCount, 1, "event dispatch shoule not be called again");
                Assert.equal(eventListenerStub.callCount, 0, "event listener is should not be added to broadcast mode instance again");
            }
        });

        this.testCase({
            name: "CfgSyncPlugin: eventListener should be set correctly to receive mode instance",
            test: () => {
                let doc = getGlobal();
                let patchEvnSpy = this.sandbox.spy(doc, "dispatchEvent");
                let global = getGlobal();
                let eventListenerStub = this.sandbox.spy(global, "addEventListener");
                this.onDone(() => {
                    this.core.unload(false);
                });

                this._config.extensionConfig = this._config.extensionConfig || {};
                this._config.extensionConfig[this.identifier].syncMode = ICfgSyncMode.Receive;
                this.core.initialize(this._config, [this._channel]);
                let targets = this.mainInst["_getDbgPlgTargets"]();
                Assert.equal(targets[0], false, "auto broadcast is off by default");
                Assert.equal(targets[1], true, "receive changes is on");
                Assert.equal(targets[2], "ai_cfgsync", "default event name is set by default");
                Assert.equal(patchEvnSpy.callCount, 0, "no event should be dispatched");
                Assert.equal(eventListenerStub.callCount, 1, "event listener is added to receive mode instance");

                this.mainInst.updateEventListenerName("test");
                targets = this.mainInst["_getDbgPlgTargets"]();
                Assert.equal(targets[2], "test", "event name should be changed");
                Assert.equal(patchEvnSpy.callCount, 0, "event dispatch shoule not be called again");
                Assert.equal(eventListenerStub.callCount, 2, "event listener is be added to receive modeinstance again");
            }
        });

        this.testCase({
            name: "CfgSyncPlugin: eventListener should be set correctly to None mode instance",
            test: () => {
                let doc = getGlobal();
                let patchEvnSpy = this.sandbox.spy(doc, "dispatchEvent");
                let global = getGlobal();
                let eventListenerStub = this.sandbox.spy(global, "addEventListener");
                this.onDone(() => {
                    this.core.unload(false);
                });

                this._config.extensionConfig = this._config.extensionConfig || {};
                this._config.extensionConfig[this.identifier].syncMode = ICfgSyncMode.None;
                this.core.initialize(this._config, [this._channel]);
                let targets = this.mainInst["_getDbgPlgTargets"]();
                Assert.equal(targets[0], false, "auto broadcast is off by default");
                Assert.equal(targets[1], false, "receive changes is off");
                Assert.equal(targets[2], "ai_cfgsync", "default event name is set by default");
                Assert.equal(patchEvnSpy.callCount, 0, "no event should be dispatched");
                Assert.equal(eventListenerStub.callCount, 0, "no event listener is added to none mode instance");

                this.mainInst.updateEventListenerName("test");
                targets = this.mainInst["_getDbgPlgTargets"]();
                Assert.equal(targets[2], "test", "event name should be changed");
                Assert.equal(patchEvnSpy.callCount, 0, "event dispatch shoule not be called again");
                Assert.equal(eventListenerStub.callCount, 0, "event listener should not be added to none mode instance again");
            }
        });

        this.testCaseAsync({
            name: "CfgSyncPlugin: should fetch from config url",
            stepDelay: 10,
            useFakeTimers: true,
            useFakeServer: true,
            steps: [ () => {
                let doc = getGlobal();
                let config = {
                    instrumentationKey:"testIkey",
                    enableAjaxPerfTracking: true
                } as IConfiguration & IConfig;
                let res = new (doc as any).Response(JSON.stringify(config), {
                    status: 200,
                    headers: { "Content-type": "application/json" }
                });
                this.onDone(() => {
                    this.core.unload(false);
                });
                hookFetch((resolve) => {
                    AITestClass.orgSetTimeout(function() {
                        resolve(res);
                    }, 0);
                });
                let patchEvnSpy = this.sandbox.spy(doc, "dispatchEvent");
                let fetchStub = this.sandbox.spy((doc as any), "fetch");
                this._config.extensionConfig  = { [this.identifier]: {
                    cfgUrl: "testURL"
                }};
                this._context["patchEvnSpy"] = patchEvnSpy;
                this._context["fetchStub"] = fetchStub;
                this.core.initialize(this._config, [this._channel]);
              
            }].concat(PollingAssert.createPollingAssert(() => {
                let fetchStub = this._context["fetchStub"];
                let patchEvnSpy = this._context["patchEvnSpy"];
                let config = {
                    instrumentationKey:"testIkey",
                    enableAjaxPerfTracking: true
                } as IConfiguration & IConfig;
                if (fetchStub.called && patchEvnSpy.called) {
                    Assert.ok(fetchStub.calledOnce, "fetch is called");
                    Assert.ok(patchEvnSpy.calledOnce, "patchEvnSpy is called");
                    let targets = this.mainInst["_getDbgPlgTargets"]();
                    Assert.equal(targets[0], true, "auto broadcast is on by default");
                    Assert.equal(targets[1], false, "receive changes is off");
                    Assert.equal(targets[2], "ai_cfgsync", "default event name is set by default");
                    let curMainCfg = this.mainInst.getCfg();
                    Assert.deepEqual(curMainCfg, config, "main config should be get from url");
                    Assert.equal(patchEvnSpy.callCount, 1, "event should be dispatched");
                    Assert.equal(fetchStub.callCount, 1, "fetch is called");
                    
                    return true;
                }
                return false;

            }, "response received", 60, 100) as any)
        });

        this.testCaseAsync({
            name: "CfgSyncPlugin: should fetch from config url at expected interval",
            stepDelay: 10,
            useFakeTimers: true,
            useFakeServer: true,
            steps: [ () => {
                let doc = getGlobal();
                let config = {
                    instrumentationKey:"testIkey",
                    enableAjaxPerfTracking: true
                } as IConfiguration & IConfig;
                this.onDone(() => {
                    this.core.unload(false);
                });
                hookFetch((resolve) => {
                    AITestClass.orgSetTimeout(function() {
                        resolve(new (doc as any).Response(JSON.stringify(config), {
                            status: 200,
                            headers: { "Content-type": "application/json" }
                        }));
                    }, 0);
                });
                let patchEvnSpy = this.sandbox.spy(doc, "dispatchEvent");
                let fetchStub = this.sandbox.spy((doc as any), "fetch");
                this._config.extensionConfig  = { [this.identifier]: {
                    cfgUrl: "testURL",
                    scheduleFetchTimeout: 1000
                }};
                this._context["patchEvnSpy"] = patchEvnSpy;
                this._context["fetchStub"] = fetchStub;
                this.core.initialize(this._config, [this._channel]);
            }].concat(PollingAssert.createPollingAssert(() => {
                let fetchStub = this._context["fetchStub"];
                let patchEvnSpy = this._context["patchEvnSpy"];
                let config = {
                    instrumentationKey:"testIkey",
                    enableAjaxPerfTracking: true
                } as IConfiguration & IConfig;
                
                if (fetchStub.called && patchEvnSpy.called && fetchStub.callCount >= 2 && patchEvnSpy.callCount >= 1) {
                    Assert.ok(patchEvnSpy.calledOnce, "patchEvnSpy is called");
                    let targets = this.mainInst["_getDbgPlgTargets"]();
                    Assert.equal(targets[0], true, "auto braodcast is on by default");
                    Assert.equal(targets[1], false, "receive changes is off");
                    Assert.equal(targets[2], "ai_cfgsync", "default event name is set by default");
                    let curMainCfg = this.mainInst.getCfg();
                    Assert.deepEqual(curMainCfg, config, "main config should be get from url");
                    Assert.ok(fetchStub.callCount >= 2, "fetch is called 2 times");
                    Assert.ok(patchEvnSpy.callCount >= 1, "event should be dispatched 1 time");
                    return true;
                }
                return false;
            }, "response received interval 1", 60, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let fetchStub = this._context["fetchStub"];
                let patchEvnSpy = this._context["patchEvnSpy"];
               
                if (fetchStub.called && patchEvnSpy.called && fetchStub.callCount >= 3 && patchEvnSpy.callCount >= 3) {
                    Assert.equal(fetchStub.callCount, 3, "fetch is called 3 times");
                    Assert.equal(patchEvnSpy.callCount, 3, "event should be dispatched 3 times");
                    return true;
                }
                return false;
            }, "response received interval 2", 60, 100 ) as any)
        });

        this.testCaseAsync({
            name: "CfgSyncPlugin: should not fetch from config url at when retry count > 2",
            stepDelay: 10,
            useFakeServer: true,
            useFakeTimers: true,
            steps: [ () => {
                let doc = getGlobal();
                this.onDone(() => {
                    this.core.unload(false);
                });
                hookFetch((resolve) => {
                    AITestClass.orgSetTimeout(function() {
                        resolve(new (doc as any).Response(JSON.stringify({}), {
                            status: 400,
                            headers: { "Content-type": "application/json" }
                        }));
                    }, 0);
                });
                let patchEvnSpy = this.sandbox.spy(doc, "dispatchEvent");
                let fetchStub = this.sandbox.spy((doc as any), "fetch");
                this._config.extensionConfig  = { [this.identifier]: {
                    cfgUrl: "testURL",
                    scheduleFetchTimeout: 1000
                }};
                this._context["patchEvnSpy"] = patchEvnSpy;
                this._context["fetchStub"] = fetchStub;
                this.core.initialize(this._config, [this._channel]);
               
            }].concat(PollingAssert.createPollingAssert(() => {
                let fetchStub = this._context["fetchStub"];
                let patchEvnSpy = this._context["patchEvnSpy"];

                if (fetchStub.called && fetchStub.callCount >= 2) {
                    Assert.ok(!patchEvnSpy.calledOnce, "patchEvnSpy should not be called");
                    let targets = this.mainInst["_getDbgPlgTargets"]();
                    Assert.equal(targets[0], true, "auto braodcast is on by default");
                    Assert.equal(targets[1], false, "receive changes is off");
                    Assert.equal(targets[2], "ai_cfgsync", "default event name is set by default");
                    let curMainCfg = this.mainInst.getCfg();
                    Assert.deepEqual(curMainCfg, null, "main config should not be set from url");
                    Assert.ok(fetchStub.callCount >= 2, "fetch is called 2 times");
                    Assert.equal(patchEvnSpy.callCount, 0, "no event should be dispatched 1 time");
                    return true;
                }
                return false;
            }, "response received", 60, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let fetchStub = this._context["fetchStub"];
                let patchEvnSpy = this._context["patchEvnSpy"];
               
                if (fetchStub.called && fetchStub.callCount >= 3) {
                    Assert.equal(fetchStub.callCount, 3, "fetch should be called 3 times");
                    Assert.equal(patchEvnSpy.callCount, 0, "event should not be dispatched again");
                    return true;
                }
                return false;
            }, "response received", 60, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let fetchStub = this._context["fetchStub"];
                let patchEvnSpy = this._context["patchEvnSpy"];
               
                if (fetchStub.called) {
                    Assert.equal(fetchStub.callCount, 3, "fetch should not be called 4 times");
                    Assert.equal(patchEvnSpy.callCount, 0, "event should not be dispatched again");
                    return true;
                }
                return false;
            }, "response received", 60, 100) as any)
        });

        this.testCase({
            name: "CfgSyncPlugin: main instance should change listeners config",
            useFakeTimers: true,
            test: () => {
                let listener = new CfgSyncPlugin();
                let core = new AppInsightsCore();
                let config = {
                    instrumentationKey: "Test-iKey123",
                    disableInstrumentationKeyValidation: false,
                    maxMessageLimit: 3001,
                    enablePerfMgr: false,
                    extensions: [listener],
                    extensionConfig: {
                        [this.identifier]: {
                            syncMode: ICfgSyncMode.Receive
                        }
                    }
                }
                let doc = getGlobal();
                let patchEvnSpy = this.sandbox.spy(doc, "dispatchEvent");
                let eventListenerStub = this.sandbox.spy(doc, "addEventListener");
                this._config.extensionConfig  = { [this.identifier]: {}};
                this.onDone(() => {
                    this.core.unload(false);
                    core.unload(false);
                });
                core.initialize(config, [this._channel]);
                this.core.initialize(this._config, [this._channel]);
                let targets = this.mainInst["_getDbgPlgTargets"]();
                Assert.equal(targets[0], true, "auto broadcast is on by default");
                Assert.equal(targets[1], false, "receive changes is off");
                Assert.equal(targets[2], "ai_cfgsync", "default event name is set by default");
                Assert.equal(patchEvnSpy.callCount, 1, "event should be dispatched");
                let curMainCfg = this.mainInst.getCfg();
                Assert.deepEqual(curMainCfg, this.core.config, "main config should be set");

                let listenerTargets = listener["_getDbgPlgTargets"]();
                Assert.equal(listenerTargets[0], false, "auto broadcast is off by default");
                Assert.equal(listenerTargets[1], true, "receive changes is true");
                Assert.equal(listenerTargets[2], "ai_cfgsync", "default event name is set by default");
                Assert.equal(patchEvnSpy.callCount, 1, "event should not be dispatched");
                Assert.equal(eventListenerStub.callCount, 1, "event listener is added");
                
                this.clock.tick(1);
                let listenerCfg = listener.getCfg();

                Assert.equal(listenerCfg.instrumentationKey, undefined, "config ikey should not be updated");
                Assert.equal(listenerCfg.maxMessageLimit, 3000, "config maxMessageLimit should be updated");
                Assert.equal(listenerCfg.enablePerfMgr, true, "config enablePerfMgr should be updated");

                Assert.equal(this.core.config.instrumentationKey, "Test-iKey", "main inst config ikey should not be updated");
                Assert.equal(this.core.config.maxMessageLimit, 3000, "main inst config maxMessageLimit should not be updated");
                Assert.equal(this.core.config.enablePerfMgr, true, "main inst config enablePerfMgr should not be updated");

            }
        });
    }
}

interface IFetchArgs {
    input: RequestInfo,
    init: RequestInit
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

