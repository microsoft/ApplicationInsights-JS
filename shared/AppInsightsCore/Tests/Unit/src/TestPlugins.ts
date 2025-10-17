import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { _eInternalMessageId } from "@microsoft/applicationinsights-common";
import { ITelemetryItem } from "@microsoft/applicationinsights-common";
import { IProcessTelemetryContext, IProcessTelemetryUpdateContext } from "@microsoft/applicationinsights-common";
import { TelemetryUpdateReason } from "@microsoft/applicationinsights-common";
import { IConfiguration } from "@microsoft/applicationinsights-common";
import { IPlugin, ITelemetryPlugin } from "@microsoft/applicationinsights-common";
import { IAppInsightsCore } from "@microsoft/applicationinsights-common";
import { ITelemetryPluginChain } from "@microsoft/applicationinsights-common";
import { ITelemetryUpdateState } from "@microsoft/applicationinsights-common";
import { IChannelControls } from "@microsoft/applicationinsights-common";
import { BaseTelemetryPlugin } from "../../../src/applicationinsights-core-js";


export class TestPlugin implements IPlugin {
    public identifier: string = "TestPlugin";
    public version: string = "1.0.31-Beta";

    public _config: IConfiguration;

    public initialize(config: IConfiguration) {
        this._config = config;
        // do custom one time initialization
    }
}

export class TrackPlugin extends BaseTelemetryPlugin {
    public identifier: string = "TrackPlugin";
    public version: string = "1.0.31-Beta";
    public priority = 2;
    public isInitialized: any;
    public _config: IConfiguration;
    public index: number = 0;

    public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) {
        super.initialize(config, core, extensions, pluginChain)
        this._config = config;
        core.track({ name: 'TestEvent1' });
    }

    public processTelemetry(evt: ITelemetryItem, itemCtx: IProcessTelemetryContext) {
        let data = evt.data = (evt.data || {});
        data.trackPlugin = this.index++;
        itemCtx.processNext(evt);
    }

    protected _doUpdate = (updateCtx?: IProcessTelemetryUpdateContext, updateState?: ITelemetryUpdateState, asyncCallback?: () => void) => {
        if (updateState.reason & TelemetryUpdateReason.ConfigurationChanged) {
            this._config = updateState.cfg;
        }
    }
}

export class OldTrackPlugin implements ITelemetryPlugin {
    public identifier: string = "OldTrackPlugin";
    public priority = 2;
    public isInitialized: any;
    public _config: IConfiguration;
    public index: number = 0;

    public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) {
        this._config = config;
        core.track({ name: 'TestEvent1' });
    }

    public processTelemetry(evt: ITelemetryItem, itemCtx: IProcessTelemetryContext) {
        let data = evt.data = (evt.data || {});
        data.trackPlugin = this.index++;
        itemCtx.processNext(evt);
    }
}

/**
 * Test plugin doesn't implement the teardown "unload" function
 */
export class TestSamplingPlugin implements ITelemetryPlugin {
    public processTelemetry: (env: ITelemetryItem) => void;
    public initialize: (config: IConfiguration) => void;
    public identifier: string = "AzureSamplingPlugin";
    /** @deprecated - Use processNext() function of the passed IProcessTelemetryContext instead */
    public setNextPlugin?: (next: ITelemetryPlugin) => void;
    public priority: number = 5;
    public version = "1.0.31-Beta";
    public nextPlugin: ITelemetryPlugin;
    public isSampledOut: boolean = false;
    public teardownCalled: boolean = false;
    public _updatedConfig: IConfiguration;
    private _validateItem = false;

    constructor(validateItem: boolean = false) {
        this.processTelemetry = this._processTelemetry.bind(this);
        this.initialize = this._start.bind(this);
        this.setNextPlugin = this._setNextPlugin.bind(this);
        this._validateItem = validateItem;
    }

    public teardown() {
        this.teardownCalled = true;
    }

    public update(updateCtx: IProcessTelemetryUpdateContext, updateState: ITelemetryUpdateState) {
        if (updateState.reason & TelemetryUpdateReason.ConfigurationChanged) {
            this._updatedConfig = updateState.cfg;
        }
    }

    private _processTelemetry(env: ITelemetryItem) {
        if (!env) {
            throw Error("Invalid telemetry object");
        }

        if (this._validateItem) {
            Assert.ok(env.baseData);
            Assert.ok(env.baseType);
            Assert.ok(env.data);
            Assert.ok(env.ext);
            Assert.ok(env.tags);
        }

        let data = env.data = (env.data || {});
        data.sampled = true;

        if (!this.isSampledOut) {
            this.nextPlugin?.processTelemetry(env);
        }
    }

    private _start(config: IConfiguration) {
        if (!config) {
            throw Error("required configuration missing");
        }

        const pluginConfig = config.extensions ? config.extensions[this.identifier] : null;
        this.isSampledOut = pluginConfig ? pluginConfig.isSampledOut : false;
    }

    private _setNextPlugin(next: ITelemetryPlugin): void {
        this.nextPlugin = next;
    }
}

export class TestChannelPlugin implements IChannelControls {
    public _nextPlugin: ITelemetryPlugin;
    public isFlushInvoked = false;
    public isUnloadInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;
    public version: string = "1.0.33-Beta";

    public processTelemetry;

    public identifier = "TestSender";

    public priority: number = 1001;
    public events: ITelemetryItem[] = [];

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

    onunloadFlush(async?: boolean) {
        this.isUnloadInvoked = true;
    }

    setNextPlugin(next: ITelemetryPlugin) {
        this._nextPlugin = next;
    }

    public initialize = (config: IConfiguration) => {
    }

    public _processTelemetry(env: ITelemetryItem) {
        this.events.push(env);

        // Just calling processTelemetry as this is the original design of the Plugins (as opposed to the newer processNext())
        this._nextPlugin?.processTelemetry(env);
    }
}
