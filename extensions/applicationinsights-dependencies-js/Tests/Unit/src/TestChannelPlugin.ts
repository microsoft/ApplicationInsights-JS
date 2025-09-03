import { IConfiguration, IChannelControls, ITelemetryItem, ITelemetryPlugin, ITelemetryPluginChain } from "@microsoft/applicationinsights-core-js";

/**
 * TestChannelPlugin for testing - a minimal implementation of IChannelControls
 * that can be used as a mock channel in tests
 */
export class TestChannelPlugin implements IChannelControls {
    public _nextPlugin: ITelemetryPlugin;
    public version: string = "1.0.0-test";
    public processTelemetry;
    public identifier: string;
    public priority: number = 1001;

    constructor(identifier: string = "TestChannelPlugin") {
        this.identifier = identifier;
        this.processTelemetry = this._processTelemetry.bind(this);
    }
    
    public pause(): void {
        // No-op for testing
    }

    public resume(): void {
        // No-op for testing
    }

    public teardown(): void {
        // No-op for testing
    }

    flush(async?: boolean, callBack?: () => void): void {
        if (callBack) {
            callBack();
        }
    }

    onunloadFlush(async?: boolean) {
        // No-op for testing
    }

    setNextPlugin(next: ITelemetryPlugin | ITelemetryPluginChain) {
        this._nextPlugin = next as ITelemetryPlugin;
    }

    public initialize = (config: IConfiguration) => {
        // No-op for testing
    }

    public _processTelemetry(env: ITelemetryItem) {
        if (this._nextPlugin) {
            this._nextPlugin.processTelemetry(env);
        }
    }
}
