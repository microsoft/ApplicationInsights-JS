/**
* PropertiesPlugin.ts
* @copyright Microsoft 2018
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    BreezeChannelIdentifier, IConfig, IPropertiesPlugin, PageView, PropertiesPluginIdentifier, createDistributedTraceContextFromTrace,
    utlSetStoragePrefix
} from "@microsoft/applicationinsights-common";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IConfigDefaults, IConfiguration, IDistributedTraceContext, IPlugin, IProcessTelemetryContext,
    IProcessTelemetryUnloadContext, ITelemetryItem, ITelemetryPluginChain, ITelemetryUnloadState, _InternalLogMessage, _eInternalMessageId,
    _logInternalMessage, createProcessTelemetryContext, eLoggingSeverity, getNavigator, getSetValue, isNullOrUndefined, onConfigChange
} from "@microsoft/applicationinsights-core-js";
import { objDeepFreeze, objDefine } from "@nevware21/ts-utils";
import { IPropTelemetryContext } from "./Interfaces/IPropTelemetryContext";
import { IPropertiesConfig } from "./Interfaces/IPropertiesConfig";
import { TelemetryContext } from "./TelemetryContext";

let undefString: string;
const nullValue: any = null;

const _defaultConfig: IConfigDefaults<IPropertiesConfig> = objDeepFreeze({
    accountId: nullValue,
    sessionRenewalMs: 30 * 60 * 1000,
    samplingPercentage: 100,
    sessionExpirationMs: 24 * 60 * 60 * 1000,
    cookieDomain: nullValue,
    sdkExtension: nullValue,
    isBrowserLinkTrackingEnabled: false,
    appId: nullValue,
    getSessionId: nullValue,
    namePrefix: undefString,
    sessionCookiePostfix: undefString,
    userCookiePostfix: undefString,
    idLength: 22,
    getNewId: nullValue
});

export default class PropertiesPlugin extends BaseTelemetryPlugin implements IPropertiesPlugin {

    public context: IPropTelemetryContext;

    public priority = 110;
    public identifier = PropertiesPluginIdentifier;

    constructor() {
        super();

        let _extensionConfig: IPropertiesConfig;
        let _distributedTraceCtx: IDistributedTraceContext;
        let _previousTraceCtx: IDistributedTraceContext;
        let _context: IPropTelemetryContext;
        let _disableUserInitMessage: boolean;

        dynamicProto(PropertiesPlugin, this, (_self, _base) => {

            _initDefaults();

            objDefine(_self, "context", {
                g: function() {
                    return _context;
                }
            });

            _self.initialize = (config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) => {
                _base.initialize(config, core, extensions, pluginChain);
                _populateDefaults(config);
            };
    
            /**
             * Add Part A fields to the event
             * @param event - The event that needs to be processed
             */
            _self.processTelemetry = (event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                if (!isNullOrUndefined(event)) {
                    itemCtx = _self._getTelCtx(itemCtx);
                    // If the envelope is PageView, reset the internal message count so that we can send internal telemetry for the new page.
                    if (event.name === PageView.envelopeType) {
                        itemCtx.diagLog().resetInternalMessageCount();
                    }

                    let theContext: TelemetryContext = (_context || {}) as TelemetryContext;
    
                    if (theContext.session) {
                        // If customer did not provide custom session id update the session manager
                        if (typeof _context.session.id !== "string" && theContext.sessionManager) {
                            theContext.sessionManager.update();
                        }
                    }

                    let userCtx = theContext.user;
                    if (userCtx && !userCtx.isUserCookieSet) {
                        userCtx.update(theContext.user.id);
                    }
    
                    _processTelemetryInternal(event, itemCtx);
    
                    if (userCtx && userCtx.isNewUser) {
                        userCtx.isNewUser = false;
                        if (!_disableUserInitMessage){
                            const message = new _InternalLogMessage(_eInternalMessageId.SendBrowserInfoOnUserInit, ((getNavigator()||{} as any).userAgent||""));
                            _logInternalMessage(itemCtx.diagLog(), eLoggingSeverity.CRITICAL, message);
                        }
                    }
    
                    _self.processNext(event, itemCtx);
                }
            };

            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                let core = (unloadCtx || {} as any).core();
                if (core && core.getTraceCtx) {
                    let traceCtx = core.getTraceCtx(false);
                    if (traceCtx === _distributedTraceCtx) {
                        core.setTraceCtx(_previousTraceCtx);
                    }
                }

                _initDefaults();
            };
    
            function _initDefaults() {
                _extensionConfig = null;
                _distributedTraceCtx = null;
                _previousTraceCtx = null;
                _context = null;
                _disableUserInitMessage = false;
            }

            function _populateDefaults(config: IConfiguration & IConfig) {
                let identifier = _self.identifier;
                let core = _self.core;

                // This function will be re-called whenever any referenced configuration is changed
                _self._addHook(onConfigChange(config, () => {
                    let ctx = createProcessTelemetryContext(null, config, core);
                    if (config.storagePrefix){
                        utlSetStoragePrefix(config.storagePrefix);
                    }
                    _disableUserInitMessage = config.disableUserInitMessage || false;
                    _extensionConfig = ctx.getExtCfg(identifier, _defaultConfig);

                    // Test hook to allow accessing the internal values -- explicitly not defined as an available property on the class
                    _self["_extConfig"] = _extensionConfig;
                }));

                // This is outside of the onConfigChange as we don't want to update (replace) these values whenever a referenced config item changes
                _previousTraceCtx = core.getTraceCtx(false);
                _context = new TelemetryContext(core, _extensionConfig, _previousTraceCtx, _self._unloadHooks);
                _distributedTraceCtx = createDistributedTraceContextFromTrace(_self.context.telemetryTrace, _previousTraceCtx);
                core.setTraceCtx(_distributedTraceCtx);
                _self.context.appId = () => {
                    let breezeChannel = core.getPlugin<IPlugin>(BreezeChannelIdentifier);
                    return breezeChannel ? breezeChannel.plugin["_appId"] : null;
                };
            }

            function _processTelemetryInternal(evt: ITelemetryItem, itemCtx: IProcessTelemetryContext) {
                // Set Part A fields
                getSetValue(evt, "tags", []);
                getSetValue(evt, "ext", {});

                let ctx = _self.context;
                ctx.applySessionContext(evt, itemCtx);
                ctx.applyApplicationContext(evt, itemCtx);
                ctx.applyDeviceContext(evt, itemCtx);
                ctx.applyOperationContext(evt, itemCtx);
                ctx.applyUserContext(evt, itemCtx);
                ctx.applyOperatingSystemContxt(evt, itemCtx);
                ctx.applyWebContext(evt, itemCtx);

                ctx.applyLocationContext(evt, itemCtx); // legacy tags
                ctx.applyInternalContext(evt, itemCtx); // legacy tags
                ctx.cleanUp(evt, itemCtx);
            }
        });
    }

    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Add Part A fields to the event
     * @param event - The event that needs to be processed
     */
    public processTelemetry(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
