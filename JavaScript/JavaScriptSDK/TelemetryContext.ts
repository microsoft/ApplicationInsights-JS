/// <reference path="sender.ts"/>
/// <reference path="telemetry/trace.ts" />
/// <reference path="telemetry/event.ts" />
/// <reference path="telemetry/exception.ts" />
/// <reference path="telemetry/metric.ts" />
/// <reference path="telemetry/pageview.ts" />
/// <reference path="telemetry/pageviewperformance.ts" />
/// <reference path="telemetry/SessionTelemetry.ts" />
/// <reference path="./Util.ts"/>
/// <reference path="./Contracts/Generated/SessionState.ts"/>
/// <reference path="./Sampling.ts"/>

module Microsoft.ApplicationInsights {
    "use strict";

    export interface ITelemetryConfig extends ISenderConfig {
        instrumentationKey: () => string;
        accountId: () => string;
        sessionRenewalMs: () => number;
        sessionExpirationMs: () => number;
        sampleRate: () => number;
    }

    export class TelemetryContext {
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
         * The session manager that manages session on the base of cookies.
         */
        public _sessionManager: Microsoft.ApplicationInsights.Context._SessionManager;

        constructor(config: ITelemetryConfig) {
            this._config = config;
            this._sender = new Sender(config);
            // window will be undefined in node.js where we do not want to initialize contexts
            if (typeof window !== 'undefined') {
                this._sessionManager = new ApplicationInsights.Context._SessionManager(
                    config,
                    (sessionState, timestamp) => TelemetryContext._sessionHandler(this, sessionState, timestamp));
                this.application = new Context.Application();
                this.device = new Context.Device();
                this.internal = new Context.Internal();
                this.location = new Context.Location();
                this.user = new Context.User(config.accountId());
                this.operation = new Context.Operation();
                this.session = new Context.Session();
                this.sample = new Context.Sample(config.sampleRate());
            }
        }

        /**
         * Use Sender.ts to send telemetry object to the endpoint
         */
        public track(envelope: Telemetry.Common.Envelope) {
            if (!envelope) {
                _InternalLogging.throwInternalUserActionable(LoggingSeverity.CRITICAL, "cannot call .track() with a null or undefined argument");
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

        private _track(envelope: Telemetry.Common.Envelope) {

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

            if (this.sample.isSampledIn(envelope)) {
                this._sender.send(envelope);
            }
            else {
                _InternalLogging.logInternalMessage(LoggingSeverity.WARNING,
                    "Telemetry is sampled and not sent to the AI service. SampleRate is " + this.sample.sampleRate);
            }

            return envelope;
        }

        private static _sessionHandler(tc: TelemetryContext, sessionState: AI.SessionState, timestamp: number) {

            var sessionStateTelemetry = new Telemetry.SessionTelemetry(sessionState);
            var sessionStateData = new ApplicationInsights.Telemetry.Common.Data<ApplicationInsights.Telemetry.SessionTelemetry>(Telemetry.SessionTelemetry.dataType, sessionStateTelemetry);
            var sessionStateEnvelope = new Telemetry.Common.Envelope(sessionStateData, Telemetry.SessionTelemetry.envelopeType);

            sessionStateEnvelope.time = Util.toISOStringForIE8(new Date(timestamp));

            tc._track(sessionStateEnvelope);
        }

        private _applyApplicationContext(envelope: Microsoft.Telemetry.Envelope, appContext: Microsoft.ApplicationInsights.Context.Application) {
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

        private _applyDeviceContext(envelope: Microsoft.Telemetry.Envelope, deviceContext: Microsoft.ApplicationInsights.Context.Device) {
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

        private _applyInternalContext(envelope: Microsoft.Telemetry.Envelope, internalContext: Microsoft.ApplicationInsights.Context.Internal) {
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

        private _applyLocationContext(envelope: Microsoft.Telemetry.Envelope, locationContext: Microsoft.ApplicationInsights.Context.Location) {
            if (locationContext) {
                var tagKeys: AI.ContextTagKeys = new AI.ContextTagKeys();
                if (typeof locationContext.ip === "string") {
                    envelope.tags[tagKeys.locationIp] = locationContext.ip;
                }
            }
        }

        private _applyOperationContext(envelope: Microsoft.Telemetry.Envelope, operationContext: Microsoft.ApplicationInsights.Context.Operation) {
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

        private _applySampleContext(envelope: Microsoft.Telemetry.Envelope, sampleContext: Microsoft.ApplicationInsights.Context.Sample) {
            if (sampleContext) {
                var tagKeys: AI.ContextTagKeys = new AI.ContextTagKeys();
                envelope.tags[tagKeys.sampleRate] = sampleContext.sampleRate;
            }
        }

        private _applySessionContext(envelope: Microsoft.Telemetry.Envelope, sessionContext: Microsoft.ApplicationInsights.Context.Session) {
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

        private _applyUserContext(envelope: Microsoft.Telemetry.Envelope, userContext: Microsoft.ApplicationInsights.Context.User) {
            if (userContext) {
                var tagKeys: AI.ContextTagKeys = new AI.ContextTagKeys();
                if (typeof userContext.accountAcquisitionDate === "string") {
                    envelope.tags[tagKeys.userAccountAcquisitionDate] = userContext.accountAcquisitionDate;
                }
                if (typeof userContext.accountId === "string") {
                    envelope.tags[tagKeys.userAccountId] = userContext.accountId;
                }
                if (typeof userContext.agent === "string") {
                    envelope.tags[tagKeys.userAgent] = userContext.agent;
                }
                if (typeof userContext.id === "string") {
                    envelope.tags[tagKeys.userId] = userContext.id;
                }
                if (typeof userContext.storeRegion === "string") {
                    envelope.tags[tagKeys.userStoreRegion] = userContext.storeRegion;
                }
            }
        }
    }
}