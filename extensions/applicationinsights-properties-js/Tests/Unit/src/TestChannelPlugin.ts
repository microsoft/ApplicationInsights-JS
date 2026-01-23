import { IChannelControls, IConfiguration, ITelemetryItem, ITelemetryPlugin, ITelemetryPluginChain } from "@microsoft/otel-core-js";


export class TestChannelPlugin implements IChannelControls {

    public isFlushInvoked = false;
    public isUnloadInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;

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

    public processTelemetry;

    public identifier = "Sender";

    setNextPlugin(next: ITelemetryPlugin | ITelemetryPluginChain) {
        // no next setup
    }

    public priority: number = 1001;

    public initialize = (config: IConfiguration) => {
    }

    private _processTelemetry(env: ITelemetryItem) {

    }
}
