/**
* TelemetryContext.ts
* @copyright Microsoft 2018
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    CtxTagKeys, Extensions, IApplication, IDevice, IInternal, ILocation, IOperatingSystem, ISession, ITelemetryTrace, IUserContext, IWeb,
    PageView, dataSanitizeString
} from "@microsoft/applicationinsights-common";
import {
    IAppInsightsCore, IDistributedTraceContext, IProcessTelemetryContext, ITelemetryItem, _InternalLogMessage, getSetValue, hasWindow,
    isNullOrUndefined, isString, objKeys, setValue
} from "@microsoft/applicationinsights-core-js";
import { Application } from "./Context/Application";
import { Device } from "./Context/Device";
import { Internal } from "./Context/Internal";
import { Location } from "./Context/Location";
import { Session, _SessionManager } from "./Context/Session";
import { TelemetryTrace } from "./Context/TelemetryTrace";
import { User } from "./Context/User";
import { IPropTelemetryContext } from "./Interfaces/IPropTelemetryContext";
import { ITelemetryConfig } from "./Interfaces/ITelemetryConfig";

const strExt = "ext";
const strTags = "tags";

function _removeEmpty(target: any, name: string) {
    if (target && target[name] && objKeys(target[name]).length === 0) {
        delete target[name];
    }
}

export class TelemetryContext implements IPropTelemetryContext {

    public application: IApplication; // The object describing a component tracked by this object - legacy
    public device: IDevice; // The object describing a device tracked by this object.
    public location: ILocation; // The object describing a location tracked by this object -legacy
    public telemetryTrace: ITelemetryTrace; // The object describing a operation tracked by this object.
    public user: IUserContext; // The object describing a user tracked by this object.
    public internal: IInternal; // legacy
    public session: ISession; // The object describing a session tracked by this object.
    public sessionManager: _SessionManager; // The session manager that manages session on the base of cookies.
    public os: IOperatingSystem;
    public web: IWeb;
    public appId: () => string;
    public getSessionId: () => string;

    constructor(core: IAppInsightsCore, defaultConfig: ITelemetryConfig, previousTraceCtx?: IDistributedTraceContext) {
        let logger = core.logger
        this.appId = () => null;
        this.getSessionId = () => null;

        dynamicProto(TelemetryContext, this, (_self) => {
            _self.application = new Application();
            _self.internal = new Internal(defaultConfig);
            if (hasWindow()) {
                _self.sessionManager = new _SessionManager(defaultConfig, core);
                _self.device = new Device();
                _self.location = new Location();
                _self.user = new User(defaultConfig, core);

                let traceId: string;
                let parentId: string;
                let name: string;
                if (previousTraceCtx) {
                    traceId = previousTraceCtx.getTraceId();
                    parentId = previousTraceCtx.getSpanId();
                    name = previousTraceCtx.getName();
                }
                _self.telemetryTrace = new TelemetryTrace(traceId, parentId, name, logger);
                _self.session = new Session();
            }

            _self.getSessionId = () => {
                let session = _self.session;
                let sesId = null;
                
                // If customer set session info, apply their context; otherwise apply context automatically generated
                if (session && isString(session.id)) {
                    sesId = session.id;
                } else {
                    // Gets the automatic session if it exists or an empty object
                    let autoSession = (_self.sessionManager || {} as _SessionManager).automaticSession;
                
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
            
                    if (evt.baseType === _InternalLogMessage.dataType || evt.baseType === PageView.dataType) {
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
