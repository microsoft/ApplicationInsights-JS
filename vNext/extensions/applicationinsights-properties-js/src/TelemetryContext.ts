/**
 * PropertiesPlugin.ts
 * @copyright Microsoft 2018
 */

import { ITelemetryItem, IDiagnosticLogger, IPlugin, IConfiguration } from '@microsoft/applicationinsights-core-js';
import { Session, _SessionManager } from './Context/Session';
import { AppExtensionKeys, CtxTagKeys, DeviceExtensionKeys, IngestExtKeys, WebExtensionKeys, OSExtKeys, 
    UserTagKeys, UserExtensionKeys, ITelemetryContext } from '@microsoft/applicationinsights-common';
import { Application } from './Context/Application';
import { Device } from './Context/Device';
import { Internal } from './Context/Internal';
import { Sample } from './Context/Sample';
import { Operation } from './Context/Operation';
import { User } from './Context/User';
import { Location } from './Context/Location';
import { ITelemetryConfig } from './Interfaces/ITelemetryConfig';
 
export class TelemetryContext implements ITelemetryContext {

    public application: Application; // The object describing a component tracked by this object.
    public device: Device; // The object describing a device tracked by this object.
    public location: Location; // The object describing a location tracked by this object.
    public operation: Operation; // The object describing a operation tracked by this object.
    public user: User; // The object describing a user tracked by this object.
    public internal: Internal;
    public session: Session; // The object describing a session tracked by this object.
    public sample: Sample;
    public sessionManager: _SessionManager; // The session manager that manages session on the base of cookies.

    constructor(logger: IDiagnosticLogger, defaultConfig: ITelemetryConfig) {
        if (typeof window !== 'undefined') {
            this.sessionManager = new _SessionManager(defaultConfig, logger);
            this.application = new Application();
            this.device = new Device();
            this.internal = new Internal(defaultConfig);
            this.location = new Location();
            this.user = new User(defaultConfig, logger);
            this.operation = new Operation();
            this.session = new Session();
            this.sample = new Sample(defaultConfig.samplingPercentage(), logger);
        }
    }
    
    public applySessionContext(event: ITelemetryItem) {
        let sessionContext = this.session || this.sessionManager.automaticSession;
        if (sessionContext) {
            if (typeof sessionContext.id === "string") {
                event.ctx[AppExtensionKeys.sessionId] = sessionContext.id;
            }
            if (typeof sessionContext.isFirst !== "undefined") {
                event.tags[CtxTagKeys.sessionIsFirst] = sessionContext.isFirst;
            }
        }
    }

    public applyApplicationContext(event: ITelemetryItem) {
        if (this.application) {

            if (typeof this.application.ver === "string") {
                event.tags[CtxTagKeys.applicationVersion] = this.application.ver;
            }
            if (typeof this.application.build === "string") {
                event.tags[CtxTagKeys.applicationBuild] = this.application.build;
            }
        }
    }

    public applyDeviceContext(event: ITelemetryItem) {

        if (this.device) {
            if (typeof this.device.id === "string") {
                event.ctx[DeviceExtensionKeys.localId] = this.device.id;
            }

            if (typeof this.device.ip === "string") {
                event.ctx[IngestExtKeys.clientIp] = this.device.ip;
            }
            if (typeof this.device.language === "string") {
                event.ctx[WebExtensionKeys.browserLang] = this.device.language;
            }
            if (typeof this.device.locale === "string") {
                event.tags[CtxTagKeys.deviceLocale] = this.device.locale;
            }
            if (typeof this.device.model === "string") {
                event.ctx[DeviceExtensionKeys.model] = this.device.model;
            }
            if (typeof this.device.network !== "undefined") {
                event.tags[CtxTagKeys.deviceNetwork] = this.device.network; // not mapped in CS 4.0
            }
            if (typeof this.device.oemName === "string") {
                event.tags[CtxTagKeys.deviceOEMName] = this.device.oemName; // not mapped in CS 4.0
            }
            if (typeof this.device.os === "string") {
                event.ctx[OSExtKeys.deviceOS] = this.device.os;
            }
            if (typeof this.device.osversion === "string") {
                event.tags[CtxTagKeys.deviceOSVersion] = this.device.osversion; // not mapped in CS 4.0
            }
            if (typeof this.device.resolution === "string") {
                event.ctx[WebExtensionKeys.screenRes] = this.device.resolution;
            }
            if (typeof this.device.type === "string") {
                event.ctx[DeviceExtensionKeys.deviceType] = this.device.type;
            }
        }
    }

    public applyInternalContext(event: ITelemetryItem) {
        if (this.internal) {
            if (typeof this.internal.agentVersion === "string") {
                event.tags[CtxTagKeys.internalAgentVersion] = this.internal.agentVersion; // not mapped in CS 4.0
            }
            if (typeof this.internal.sdkVersion === "string") {
                event.tags[CtxTagKeys.internalSdkVersion] = this.internal.sdkVersion; // not mapped in CS 4.0
            }
        }
    }

    public applyLocationContext(event: ITelemetryItem) {
        if (this.location) {

            if (typeof this.location.ip === "string") {
                event.tags[CtxTagKeys.locationIp] = this.location.ip; // not mapped in CS 4.0
            }
        }
    }

    public applySampleContext(event: ITelemetryItem) {
        if (this.sample) {
            event.tags["sampleRate"] = this.sample.sampleRate; // tags.sampleRate -> mapped in CS 4.0
        }
    }

    public applyOperationContext(event: ITelemetryItem) {
        if (this.operation) {
            if (typeof this.operation.id === "string") {
                event.tags[CtxTagKeys.operationId] = this.operation.id; // not mapped in CS 4.0
            }
            if (typeof this.operation.name === "string") {
                event.tags[CtxTagKeys.operationName] = this.operation.name; // not mapped in CS 4.0
            }
            if (typeof this.operation.parentId === "string") {
                event.tags[CtxTagKeys.operationParentId] = this.operation.parentId; // not mapped in CS 4.0
            }
            if (typeof this.operation.rootId === "string") {
                event.tags[CtxTagKeys.operationRootId] = this.operation.rootId; // not mapped in CS 4.0
            }
            if (typeof this.operation.syntheticSource === "string") {
                event.tags[CtxTagKeys.operationSyntheticSource] = this.operation.syntheticSource; // not mapped in CS 4.0
            }
        }
    }

    public applyUserContext(event: ITelemetryItem) {
        if (this.user) {
            if (!event.tags) {
                event.tags = [];
            }
            
            if (typeof this.user.agent === "string") {
                let val = this.user.agent;
                let ky = CtxTagKeys.userAgent;
                event.tags.push({ ky: val }); // ai.user.agent stays under tags
            }

            if (typeof this.user.storeRegion === "string") {
                let ky = CtxTagKeys.userStoreRegion; // "ai.user.storeRegion" stays under tags
                let val = this.user.storeRegion;
                event.tags.push({ky: val});
            }

            // stays in tags under User extension
            if (typeof this.user.accountId === "string") {
                let item = {};
                item[UserTagKeys.accountId] = this.user.accountId;
                event.tags.push(item);
            }
            
            // CS 4.0            
            if (typeof this.user.id === "string") {
                event.ctx[UserExtensionKeys.id] = this.user.id;
            }
            
            if (typeof this.user.authenticatedId === "string") {
                event.ctx[UserExtensionKeys.authId] = this.user.authenticatedId;
            }            
        }
    }
}