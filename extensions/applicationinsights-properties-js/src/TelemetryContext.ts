/**
* TelemetryContext.ts
* @copyright Microsoft 2018
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    CtxTagKeys, Extensions, IAppInsightsCore, IApplication, IDevice, IDistributedTraceContext, IInternal, ILocation, IOperatingSystem,
    IProcessTelemetryContext, ISession, ISessionManager, ITelemetryItem, ITelemetryTrace, IUnloadHookContainer, IUserContext, IWeb,
    PageViewDataType, _InternalLogMessage, dataSanitizeString, getSetValue, hasWindow, isNullOrUndefined, isString, objKeys, setValue
} from "@microsoft/applicationinsights-core-js";
import { fnCall, getDeferred, isFunction, isUndefined, objDefine, objDefineProps, strLetterCase } from "@nevware21/ts-utils";
import { Application } from "./Context/Application";
import { Device } from "./Context/Device";
import { Internal } from "./Context/Internal";
import { Location } from "./Context/Location";
import { Session, _SessionManager } from "./Context/Session";
import { User } from "./Context/User";
import { IPropTelemetryContext } from "./Interfaces/IPropTelemetryContext";
import { IPropertiesConfig } from "./Interfaces/IPropertiesConfig";

const strExt = "ext";
const strTags = "tags";
let UNDEF_VALUE: undefined;

function _removeEmpty(target: any, name: string) {
    if (target && target[name] && objKeys(target[name]).length === 0) {
        delete target[name];
    }
}

function _nullResult(): string {
    return null;
}

/**
 * Create a telemetryTrace object that will be used to manage the trace context for the current telemetry item.
 * This will create a proxy object that will read the values from the core.getTraceCtx() and provide a way to update the values
 * in the core.getTraceCtx() if they are valid.
 * @param core - The core instance that will be used to get the trace context
 * @returns A telemetryTrace object that will be used to manage the trace context for the current telemetry item.
 */
function _createTelemetryTrace(core: IAppInsightsCore): ITelemetryTrace {
    let coreTraceCtx: IDistributedTraceContext | null = core ? core.getTraceCtx() : null;
    let trace: any = {};

    function _getCtx() {
        let ctx = core ? core.getTraceCtx() : null;
        if (coreTraceCtx && ctx !== coreTraceCtx) {
            // It appears that the coreTraceCtx has been updated, so clear the local trace context
            trace = {};
        }

        return ctx;
    }

    function _getTraceCtx<T>(name: keyof IDistributedTraceContext extends string ? keyof IDistributedTraceContext : never): T {
        let value: T;
        let ctx = _getCtx();

        if (!isUndefined(trace[name])) {
            // has local value
            value = trace[name];
        } else if (ctx) {
            if (name in ctx) {
                // has property
                value = (ctx as any)[name] as T;
            } else {
                let fnName = "get" + strLetterCase(name);
                if (isFunction((ctx as any)[fnName])) {
                    value = (ctx as any)[fnName];
                }
            }

            if (isFunction(value)) {
                // The return values was a function, call it
                value = fnCall(value as any, ctx);
            }
        }

        return value;
    }

    function _setTraceCtx<V>(name: keyof IDistributedTraceContext extends string ? keyof IDistributedTraceContext : never, value: V, checkFn?: () => V) {
        let ctx = _getCtx();

        if (ctx) {
            if (name in ctx) {
                if (isFunction((ctx as any)[name])) {
                    // The return values was a function, call it
                    fnCall((ctx as any)[name], ctx, [value]);
                } else {
                    (ctx as any)[name] = value;
                }
            } else {
                let fnName = "set" + strLetterCase(name);
                if (isFunction((ctx as any)[fnName])) {
                    (ctx as any)[fnName](value);
                }
            }

            // For backward compatability, we need to support invalid values for historic reasons,
            // moving forward we have marked the usage of the telemetryTrace as deprecated and will be removed in a future version.
            // We will only set the value in the local trace context if it is a valid trace ID or a string, otherwise we will remove it
            trace[name] = UNDEF_VALUE;
            if (value && isString(value)) {
                // If the value is null or undefined, remove it from the local trace context
                if (checkFn && checkFn() !== value) {
                    // If the values doesn't match (most likely because the value is invalid), set the value in the local trace context
                    coreTraceCtx = ctx;
                    trace[name] = value;
                }
            }
        }
    }

    function _getTraceId() {
        return _getTraceCtx<string>("traceId");
    }

    function _getParentId() {
        let ctx = _getCtx();
        let spanId = trace["spanId"];
        if (ctx && isUndefined(spanId)) {
            let parentCtx = ctx.parentCtx;
            if (parentCtx) {
                spanId = parentCtx.spanId;
            }
        }

        return spanId || _getTraceCtx<string>("spanId");
    }

    function _getTraceFlags() {
        return _getTraceCtx("traceFlags");
    }

    function _getName() {
        return dataSanitizeString(core ? core.logger : null, _getTraceCtx("getName") || _getTraceCtx("pageName"));
    }

    function _setValue<V = string>(name: keyof IDistributedTraceContext extends string ? keyof IDistributedTraceContext : never, checkFn?: () => V): (value: V) => void {
        return function (value: V) {
            _setTraceCtx(name, value, checkFn);
        };
    }

    return objDefineProps<ITelemetryTrace>({}, {
        traceID: {
            g: _getTraceId,
            s: _setValue("traceId", _getTraceId)},
        parentID: {
            g: _getParentId,
            s: _setValue("spanId", _getParentId)
        },
        traceFlags: {
            g: _getTraceFlags,
            s: _setValue("traceFlags", _getTraceFlags)
        },
        name: {
            g: _getName,
            s: _setValue("pageName", _getName)
        }
    });
}

export class TelemetryContext implements IPropTelemetryContext {

    public application: IApplication; // The object describing a component tracked by this object - legacy
    public device: IDevice; // The object describing a device tracked by this object.
    public location: ILocation; // The object describing a location tracked by this object -legacy

    /**
     * The object describing a telemetry operation tracked by this object, values applied to this object will be
     * applied to the telemetry being processed and the values will override the values in the {@link IAppInsightsCore.getTraceCtx}
     * property, thus any new {@link IDistributedTraceContext} values will be ignored.
     * @deprecated (since v3.4.0) This property is now being marked as deprecated and provided in the current releases for backward
     * compatability only, it will be removed in a future version. Use the {@link IAppInsightsCore.getTraceCtx} property
     * instead.
     * @remarks Any "updates" to the telemetryTrace will NOT be reflected in the {@link IAppInsightsCore.getTraceCtx} property, however, if no values
     * are set on the telemetryTrace, the {@link IAppInsightsCore.getTraceCtx} property will be used to get the values.
     */
    public telemetryTrace: ITelemetryTrace; // The object describing a operation tracked by this object.
    public user: IUserContext; // The object describing a user tracked by this object.
    public internal: IInternal; // legacy
    public session: ISession; // The object describing a session tracked by this object.
    public sessionManager: ISessionManager; // The session manager that manages session on the base of cookies.
    public os: IOperatingSystem;
    public web: IWeb;
    public appId: () => string;
    public getSessionId: () => string;

    constructor(core: IAppInsightsCore, defaultConfig: IPropertiesConfig, unloadHookContainer?: IUnloadHookContainer) {
        let logger = core.logger

        dynamicProto(TelemetryContext, this, (_self) => {
            _self.appId = _nullResult;
            _self.getSessionId = _nullResult;
            _self.application = new Application();
            _self.internal = new Internal(defaultConfig, unloadHookContainer);
            if (hasWindow()) {
                _self.sessionManager = new _SessionManager(defaultConfig, core, unloadHookContainer);
                _self.device = new Device();
                _self.location = new Location();
                _self.user = new User(defaultConfig, core, unloadHookContainer);
                _self.session = new Session();
                
                objDefine(_self, "telemetryTrace", {
                    l: getDeferred(() => _createTelemetryTrace(core))
                });
            }

            _self.getSessionId = () => {
                let session = _self.session;
                let sesId = null;
                
                // If customer set session info, apply their context; otherwise apply context automatically generated
                if (session && isString(session.id)) {
                    sesId = session.id;
                } else {
                    // Gets the automatic session if it exists or an empty object
                    let autoSession = (_self.sessionManager || {} as ISessionManager).automaticSession;
                
                    sesId = autoSession && isString(autoSession.id) ? autoSession.id : null;
                }

                return sesId;
            }
    
            _self.applySessionContext = (evt: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                setValue(getSetValue(evt.ext, Extensions.AppExt), "sesId", _self.getSessionId(), isString);
            }

            _self.applyOperatingSystemContxt = (evt: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                setValue(evt.ext, Extensions.OSExt, _self.os);
            };
        
            _self.applyApplicationContext = (evt: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                let application = _self.application;
                if (application) {
                    // evt.ext.app
                    let tags = getSetValue(evt, strTags);
                    setValue(tags, CtxTagKeys.applicationVersion, application.ver, isString);
                    setValue(tags, CtxTagKeys.applicationBuild, application.build, isString)
                }
            };
        
            _self.applyDeviceContext = (evt: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                let device = _self.device;
                if (device) {
                    // evt.ext.device
                    let extDevice = getSetValue(getSetValue(evt, strExt), Extensions.DeviceExt);
                    setValue(extDevice, "localId", device.id, isString);
                    setValue(extDevice, "ip", device.ip, isString);
                    setValue(extDevice, "model", device.model, isString);
                    setValue(extDevice, "deviceClass", device.deviceClass, isString);
                }
            };
        
            _self.applyInternalContext = (evt: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                let internal = _self.internal;
                if (internal) {
                    let tags = getSetValue(evt, strTags);

                    setValue(tags, CtxTagKeys.internalAgentVersion, internal.agentVersion, isString); // not mapped in CS 4.0
                    setValue(tags, CtxTagKeys.internalSdkVersion, dataSanitizeString(logger, internal.sdkVersion, 64), isString);
            
                    if (evt.baseType === _InternalLogMessage.dataType || evt.baseType === PageViewDataType) {
                        setValue(tags, CtxTagKeys.internalSnippet, internal.snippetVer, isString);
                        setValue(tags, CtxTagKeys.internalSdkSrc, internal.sdkSrc, isString);
                    }
                }
            };
        
            _self.applyLocationContext = (evt: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                let location = this.location;
                if (location) {
                    setValue(getSetValue(evt, strTags, []), CtxTagKeys.locationIp, location.ip, isString);
                }
            };
        
            _self.applyOperationContext = (evt: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                let telemetryTrace = _self.telemetryTrace;
                if (telemetryTrace) {
                    const extTrace = getSetValue(getSetValue(evt, strExt), Extensions.TraceExt, { traceID: undefined, parentID: undefined } as ITelemetryTrace);
                    setValue(extTrace, "traceID", telemetryTrace.traceID, isString, isNullOrUndefined);
                    setValue(extTrace, "name", telemetryTrace.name, isString, isNullOrUndefined);
                    setValue(extTrace, "parentID", telemetryTrace.parentID, isString, isNullOrUndefined);
                }
            };
        
            _self.applyWebContext = (evt: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                let web = this.web;
                if (web) {
                    setValue(getSetValue(evt, strExt), Extensions.WebExt, web);
                }
            }
        
            _self.applyUserContext = (evt: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                let user = _self.user;
                if (user) {
                    let tags = getSetValue(evt, strTags, []);

                    // stays in tags
                    setValue(tags, CtxTagKeys.userAccountId, user.accountId, isString);
            
                    // CS 4.0
                    let extUser = getSetValue(getSetValue(evt, strExt), Extensions.UserExt);
                    setValue(extUser, "id", user.id, isString);
                    setValue(extUser, "authId", user.authenticatedId, isString);
                }
            }
        
            _self.cleanUp = (evt:ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                let ext = evt.ext;
                if (ext) {
                    _removeEmpty(ext, Extensions.DeviceExt);
                    _removeEmpty(ext, Extensions.UserExt);
                    _removeEmpty(ext, Extensions.WebExt);
                    _removeEmpty(ext, Extensions.OSExt);
                    _removeEmpty(ext, Extensions.AppExt);
                    _removeEmpty(ext, Extensions.TraceExt);
                }
            }
        });
    }

    public applySessionContext(evt: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public applyOperatingSystemContxt(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public applyApplicationContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public applyDeviceContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public applyInternalContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public applyLocationContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public applyOperationContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public applyWebContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public applyUserContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public cleanUp(event:ITelemetryItem, itemCtx?: IProcessTelemetryContext): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
