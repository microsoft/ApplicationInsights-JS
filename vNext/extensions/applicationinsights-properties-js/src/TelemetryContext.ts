/**
 * PropertiesPlugin.ts
 * @copyright Microsoft 2018
 */

import { ITelemetryItem, IDiagnosticLogger } from '@microsoft/applicationinsights-core-js';
import { Session, _SessionManager } from './Context/Session';
import { Extensions, ITelemetryContext, IOperatingSystem, ITelemetryTrace, IWeb, SampleRate, CtxTagKeys, SDKExtensionKeys } from '@microsoft/applicationinsights-common';
import { Application } from './Context/Application';
import { Device } from './Context/Device';
import { Internal } from './Context/Internal';
import { Sample } from './Context/Sample';
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
    public sample: Sample;
    public os: IOperatingSystem;
    public web: IWeb;
    public appId: () => string;

    constructor(logger: IDiagnosticLogger, defaultConfig: ITelemetryConfig) {
        if (typeof window !== 'undefined') {
            this.sessionManager = new _SessionManager(defaultConfig, logger);
            this.application = new Application();
            this.device = new Device();
            this.internal = new Internal(defaultConfig);
            this.location = new Location();
            this.user = new User(defaultConfig, logger);
            this.telemetryTrace = new TelemetryTrace();
            this.session = new Session();
            this.sample = new Sample(defaultConfig.samplingPercentage(), logger);
        }
        this.appId = () => null;
    }

    public applySessionContext(event: ITelemetryItem) {
        let sessionContext = this.session || this.sessionManager.automaticSession;
        if (sessionContext) {
            if (typeof sessionContext.id === "string") {
                event.ext.app.sesId = sessionContext.id;
            }
        }

        if (this.session) {
            // If customer set session info, apply his context; otherwise apply context automatically generated
            if (typeof this.session.id === "string") {
                event.ext.app.sesId = this.session.id;
            } else {
                event.ext.app.sesId = this.sessionManager.automaticSession.id;
            }
        }
    }

    public applyOperatingSystemContxt(event: ITelemetryItem) {
        if (this.os && this.os.name) {
            event.ext.os = this.os;
        }
    }

    public applyApplicationContext(event: ITelemetryItem) {
        if (this.application) {

            if (typeof this.application.ver === "string") {
                event.tags.push({[CtxTagKeys.applicationVersion]: this.application.ver});
            }
            if (typeof this.application.build === "string") {
                event.tags.push({[CtxTagKeys.applicationBuild]: this.application.build });
            }
        }
    }

    public applyDeviceContext(event: ITelemetryItem) {

        if (this.device) {
            if (typeof this.device.id === "string") {
                event.ext.device.localId = this.device.id;
            }

            if (typeof this.device.ip === "string") {
                event.ext.device.ip = this.device.ip;
            }

            if (typeof this.device.model === "string") {
                event.ext.device.model = this.device.model;
            }

            if (typeof this.device.deviceClass === "string") {
                event.ext.device.deviceClass = this.device.deviceClass;
            }
        }
    }

    public applyInternalContext(event: ITelemetryItem) {
        if (this.internal) {
            if (typeof this.internal.agentVersion === "string") {
                event.tags.push({[CtxTagKeys.internalAgentVersion]: this.internal.agentVersion }); // not mapped in CS 4.0
            }
            if (typeof this.internal.sdkVersion === "string") {
                event.tags.push({[CtxTagKeys.internalSdkVersion]: this.internal.sdkVersion });
            } else {
                // store the version provided by core
                if (event[Extensions.SDKExt] && event[Extensions.SDKExt][SDKExtensionKeys.libVer]) { // not exposing context object as this ext is not finalized
                    event.tags.push({[CtxTagKeys.internalSdkVersion]: event[Extensions.SDKExt][SDKExtensionKeys.libVer] }); // map sdk.libVer
                }
            }
        }
    }

    public applyLocationContext(event: ITelemetryItem) {
        if (this.location) {
            if (typeof this.location.ip === "string") {
                event.tags.push({[CtxTagKeys.locationIp]: this.location.ip});
            }
        }
    }

    public applySampleContext(event: ITelemetryItem) {
        if (this.sample) {
            event.tags.push({ SampleRate:  this.sample.sampleRate }); // tags.sampleRate -> mapped in CS 4.0
        }
    }

    public applyOperationContext(event: ITelemetryItem) {
        if (this.telemetryTrace) {
            let trace = event.ext.trace || <ITelemetryTrace>{traceID: undefined, parentID: undefined};
            if (typeof this.telemetryTrace.traceID === "string") {
                trace.traceID = this.telemetryTrace.traceID;
            }

            if (typeof this.telemetryTrace.name === "string") {
                trace.name = this.telemetryTrace.name;
            }

            if (typeof this.telemetryTrace.parentID === "string") {
                trace.parentID = this.telemetryTrace.parentID;
            }

            event.ext.trace = trace;
        }
    }

    public applyWebContext(event: ITelemetryItem) {
        if (this.web) {
            event.ext.web = event.ext.web || {};
            event.ext.web = this.web;
        }
    }

    public applyUserContext(event: ITelemetryItem) {
        if (this.user) {
            if (!event.tags) {
                event.tags = [];
            }

            // stays in tags
            if (typeof this.user.accountId === "string") {
                let item = {};
                event.tags.push({[CtxTagKeys.userAccountId]: this.user.accountId});
            }

            // CS 4.0
            if (typeof this.user.id === "string") {
                event.ext.user.id = this.user.id;
            }

            if (typeof this.user.authenticatedId === "string") {
                event.ext.user.authId = this.user.authenticatedId;
            }
        }
    }

    public cleanUp(event:ITelemetryItem) {
        if (event.ext[Extensions.DeviceExt] && Object.keys(event.ext[Extensions.DeviceExt]).length === 0) {
            delete event.ext[Extensions.DeviceExt];
        }
        if (event.ext[Extensions.UserExt] && Object.keys(event.ext[Extensions.UserExt]).length === 0) {
            delete event.ext[Extensions.UserExt];
        }
        if (event.ext[Extensions.WebExt] && Object.keys(event.ext[Extensions.WebExt]).length === 0) {
            delete event.ext[Extensions.WebExt];
        }
        if (event.ext[Extensions.OSExt] && Object.keys(event.ext[Extensions.OSExt]).length === 0) {
            delete event.ext[Extensions.OSExt];
        }
        if (event.ext[Extensions.AppExt] && Object.keys(event.ext[Extensions.AppExt]).length === 0) {
            delete event.ext[Extensions.AppExt];
        }
        if (event.ext[Extensions.TraceExt] && Object.keys(event.ext[Extensions.TraceExt]).length === 0) {
            delete event.ext[Extensions.TraceExt];
        }
    }
}