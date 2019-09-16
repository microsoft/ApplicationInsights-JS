/**
 * ReactPlugin.ts
 * @copyright Microsoft 2019
 */

import {
    IConfig, IPageViewTelemetry, IMetricTelemetry, IAppInsights
} from "@microsoft/applicationinsights-common";
import {
    IPlugin, IConfiguration, IAppInsightsCore,
    ITelemetryPlugin, CoreUtils, ITelemetryItem,
    IDiagnosticLogger, _InternalMessageId, LoggingSeverity, ICustomProperties
} from "@microsoft/applicationinsights-core-js";
import { IReactExtensionConfig } from './Interfaces/IReactExtensionConfig';
import { History, LocationListener, Location, Action } from "history";

export default class ReactPlugin implements ITelemetryPlugin {
    public priority = 185;
    public identifier = 'ReactPlugin';
    private _logger: IDiagnosticLogger;

    private _analyticsPlugin: IAppInsights;
    private _nextPlugin: ITelemetryPlugin;
    private _extensionConfig: IReactExtensionConfig;

    initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[]) {
        this._extensionConfig =
            config.extensionConfig && config.extensionConfig[this.identifier]
                ? (config.extensionConfig[this.identifier] as IReactExtensionConfig)
                : { history: null };
        this._logger = core.logger;
        extensions.forEach(ext => {
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
     * Add Part A fields to the event
     * @param event The event that needs to be processed
     */
    processTelemetry(event: ITelemetryItem) {
        if (!CoreUtils.isNullOrUndefined(this._nextPlugin)) {
            this._nextPlugin.processTelemetry(event);
        }
    }

    /**
     * Sets the next plugin that comes after this plugin
     * @param nextPlugin The next plugin
     */
    setNextPlugin(nextPlugin: ITelemetryPlugin) {
        this._nextPlugin = nextPlugin;
    }


    trackMetric(metric: IMetricTelemetry, customProperties: ICustomProperties) {
        if (this._analyticsPlugin) {
            this._analyticsPlugin.trackMetric(metric, customProperties);
        } else {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "Analytics plugin is not available, React plugin telemetry will not be sent: ");
        }
    }

    trackPageView(pageView: IPageViewTelemetry) {
        if (this._analyticsPlugin) {
            this._analyticsPlugin.trackPageView(pageView);
        } else {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "Analytics plugin is not available, React plugin telemetry will not be sent: ");
        }
    }

    private addHistoryListener(history: History): void {
        const locationListener: LocationListener = (location: Location, action: Action): void => {
            // Timeout to ensure any changes to the DOM made by route changes get included in pageView telemetry
            setTimeout(() => {
                const pageViewTelemetry: IPageViewTelemetry = { uri: location.pathname };
                this.trackPageView(pageViewTelemetry);
            }, 500);
        };
        history.listen(locationListener);
    }
}
