/**
 * Angular.ts
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
import { IAngularExtensionConfig } from './Interfaces/IAngularExtensionConfig';

export default class AngularPlugin implements ITelemetryPlugin {
    public priority = 186;
    public identifier = 'AngularPlugin';

    private _logger: IDiagnosticLogger;
    private _analyticsPlugin: IAppInsights;
    private _nextPlugin: ITelemetryPlugin;
    private _extensionConfig: IAngularExtensionConfig;

    initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[]) {
        this._extensionConfig =
            config.extensionConfig && config.extensionConfig[this.identifier]
                ? (config.extensionConfig[this.identifier] as IAngularExtensionConfig)
                : { router: null };
        this._logger = core.logger;
        extensions.forEach(ext => {
            const identifier = (ext as ITelemetryPlugin).identifier;
            if (identifier === 'ApplicationInsightsAnalytics') {
                this._analyticsPlugin = (ext as any) as IAppInsights;
            }
        });
        if (this._extensionConfig.router) {
            this._extensionConfig.router.events.subscribe(event => {
                if (event.constructor.name === "NavigationEnd") {
                    // Timeout to ensure any changes to the DOM made by route changes get included in pageView telemetry
                    setTimeout(() => {
                        const pageViewTelemetry: IPageViewTelemetry = { uri: this._extensionConfig.router.url };
                        this.trackPageView(pageViewTelemetry);
                    }, 500);
                }
            });
            const pageViewTelemetry: IPageViewTelemetry = {
                uri: this._extensionConfig.router.url
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
                LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "Analytics plugin is not available, Angular plugin telemetry will not be sent: ");
        }
    }

    trackPageView(pageView: IPageViewTelemetry) {
        if (this._analyticsPlugin) {
            this._analyticsPlugin.trackPageView(pageView);
        } else {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "Analytics plugin is not available, Angular plugin telemetry will not be sent: ");
        }
    }
}
