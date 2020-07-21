/**
 * PropertiesPlugin.ts
 * @copyright Microsoft 2018
 */

import { ITelemetryItem, IProcessTelemetryContext, IDiagnosticLogger, CoreUtils, hasWindow, _InternalLogMessage } from '@microsoft/applicationinsights-core-js';
import { Session, _SessionManager } from './Context/Session';
import { Extensions, ITelemetryContext, IOperatingSystem, ITelemetryTrace, IWeb, SampleRate, CtxTagKeys, PageView } from '@microsoft/applicationinsights-common';
import { Application } from './Context/Application';
import { Device } from './Context/Device';
import { Internal } from './Context/Internal';
import { User } from './Context/User';
import { Location } from './Context/Location';
import { ITelemetryConfig } from './Interfaces/ITelemetryConfig';
import { TelemetryTrace } from './Context/TelemetryTrace';

export class TelemetryContext implements ITelemetryContext {

    public application: Application; // The object describing a component tracked by this object - legacy
    public device: Device; // The object describing a device tracked by this object.
    public location: Location; // The object describing a location tracked by this object -legacy
    public telemetryTrace: TelemetryTrace; // The object describing a operation tracked by this object.
    public user: User; // The object describing a user tracked by this object.
    public internal: Internal; // legacy
    public session: Session; // The object describing a session tracked by this object.
    public sessionManager: _SessionManager; // The session manager that manages session on the base of cookies.
    public os: IOperatingSystem;
    public web: IWeb;
    public appId: () => string;

    constructor(logger: IDiagnosticLogger, defaultConfig: ITelemetryConfig) {
        let _self = this;
        _self.application = new Application();
        _self.internal = new Internal(defaultConfig);
        if (hasWindow()) {
            _self.sessionManager = new _SessionManager(defaultConfig, logger);
            _self.device = new Device();
            _self.location = new Location();
            _self.user = new User(defaultConfig, logger);
            _self.telemetryTrace = new TelemetryTrace(undefined, undefined, undefined, logger);
            _self.session = new Session();
        }
        _self.appId = () => null;
    }

    public applySessionContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        let session = this.session;
        let sessionManager = this.sessionManager;
        const sessionContext = session || (sessionManager && sessionManager.automaticSession);
        if (sessionContext) {
            if (CoreUtils.isString(sessionContext.id)) {
                event.ext.app.sesId = sessionContext.id;
            }
        }

        if (session) {
            // If customer set session info, apply his context; otherwise apply context automatically generated
            if (CoreUtils.isString(session.id)) {
                event.ext.app.sesId = session.id;
            } else {
                event.ext.app.sesId = sessionManager.automaticSession.id;
            }
        }
    }

    public applyOperatingSystemContxt(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        let os = this.os;
        if (os && os.name) {
            event.ext.os = os;
        }
    }

    public applyApplicationContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        let application = this.application;
        if (application) {

            if (CoreUtils.isString(application.ver)) {
                event.tags[CtxTagKeys.applicationVersion] = application.ver;
            }
            if (CoreUtils.isString(application.build)) {
                event.tags[CtxTagKeys.applicationBuild] = application.build;
            }
        }
    }

    public applyDeviceContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        let device = this.device;
        if (device) {
            if (CoreUtils.isString(device.id)) {
                event.ext.device.localId = device.id;
            }

            if (CoreUtils.isString(device.ip)) {
                event.ext.device.ip = device.ip;
            }

            if (CoreUtils.isString(device.model)) {
                event.ext.device.model = device.model;
            }

            if (CoreUtils.isString(device.deviceClass)) {
                event.ext.device.deviceClass = device.deviceClass;
            }
        }
    }

    public applyInternalContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        let internal = this.internal;
        if (internal) {
            if (CoreUtils.isString(internal.agentVersion)) {
                event.tags[CtxTagKeys.internalAgentVersion] = internal.agentVersion; // not mapped in CS 4.0
            }
            if (CoreUtils.isString(internal.sdkVersion)) {
                event.tags[CtxTagKeys.internalSdkVersion] = internal.sdkVersion;
            }

            if (event.baseType === _InternalLogMessage.dataType || event.baseType === PageView.dataType) {
                if (CoreUtils.isString(internal.snippetVer)) {
                    event.tags[CtxTagKeys.internalSnippet] = internal.snippetVer;
                }

                if (CoreUtils.isString(internal.sdkSrc)) {
                    event.tags[CtxTagKeys.internalSdkSrc] = internal.sdkSrc;
                }
            }
        }
    }

    public applyLocationContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        let location = this.location;
        if (location) {
            if (CoreUtils.isString(location.ip)) {
                event.tags[CtxTagKeys.locationIp] = location.ip;
            }
        }
    }

    public applyOperationContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        let telemetryTrace = this.telemetryTrace;
        if (telemetryTrace) {
            const trace = event.ext.trace || ({traceID: undefined, parentID: undefined} as ITelemetryTrace);
            if (CoreUtils.isString(telemetryTrace.traceID)) {
                trace.traceID = telemetryTrace.traceID;
            }

            if (CoreUtils.isString(telemetryTrace.name)) {
                trace.name = telemetryTrace.name;
            }

            if (CoreUtils.isString(telemetryTrace.parentID)) {
                trace.parentID = telemetryTrace.parentID;
            }

            event.ext.trace = trace;
        }
    }

    public applyWebContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        let web = this.web;
        if (web) {
            event.ext.web = event.ext.web || {};
            event.ext.web = web;
        }
    }

    public applyUserContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        let user = this.user;
        if (user) {
            if (!event.tags) {
                event.tags = [];
            }

            // stays in tags
            if (CoreUtils.isString(user.accountId)) {
                event.tags[CtxTagKeys.userAccountId] = user.accountId;
            }

            // CS 4.0
            if (CoreUtils.isString( user.id)) {
                event.ext.user.id = user.id;
            }

            if (CoreUtils.isString(user.authenticatedId)) {
                event.ext.user.authId = user.authenticatedId;
            }
        }
    }

    public cleanUp(event:ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        if (event.ext[Extensions.DeviceExt] && CoreUtils.objKeys(event.ext[Extensions.DeviceExt]).length === 0) {
            delete event.ext[Extensions.DeviceExt];
        }
        if (event.ext[Extensions.UserExt] && CoreUtils.objKeys(event.ext[Extensions.UserExt]).length === 0) {
            delete event.ext[Extensions.UserExt];
        }
        if (event.ext[Extensions.WebExt] && CoreUtils.objKeys(event.ext[Extensions.WebExt]).length === 0) {
            delete event.ext[Extensions.WebExt];
        }
        if (event.ext[Extensions.OSExt] && CoreUtils.objKeys(event.ext[Extensions.OSExt]).length === 0) {
            delete event.ext[Extensions.OSExt];
        }
        if (event.ext[Extensions.AppExt] && CoreUtils.objKeys(event.ext[Extensions.AppExt]).length === 0) {
            delete event.ext[Extensions.AppExt];
        }
        if (event.ext[Extensions.TraceExt] && CoreUtils.objKeys(event.ext[Extensions.TraceExt]).length === 0) {
            delete event.ext[Extensions.TraceExt];
        }
    }
}