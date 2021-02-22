/**
 * PropertiesPlugin.ts
 * @copyright Microsoft 2018
 */

import {
    BaseTelemetryPlugin, IConfiguration, isNullOrUndefined,
    IAppInsightsCore, IPlugin, ITelemetryItem, IProcessTelemetryContext, _InternalLogMessage, LoggingSeverity, _InternalMessageId, getNavigator,
    ITelemetryPluginChain, objForEachKey
} from '@microsoft/applicationinsights-core-js';
import { TelemetryContext } from './TelemetryContext';
import { PageView, ConfigurationManager,
    IConfig, BreezeChannelIdentifier, PropertiesPluginIdentifier, IPropertiesPlugin, Extensions, Util } from '@microsoft/applicationinsights-common';
import { ITelemetryConfig } from './Interfaces/ITelemetryConfig';

export default class PropertiesPlugin extends BaseTelemetryPlugin implements IPropertiesPlugin {

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
            appId: () => null,
            namePrefix: () => undefined,
            idLength: () => 22
        }
        return defaultConfig;
    }
    public context: TelemetryContext;

    public priority = 110;
    public identifier = PropertiesPluginIdentifier;
    private _breezeChannel: IPlugin; // optional. If exists, grab appId from it

    private _extensionConfig: ITelemetryConfig;

    initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) {
        super.initialize(config, core, extensions, pluginChain);
        let ctx = this._getTelCtx();
        let identifier = this.identifier;
        const defaultConfig: ITelemetryConfig = PropertiesPlugin.getDefaultConfig();
        this._extensionConfig = this._extensionConfig || PropertiesPlugin.getDefaultConfig();
        objForEachKey(defaultConfig, (field, value) => {
            this._extensionConfig[field] = () => ctx.getConfig(identifier, field, value());
        });

        this.context = new TelemetryContext(core.logger, this._extensionConfig);
        this._breezeChannel = Util.getExtension(extensions, BreezeChannelIdentifier);
        this.context.appId = () => this._breezeChannel ? this._breezeChannel["_appId"] : null;
    }

    /**
     * Add Part A fields to the event
     * @param event The event that needs to be processed
     */
    processTelemetry(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        if (isNullOrUndefined(event)) {
            // TODO(barustum): throw an internal event once we have support for internal logging
        } else {
            itemCtx = this._getTelCtx(itemCtx);
            // If the envelope is PageView, reset the internal message count so that we can send internal telemetry for the new page.
            if (event.name === PageView.envelopeType) {
                itemCtx.diagLog().resetInternalMessageCount();
            }

            if (this.context.session) {
                // If customer did not provide custom session id update the session manager
                if (typeof this.context.session.id !== "string") {
                    this.context.sessionManager.update();
                }
            }

            this._processTelemetryInternal(event, itemCtx);

            if (this.context && this.context.user && this.context.user.isNewUser) {
                this.context.user.isNewUser = false;
                const message = new _InternalLogMessage(_InternalMessageId.SendBrowserInfoOnUserInit, ((getNavigator()||{} as any).userAgent||""));
                itemCtx.diagLog().logInternalMessage(LoggingSeverity.CRITICAL, message);
            }

            this.processNext(event, itemCtx);
        }
    }

    private _processTelemetryInternal(event: ITelemetryItem, itemCtx: IProcessTelemetryContext) {
        // set part A  fields
        if (!event.tags) {
            event.tags = [];
        }

        if (!event.ext) {
            event.ext = {};
        }

        let ext = event.ext;
        ext[Extensions.DeviceExt] = ext[Extensions.DeviceExt] || {};
        ext[Extensions.WebExt] = ext[Extensions.WebExt] || {};
        ext[Extensions.UserExt] = ext[Extensions.UserExt] || {};
        ext[Extensions.OSExt] = ext[Extensions.OSExt] || {};
        ext[Extensions.AppExt] = ext[Extensions.AppExt] || {};
        ext[Extensions.TraceExt] = ext[Extensions.TraceExt] || {};

        let context = this.context;
        context.applySessionContext(event, itemCtx);
        context.applyApplicationContext(event, itemCtx);
        context.applyDeviceContext(event, itemCtx);
        context.applyOperationContext(event, itemCtx);
        context.applyUserContext(event, itemCtx);
        context.applyOperatingSystemContxt(event, itemCtx);
        context.applyWebContext(event, itemCtx);

        context.applyLocationContext(event, itemCtx); // legacy tags
        context.applyInternalContext(event, itemCtx); // legacy tags
        context.cleanUp(event, itemCtx);
    }
}