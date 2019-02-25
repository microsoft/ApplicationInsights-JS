/**
 * PropertiesPlugin.ts
 * @copyright Microsoft 2018
 */

import {
    ITelemetryPlugin, IConfiguration, CoreUtils,
    IAppInsightsCore, IPlugin, ITelemetryItem, IDiagnosticLogger
} from '@microsoft/applicationinsights-core-js';
import { TelemetryContext } from './TelemetryContext';
import { PageView, ConfigurationManager,
    IConfig, PropertiesPluginIdentifier, IPropertiesPlugin, Extensions } from '@microsoft/applicationinsights-common';
import { ITelemetryConfig } from './Interfaces/ITelemetryConfig';

export default class PropertiesPlugin implements ITelemetryPlugin, IPropertiesPlugin {
    public context: TelemetryContext;
    private _logger: IDiagnosticLogger;
    
    public priority = 170;
    public identifier = PropertiesPluginIdentifier;

    private _nextPlugin: ITelemetryPlugin;
    private _extensionConfig: ITelemetryConfig;

    public static getDefaultConfig(): ITelemetryConfig {
        const defaultConfig: ITelemetryConfig = {
            instrumentationKey: () => undefined,
            accountId: () => null,
            sessionRenewalMs: () => 30 * 60 * 1000,
            samplingPercentage: () => 100,
            sessionExpirationMs: () => 24 * 60 * 60 * 1000,
            cookieDomain: () => null,
            sdkExtension: () => null,
            isBrowserLinkTrackingEnabled: () => false,
            appId: () => null
        }
        return defaultConfig;
    }

    initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[]) {
        const defaultConfig: ITelemetryConfig = PropertiesPlugin.getDefaultConfig();
        this._extensionConfig = this._extensionConfig || PropertiesPlugin.getDefaultConfig();
        for (let field in defaultConfig) {
            this._extensionConfig[field] = () => ConfigurationManager.getConfig(config, field, this.identifier, defaultConfig[field]());
        }

        this._logger = core.logger;
        this.context = new TelemetryContext(core.logger, this._extensionConfig);
    }

    /**
     * Add Part A fields to the event
     * @param event The event that needs to be processed
     */
    processTelemetry(event: ITelemetryItem) {
        if (CoreUtils.isNullOrUndefined(event)) {
            // TODO(barustum): throw an internal event once we have support for internal logging
        } else {
            // if the event is not sampled in, do not bother going through the pipeline
            if (this.context.sample.isSampledIn(event)) {
                // If the envelope is PageView, reset the internal message count so that we can send internal telemetry for the new page.
                if (event.name === PageView.envelopeType) {
                    this._logger.resetInternalMessageCount();
                }

                if (this.context.session) {
                    // If customer did not provide custom session id update the session manager
                    if (typeof this.context.session.id !== "string") {
                        this.context.sessionManager.update();
                    }
                }

                this._processTelemetryInternal(event);
            }

            if (!CoreUtils.isNullOrUndefined(this._nextPlugin)) {
                this._nextPlugin.processTelemetry(event);
            }
        }
    }

    /**
     * Sets the next plugin that comes after this plugin
     * @param nextPlugin The next plugin
     */
    setNextPlugin(nextPlugin: ITelemetryPlugin) {
        this._nextPlugin = nextPlugin;
    }

    private _processTelemetryInternal(event: ITelemetryItem) {

        
        this.context.applySessionContext(event);
        // set part A  fields
        if (!event.tags) {
            event.tags = [];
        }

        if (!event.ext) {
            event.ext = {};
        }
        event.ext[Extensions.DeviceExt] = {};
        event.ext[Extensions.IngestExt] = {};
        event.ext[Extensions.WebExt] = {};
        event.ext[Extensions.UserExt] = {};
        event.ext[Extensions.OSExt] = {};
        event.ext[Extensions.AppExt] = {};
        event.ext[Extensions.TraceExt] = {};

        this.context.applyApplicationContext(event);
        this.context.applyDeviceContext(event);
        this.context.applyInternalContext(event);
        this.context.applyLocationContext(event);
        this.context.applySampleContext(event);
        this.context.applyOperationContext(event);
        this.context.applyUserContext(event);
        this.context.cleanUp(event);
    }
}