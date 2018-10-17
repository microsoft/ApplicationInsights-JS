// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="Sender.ts"/>
/// <reference path="Telemetry/Trace.ts" />
/// <reference path="Telemetry/Event.ts" />
/// <reference path="Telemetry/Exception.ts" />
/// <reference path="Telemetry/Metric.ts" />
/// <reference path="Telemetry/PageView.ts" />
/// <reference path="Telemetry/PageViewPerformance.ts" />
/// <reference path="./Util.ts"/>
/// <reference path="../JavaScriptSDK.Interfaces/ITelemetryContext.ts" />

module Microsoft.ApplicationInsights {
    "use strict";

    export interface ITelemetryConfig extends ISenderConfig {
        instrumentationKey: () => string;
        accountId: () => string;
        sessionRenewalMs: () => number;
        sessionExpirationMs: () => number;
        sampleRate: () => number;
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

        /**
         * The sender instance for this context
         */
        public _sender: Sender;

        /**
         * The object describing a component tracked by this object.
         */
        public application: Context.Application;

        /**
         * The object describing a device tracked by this object.
         */
        public device: Context.Device;

        public internal: Context.Internal;

        /**
         * The object describing a location tracked by this object.
         */
        public location: Context.Location;

        /**
         * The object describing a operation tracked by this object.
         */
        public operation: Context.Operation;

        public sample: Context.Sample;

        /**
         * The object describing a user tracked by this object.
         */
        public user: Context.User;

        /**
         * The object describing a session tracked by this object.
         */
        public session: Context.Session;

        /**
         * AppId of this component if returned by the backend.
         */
        public appId: () => string;

        /**
        * The array of telemetry initializers to call before sending each telemetry item.
        */
        private telemetryInitializers: { (envelope: Microsoft.ApplicationInsights.IEnvelope): boolean | void; }[];

        /**
         * The session manager that manages session on the base of cookies.
         */
        public _sessionManager: Microsoft.ApplicationInsights.Context._SessionManager;

        constructor(config: ITelemetryConfig) {
            this._config = config;
            this._sender = new Sender(config);
            this.appId = () => this._sender._appId;

            // use appId set in config instead of getting it from the backend
            if (config.appId()) {
                this._sender._appId = config.appId();
            }

            this.telemetryInitializers = [];

            // window will be undefined in node.js where we do not want to initialize contexts
            if (typeof window !== 'undefined') {
                this._sessionManager = new ApplicationInsights.Context._SessionManager(config);
                this.application = new Context.Application();
                this.device = new Context.Device();
                this.internal = new Context.Internal(config);
                this.location = new Context.Location();
                this.user = new Context.User(config);
                this.operation = new Context.Operation();
                this.session = new Context.Session();
                this.sample = new Context.Sample(config.sampleRate());
            }

            this._addDefaultTelemetryInitializers();
        }

        /**
        * Adds telemetry initializer to the collection. Telemetry initializers will be called one by one
        * before telemetry item is pushed for sending and in the order they were added.
        */
        public addTelemetryInitializer(telemetryInitializer: (envelope: Microsoft.ApplicationInsights.IEnvelope) => boolean | void) {
            this.telemetryInitializers.push(telemetryInitializer);
        }

        /**
         * Use Sender.ts to send telemetry object to the endpoint
         */
        public track(envelope: Microsoft.ApplicationInsights.IEnvelope) {
            if (!envelope) {
                _InternalLogging.throwInternal(
                    LoggingSeverity.CRITICAL,
                    _InternalMessageId.TrackArgumentsNotSpecified,
                    "cannot call .track() with a null or undefined argument", null, true);
            } else {
                // If the envelope is PageView, reset the internal message count so that we can send internal telemetry for the new page.
                if (envelope.name === Telemetry.PageView.envelopeType) {
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
                let dropBrowserLinkRequests = (envelope: Microsoft.ApplicationInsights.IEnvelope) => {
                    if (envelope.name === Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData.envelopeType) {
                        let remoteData = envelope.data as Telemetry.Common.Data<Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData>;
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

        private _track(envelope: Microsoft.ApplicationInsights.IEnvelope) {

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
                if (envelope.name === Telemetry.Metric.envelopeType ||
                    this.sample.isSampledIn(envelope)) {
                    var iKeyNoDashes = this._config.instrumentationKey().replace(/-/g, "");
                    envelope.name = envelope.name.replace("{0}", iKeyNoDashes);
                    this._sender.send(envelope);
                } else {
                    _InternalLogging.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.TelemetrySampledAndNotSent,
                        "Telemetry is sampled and not sent to the AI service.", { SampleRate: this.sample.sampleRate }, true);
                }
            }

            return envelope;
        }

        private _applyApplicationContext(envelope: Microsoft.ApplicationInsights.IEnvelope, appContext: Microsoft.ApplicationInsights.Context.Application) {
            if (appContext) {
                var tagKeys: AI.ContextTagKeys = new AI.ContextTagKeys();

                if (typeof appContext.ver === "string") {
                    envelope.tags[tagKeys.applicationVersion] = appContext.ver;
                }
                if (typeof appContext.build === "string") {
                    envelope.tags[tagKeys.applicationBuild] = appContext.build;
                }
            }
        }

        private _applyDeviceContext(envelope: Microsoft.ApplicationInsights.IEnvelope, deviceContext: Microsoft.ApplicationInsights.Context.Device) {
            var tagKeys: AI.ContextTagKeys = new AI.ContextTagKeys();

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

        private _applyInternalContext(envelope: Microsoft.ApplicationInsights.IEnvelope, internalContext: Microsoft.ApplicationInsights.Context.Internal) {
            if (internalContext) {
                var tagKeys: AI.ContextTagKeys = new AI.ContextTagKeys();
                if (typeof internalContext.agentVersion === "string") {
                    envelope.tags[tagKeys.internalAgentVersion] = internalContext.agentVersion;
                }
                if (typeof internalContext.sdkVersion === "string") {
                    envelope.tags[tagKeys.internalSdkVersion] = internalContext.sdkVersion;
                }
            }
        }

        private _applyLocationContext(envelope: Microsoft.ApplicationInsights.IEnvelope, locationContext: Microsoft.ApplicationInsights.Context.Location) {
            if (locationContext) {
                var tagKeys: AI.ContextTagKeys = new AI.ContextTagKeys();
                if (typeof locationContext.ip === "string") {
                    envelope.tags[tagKeys.locationIp] = locationContext.ip;
                }
            }
        }

        private _applyOperationContext(envelope: Microsoft.ApplicationInsights.IEnvelope, operationContext: Microsoft.ApplicationInsights.Context.Operation) {
            if (operationContext) {
                var tagKeys: AI.ContextTagKeys = new AI.ContextTagKeys();
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

        private _applySampleContext(envelope: Microsoft.ApplicationInsights.IEnvelope, sampleContext: Microsoft.ApplicationInsights.Context.Sample) {
            if (sampleContext) {
                envelope.sampleRate = sampleContext.sampleRate;
            }
        }

        private _applySessionContext(envelope: Microsoft.ApplicationInsights.IEnvelope, sessionContext: Microsoft.ApplicationInsights.Context.Session) {
            if (sessionContext) {
                var tagKeys: AI.ContextTagKeys = new AI.ContextTagKeys();
                if (typeof sessionContext.id === "string") {
                    envelope.tags[tagKeys.sessionId] = sessionContext.id;
                }
                if (typeof sessionContext.isFirst !== "undefined") {
                    envelope.tags[tagKeys.sessionIsFirst] = sessionContext.isFirst;
                }
            }
        }

        private _applyUserContext(envelope: Microsoft.ApplicationInsights.IEnvelope, userContext: Microsoft.ApplicationInsights.Context.User) {
            if (userContext) {
                var tagKeys: AI.ContextTagKeys = new AI.ContextTagKeys();
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
}