/**
 * Angular.ts
 * @copyright Microsoft 2019
 */

import {
    IConfig, IPageViewTelemetry, IMetricTelemetry, IAppInsights
} from "@microsoft/applicationinsights-common";
import {
    IPlugin, IConfiguration, IAppInsightsCore,
    ITelemetryPlugin, BaseTelemetryPlugin, CoreUtils, ITelemetryItem, ITelemetryPluginChain,
    IProcessTelemetryContext, _InternalMessageId, LoggingSeverity, ICustomProperties
} from "@microsoft/applicationinsights-core-js";
import { IAngularExtensionConfig } from './Interfaces/IAngularExtensionConfig';

export default class AngularPlugin extends BaseTelemetryPlugin {
    public priority = 186;
    public identifier = 'AngularPlugin';

    private _analyticsPlugin: IAppInsights;
    private _extConfig: IAngularExtensionConfig;

    initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) {
        super.initialize(config, core, extensions, pluginChain);
        let ctx = this._getTelCtx();
        this._extConfig = ctx.getExtCfg<IAngularExtensionConfig>(this.identifier, { router: null });
        CoreUtils.arrForEach(extensions, ext => {
            const identifier = (ext as ITelemetryPlugin).identifier;
            if (identifier === 'ApplicationInsightsAnalytics') {
                this._analyticsPlugin = (ext as any) as IAppInsights;
            }
        });
        if (this._extConfig.router) {
            this._extConfig.router.events.subscribe(event => {
                if (event.constructor.name === "NavigationEnd") {
                    // Timeout to ensure any changes to the DOM made by route changes get included in pageView telemetry
                    setTimeout(() => {
                        const pageViewTelemetry: IPageViewTelemetry = { uri: this._extConfig.router.url };
                        this.trackPageView(pageViewTelemetry);
                    }, 500);
                }
            });
            const pageViewTelemetry: IPageViewTelemetry = {
                uri: this._extConfig.router.url
            };
            this.trackPageView(pageViewTelemetry);
        }
    }

    /**
     * Add Part A fields to the event
     * @param event The event that needs to be processed
     */
    processTelemetry(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        this.processNext(event, itemCtx);
    }

    trackMetric(metric: IMetricTelemetry, customProperties: ICustomProperties) {
        if (this._analyticsPlugin) {
            this._analyticsPlugin.trackMetric(metric, customProperties);
        } else {
            this.diagLog().throwInternal(
                LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "Analytics plugin is not available, Angular plugin telemetry will not be sent: ");
        }
    }

    trackPageView(pageView: IPageViewTelemetry) {
        if (this._analyticsPlugin) {
            this._analyticsPlugin.trackPageView(pageView);
        } else {
            this.diagLog().throwInternal(
                LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "Analytics plugin is not available, Angular plugin telemetry will not be sent: ");
        }
    }
}
