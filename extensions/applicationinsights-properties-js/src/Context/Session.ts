// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import { ISession, utlCanUseLocalStorage, utlGetLocalStorage, utlSetLocalStorage } from "@microsoft/applicationinsights-common";
import {
    IDiagnosticLogger, _InternalMessageId, LoggingSeverity, DiagnosticLogger, IAppInsightsCore, ICookieMgr, safeGetCookieMgr, isFunction,
    newId, dumpObj, getExceptionName, dateNow, safeGetLogger
} from "@microsoft/applicationinsights-core-js";

const cookieNameConst = "ai_session";

export interface ISessionConfig {
    sessionRenewalMs?: () => number;
    sessionExpirationMs?: () => number;
    namePrefix?: () => string;
    sessionCookiePostfix?: () => string;
    idLength?: () => number;
    getNewId?: () => (idLength?: number) => string;

    /**
     * @deprecated Avoid using this value to override the cookie manager cookie domain.
     */
    cookieDomain?: () => string;
}

export class Session implements ISession {
    /**
     * The session ID.
     */
    public id?: string;

    /**
     * The date at which this guid was generated.
     * Per the spec the ID will be regenerated if more than acquisitionSpan milliseconds elapsed from this time.
     */
    public acquisitionDate?: number;

    /**
     * The date at which this session ID was last reported.
     * This value should be updated whenever telemetry is sent using this ID.
     * Per the spec the ID will be regenerated if more than renewalSpan milliseconds elapse from this time with no activity.
     */
    public renewalDate?: number;
}

export class _SessionManager {

    public static acquisitionSpan = 86400000; // 24 hours in ms
    public static renewalSpan = 1800000; // 30 minutes in ms
    public static cookieUpdateInterval = 60000 // 1 minute in ms
    public automaticSession: Session;
    public config: ISessionConfig;

    constructor(config: ISessionConfig, core?: IAppInsightsCore) {
        let self = this;
        let _storageNamePrefix: () => string;
        let _cookieUpdatedTimestamp: number;
        let _logger: IDiagnosticLogger = safeGetLogger(core);
        let _cookieManager: ICookieMgr = safeGetCookieMgr(core);

        dynamicProto(_SessionManager, self, (_self) => {
   
            if (!config) {
                config = ({} as any);
            }
    
            if (!isFunction(config.sessionExpirationMs)) {
                config.sessionExpirationMs = () => _SessionManager.acquisitionSpan;
            }
    
            if (!isFunction(config.sessionRenewalMs)) {
                config.sessionRenewalMs = () => _SessionManager.renewalSpan;
            }
    
            _self.config = config;
            // sessionCookiePostfix takes the preference if it is configured, otherwise takes namePrefix if configured.
            const sessionCookiePostfix = (_self.config.sessionCookiePostfix && _self.config.sessionCookiePostfix()) ?
                                            _self.config.sessionCookiePostfix() :
                                            ((_self.config.namePrefix && _self.config.namePrefix()) ? _self.config.namePrefix() : "");

            _storageNamePrefix = () => cookieNameConst + sessionCookiePostfix;
    
            _self.automaticSession = new Session();

            _self.update = () => {
                // Always using Date getTime() as there is a bug in older IE instances that causes the performance timings to have the hi-bit set eg 0x800000000 causing
                // the number to be incorrect.
                const nowMs = dateNow();

                let isExpired = false;
                const session = _self.automaticSession;
                if (!session.id) {
                    isExpired = !_initializeAutomaticSession(session, nowMs);
                }

                const sessionExpirationMs = _self.config.sessionExpirationMs();

                if (!isExpired && sessionExpirationMs > 0) {
                    const sessionRenewalMs = _self.config.sessionRenewalMs();
                    const timeSinceAcqMs = nowMs - session.acquisitionDate;
                    const timeSinceRenewalMs = nowMs - session.renewalDate;
                    isExpired = timeSinceAcqMs < 0 || timeSinceRenewalMs < 0;         // expired if the acquisition or last renewal are in the future
                    isExpired = isExpired || timeSinceAcqMs > sessionExpirationMs;    // expired if the time since acquisition is more than session Expiration
                    isExpired = isExpired || timeSinceRenewalMs > sessionRenewalMs;   // expired if the time since last renewal is more than renewal period
                }
        
                // renew if acquisitionSpan or renewalSpan has elapsed
                if (isExpired) {
                    // update automaticSession so session state has correct id
                    _renew(nowMs);
                } else {
                    // do not update the cookie more often than cookieUpdateInterval
                    if (!_cookieUpdatedTimestamp || nowMs - _cookieUpdatedTimestamp > _SessionManager.cookieUpdateInterval) {
                        _setCookie(session, nowMs);
                    }
                }
            };
        
            /**
             *  Record the current state of the automatic session and store it in our cookie string format
             *  into the browser's local storage. This is used to restore the session data when the cookie
             *  expires.
             */
            _self.backup = () => {
                const session = _self.automaticSession;
                _setStorage(session.id, session.acquisitionDate, session.renewalDate);
            };
        
            /**
             * Use config.namePrefix + ai_session cookie data or local storage data (when the cookie is unavailable) to
             * initialize the automatic session.
             * @returns true if values set otherwise false
             */
            function _initializeAutomaticSession(session: ISession, now: number): boolean {
                let isValid = false;
                const cookieValue = _cookieManager.get(_storageNamePrefix());
                if (cookieValue && isFunction(cookieValue.split)) {
                    isValid = _initializeAutomaticSessionWithData(session, cookieValue);
                } else {
                    // There's no cookie, but we might have session data in local storage
                    // This can happen if the session expired or the user actively deleted the cookie
                    // We only want to recover data if the cookie is missing from expiry. We should respect the user's wishes if the cookie was deleted actively.
                    // The User class handles this for us and deletes our local storage object if the persistent user cookie was removed.
                    const storageValue = utlGetLocalStorage(_logger, _storageNamePrefix());
                    if (storageValue) {
                        isValid = _initializeAutomaticSessionWithData(session, storageValue);
                    }
                }
        
                return isValid || !!session.id;
            }
        
            /**
             * Extract id, acquisitionDate, and renewalDate from an ai_session payload string and
             * use this data to initialize automaticSession.
             *
             * @param {string} sessionData - The string stored in an ai_session cookie or local storage backup
             * @returns true if values set otherwise false
             */
            function _initializeAutomaticSessionWithData(session: ISession, sessionData: string) {
                let isValid = false;
                const sessionReset = ", session will be reset";
                const tokens = sessionData.split("|");
        
                if (tokens.length >= 2) {
                    try {
                        const acqMs = +tokens[1] || 0;
                        const renewalMs = +tokens[2] || 0;
                        if (isNaN(acqMs) || acqMs <= 0) {
                            _logger.throwInternal(LoggingSeverity.WARNING,
                                _InternalMessageId.SessionRenewalDateIsZero,
                                "AI session acquisition date is 0" + sessionReset);
                        } else if (isNaN(renewalMs) || renewalMs <= 0) {
                            _logger.throwInternal(LoggingSeverity.WARNING,
                                _InternalMessageId.SessionRenewalDateIsZero,
                                "AI session renewal date is 0" + sessionReset);
                        } else if (tokens[0]) {
                            // Everything looks valid so set the values
                            session.id = tokens[0];
                            session.acquisitionDate = acqMs;
                            session.renewalDate = renewalMs;
                            isValid = true;
                        }
                    } catch (e) {
                        _logger.throwInternal(LoggingSeverity.CRITICAL,
                            _InternalMessageId.ErrorParsingAISessionCookie,
                            "Error parsing ai_session value [" + (sessionData || "") + "]" + sessionReset + " - " + getExceptionName(e),
                            { exception: dumpObj(e) });
                    }
                }

                return isValid;
            }
        
            function _renew(nowMs: number) {
                let theConfig = (_self.config ||{});
                let getNewId = (theConfig.getNewId ? theConfig.getNewId() : null) || newId;
                _self.automaticSession.id = getNewId(theConfig.idLength ? theConfig.idLength() : 22);
                _self.automaticSession.acquisitionDate = nowMs;
        
                _setCookie(_self.automaticSession, nowMs);
        
                // If this browser does not support local storage, fire an internal log to keep track of it at this point
                if (!utlCanUseLocalStorage()) {
                    _logger.throwInternal(LoggingSeverity.WARNING,
                        _InternalMessageId.BrowserDoesNotSupportLocalStorage,
                        "Browser does not support local storage. Session durations will be inaccurate.");
                }
            }
        
            function _setCookie(session: ISession, nowMs: number) {
                let acq = session.acquisitionDate;
                session.renewalDate = nowMs

                let config = _self.config;
                let renewalPeriodMs = config.sessionRenewalMs();

                // Set cookie to expire after the session expiry time passes or the session renewal deadline, whichever is sooner
                // Expiring the cookie will cause the session to expire even if the user isn't on the page
                const acqTimeLeftMs = (acq + config.sessionExpirationMs()) - nowMs;
                const cookie = [session.id, acq, nowMs];
                let maxAgeSec = 0;
        
                if (acqTimeLeftMs < renewalPeriodMs) {
                    maxAgeSec = acqTimeLeftMs / 1000;
                } else {
                    maxAgeSec = renewalPeriodMs / 1000;
                }
        
                const cookieDomain = config.cookieDomain ? config.cookieDomain() : null;

                // if sessionExpirationMs is set to 0, it means the expiry is set to 0 for this session cookie
                // A cookie with 0 expiry in the session cookie will never expire for that browser session.  If the browser is closed the cookie expires.
                // Depending on the browser, another instance does not inherit this cookie, however, another tab will
                _cookieManager.set(_storageNamePrefix(), cookie.join("|"), config.sessionExpirationMs() > 0 ? maxAgeSec : null, cookieDomain);
                _cookieUpdatedTimestamp = nowMs;
            }
        
            function _setStorage(guid: string, acq: number, renewal: number) {
                // Keep data in local storage to retain the last session id, allowing us to cleanly end the session when it expires
                // Browsers that don't support local storage won't be able to end sessions cleanly from the client
                // The server will notice this and end the sessions itself, with loss of accurate session duration
                utlSetLocalStorage(_logger, _storageNamePrefix(), [guid, acq, renewal].join("|"));
            }
        });
    }

    public update() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     *  Record the current state of the automatic session and store it in our cookie string format
     *  into the browser's local storage. This is used to restore the session data when the cookie
     *  expires.
     */
    public backup() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
