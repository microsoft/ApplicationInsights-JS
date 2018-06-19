///<reference path="../node_modules/applicationinsights-common/bundle/applicationinsights-common.d.ts" />

import { 
    Trace, Event, Exception, Metric, 
    IEnvelope, ContextTagKeys,
    RemoteDependencyData, _InternalLogging, 
    _InternalMessageId, LoggingSeverity, Util,
    Data,PageViewPerformance, PageView } from "applicationinsights-common";
import { ITelemetryContext } from '../JavaScriptSDK.Interfaces/ITelemetryContext';
import { Application } from './Context/Application';
import { Device } from './Context/Device';
import { Internal } from './Context/Internal';
import { Location } from './Context/Location';
import { Operation } from './Context/Operation';
import { Sample } from './Context/Sample';
import { User } from './Context/User';
import { Session, _SessionManager } from './Context/Session';

export interface ITelemetryConfig {
    instrumentationKey: () => string;
    accountId: () => string;
    sessionRenewalMs: () => number;
    sampleRate: () => number;
    sessionExpirationMs: () => number;
    cookieDomain: () => string;
    sdkExtension: () => string;
    isBrowserLinkTrackingEnabled: () => boolean;
    appId: () => string;
}

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
    * The array of telemetry initializers to call before sending each telemetry item.
    */
    private telemetryInitializers: { (envelope: IEnvelope): boolean | void; }[];

    /**
     * The session manager that manages session on the base of cookies.
     */
    public _sessionManager: _SessionManager;

    constructor(config: ITelemetryConfig) {
        this._config = config;
//        this._sender = new Sender(config);
        // this.appId = () => this._sender._appId;

        // // use appId set in config instead of getting it from the backend
        // if (config.appId()) {
        //     this._sender._appId = config.appId();
        // }

        this.telemetryInitializers = [];

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
    * Adds telemetry initializer to the collection. Telemetry initializers will be called one by one
    * before telemetry item is pushed for sending and in the order they were added.
    */
    public addTelemetryInitializer(telemetryInitializer: (envelope: IEnvelope) => boolean | void) {
        this.telemetryInitializers.push(telemetryInitializer);
    }

    /**
     * Use Sender.ts to send telemetry object to the endpoint
     */
    public track(envelope: IEnvelope) {
        if (!envelope) {
            _InternalLogging.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.TrackArgumentsNotSpecified,
                "cannot call .track() with a null or undefined argument", null, true);
        } else {
            // If the envelope is PageView, reset the internal message count so that we can send internal telemetry for the new page.
            if (envelope.name === PageView.envelopeType) {
                _InternalLogging.resetInternalMessageCount();
            }

            if (this.session) {
                // If customer did not provide custom session id update sessionmanager
                if (typeof this.session.id !== "string") {
                    this._sessionManager.update();
                }
            }

            this._track(envelope);
        }

        return envelope;
    }

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

    private _track(envelope: IEnvelope) {

        if (this.session) {
            // If customer set id, apply his context; otherwise apply context generated from cookies 
            if (typeof this.session.id === "string") {
                this._applySessionContext(envelope, this.session);
            } else {
                this._applySessionContext(envelope, this._sessionManager.automaticSession);
            }
        }

        this._applyApplicationContext(envelope, this.application);
        this._applyDeviceContext(envelope, this.device);
        this._applyInternalContext(envelope, this.internal);
        this._applyLocationContext(envelope, this.location);
        this._applySampleContext(envelope, this.sample);
        this._applyUserContext(envelope, this.user);
        this._applyOperationContext(envelope, this.operation);

        envelope.iKey = this._config.instrumentationKey();

        var doNotSendItem = false;
        try {
            var telemetryInitializersCount = this.telemetryInitializers.length;
            for (var i = 0; i < telemetryInitializersCount; ++i) {
                var telemetryInitializer = this.telemetryInitializers[i];
                if (telemetryInitializer) {
                    if (telemetryInitializer.apply(null, [envelope]) === false) {
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
            if (envelope.name === Metric.envelopeType ||
                this.sample.isSampledIn(envelope)) {
                var iKeyNoDashes = this._config.instrumentationKey().replace(/-/g, "");
                envelope.name = envelope.name.replace("{0}", iKeyNoDashes);
                //this._sender.send(envelope);
            } else {
                _InternalLogging.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.TelemetrySampledAndNotSent,
                    "Telemetry is sampled and not sent to the AI service.", { SampleRate: this.sample.sampleRate }, true);
            }
        }

        return envelope;
    }

    private _applyApplicationContext(envelope: IEnvelope, appContext: Application) {
        if (appContext) {
            var tagKeys: ContextTagKeys = new ContextTagKeys();

            if (typeof appContext.ver === "string") {
                envelope.tags[tagKeys.applicationVersion] = appContext.ver;
            }
            if (typeof appContext.build === "string") {
                envelope.tags[tagKeys.applicationBuild] = appContext.build;
            }
        }
    }

    private _applyDeviceContext(envelope: IEnvelope, deviceContext: Device) {
        var tagKeys: ContextTagKeys = new ContextTagKeys();

        if (deviceContext) {
            if (typeof deviceContext.id === "string") {
                envelope.tags[tagKeys.deviceId] = deviceContext.id;
            }
            if (typeof deviceContext.ip === "string") {
                envelope.tags[tagKeys.deviceIp] = deviceContext.ip;
            }
            if (typeof deviceContext.language === "string") {
                envelope.tags[tagKeys.deviceLanguage] = deviceContext.language;
            }
            if (typeof deviceContext.locale === "string") {
                envelope.tags[tagKeys.deviceLocale] = deviceContext.locale;
            }
            if (typeof deviceContext.model === "string") {
                envelope.tags[tagKeys.deviceModel] = deviceContext.model;
            }
            if (typeof deviceContext.network !== "undefined") {
                envelope.tags[tagKeys.deviceNetwork] = deviceContext.network;
            }
            if (typeof deviceContext.oemName === "string") {
                envelope.tags[tagKeys.deviceOEMName] = deviceContext.oemName;
            }
            if (typeof deviceContext.os === "string") {
                envelope.tags[tagKeys.deviceOS] = deviceContext.os;
            }
            if (typeof deviceContext.osversion === "string") {
                envelope.tags[tagKeys.deviceOSVersion] = deviceContext.osversion;
            }
            if (typeof deviceContext.resolution === "string") {
                envelope.tags[tagKeys.deviceScreenResolution] = deviceContext.resolution;
            }
            if (typeof deviceContext.type === "string") {
                envelope.tags[tagKeys.deviceType] = deviceContext.type;
            }
        }
    }

    private _applyInternalContext(envelope: IEnvelope, internalContext: Internal) {
        if (internalContext) {
            var tagKeys: ContextTagKeys = new ContextTagKeys();
            if (typeof internalContext.agentVersion === "string") {
                envelope.tags[tagKeys.internalAgentVersion] = internalContext.agentVersion;
            }
            if (typeof internalContext.sdkVersion === "string") {
                envelope.tags[tagKeys.internalSdkVersion] = internalContext.sdkVersion;
            }
        }
    }

    private _applyLocationContext(envelope: IEnvelope, locationContext: Location) {
        if (locationContext) {
            var tagKeys: ContextTagKeys = new ContextTagKeys();
            if (typeof locationContext.ip === "string") {
                envelope.tags[tagKeys.locationIp] = locationContext.ip;
            }
        }
    }

    private _applyOperationContext(envelope: IEnvelope, operationContext: Operation) {
        if (operationContext) {
            var tagKeys: ContextTagKeys = new ContextTagKeys();
            if (typeof operationContext.id === "string") {
                envelope.tags[tagKeys.operationId] = operationContext.id;
            }
            if (typeof operationContext.name === "string") {
                envelope.tags[tagKeys.operationName] = operationContext.name;
            }
            if (typeof operationContext.parentId === "string") {
                envelope.tags[tagKeys.operationParentId] = operationContext.parentId;
            }
            if (typeof operationContext.rootId === "string") {
                envelope.tags[tagKeys.operationRootId] = operationContext.rootId;
            }
            if (typeof operationContext.syntheticSource === "string") {
                envelope.tags[tagKeys.operationSyntheticSource] = operationContext.syntheticSource;
            }
        }
    }

    private _applySampleContext(envelope: IEnvelope, sampleContext: Sample) {
        if (sampleContext) {
            envelope.sampleRate = sampleContext.sampleRate;
        }
    }

    private _applySessionContext(envelope: IEnvelope, sessionContext: Session) {
        if (sessionContext) {
            var tagKeys: ContextTagKeys = new ContextTagKeys();
            if (typeof sessionContext.id === "string") {
                envelope.tags[tagKeys.sessionId] = sessionContext.id;
            }
            if (typeof sessionContext.isFirst !== "undefined") {
                envelope.tags[tagKeys.sessionIsFirst] = sessionContext.isFirst;
            }
        }
    }

    private _applyUserContext(envelope: IEnvelope, userContext: User) {
        if (userContext) {
            var tagKeys: ContextTagKeys = new ContextTagKeys();
            if (typeof userContext.accountId === "string") {
                envelope.tags[tagKeys.userAccountId] = userContext.accountId;
            }
            if (typeof userContext.agent === "string") {
                envelope.tags[tagKeys.userAgent] = userContext.agent;
            }
            if (typeof userContext.id === "string") {
                envelope.tags[tagKeys.userId] = userContext.id;
            }
            if (typeof userContext.authenticatedId === "string") {
                envelope.tags[tagKeys.userAuthUserId] = userContext.authenticatedId;
            }
            if (typeof userContext.storeRegion === "string") {
                envelope.tags[tagKeys.userStoreRegion] = userContext.storeRegion;
            }
        }
    }
}