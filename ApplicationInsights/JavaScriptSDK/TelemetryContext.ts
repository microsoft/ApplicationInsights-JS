import {
    Metric, IEnvelope, ContextTagKeys,
    RemoteDependencyData, _InternalLogging,
    _InternalMessageId, LoggingSeverity, Util,
    Data, PageView
} from "applicationinsights-common";
import { ITelemetryContext } from '../JavaScriptSDK.Interfaces/ITelemetryContext';
import { Application } from './Context/Application';
import { Device } from './Context/Device';
import { Internal } from './Context/Internal';
import { Location } from './Context/Location';
import { Operation } from './Context/Operation';
import { Sample } from './Context/Sample';
import { User } from './Context/User';
import { Session, _SessionManager } from './Context/Session';
import { IAppInsightsCore, ITelemetryItem, CoreUtils } from "applicationinsights-core-js";
import { TelemetryItemCreator } from "./TelemetryItemCreator";
import { ITelemetryConfig } from "../JavaScriptSDK.Interfaces/ITelemetryConfig";


export class TelemetryContext implements ITelemetryContext {
    /**
     * The configuration for this telemetry context
     */
    public _config: ITelemetryConfig;

    // /**
    //  * The sender instance for this context
    //  */
    // public _sender: Sender;

    /**
     * The object describing a component tracked by this object.
     */
    public application: Application;

    /**
     * The object describing a device tracked by this object.
     */
    public device: Device;

    public internal: Internal;

    /**
     * The object describing a location tracked by this object.
     */
    public location: Location;

    /**
     * The object describing a operation tracked by this object.
     */
    public operation: Operation;

    public sample: Sample;

    /**
     * The object describing a user tracked by this object.
     */
    public user: User;

    /**
     * The object describing a session tracked by this object.
     */
    public session: Session;

    /**
     * AppId of this component if returned by the backend.
     */
    public appId: () => string;

    /**
     * The session manager that manages session on the base of cookies.
     */
    public _sessionManager: _SessionManager;

    /**
    * Internal telemetry initializers.
    */
    private _telemetryInitializers: { (envelope: IEnvelope): boolean | void; }[];

    private _core: IAppInsightsCore;

    constructor(config: ITelemetryConfig, core: IAppInsightsCore) {
        this._config = config;
        this._core = core;

        this._telemetryInitializers = [];

        // window will be undefined in node.js where we do not want to initialize contexts
        if (typeof window !== 'undefined') {
            this._sessionManager = new _SessionManager(config);
            this.application = new Application();
            this.device = new Device();
            this.internal = new Internal(config);
            this.location = new Location();
            this.user = new User(config);
            this.operation = new Operation();
            this.session = new Session();
            this.sample = new Sample(config.sampleRate());
        }

        this._addDefaultTelemetryInitializers();
    }

    /**
    * Adds internal telemetry initializer to the collection.
    */
    private addTelemetryInitializer(telemetryInitializer: (envelope: IEnvelope) => boolean | void) {
        this._telemetryInitializers.push(telemetryInitializer);
    }

    /**
     * Uses channel to send telemetry object to the endpoint
     */
    public track(telemetryItem: ITelemetryItem) {
        if (CoreUtils.isNullOrUndefined(telemetryItem)) {
            _InternalLogging.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.TrackArgumentsNotSpecified,
                "cannot call .track() with a null or undefined argument", null, true);
        } else {
            // If the envelope is PageView, reset the internal message count so that we can send internal telemetry for the new page.
            if (telemetryItem.name === PageView.envelopeType) {
                _InternalLogging.resetInternalMessageCount();
            }

            if (this.session) {
                // If customer did not provide custom session id update sessionmanager
                if (typeof this.session.id !== "string") {
                    this._sessionManager.update();
                }
            }

            this._track(telemetryItem);
        }

        return telemetryItem;
    }

    // Todo: move to separate extension
    private _addDefaultTelemetryInitializers() {
        if (!this._config.isBrowserLinkTrackingEnabled()) {
            const browserLinkPaths = ['/browserLinkSignalR/', '/__browserLink/'];
            let dropBrowserLinkRequests = (envelope: IEnvelope) => {
                if (envelope.name === RemoteDependencyData.envelopeType) {
                    let remoteData = envelope.data as Data<RemoteDependencyData>;
                    if (remoteData && remoteData.baseData) {
                        for (let i = 0; i < browserLinkPaths.length; i++) {
                            if (remoteData.baseData.name.indexOf(browserLinkPaths[i]) >= 0) {
                                return false;
                            }
                        }
                    }
                }

                return true;
            }

            this.addTelemetryInitializer(dropBrowserLinkRequests)
        }
    }

    private _track(telemetryItem: ITelemetryItem) {
        let tagsItem: { [key: string]: any } = {};

        if (this.session) {
            // If customer set id, apply his context; otherwise apply context generated from cookies 
            if (typeof this.session.id === "string") {
                this._applySessionContext(tagsItem, this.session);
            } else {
                this._applySessionContext(tagsItem, this._sessionManager.automaticSession);
            }
        }

        // set Part A fields
        this._applyApplicationContext(tagsItem, this.application);
        this._applyDeviceContext(tagsItem, this.device);
        this._applyInternalContext(tagsItem, this.internal);
        this._applyLocationContext(tagsItem, this.location);
        this._applySampleContext(tagsItem, this.sample);
        this._applyUserContext(tagsItem, this.user);
        this._applyOperationContext(tagsItem, this.operation);
        telemetryItem.tags.push(tagsItem);

        // set instrumentation key
        telemetryItem.instrumentationKey = this._config.instrumentationKey();

        var doNotSendItem = false;
        try {
            var telemetryInitializersCount = this._telemetryInitializers.length;
            for (var i = 0; i < telemetryInitializersCount; ++i) {
                var telemetryInitializer = this._telemetryInitializers[i];
                if (telemetryInitializer) {
                    if (telemetryInitializer.apply(null, [telemetryItem]) === false) {
                        doNotSendItem = true;
                        break;
                    }
                }
            }
        } catch (e) {
            doNotSendItem = true;
            _InternalLogging.throwInternal(
                LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "One of telemetry initializers failed, telemetry item will not be sent: " + Util.getExceptionName(e),
                { exception: Util.dump(e) }, true);
        }

        if (!doNotSendItem) {
            if (telemetryItem.name === Metric.envelopeType || this.sample.isSampledIn(telemetryItem)) {
                var iKeyNoDashes = this._config.instrumentationKey().replace(/-/g, "");
                telemetryItem.name = telemetryItem.name.replace("{0}", iKeyNoDashes);

                // map and send data
                this._core.track(telemetryItem);
            } else {
                _InternalLogging.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.TelemetrySampledAndNotSent,
                    "Telemetry is sampled and not sent to the AI service.", { SampleRate: this.sample.sampleRate }, true);
            }
        }

        return telemetryItem;
    }

    private _applyApplicationContext(tagsItem: { [key: string]: any }, appContext: Application) {
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

    private _applyDeviceContext(tagsItem: { [key: string]: any }, deviceContext: Device) {
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

    private _applyInternalContext(tagsItem: { [key: string]: any }, internalContext: Internal) {
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

    private _applyLocationContext(tagsItem: { [key: string]: any }, locationContext: Location) {
        if (locationContext) {
            var tagKeys: ContextTagKeys = new ContextTagKeys();
            if (typeof locationContext.ip === "string") {
                tagsItem[tagKeys.locationIp] = locationContext.ip;
            }
        }
    }

    private _applyOperationContext(tagsItem: { [key: string]: any }, operationContext: Operation) {
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

    private _applySampleContext(tagsItem: { [key: string]: any }, sampleContext: Sample) {
        if (sampleContext) {
            tagsItem.sampleRate = sampleContext.sampleRate;
        }
    }

    private _applySessionContext(tags: { [key: string]: any }, sessionContext: Session) {
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

    private _applyUserContext(tagsItem: { [key: string]: any }, userContext: User) {
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