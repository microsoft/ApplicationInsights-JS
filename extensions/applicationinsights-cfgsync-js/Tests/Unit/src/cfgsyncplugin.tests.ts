import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { AppInsightsCore, IAppInsightsCore, IPlugin, ITelemetryItem, eventOff, eventOn, getDocument, getGlobal } from "@microsoft/applicationinsights-core-js";
import { IConfiguration } from "@microsoft/applicationinsights-core-js";
import { CfgSyncPlugin } from "../../../../applicationinsights-cfgsync-js/src/applicationinsights-cfgsync-js";



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
                this.core.initialize({instrumentationKey: "Test-iKey",  extensions: [this.mainInst], extensionConfig: {[this.identifier]: {}}}, [this._channel]);
                let udfVal = undefined;
                let expectedDefaults = {
                    disableAutoSync: false,
                    customEvtName: udfVal,
                    cfgUrl: udfVal,
                    receiveChanges: false,
                    overrideSyncFunc: udfVal,
                    overrideFetchFunc: udfVal,
                    onCfgChangeReceive: udfVal,
                    nonOverrideConfigs:["instrumentationKey", "connectionString", "endpointUrl"]
                };
                this.core.config.extensionConfig = this.core.config.extensionConfig || {};
                let actualDefaults = this.core.config.extensionConfig[this.identifier];
                Assert.deepEqual(expectedDefaults, actualDefaults, "default config should be set dynamically");
                let targets = this.mainInst["_getDbgPlgTargets"]();
                Assert.equal(targets[0], true, "auto sync is on by default");
                Assert.equal(targets[1], false, "receive changes is off by default");
                Assert.equal(targets[2], "cfgsync", "default event name is set by default");
                Assert.equal(patchEvnSpy.callCount, 1, "event is dispatched for one time");

                this.core.config.extensionConfig[this.identifier].disableAutoSync = true;
                this.core.config.extensionConfig[this.identifier].receiveChanges = true;
                this.core.config.extensionConfig[this.identifier].customEvtName = "test";
                this.clock.tick(1);
                targets = this.mainInst["_getDbgPlgTargets"]();
                Assert.equal(targets[0], false, "auto sync is changed to false dynamically");
                Assert.equal(targets[1], false, "receive changes should not be changed dynamically");
                Assert.equal(targets[2], "test", "default event name should be changed dynamically");
                Assert.equal(patchEvnSpy.callCount, 1, "event is dispatched should not be called again");
                
                
            }

        });

        this.testCase({
            name: "CfgSyncPlugin: eventListener should be set correctly",
            test: () => {
                // let doc = getGlobal();
                // let patchEvnSpy = this.sandbox.spy(doc, "dispatchEvent");
                // //let global = getGlobal();
                // //let eventListenerStub = this.sandbox.spy(global, "addEventListener");
                // this.core.initialize(this._config, [this._channel]);
                // let targets = this.mainInst["_getDbgPlgTargets"]();
                // Assert.equal(targets[0], true, "auto sync is on by default");
                // Assert.equal(targets[1], true, "receive changes is on");
                // Assert.equal(targets[2], "cfgsync", "default event name is set by default");
                // Assert.equal(patchEvnSpy.callCount, 1, "event is dispatched");
                //Assert.equal(eventListenerStub.callCount, 1, "event listener is added");

                // this.mainInst.updateEventListenerName("test");
                // targets = this.mainInst["_getDbgPlgTargets"]();
                // Assert.equal(targets[2], "test", "event name should be changed");

            }
        });

        this.testCase({
            name: "CfgSyncPlugin: should fetch from config url",
            test: () => {
                this._config.extensionConfig  = { [this.identifier]: {
                    cfgUrl: "testURL"
                }}
                let doc = getGlobal();
                let patchEvnSpy = this.sandbox.spy(doc, "dispatchEvent");
                //let global = getGlobal();
                //let eventListenerStub = this.sandbox.spy(global, "addEventListener");
                this.core.initialize(this._config, [this._channel]);
                let targets = this.mainInst["_getDbgPlgTargets"]();
                Assert.equal(targets[0], true, "auto sync is on by default");
                Assert.equal(targets[1], false, "receive changes is off");
                Assert.equal(targets[2], "cfgsync", "default event name is set by default");
                Assert.equal(patchEvnSpy.callCount, 0, "event should not be dispatched");
                //Assert.equal(eventListenerStub.callCount, 1, "event listener is added");

            }
        });

        this.testCase({
            name: "CfgSyncPlugin: main instance should change listeners config",
            useFakeTimers: true,
            test: () => {
                // let listener = new CfgSyncPlugin();
                // let core = new AppInsightsCore();
                // let config = {
                //     instrumentationKey: "Test-iKey123",
                //     disableInstrumentationKeyValidation: false,
                //     maxMessageLimit: 3001,
                //     enablePerfMgr: false,
                //     extensions: [listener],
                //     extensionConfig: {
                //         [this.identifier]: {
                //             disableAutoSync: false,
                //             receiveChanges: true
                //         }
                //     }
                // }
                // let doc = getGlobal();
                // let patchEvnSpy = this.sandbox.spy(doc, "dispatchEvent");
                // this._config.extensionConfig  = { [this.identifier]: {}};
                // core.initialize(config, [this._channel]);
                // this.core.initialize(this._config, [this._channel]);
                // let targets = this.mainInst["_getDbgPlgTargets"]();
                // Assert.equal(targets[0], true, "auto sync is on by default");
                // Assert.equal(targets[1], false, "receive changes is off");
                // Assert.equal(targets[2], "cfgsync", "default event name is set by default");
                // Assert.equal(patchEvnSpy.callCount, 2, "event should be dispatched");

                // let listenerTargets = listener["_getDbgPlgTargets"]();
                // Assert.equal(listenerTargets[0], true, "auto sync is on by default");
                // Assert.equal(listenerTargets[1], true, "receive changes is true");
                // Assert.equal(listenerTargets[2], "cfgsync", "default event name is set by default");
                // Assert.equal(patchEvnSpy.callCount, 2, "event should not be dispatched");
                // this.clock.tick(1 );

                //Assert.equal(core.config.instrumentationKey, "Test-iKey", "config should be updated");

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


