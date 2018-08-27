/**
 * PropertiesPlugin.ts
 * @author Basel Rustum (barustum)
 * @copyright Microsoft 2018
 */

import {
    ITelemetryPlugin, IConfiguration,
    IAppInsightsCore, IPlugin, ITelemetryItem
} from 'applicationinsights-core-js';
import { ContextTagKeys, Util, PageView } from 'applicationinsights-common';
import { Session, _SessionManager } from './Context/Session';
import { Application } from './Context/Application';
import { Device } from './Context/Device';
import { Internal } from './Context/Internal';
import { Location } from './Context/Location';
import { Operation } from './Context/Operation';
import { Sample } from './Context/Sample';
import { User } from './Context/User';
import { ITelemetryConfig } from './Interfaces/ITelemetryConfig';

export const Version = "0.0.1";

export default class PropertiesPlugin implements ITelemetryPlugin {
    public priority = 10;
    public identifier = "AppInsightsPropertiesPlugin";

    private _nextPlugin: ITelemetryPlugin;
    private _extensionConfig: ITelemetryConfig;
    private _session: Session; // The object describing a session tracked by this object.
    private _sessionManager: _SessionManager; // The session manager that manages session on the base of cookies.
    private _application: Application; // The object describing a component tracked by this object.
    private _device: Device; // The object describing a device tracked by this object.
    private _location: Location; // The object describing a location tracked by this object.
    private _operation: Operation; // The object describing a operation tracked by this object.
    private _user: User; // The object describing a user tracked by this object.
    private _internal: Internal;
    private _sample: Sample;

    initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) {
        this._extensionConfig = config.extensions && config.extensions[this.identifier] ? config.extensions[this.identifier] : <ITelemetryConfig>{};

        if (typeof window !== 'undefined') {
            this._sessionManager = new _SessionManager(this._extensionConfig);
            this._application = new Application();
            this._device = new Device();
            this._internal = new Internal(this._extensionConfig);
            this._location = new Location();
            this._user = new User(this._extensionConfig);
            this._operation = new Operation();
            this._session = new Session();
            this._sample = new Sample(this._extensionConfig.sampleRate());
        }
    }

    /**
     * Add Part A fields to the event
     * @param event The event that needs to be processed
     */
    processTelemetry(event: ITelemetryItem) {
        if (Util.IsNullOrUndefined(event)) {
            // TODO(barustum): throw an internal event once we have support for internal logging
        } else {
            // If the envelope is PageView, reset the internal message count so that we can send internal telemetry for the new page.
            if (event.name === PageView.envelopeType) {
                // TODO(barustum): resetInternalMessageCount once we have support for internal logging
                //_InternalLogging.resetInternalMessageCount();
            }

            if (this._session) {
                // If customer did not provide custom session id update the session manager
                if (typeof this._session.id !== "string") {
                    this._sessionManager.update();
                }
            }

            this._processTelemetryInternal(event);
        }

        this._nextPlugin.processTelemetry(event);
    }

    /**
     * Sets the next plugin that comes after this plugin
     * @param nextPlugin The next plugin
     */
    setNextPlugin(nextPlugin: ITelemetryPlugin) {
        this._nextPlugin = nextPlugin;
    }

    private _processTelemetryInternal(event: ITelemetryItem) {
        let tagsItem: { [key: string]: any } = {};

        if (this._session) {
            // If customer set id, apply his context; otherwise apply context generated from cookies 
            if (typeof this._session.id === "string") {
                PropertiesPlugin._applySessionContext(tagsItem, this._session);
            } else {
                PropertiesPlugin._applySessionContext(tagsItem, this._sessionManager.automaticSession);
            }
        }

        // set part A  fields
        PropertiesPlugin._applyApplicationContext(tagsItem, this._application);
        PropertiesPlugin._applyDeviceContext(tagsItem, this._device);
        PropertiesPlugin._applyInternalContext(tagsItem, this._internal);
        PropertiesPlugin._applyLocationContext(tagsItem, this._location);
        PropertiesPlugin._applySampleContext(tagsItem, this._sample);
        PropertiesPlugin._applyUserContext(tagsItem, this._user);
        PropertiesPlugin._applyOperationContext(tagsItem, this._operation);
        event.tags.push(tagsItem);

        // set instrumentation key
        event.instrumentationKey = this._extensionConfig.instrumentationKey();
    }

    private static _applySessionContext(tags: { [key: string]: any }, sessionContext: Session) {
        if (sessionContext) {
            var tagKeys: ContextTagKeys = new ContextTagKeys();
            if (typeof sessionContext.id === "string") {
                tags[tagKeys.sessionId] = sessionContext.id;
            }
            if (typeof sessionContext.isFirst !== "undefined") {
                tags[tagKeys.sessionIsFirst] = sessionContext.isFirst;
            }
        }
    }

    private static _applyApplicationContext(tagsItem: { [key: string]: any }, appContext: Application) {
        if (appContext) {
            var tagKeys: ContextTagKeys = new ContextTagKeys();

            if (typeof appContext.ver === "string") {
                tagsItem[tagKeys.applicationVersion] = appContext.ver;
            }
            if (typeof appContext.build === "string") {
                tagsItem[tagKeys.applicationBuild] = appContext.build;
            }
        }
    }

    private static _applyDeviceContext(tagsItem: { [key: string]: any }, deviceContext: Device) {
        var tagKeys: ContextTagKeys = new ContextTagKeys();

        if (deviceContext) {
            if (typeof deviceContext.id === "string") {
                tagsItem[tagKeys.deviceId] = deviceContext.id;
            }
            if (typeof deviceContext.ip === "string") {
                tagsItem[tagKeys.deviceIp] = deviceContext.ip;
            }
            if (typeof deviceContext.language === "string") {
                tagsItem[tagKeys.deviceLanguage] = deviceContext.language;
            }
            if (typeof deviceContext.locale === "string") {
                tagsItem[tagKeys.deviceLocale] = deviceContext.locale;
            }
            if (typeof deviceContext.model === "string") {
                tagsItem[tagKeys.deviceModel] = deviceContext.model;
            }
            if (typeof deviceContext.network !== "undefined") {
                tagsItem[tagKeys.deviceNetwork] = deviceContext.network;
            }
            if (typeof deviceContext.oemName === "string") {
                tagsItem[tagKeys.deviceOEMName] = deviceContext.oemName;
            }
            if (typeof deviceContext.os === "string") {
                tagsItem[tagKeys.deviceOS] = deviceContext.os;
            }
            if (typeof deviceContext.osversion === "string") {
                tagsItem[tagKeys.deviceOSVersion] = deviceContext.osversion;
            }
            if (typeof deviceContext.resolution === "string") {
                tagsItem[tagKeys.deviceScreenResolution] = deviceContext.resolution;
            }
            if (typeof deviceContext.type === "string") {
                tagsItem[tagKeys.deviceType] = deviceContext.type;
            }
        }
    }

    private static _applyInternalContext(tagsItem: { [key: string]: any }, internalContext: Internal) {
        if (internalContext) {
            var tagKeys: ContextTagKeys = new ContextTagKeys();
            if (typeof internalContext.agentVersion === "string") {
                tagsItem[tagKeys.internalAgentVersion] = internalContext.agentVersion;
            }
            if (typeof internalContext.sdkVersion === "string") {
                tagsItem[tagKeys.internalSdkVersion] = internalContext.sdkVersion;
            }
        }
    }

    private static _applyLocationContext(tagsItem: { [key: string]: any }, locationContext: Location) {
        if (locationContext) {
            var tagKeys: ContextTagKeys = new ContextTagKeys();
            if (typeof locationContext.ip === "string") {
                tagsItem[tagKeys.locationIp] = locationContext.ip;
            }
        }
    }

    private static _applyOperationContext(tagsItem: { [key: string]: any }, operationContext: Operation) {
        if (operationContext) {
            var tagKeys: ContextTagKeys = new ContextTagKeys();
            if (typeof operationContext.id === "string") {
                tagsItem[tagKeys.operationId] = operationContext.id;
            }
            if (typeof operationContext.name === "string") {
                tagsItem[tagKeys.operationName] = operationContext.name;
            }
            if (typeof operationContext.parentId === "string") {
                tagsItem[tagKeys.operationParentId] = operationContext.parentId;
            }
            if (typeof operationContext.rootId === "string") {
                tagsItem[tagKeys.operationRootId] = operationContext.rootId;
            }
            if (typeof operationContext.syntheticSource === "string") {
                tagsItem[tagKeys.operationSyntheticSource] = operationContext.syntheticSource;
            }
        }
    }

    private static _applySampleContext(tagsItem: { [key: string]: any }, sampleContext: Sample) {
        if (sampleContext) {
            tagsItem.sampleRate = sampleContext.sampleRate;
        }
    }

    private static _applyUserContext(tagsItem: { [key: string]: any }, userContext: User) {
        if (userContext) {
            var tagKeys: ContextTagKeys = new ContextTagKeys();
            if (typeof userContext.accountId === "string") {
                tagsItem[tagKeys.userAccountId] = userContext.accountId;
            }
            if (typeof userContext.agent === "string") {
                tagsItem[tagKeys.userAgent] = userContext.agent;
            }
            if (typeof userContext.id === "string") {
                tagsItem[tagKeys.userId] = userContext.id;
            }
            if (typeof userContext.authenticatedId === "string") {
                tagsItem[tagKeys.userAuthUserId] = userContext.authenticatedId;
            }
            if (typeof userContext.storeRegion === "string") {
                tagsItem[tagKeys.userStoreRegion] = userContext.storeRegion;
            }
        }
    }
}