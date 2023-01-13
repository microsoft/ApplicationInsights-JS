/**
* @copyright Microsoft 2020
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import { IConfig, IPropertiesPlugin, PropertiesPluginIdentifier } from "@microsoft/applicationinsights-common";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IConfigDefaults, IConfiguration, ICustomProperties, IPlugin, IProcessTelemetryContext,
    IProcessTelemetryUnloadContext, ITelemetryItem, ITelemetryPluginChain, ITelemetryUnloadState, _eInternalMessageId, _throwInternal,
    arrForEach, createProcessTelemetryContext, dumpObj, eLoggingSeverity, getExceptionName, isNullOrUndefined, onConfigChange, throwError,
    unloadComponents
} from "@microsoft/applicationinsights-core-js";
import { PropertiesPlugin } from "@microsoft/applicationinsights-properties-js";
import { hasDocument, isObject, objDeepFreeze, objDefineProp, objForEachKey } from "@nevware21/ts-utils";
import {
    IAutoCaptureHandler, IClickAnalyticsConfiguration, IContentHandler, ICoreData, ICustomDataTags, IPageActionTelemetry
} from "./Interfaces/Datamodel";
import {
    BehaviorEnumValidator, BehaviorMapValidator, BehaviorValueValidator, DEFAULT_AI_BLOB_ATTRIBUTE_TAG, DEFAULT_DATA_PREFIX,
    DEFAULT_DONOT_TRACK_TAG
} from "./common/Utils";
import { PageAction } from "./events/PageAction";
import { AutoCaptureHandler } from "./handlers/AutoCaptureHandler";
import { DomContentHandler } from "./handlers/DomContentHandler";

export { BehaviorMapValidator, BehaviorValueValidator, BehaviorEnumValidator }

const dataTagsDefault = {
    useDefaultContentNameOrId: false,
    aiBlobAttributeTag: DEFAULT_AI_BLOB_ATTRIBUTE_TAG,
    customDataPrefix: DEFAULT_DATA_PREFIX,
    captureAllMetaDataContent: false,
    dntDataTag: DEFAULT_DONOT_TRACK_TAG,
    metaDataPrefix: "",
    parentDataTag: ""
} as ICustomDataTags;

const coreDataDefault = {
    eferrerUri: hasDocument ? document.referrer : "",
    requestUri: "",
    pageName: "",
    pageType: ""
} as ICoreData;

const defaultValues: IConfigDefaults<IClickAnalyticsConfiguration> = objDeepFreeze({
    autoCapture: true,
    callback: {
        pageActionPageTags: null,
        pageName: null,
        contentName: null
    },
    pageTags: {},
    coreData: {set:_setProp, v:coreDataDefault},
    dataTags: {set: _setProp, v: dataTagsDefault},
    behaviorValidator: (key:string) => key || "",
    defaultRightClickBhvr: "",
    dropInvalidEvents : false,
    urlCollectHash: false,
    urlCollectQuery: false
});

function _setProp(val: Object, def: Object): Object {
    if (def && isObject(def)) {
        objForEachKey(def, (key, obj) => {
            val[key] = val[key] || obj;
            if (key === "customDataPrefix") {
                let prefix = val[key];
                val[key] = prefix && prefix.indexOf(DEFAULT_DATA_PREFIX) === 0? prefix : DEFAULT_DATA_PREFIX;
            }
        });
    }
    return val;
}

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
        let _autoCapture: boolean;

        dynamicProto(ClickAnalyticsPlugin, this, (_self, _base) => {
            let _identifier = _self.identifier;
            _initDefaults();

            _self.initialize = (config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) => {

                if (isNullOrUndefined(core)) {
                    throwError("Error initializing");
                }

                super.initialize(config, core, extensions, pluginChain);
                _populateDefaults(config);

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

            function _populateDefaults(config: IConfiguration) {
                let core = _self.core;

                _self._addHook(onConfigChange(config, (details) => {
                    let config = details.cfg;
                    let ctx = createProcessTelemetryContext(null, config, core);
                    let _config = ctx.getExtCfg(_identifier, defaultValues);

                    let logger = _self.diagLog();
                    _contentHandler = new DomContentHandler(_config, logger);
                    let metaTags = _contentHandler.getMetadata();
                    _pageAction = new PageAction(this, _config, _contentHandler, _config.callback.pageActionPageTags, metaTags, logger);
    
                    // Default to DOM autoCapture handler
                    if (_autoCaptureHandler) {
                        _autoCaptureHandler._doUnload();
                    }
                    _autoCaptureHandler = new AutoCaptureHandler(_self, _config, _pageAction, logger);
                    let autoCapture = !!_config.autoCapture;
                    if (!_autoCapture && autoCapture) {
                        _autoCaptureHandler.click();
                    }
                    _autoCapture = autoCapture;
                }));
            }
        });

        function _initDefaults() {
            _config = null;
            _pageAction = null;
            _autoCaptureHandler = null;
            _contentHandler = null;
            _autoCapture = false;

            // Define _self.config
            objDefineProp(self, "config", {
                configurable: true,
                enumerable: true,
                get: () => _config
            });
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
     * @param customProperties - Additional data used to filter events and metrics. Defaults to empty.
     */
    public trackPageAction(pageAction?: IPageActionTelemetry, customProperties?: ICustomProperties) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
