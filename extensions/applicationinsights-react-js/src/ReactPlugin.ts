/**
 * ReactPlugin.ts
 * @copyright Microsoft 2019
 */

import {
    IConfig, IPageViewTelemetry, IMetricTelemetry, IAppInsights, IEventTelemetry, IExceptionTelemetry, ITraceTelemetry
} from "@microsoft/applicationinsights-common";
import {
    IPlugin, IConfiguration, IAppInsightsCore, IDiagnosticLogger,
    ITelemetryPlugin, BaseTelemetryPlugin, ITelemetryItem, IProcessTelemetryContext,
    ITelemetryPluginChain, _InternalMessageId, LoggingSeverity, ICustomProperties, safeGetCookieMgr, ICookieMgr, arrForEach
} from "@microsoft/applicationinsights-core-js";
import { IReactExtensionConfig } from './Interfaces/IReactExtensionConfig';
import { History, Location, Action, Update } from "history";

export default class ReactPlugin extends BaseTelemetryPlugin {
    public priority = 185;
    public identifier = 'ReactPlugin';

    private _analyticsPlugin: IAppInsights;
    private _extensionConfig: IReactExtensionConfig;

    initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) {
        super.initialize(config, core, extensions, pluginChain);
        this._extensionConfig =
            config.extensionConfig && config.extensionConfig[this.identifier]
                ? (config.extensionConfig[this.identifier] as IReactExtensionConfig)
                : { history: null };

        arrForEach(extensions, ext => {
            const identifier = (ext as ITelemetryPlugin).identifier;
            if (identifier === 'ApplicationInsightsAnalytics') {
                this._analyticsPlugin = (ext as any) as IAppInsights;
            }
        });
        if (this._extensionConfig.history) {
            this.addHistoryListener(this._extensionConfig.history);
            const pageViewTelemetry: IPageViewTelemetry = {
                uri: this._extensionConfig.history.location.pathname
            };
            this.trackPageView(pageViewTelemetry);
        }
    }

    /**
     * Get the current cookie manager for this instance
     */
    getCookieMgr(): ICookieMgr {
        return safeGetCookieMgr(this.core);
    }

    /**
     * Get application insights instance.
     */
    getAppInsights(): IAppInsights {
        return this._analyticsPlugin;
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
                LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "Analytics plugin is not available, React plugin telemetry will not be sent: ");
        }
    }

    trackPageView(pageView: IPageViewTelemetry) {
        if (this._analyticsPlugin) {
            this._analyticsPlugin.trackPageView(pageView);
        } else {
            this.diagLog().throwInternal(
                LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "Analytics plugin is not available, React plugin telemetry will not be sent: ");
        }
    }

    trackEvent(event: IEventTelemetry, customProperties?: ICustomProperties) {
        if (this._analyticsPlugin) {
            this._analyticsPlugin.trackEvent(event, customProperties);
        } else {
            this.diagLog().throwInternal(
                LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "Analytics plugin is not available, React plugin telemetry will not be sent: ");
        }
    }

    trackException(exception: IExceptionTelemetry, customProperties?: {
        [key: string]: any;
    }) {
        if (this._analyticsPlugin) {
            this._analyticsPlugin.trackException(exception, customProperties);
        } else {
            this.diagLog().throwInternal(
                LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "Analytics plugin is not available, React plugin telemetry will not be sent: ");
        }
    }

    trackTrace(trace: ITraceTelemetry, customProperties?: {
        [key: string]: any;
    }) {
        if (this._analyticsPlugin) {
            this._analyticsPlugin.trackTrace(trace, customProperties);
        } else {
            this.diagLog().throwInternal(
                LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "Analytics plugin is not available, React plugin telemetry will not be sent: ");
        }
    }


    private addHistoryListener(history: History): void {
        const locationListener = (arg: Location | Update): void => {
            // v4 of the history API passes "location" as the first argument, while v5 passes an object that contains location and action 
            let locn: Location = null;
            if ("location" in arg) {
                // Looks like v5
                locn = arg["location"];
            } else {
                locn = arg as Location;
            }

            // Timeout to ensure any changes to the DOM made by route changes get included in pageView telemetry
            setTimeout(() => {
                const pageViewTelemetry: IPageViewTelemetry = { uri: locn.pathname };
                this.trackPageView(pageViewTelemetry);
            }, 500);
        };
        history.listen(locationListener);
    }
}
