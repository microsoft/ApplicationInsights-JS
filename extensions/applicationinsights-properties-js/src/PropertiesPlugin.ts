/**
 * PropertiesPlugin.ts
 * @copyright Microsoft 2018
 */

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    BaseTelemetryPlugin, IConfiguration, isNullOrUndefined,
    IAppInsightsCore, IPlugin, ITelemetryItem, IProcessTelemetryContext, _InternalLogMessage, eLoggingSeverity, _eInternalMessageId, getNavigator,
    ITelemetryPluginChain, objForEachKey, getSetValue, _logInternalMessage, IProcessTelemetryUnloadContext, ITelemetryUnloadState, IDistributedTraceContext
} from "@microsoft/applicationinsights-core-js";
import { TelemetryContext } from "./TelemetryContext";
import { PageView, IConfig, BreezeChannelIdentifier, PropertiesPluginIdentifier, IPropertiesPlugin, createDistributedTraceContextFromTrace } from "@microsoft/applicationinsights-common";
import { ITelemetryConfig } from "./Interfaces/ITelemetryConfig";
import { IPropTelemetryContext } from "./Interfaces/IPropTelemetryContext";

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
            getSessionId: () => null,
            namePrefix: () => undefined,
            sessionCookiePostfix: () => undefined,
            userCookiePostfix: () => undefined,
            idLength: () => 22,
            getNewId: () => null
        };
        
        return defaultConfig;
    }

    public context: IPropTelemetryContext;

    public priority = 110;
    public identifier = PropertiesPluginIdentifier;

    constructor() {
        super();

        let _extensionConfig: ITelemetryConfig;
        let _distributedTraceCtx: IDistributedTraceContext;
        let _previousTraceCtx: IDistributedTraceContext;

        dynamicProto(PropertiesPlugin, this, (_self, _base) => {

            _initDefaults();

            _self.initialize = (config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) => {
                _base.initialize(config, core, extensions, pluginChain);
                let ctx = _self._getTelCtx();
                let identifier = _self.identifier;
                const defaultConfig: ITelemetryConfig = PropertiesPlugin.getDefaultConfig();
                _extensionConfig = _extensionConfig || {} as ITelemetryConfig;
                objForEachKey(defaultConfig, (field, value) => {
                    _extensionConfig[field] = () => ctx.getConfig(identifier, field, value() as any);
                });
    
                _previousTraceCtx = core.getTraceCtx(false);
                _self.context = new TelemetryContext(core, _extensionConfig, _previousTraceCtx);
                _distributedTraceCtx = createDistributedTraceContextFromTrace(_self.context.telemetryTrace, _previousTraceCtx);
                core.setTraceCtx(_distributedTraceCtx);
                _self.context.appId = () => {
                    let breezeChannel = core.getPlugin<IPlugin>(BreezeChannelIdentifier);
                    return breezeChannel ? breezeChannel.plugin["_appId"] : null;
                };

                // Test hook to allow accessing the internal values -- explicitly not defined as an available property on the class
                _self["_extConfig"] = _extensionConfig;
            };
    
            /**
             * Add Part A fields to the event
             * @param event The event that needs to be processed
             */
            _self.processTelemetry = (event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                if (isNullOrUndefined(event)) {
                    // TODO(barustum): throw an internal event once we have support for internal logging
                } else {
                    itemCtx = _self._getTelCtx(itemCtx);
                    // If the envelope is PageView, reset the internal message count so that we can send internal telemetry for the new page.
                    if (event.name === PageView.envelopeType) {
                        itemCtx.diagLog().resetInternalMessageCount();
                    }

                    let theContext: TelemetryContext = (_self.context || {}) as TelemetryContext;
    
                    if (theContext.session) {
                        // If customer did not provide custom session id update the session manager
                        if (typeof _self.context.session.id !== "string" && theContext.sessionManager) {
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
                        const message = new _InternalLogMessage(_eInternalMessageId.SendBrowserInfoOnUserInit, ((getNavigator()||{} as any).userAgent||""));
                        _logInternalMessage(itemCtx.diagLog(), eLoggingSeverity.CRITICAL, message);
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
     * @param event The event that needs to be processed
     */
    public processTelemetry(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
