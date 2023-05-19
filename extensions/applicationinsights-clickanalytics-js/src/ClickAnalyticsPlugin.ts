/**
* @copyright Microsoft 2020
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import { IConfig, IPropertiesPlugin, PropertiesPluginIdentifier } from "@microsoft/applicationinsights-common";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IConfiguration, ICustomProperties, IPlugin, IProcessTelemetryContext,
    IProcessTelemetryUnloadContext, ITelemetryItem, ITelemetryPluginChain, ITelemetryUnloadState, _eInternalMessageId, _throwInternal,
    arrForEach, dumpObj, eLoggingSeverity, getExceptionName, isNullOrUndefined, strTrim, throwError, unloadComponents
} from "@microsoft/applicationinsights-core-js";
import { PropertiesPlugin } from "@microsoft/applicationinsights-properties-js";
import { IAutoCaptureHandler, IClickAnalyticsConfiguration, IContentHandler, IPageActionTelemetry } from "./Interfaces/Datamodel";
import { BehaviorEnumValidator, BehaviorMapValidator, BehaviorValueValidator, mergeConfig } from "./common/Utils";
import { PageAction } from "./events/PageAction";
import { AutoCaptureHandler } from "./handlers/AutoCaptureHandler";
import { DomContentHandler } from "./handlers/DomContentHandler";

export { BehaviorMapValidator, BehaviorValueValidator, BehaviorEnumValidator }

export class ClickAnalyticsPlugin extends BaseTelemetryPlugin {
    public identifier: string = "ClickAnalyticsPlugin";
    public priority: number = 181;
    public static Version = "#version#";

    constructor() {
        super();

        let _config: IClickAnalyticsConfiguration;
        let _pageAction: PageAction;
        let _autoCaptureHandler: IAutoCaptureHandler;
        let _contentHandler: IContentHandler;

        dynamicProto(ClickAnalyticsPlugin, this, (_self, _base) => {
            let _identifier = _self.identifier;
            _initDefaults();

            _self.initialize = (config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) => {

                if (isNullOrUndefined(core)) {
                    throwError("Error initializing");
                }

                config.extensionConfig = config.extensionConfig || [];
                config.extensionConfig[_identifier] = config.extensionConfig[_identifier] || {};
                _config = mergeConfig(config.extensionConfig[_identifier]);
                super.initialize(config, core, extensions, pluginChain);
                let logger = _self.diagLog();

                // Default to DOM content handler
                _contentHandler = _contentHandler ? _contentHandler : new DomContentHandler(_config, logger);
                let metaTags = _contentHandler.getMetadata();
                _pageAction = new PageAction(_self, _config, _contentHandler, _config.callback.pageActionPageTags, metaTags, logger);

                // Default to DOM autoCapture handler
                _autoCaptureHandler = _autoCaptureHandler ? _autoCaptureHandler : new AutoCaptureHandler(_self, _config, _pageAction, logger);
                if (_config.autoCapture) {
                    _autoCaptureHandler.click();
                }

                // Find the properties plugin.
                let _propertiesExtension:IPropertiesPlugin;
                arrForEach(extensions, extension => {
                    if (extension.identifier === PropertiesPluginIdentifier) {
                        _propertiesExtension = extension as PropertiesPlugin;
                    }
                });
                // Append Click Analytics Plugin Version to SDK version.
                if (_propertiesExtension && _propertiesExtension.context && _propertiesExtension.context.internal) {
                    let theVersion = _propertiesExtension.context.internal.sdkVersion;
                    if (theVersion) {
                        theVersion += "_ClickPlugin"+ ClickAnalyticsPlugin.Version;
                        if (theVersion.length > 64) {
                            theVersion = strTrim(theVersion.substring(0, 64));
                        }

                        _propertiesExtension.context.internal.sdkVersion = theVersion;
                    }
                }
            }
        
            _self.processTelemetry = (env: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void => {
                _self.processNext(env, itemCtx);
            };
        
            _self.trackPageAction = (pageAction?: IPageActionTelemetry, customProperties?: ICustomProperties) => {
                try {
                    _pageAction.trackPageAction(pageAction, customProperties);
                } catch (e) {
                    _throwInternal(
                        _self.diagLog(),
                        eLoggingSeverity.CRITICAL,
                        _eInternalMessageId.TrackPageActionEventFailed,
                        "trackPageAction failed, page action event will not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState, asyncCallback?: () => void): void | boolean => {
                return unloadComponents([
                    _autoCaptureHandler,
                    _contentHandler,
                    _pageAction
                ], unloadCtx, unloadState, () => {
                    _initDefaults();
                    asyncCallback && asyncCallback();
                })
            };
        });

        function _initDefaults() {
            _config = null;
            _pageAction = null;
            _autoCaptureHandler = null;
            _contentHandler = null;
        }
    }

    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public processTelemetry(env: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Logs a page action event.
     * @param IPageActionTelemetry
     * @param customProperties Additional data used to filter events and metrics. Defaults to empty.
     */
    public trackPageAction(pageAction?: IPageActionTelemetry, customProperties?: ICustomProperties) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
