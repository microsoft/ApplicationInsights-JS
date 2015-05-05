/// <reference path="../util.ts" />
/// <reference path="../Contracts/Generated/SessionState.ts"/>

module Microsoft.ApplicationInsights.Context {
    "use strict";

    export interface ISessionConfig {
        sessionRenewalMs: () => number;
        sessionExpirationMs: () => number;
    }

    export class Session {
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
        public automaticSession: Session;
        public config: ISessionConfig;
        
        public _sessionHandler: (sessionState: AI.SessionState, timestamp: number) => void;
        
        constructor(config: ISessionConfig, sessionHandler: (sessionState: AI.SessionState, timestamp: number) => void) {

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

            this._sessionHandler = sessionHandler;
            this.automaticSession = new Session();
        }

        public update() {
            if (!this.automaticSession.id) {
                this.initializeAutomaticSession();
            }

            var now = +new Date;

            var acquisitionExpired = now - this.automaticSession.acquisitionDate > this.config.sessionExpirationMs();
            var renewalExpired = now - this.automaticSession.renewalDate > this.config.sessionRenewalMs();

            // renew if acquisitionSpan or renewalSpan has ellapsed
            if (acquisitionExpired || renewalExpired) {
                // first send session end than update automaticSession so session state has correct id
                if (typeof this._sessionHandler === "function") {
                    this._sessionHandler(AI.SessionState.End, this.automaticSession.renewalDate);
                }
                this.automaticSession.isFirst = undefined;
                this.renew();
            } else {
                this.automaticSession.renewalDate = +new Date;
                this.setCookie(this.automaticSession.id, this.automaticSession.acquisitionDate, this.automaticSession.renewalDate);
            }
        }

        private initializeAutomaticSession() {
            var cookie = Util.getCookie('ai_session');
            if (cookie && typeof cookie.split === "function") {
                var params = cookie.split("|");
                if (params.length > 0) {
                    this.automaticSession.id = params[0];
                }

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
            }

            if (!this.automaticSession.id) {
                this.automaticSession.isFirst = true;
                this.renew();
            }
        }

        private renew() {
            var now = +new Date;

            this.automaticSession.id = Util.newGuid();
            this.automaticSession.acquisitionDate = now;
            this.automaticSession.renewalDate = now;

            this.setCookie(this.automaticSession.id, this.automaticSession.acquisitionDate, this.automaticSession.renewalDate);
            // first we updated automaticSession than we send session start so it has correct id
            if (typeof this._sessionHandler === "function") {
                this._sessionHandler(AI.SessionState.Start, now);
            }
        }

        private setCookie(guid: string, acq: number, renewal: number) {
            var date = new Date(acq);
            var cookie = [guid, acq, renewal];
            // Set cookie to never expire so we can set Session.IsFirst only when cookie is generated for the first time
            // 365 * 24 * 60 * 60 * 1000 = 31536000000 
            date.setTime(date.getTime() + 31536000000);
            Util.setCookie('ai_session', cookie.join('|') + ';expires=' + date.toUTCString());
        }
    }
} 