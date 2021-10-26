/**
 * @copyright Microsoft 2020
 */

import {
    IPlugin, IConfiguration, IAppInsightsCore,
    BaseTelemetryPlugin, isNullOrUndefined, ITelemetryItem,
    IProcessTelemetryContext, ITelemetryPluginChain,
    _InternalMessageId, ICustomProperties,
    LoggingSeverity, arrForEach, dumpObj, getExceptionName
} from "@microsoft/applicationinsights-core-js";
import { IConfig, IPropertiesPlugin, PropertiesPluginIdentifier } from "@microsoft/applicationinsights-common";
import {
    IClickAnalyticsConfiguration, IContentHandler,
    IAutoCaptureHandler, IPageActionTelemetry
} from "./Interfaces/Datamodel";
import {
    mergeConfig, BehaviorMapValidator,
    BehaviorValueValidator, BehaviorEnumValidator, _ExtendedInternalMessageId
    } from "./common/Utils";
import { PageAction } from "./events/PageAction";
import { AutoCaptureHandler } from "./handlers/AutoCaptureHandler";
import { DomContentHandler } from "./handlers/DomContentHandler";
import { PropertiesPlugin } from "@microsoft/applicationinsights-properties-js";
export { BehaviorMapValidator, BehaviorValueValidator, BehaviorEnumValidator }

export class ClickAnalyticsPlugin extends BaseTelemetryPlugin {
    public identifier: string = "ClickAnalyticsPlugin";
    public priority: number = 181;
    public static Version = "2.7.0";
    private _config: IClickAnalyticsConfiguration;
    private pageAction: PageAction;
    private _autoCaptureHandler: IAutoCaptureHandler;
    private _contentHandler: IContentHandler;

    initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) {
        
        if (isNullOrUndefined(core)) {
            throw Error("Error initializing");
        }
        config.extensionConfig = config.extensionConfig || [];
        config.extensionConfig[this.identifier] = config.extensionConfig[this.identifier] || {};
        this._config = mergeConfig(config.extensionConfig[this.identifier]);
        super.initialize(config, core, extensions, pluginChain);
        // Default to DOM content handler
        this._contentHandler = this._contentHandler ? this._contentHandler : new DomContentHandler(this._config, this.diagLog());
        let metaTags = this._contentHandler.getMetadata();
        this.pageAction = new PageAction(this, this._config, this._contentHandler, this._config.callback.pageActionPageTags, metaTags, this.diagLog());
        // Default to DOM autoCapture handler
        this._autoCaptureHandler = this._autoCaptureHandler ? this._autoCaptureHandler : new AutoCaptureHandler(this, this._config, this.pageAction, this.diagLog());
        if (this._config.autoCapture) {
            this._autoCaptureHandler.click();
        }
        // Find the properties plugin.
        let _propertiesExtension:IPropertiesPlugin;
        arrForEach(extensions, extension => {
            if (extension.identifier === PropertiesPluginIdentifier) {
                _propertiesExtension = extension as PropertiesPlugin;
            }
        });
        // Append Click Analytics Plugin Version to SDK version.
        if (_propertiesExtension && _propertiesExtension.context &&
            _propertiesExtension.context.internal && _propertiesExtension.context.internal.sdkVersion) {
                _propertiesExtension.context.internal.sdkVersion += "_ClickPlugin"+ ClickAnalyticsPlugin.Version;
        }
    }

    processTelemetry(env: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void {
        this.processNext(env, itemCtx);
    }

    /**
     * Logs a page action event.
     * @param IPageActionTelemetry
     * @param customProperties Additional data used to filter events and metrics. Defaults to empty.
     */
    public trackPageAction(pageAction?: IPageActionTelemetry, customProperties?: ICustomProperties) {
        try {

            this.pageAction.trackPageAction(pageAction,customProperties);

        } catch (e) {
            this.diagLog().throwInternal(
                LoggingSeverity.CRITICAL,
                _ExtendedInternalMessageId.TrackPageActionEventFailed,
                "trackPageAction failed, page action event will not be collected: " + getExceptionName(e),
                { exception: dumpObj(e) });
        }
    }
}