/**
 * Angular.ts
 * @copyright Microsoft 2019
 */

import {
    IConfig, IPageViewTelemetry, IMetricTelemetry, IAppInsights, PropertiesPluginIdentifier, Util
} from "@microsoft/applicationinsights-common";
import {
    IPlugin, IConfiguration, IAppInsightsCore,
    ITelemetryPlugin, BaseTelemetryPlugin, CoreUtils, ITelemetryItem, ITelemetryPluginChain,
    IProcessTelemetryContext, _InternalMessageId, LoggingSeverity, ICustomProperties, getLocation
} from "@microsoft/applicationinsights-core-js";
import { IAngularExtensionConfig } from './Interfaces/IAngularExtensionConfig';
// For types only
import * as properties from "@microsoft/applicationinsights-properties-js";

const NAVIGATIONEND = "NavigationEnd";

export default class AngularPlugin extends BaseTelemetryPlugin {
    public priority = 186;
    public identifier = 'AngularPlugin';

    private _analyticsPlugin: IAppInsights;
    private _propertiesPlugin: properties.PropertiesPlugin;

    initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) {
        super.initialize(config, core, extensions, pluginChain);
        let ctx = this._getTelCtx();
        let extConfig = ctx.getExtCfg<IAngularExtensionConfig>(this.identifier, { router: null });
        CoreUtils.arrForEach(extensions, ext => {
            const identifier = (ext as ITelemetryPlugin).identifier;
            if (identifier === 'ApplicationInsightsAnalytics') {
                this._analyticsPlugin = (ext as any) as IAppInsights;
            }
            if (identifier === PropertiesPluginIdentifier) {
                this._propertiesPlugin = (ext as any) as properties.PropertiesPlugin;
            }
        });
        if (extConfig.router) {
            let isPageInitialLoad = true;
            if (isPageInitialLoad) {
                const pageViewTelemetry: IPageViewTelemetry = {
                    uri: extConfig.router.url
                };
                this.trackPageView(pageViewTelemetry);
            }
            extConfig.router.events.subscribe(event => {
                if (event.constructor.name === NAVIGATIONEND) {
                    // for page initial load, do not call trackPageView twice
                    if (isPageInitialLoad) {
                        isPageInitialLoad = false;
                        return;
                    }
                    const pageViewTelemetry: IPageViewTelemetry = { uri: extConfig.router.url };
                    this.trackPageView(pageViewTelemetry);
                }
            });
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
            const location = getLocation();
            if (this._propertiesPlugin && this._propertiesPlugin.context && this._propertiesPlugin.context.telemetryTrace) {
                this._propertiesPlugin.context.telemetryTrace.traceID = Util.generateW3CId();
                this._propertiesPlugin.context.telemetryTrace.name = location && location.pathname || "_unknown_";
            }
            this._analyticsPlugin.trackPageView(pageView);
        } else {
            this.diagLog().throwInternal(
                LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "Analytics plugin is not available, Angular plugin telemetry will not be sent: ");
        }
    }
}
