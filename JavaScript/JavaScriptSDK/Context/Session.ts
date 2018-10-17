// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="../Util.ts" />
/// <reference path="../../JavaScriptSDK.Interfaces/Context/ISession.ts" />

module Microsoft.ApplicationInsights.Context {

    "use strict";

    export interface ISessionConfig {
        sessionRenewalMs: () => number;
        sessionExpirationMs: () => number;
        cookieDomain: () => string;
    }

    export class Session implements ISession {
        /**
         * The session ID.
         */
        public id: string;

        /**  
         * The true if this is the first session  
         */
        public isFirst: boolean;

        /**
         * The date at which this guid was genereated.
         * Per the spec the ID will be regenerated if more than acquisitionSpan milliseconds ellapse from this time.
         */
        public acquisitionDate: number;

        /**
         * The date at which this session ID was last reported.
         * This value should be updated whenever telemetry is sent using this ID.
         * Per the spec the ID will be regenerated if more than renewalSpan milliseconds elapse from this time with no activity.
         */
        public renewalDate: number;
    }

    export class _SessionManager {

        public static acquisitionSpan = 86400000; // 24 hours in ms
        public static renewalSpan = 1800000; // 30 minutes in ms
        public static cookieUpdateInterval = 60000 // 1 minute in ms
        public automaticSession: Session;
        public config: ISessionConfig;

        private cookieUpdatedTimestamp: number;

        constructor(config: ISessionConfig) {

            if (!config) {
                config = <any>{};
            }

            if (!(typeof config.sessionExpirationMs === "function")) {
                config.sessionExpirationMs = () => _SessionManager.acquisitionSpan;
            }

            if (!(typeof config.sessionRenewalMs === "function")) {
                config.sessionRenewalMs = () => _SessionManager.renewalSpan;
            }

            this.config = config;

            this.automaticSession = new Session();
        }

        public update() {
            if (!this.automaticSession.id) {
                this.initializeAutomaticSession();
            }

            var now = dateTime.Now();

            var acquisitionExpired = now - this.automaticSession.acquisitionDate > this.config.sessionExpirationMs();
            var renewalExpired = now - this.automaticSession.renewalDate > this.config.sessionRenewalMs();

            // renew if acquisitionSpan or renewalSpan has ellapsed
            if (acquisitionExpired || renewalExpired) {
                // update automaticSession so session state has correct id                
                this.automaticSession.isFirst = undefined;
                this.renew();
            } else {
                // do not update the cookie more often than cookieUpdateInterval
                if (!this.cookieUpdatedTimestamp || now - this.cookieUpdatedTimestamp > _SessionManager.cookieUpdateInterval) {
                    this.automaticSession.renewalDate = now;
                    this.setCookie(this.automaticSession.id, this.automaticSession.acquisitionDate, this.automaticSession.renewalDate);
                }
            }
        }

        /**
         *  Record the current state of the automatic session and store it in our cookie string format
         *  into the browser's local storage. This is used to restore the session data when the cookie
         *  expires.
         */
        public backup() {
            this.setStorage(this.automaticSession.id, this.automaticSession.acquisitionDate, this.automaticSession.renewalDate);
        }

        /**
         *  Use ai_session cookie data or local storage data (when the cookie is unavailable) to
         *  initialize the automatic session.
         */
        private initializeAutomaticSession() {
            var cookie = Util.getCookie('ai_session');
            if (cookie && typeof cookie.split === "function") {
                this.initializeAutomaticSessionWithData(cookie);
            } else {
                // There's no cookie, but we might have session data in local storage
                // This can happen if the session expired or the user actively deleted the cookie
                // We only want to recover data if the cookie is missing from expiry. We should respect the user's wishes if the cookie was deleted actively.
                // The User class handles this for us and deletes our local storage object if the persistent user cookie was removed.
                var storage = Util.getStorage('ai_session');
                if (storage) {
                    this.initializeAutomaticSessionWithData(storage);
                }
            }

            if (!this.automaticSession.id) {
                this.automaticSession.isFirst = true;
                this.renew();
            }
        }

        /**
         *  Extract id, aquisitionDate, and renewalDate from an ai_session payload string and
         *  use this data to initialize automaticSession.
         *
         *  @param {string} sessionData - The string stored in an ai_session cookie or local storage backup
         */
        private initializeAutomaticSessionWithData(sessionData: string) {
            var params = sessionData.split("|");

            if (params.length > 0) {
                this.automaticSession.id = params[0];
            }

            try {
                if (params.length > 1) {
                    var acq = +params[1];
                    this.automaticSession.acquisitionDate = +new Date(acq);
                    this.automaticSession.acquisitionDate = this.automaticSession.acquisitionDate > 0 ? this.automaticSession.acquisitionDate : 0;
                }

                if (params.length > 2) {
                    var renewal = +params[2];
                    this.automaticSession.renewalDate = +new Date(renewal);
                    this.automaticSession.renewalDate = this.automaticSession.renewalDate > 0 ? this.automaticSession.renewalDate : 0;
                }
            } catch (e) {
                _InternalLogging.throwInternal(LoggingSeverity.CRITICAL,

                    _InternalMessageId.ErrorParsingAISessionCookie,
                    "Error parsing ai_session cookie, session will be reset: " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }

            if (this.automaticSession.renewalDate == 0) {
                _InternalLogging.throwInternal(LoggingSeverity.WARNING,
                    _InternalMessageId.SessionRenewalDateIsZero,
                    "AI session renewal date is 0, session will be reset.");
            }
        }

        private renew() {
            var now = dateTime.Now();

            this.automaticSession.id = Util.newId();
            this.automaticSession.acquisitionDate = now;
            this.automaticSession.renewalDate = now;

            this.setCookie(this.automaticSession.id, this.automaticSession.acquisitionDate, this.automaticSession.renewalDate);

            // If this browser does not support local storage, fire an internal log to keep track of it at this point
            if (!Util.canUseLocalStorage()) {
                _InternalLogging.throwInternal(LoggingSeverity.WARNING,
                    _InternalMessageId.BrowserDoesNotSupportLocalStorage,
                    "Browser does not support local storage. Session durations will be inaccurate.");
            }
        }

        private setCookie(guid: string, acq: number, renewal: number) {
            // Set cookie to expire after the session expiry time passes or the session renewal deadline, whichever is sooner
            // Expiring the cookie will cause the session to expire even if the user isn't on the page
            var acquisitionExpiry = acq + this.config.sessionExpirationMs();
            var renewalExpiry = renewal + this.config.sessionRenewalMs();
            var cookieExpiry = new Date();
            var cookie = [guid, acq, renewal];

            if (acquisitionExpiry < renewalExpiry) {
                cookieExpiry.setTime(acquisitionExpiry);
            } else {
                cookieExpiry.setTime(renewalExpiry);
            }

            var cookieDomnain = this.config.cookieDomain ? this.config.cookieDomain() : null;

            Util.setCookie('ai_session', cookie.join('|') + ';expires=' + cookieExpiry.toUTCString(), cookieDomnain);

            this.cookieUpdatedTimestamp = dateTime.Now();
        }

        private setStorage(guid: string, acq: number, renewal: number) {
            // Keep data in local storage to retain the last session id, allowing us to cleanly end the session when it expires
            // Browsers that don't support local storage won't be able to end sessions cleanly from the client
            // The server will notice this and end the sessions itself, with loss of accurate session duration
            Util.setStorage('ai_session', [guid, acq, renewal].join('|'));
        }
    }
} 