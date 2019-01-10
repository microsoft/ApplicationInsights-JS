/**
 * PropertiesPlugin.ts
 * @copyright Microsoft 2018
 */

import {
    ITelemetryPlugin, IConfiguration, CoreUtils,
    IAppInsightsCore, IPlugin, ITelemetryItem
} from '@microsoft/applicationinsights-core-js';
import { PageView, ConfigurationManager,
    WebExtensionKeys, DeviceExtensionKeys, 
    IConfig, UserExtensionKeys, UserTagKeys, AppExtensionKeys,
    IngestExtKeys, OSExtKeys, CtxTagKeys  } from '@microsoft/applicationinsights-common';
import { Session, _SessionManager } from './Context/Session';
import { Application } from './Context/Application';
import { Device } from './Context/Device';
import { Internal } from './Context/Internal';
import { Location } from './Context/Location';
import { Operation } from './Context/Operation';
import { User } from './Context/User';
import { Sample } from './Context/Sample';
import { ITelemetryConfig } from './Interfaces/ITelemetryConfig';
import { ITelemetryContext } from './Interfaces/ITelemetryContext';

export default class PropertiesPlugin implements ITelemetryPlugin, ITelemetryContext {
    public priority = 170;
    public identifier = "AppInsightsPropertiesPlugin";
    public application: Application; // The object describing a component tracked by this object.
    public device: Device; // The object describing a device tracked by this object.
    public location: Location; // The object describing a location tracked by this object.
    public operation: Operation; // The object describing a operation tracked by this object.
    public user: User; // The object describing a user tracked by this object.
    public internal: Internal;
    public session: Session; // The object describing a session tracked by this object.
    public sample: Sample;
    public _sessionManager: _SessionManager; // The session manager that manages session on the base of cookies.

    private _nextPlugin: ITelemetryPlugin;
    private _extensionConfig: ITelemetryConfig;

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
            appId: () => null
        }
        return defaultConfig;
    }

    initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[]) {
        const defaultConfig: ITelemetryConfig = PropertiesPlugin.getDefaultConfig();
        this._extensionConfig = this._extensionConfig || PropertiesPlugin.getDefaultConfig();
        for (let field in defaultConfig) {
            this._extensionConfig[field] = () => ConfigurationManager.getConfig(config, field, this.identifier, defaultConfig[field]());
        }
        
        if (typeof window !== 'undefined') {
            this._sessionManager = new _SessionManager(this._extensionConfig, core.logger);
            this.application = new Application();
            this.device = new Device();
            this.internal = new Internal(this._extensionConfig);
            this.location = new Location();
            this.user = new User(this._extensionConfig, core.logger);
            this.operation = new Operation();
            this.session = new Session();
            this.sample = new Sample(this._extensionConfig.samplingPercentage(), core.logger);
        }
    }

    /**
     * Add Part A fields to the event
     * @param event The event that needs to be processed
     */
    processTelemetry(event: ITelemetryItem) {
        if (CoreUtils.isNullOrUndefined(event)) {
            // TODO(barustum): throw an internal event once we have support for internal logging
        } else {
            // if the event is not sampled in, do not bother going through the pipeline
            if (this.sample.isSampledIn(event)) {
                // If the envelope is PageView, reset the internal message count so that we can send internal telemetry for the new page.
                if (event.name === PageView.envelopeType) {
                    // TODO(barustum): resetInternalMessageCount once we have support for internal logging
                    //_InternalLogging.resetInternalMessageCount();
                }

                if (this.session) {
                    // If customer did not provide custom session id update the session manager
                    if (typeof this.session.id !== "string") {
                        this._sessionManager.update();
                    }
                }

                this._processTelemetryInternal(event);
            }

            if (!CoreUtils.isNullOrUndefined(this._nextPlugin)) {
                this._nextPlugin.processTelemetry(event);
            }
        }
    }

    /**
     * Sets the next plugin that comes after this plugin
     * @param nextPlugin The next plugin
     */
    setNextPlugin(nextPlugin: ITelemetryPlugin) {
        this._nextPlugin = nextPlugin;
    }

    private _processTelemetryInternal(event: ITelemetryItem) {

        if (this.session) {
            // If customer set id, apply his context; otherwise apply context generated from cookies 
            if (typeof this.session.id === "string") {
                this._applySessionContext(event, this.session);
            } else {
                this._applySessionContext(event, this._sessionManager.automaticSession);
            }
        }

        // set part A  fields
        if (!event.tags) {
            event.tags = [];
        }

        if (!event.ctx) {
            event.ctx = {};
        }

        this._applyApplicationContext(event, this.application);
        this._applyDeviceContext(event, this.device);
        this._applyInternalContext(event, this.internal);
        this._applyLocationContext(event, this.location);
        this._applySampleContext(event, this.sample);
        this._applyOperationContext(event, this.operation);
        this._applyUserContext(event, this.user);
    }

    private _applySessionContext(event: ITelemetryItem, sessionContext: Session) {
        if (sessionContext) {
            if (typeof sessionContext.id === "string") {
                event.ctx[AppExtensionKeys.sessionId] = sessionContext.id;
            }
            if (typeof sessionContext.isFirst !== "undefined") {
                event.tags[CtxTagKeys.sessionIsFirst] = sessionContext.isFirst;
            }
        }
    }

    private _applyApplicationContext(event: ITelemetryItem, appContext: Application) {
        if (appContext) {

            if (typeof appContext.ver === "string") {
                event.tags[CtxTagKeys.applicationVersion] = appContext.ver;
            }
            if (typeof appContext.build === "string") {
                event.tags[CtxTagKeys.applicationBuild] = appContext.build;
            }
        }
    }

    private _applyDeviceContext(event: ITelemetryItem, deviceContext: Device) {

        if (deviceContext) {
            if (typeof deviceContext.id === "string") {
                event.ctx[DeviceExtensionKeys.localId] = deviceContext.id;
            }

            if (typeof deviceContext.ip === "string") {
                event.ctx[IngestExtKeys.clientIp] = deviceContext.ip;
            }
            if (typeof deviceContext.language === "string") {
                event.ctx[WebExtensionKeys.browserLang] = deviceContext.language;
            }
            if (typeof deviceContext.locale === "string") {
                event.tags[CtxTagKeys.deviceLocale] = deviceContext.locale;
            }
            if (typeof deviceContext.model === "string") {
                event.ctx[DeviceExtensionKeys.model] = deviceContext.model;
            }
            if (typeof deviceContext.network !== "undefined") {
                event.tags[CtxTagKeys.deviceNetwork] = deviceContext.network; // not mapped in CS 4.0
            }
            if (typeof deviceContext.oemName === "string") {
                event.tags[CtxTagKeys.deviceOEMName] = deviceContext.oemName; // not mapped in CS 4.0
            }
            if (typeof deviceContext.os === "string") {
                event.ctx[OSExtKeys.deviceOS] = deviceContext.os;
            }
            if (typeof deviceContext.osversion === "string") {
                event.tags[CtxTagKeys.deviceOSVersion] = deviceContext.osversion; // not mapped in CS 4.0
            }
            if (typeof deviceContext.resolution === "string") {
                event.ctx[WebExtensionKeys.screenRes] = deviceContext.resolution;
            }
            if (typeof deviceContext.type === "string") {
                event.ctx[DeviceExtensionKeys.deviceType] = deviceContext.type;
            }
        }
    }

    private _applyInternalContext(event: ITelemetryItem, internalContext: Internal) {
        if (internalContext) {
            if (typeof internalContext.agentVersion === "string") {
                event.tags[CtxTagKeys.internalAgentVersion] = internalContext.agentVersion; // not mapped in CS 4.0
            }
            if (typeof internalContext.sdkVersion === "string") {
                event.tags[CtxTagKeys.internalSdkVersion] = internalContext.sdkVersion; // not mapped in CS 4.0
            }
        }
    }

    private _applyLocationContext(event: ITelemetryItem, locationContext: Location) {
        if (locationContext) {

            if (typeof locationContext.ip === "string") {
                event.tags[CtxTagKeys.locationIp] = locationContext.ip; // not mapped in CS 4.0
            }
        }
    }

    private _applySampleContext(event: ITelemetryItem, sampleContext: Sample) {
        if (sampleContext) {
            event.tags["sampleRate"] = sampleContext.sampleRate; // tags.sampleRate -> mapped in CS 4.0
        }
    }

    private _applyOperationContext(event: ITelemetryItem, operationContext: Operation) {
        if (operationContext) {
            if (typeof operationContext.id === "string") {
                event.tags[CtxTagKeys.operationId] = operationContext.id; // not mapped in CS 4.0
            }
            if (typeof operationContext.name === "string") {
                event.tags[CtxTagKeys.operationName] = operationContext.name; // not mapped in CS 4.0
            }
            if (typeof operationContext.parentId === "string") {
                event.tags[CtxTagKeys.operationParentId] = operationContext.parentId; // not mapped in CS 4.0
            }
            if (typeof operationContext.rootId === "string") {
                event.tags[CtxTagKeys.operationRootId] = operationContext.rootId; // not mapped in CS 4.0
            }
            if (typeof operationContext.syntheticSource === "string") {
                event.tags[CtxTagKeys.operationSyntheticSource] = operationContext.syntheticSource; // not mapped in CS 4.0
            }
        }
    }

    private _applyUserContext(event: ITelemetryItem, userContext: User) {
        if (userContext) {
            if (!event.tags) {
                event.tags = [];
            }
            
            if (typeof userContext.agent === "string") {
                let val = userContext.agent;
                let ky = CtxTagKeys.userAgent;
                event.tags.push({ ky: val }); // ai.user.agent stays under tags
            }

            if (typeof userContext.storeRegion === "string") {
                let ky = CtxTagKeys.userStoreRegion; // "ai.user.storeRegion" stays under tags
                let val = userContext.storeRegion;
                event.tags.push({ky: val});
            }

            // stays in tags under User extension
            if (typeof userContext.accountId === "string") {
                let item = {};
                item[UserTagKeys.accountId] = userContext.accountId;
                event.tags.push(item);
            }
            
            // CS 4.0            
            if (typeof userContext.id === "string") {
                event.ctx[UserExtensionKeys.id] = userContext.id;
            }
            
            if (typeof userContext.authenticatedId === "string") {
                event.ctx[UserExtensionKeys.authId] = userContext.authenticatedId;
            }            
        }
    }
}