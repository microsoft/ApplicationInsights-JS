/**
 * PropertiesPlugin.ts
 * @copyright Microsoft 2018
 */

import {
    ITelemetryPlugin, IConfiguration, CoreUtils,
    IAppInsightsCore, IPlugin, ITelemetryItem, IDiagnosticLogger
} from '@microsoft/applicationinsights-core-js';
import { ContextTagKeys, Util, PageView, ConfigurationManager, IConfig } from '@microsoft/applicationinsights-common';
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
import { IPropertiesPlugin } from './Interfaces/IPropertiesPlugin';

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
            instrumentationKey: undefined,
            accountId: undefined,
            sessionRenewalMs: undefined,
            samplingPercentage: undefined,
            sessionExpirationMs: undefined,
            cookieDomain: null,
            sdkExtension: undefined,
            isBrowserLinkTrackingEnabled: undefined,
            appId: undefined
        }
        return defaultConfig;
    }

    initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[]) {
        const defaultConfig: ITelemetryConfig = PropertiesPlugin.getDefaultConfig();
        this._extensionConfig = this._extensionConfig || PropertiesPlugin.getDefaultConfig();
        for (let field in defaultConfig) {
            this._extensionConfig[field] = () => ConfigurationManager.getConfig(config, field, this.identifier) || defaultConfig[field];
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
        let tagsItem: { [key: string]: any } = {};

        if (this.session) {
            // If customer set id, apply his context; otherwise apply context generated from cookies 
            if (typeof this.session.id === "string") {
                PropertiesPlugin._applySessionContext(tagsItem, this.session);
            } else {
                PropertiesPlugin._applySessionContext(tagsItem, this._sessionManager.automaticSession);
            }
        }

        // set part A  fields
        PropertiesPlugin._applyApplicationContext(tagsItem, this.application);
        PropertiesPlugin._applyDeviceContext(tagsItem, this.device);
        PropertiesPlugin._applyInternalContext(tagsItem, this.internal);
        PropertiesPlugin._applyLocationContext(tagsItem, this.location);
        PropertiesPlugin._applySampleContext(tagsItem, this.sample);
        PropertiesPlugin._applyUserContext(tagsItem, this.user);
        PropertiesPlugin._applyOperationContext(tagsItem, this.operation);
        event.tags.push(tagsItem);
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

    private static _applySampleContext(tagsItem: { [key: string]: any }, sampleContext: Sample) {
        if (sampleContext) {
            tagsItem.sampleRate = sampleContext.sampleRate;
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