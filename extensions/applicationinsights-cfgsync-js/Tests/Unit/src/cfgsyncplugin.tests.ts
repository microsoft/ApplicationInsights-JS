import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { AppInsightsCore, IAppInsightsCore, IPlugin, ITelemetryItem, eventOff, eventOn, getDocument, getGlobal, getWindow } from "@microsoft/applicationinsights-core-js";
import { IConfiguration } from "@microsoft/applicationinsights-core-js";
import { CfgSyncPlugin } from "../../../../applicationinsights-cfgsync-js/src/applicationinsights-cfgsync-js";
import { NonOverrideCfg } from "../../../src/Interfaces/ICfgSyncConfig";
import { IConfig } from "@microsoft/applicationinsights-common";



export class CfgSyncPluginTests extends AITestClass {
    private core: AppInsightsCore;
    private _config: IConfiguration;
    private mainInst: CfgSyncPlugin;
    private identifier: string;
    private _channel: ChannelPlugin;

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
                    disableAutoSync: false,
                    receiveChanges: true
                }
            }
        };
        _self._channel = new ChannelPlugin();
        _self.core = new AppInsightsCore();
    }

    public testCleanup() {
        this.mainInst.teardown();
        this.core = null as any;
        this._config = null as any;
        this.mainInst = null as any;
    }

    public registerTests() {
        this.testCase({
            name: "CfgSyncPlugin: default config should be set dynamically from root",
            useFakeTimers: true,
            test: () => {
                let doc = getGlobal();
                let patchEvnSpy = this.sandbox.spy(doc, "dispatchEvent");
                this.onDone(() => {
                    this.core.unload(false);
                });
                this.core.initialize({instrumentationKey: "Test-iKey",  extensions: [this.mainInst], extensionConfig: {[this.identifier]: {}}}, [this._channel]);
                let udfVal = undefined;
                let defaultNonOverrideCfg: NonOverrideCfg = {instrumentationKey: true, connectionString: true, endpointUrl: true }
                let expectedDefaults = {
                    disableAutoSync: false,
                    customEvtName: udfVal,
                    cfgUrl: udfVal,
                    receiveChanges: false,
                    overrideSyncFunc: udfVal,
                    overrideFetchFunc: udfVal,
                    onCfgChangeReceive: udfVal,
                    nonOverrideConfigs: defaultNonOverrideCfg
                };
                this.core.config.extensionConfig = this.core.config.extensionConfig || {};
                let actualDefaults = this.core.config.extensionConfig[this.identifier];
                Assert.deepEqual(expectedDefaults, actualDefaults, "default config should be set dynamically");
                let targets = this.mainInst["_getDbgPlgTargets"]();
                Assert.equal(targets[0], true, "auto sync is on by default");
                Assert.equal(targets[1], false, "receive changes is off by default");
                Assert.equal(targets[2], "cfgsync", "default event name is set by default");
                Assert.equal(patchEvnSpy.callCount, 1, "event is dispatched for one time");

                this.core.config.extensionConfig[this.identifier].customEvtName = "test";
                this.clock.tick(1);
                targets = this.mainInst["_getDbgPlgTargets"]();
                Assert.equal(targets[2], "test", "default event name should be changed dynamically");
                Assert.equal(patchEvnSpy.callCount, 2, "event dispatch should be called again");

                this.core.config.extensionConfig[this.identifier].disableAutoSync = true;
                this.core.config.extensionConfig[this.identifier].receiveChanges = true;
              
                this.clock.tick(1);
                targets = this.mainInst["_getDbgPlgTargets"]();
                Assert.equal(targets[0], true, "auto sync should not be changed to false dynamically");
                Assert.equal(targets[1], false, "receive changes should not be changed dynamically");
                Assert.equal(patchEvnSpy.callCount, 3, "event dispatch should be called again");
            }

        });

        this.testCase({
            name: "CfgSyncPlugin: eventListener should be set correctly",
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
                Assert.equal(targets[0], true, "auto sync is on by default");
                Assert.equal(targets[1], true, "receive changes is on");
                Assert.equal(targets[2], "cfgsync", "default event name is set by default");
                Assert.equal(patchEvnSpy.callCount, 1, "event is dispatched");
                Assert.equal(eventListenerStub.callCount, 1, "event listener is added");

                this.mainInst.updateEventListenerName("test");
                targets = this.mainInst["_getDbgPlgTargets"]();
                Assert.equal(targets[2], "test", "event name should be changed");
                Assert.equal(patchEvnSpy.callCount, 1, "event dispatch shoule not be called again");
                Assert.equal(eventListenerStub.callCount, 2, "event listener is added again");
            }
        });

        this.testCase({
            name: "CfgSyncPlugin: should fetch from config url",
            useFakeTimers: true,
            test: () => {
                this._config.extensionConfig  = { [this.identifier]: {
                    cfgUrl: "testURL"
                }};
                let config = {
                    instrumentationKey:"testIkey",
                    enableAjaxPerfTracking: true
                } as IConfiguration & IConfig;
                let doc = getGlobal();
                function mockApiResponse(body = config) {
                    return new (doc as any).Response(JSON.stringify(body), {
                        status: 200,
                        headers: { "Content-type": "application/json" }
                    });
                }
                this.onDone(() => {
                    this.core.unload(false);
                });
                let patchEvnSpy = this.sandbox.spy(doc, "dispatchEvent");
                let fetchstub = this.sandbox.stub((doc as any), "fetch").returns(mockApiResponse());
                this.core.initialize(this._config, [this._channel]);
                this.clock.tick(1);
                let targets = this.mainInst["_getDbgPlgTargets"]();
                Assert.equal(targets[0], true, "auto sync is on by default");
                Assert.equal(targets[1], false, "receive changes is off");
                Assert.equal(targets[2], "cfgsync", "default event name is set by default");
                //Assert.deepEqual(targets[3], config, "main config should be get from url");
                //Assert.equal(patchEvnSpy.callCount, 1, "event should be dispatched");
                Assert.equal(fetchstub.callCount, 1, "fetch is called");

            }
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
                            disableAutoSync: true,
                            receiveChanges: true
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
                Assert.equal(targets[0], true, "auto sync is on by default");
                Assert.equal(targets[1], false, "receive changes is off");
                Assert.equal(targets[2], "cfgsync", "default event name is set by default");
                Assert.equal(patchEvnSpy.callCount, 1, "event should be dispatched");

                let listenerTargets = listener["_getDbgPlgTargets"]();
                Assert.equal(listenerTargets[0], false, "auto sync is off by default");
                Assert.equal(listenerTargets[1], true, "receive changes is true");
                Assert.equal(listenerTargets[2], "cfgsync", "default event name is set by default");
                Assert.equal(patchEvnSpy.callCount, 1, "event should not be dispatched");
                Assert.equal(eventListenerStub.callCount, 1, "event listener is added");
                
                this.clock.tick(1);

                Assert.equal(core.config.instrumentationKey, "Test-iKey123", "config ikey should not be updated");
                Assert.equal(core.config.maxMessageLimit, 3000, "config maxMessageLimit should be updated");
                Assert.equal(core.config.enablePerfMgr, true, "config enablePerfMgr should be updated");

                Assert.equal(this.core.config.instrumentationKey, "Test-iKey", "main inst config ikey should not be updated");
                Assert.equal(this.core.config.maxMessageLimit, 3000, "main inst config maxMessageLimit should not be updated");
                Assert.equal(this.core.config.enablePerfMgr, true, "main inst config enablePerfMgr should not be updated");

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


