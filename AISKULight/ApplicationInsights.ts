import { IConfiguration, AppInsightsCore, IAppInsightsCore, _InternalMessageId, CoreUtils, ITelemetryItem } from "applicationinsights-core-js";
import { Sender } from "applicationinsights-channel-js";

"use strict";

export class ApplicationInsights {
    public config: IConfiguration;
    private core: IAppInsightsCore;

    constructor(config: IConfiguration) {

        // initialize the queue and config in case they are undefined
        if (CoreUtils.isNullOrUndefined(config) || CoreUtils.isNullOrUndefined(config.instrumentationKey)) {
            throw new Error("Invalid input configuration");
        }

        this.initialize();
    }

    public initialize(): void {

        this.core = new AppInsightsCore();
        let extensions = [];
        let appInsightsChannel: Sender = new Sender();

        extensions.push(appInsightsChannel);

        // initialize core
        this.core.initialize(this.config, extensions);

        // initialize extensions
        appInsightsChannel.initialize(this.config, this.core, extensions);
    }

    public track(item: ITelemetryItem) {
        this.core.track(item);
    }
}