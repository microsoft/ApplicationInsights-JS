// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from '@microsoft/dynamicproto-js';
import { ISession, Util } from '@microsoft/applicationinsights-common';
import { IDiagnosticLogger, _InternalMessageId, LoggingSeverity, DiagnosticLogger, isFunction, dumpObj } from '@microsoft/applicationinsights-core-js';

const cookieNameConst = 'ai_session';

export interface ISessionConfig {
    sessionRenewalMs?: () => number;
    sessionExpirationMs?: () => number;
    cookieDomain?: () => string;
    namePrefix?: () => string;
    idLength?: () => number;
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

    constructor(config: ISessionConfig, logger?: IDiagnosticLogger) {
        let self = this;
        let _storageNamePrefix: () => string;
        let _cookieUpdatedTimestamp: number;
        let _logger: IDiagnosticLogger = logger || new DiagnosticLogger();

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
            _storageNamePrefix = () => _self.config.namePrefix && _self.config.namePrefix() ? cookieNameConst + _self.config.namePrefix() : cookieNameConst;
    
            _self.automaticSession = new Session();

            _self.update = () => {
                if (!_self.automaticSession.id) {
                    _initializeAutomaticSession();
                }
        
                // Always using Date getTime() as there is a bug in older IE instances that causes the performance timings to have the hi-bit set eg 0x800000000 causing
                // the number to be incorrect.
                const now = new Date().getTime();
        
                const acquisitionExpired = _self.config.sessionExpirationMs() === 0 ? false : now - _self.automaticSession.acquisitionDate > _self.config.sessionExpirationMs();
                const renewalExpired = _self.config.sessionExpirationMs() === 0 ? false : now - _self.automaticSession.renewalDate > _self.config.sessionRenewalMs();
        
                // renew if acquisitionSpan or renewalSpan has elapsed
                if (acquisitionExpired || renewalExpired) {
                    // update automaticSession so session state has correct id
                    _renew();
                } else {
                    // do not update the cookie more often than cookieUpdateInterval
                    if (!_cookieUpdatedTimestamp || now - _cookieUpdatedTimestamp > _SessionManager.cookieUpdateInterval) {
                        _self.automaticSession.renewalDate = now;
                        _setCookie(_self.automaticSession.id, _self.automaticSession.acquisitionDate, _self.automaticSession.renewalDate);
                    }
                }
            };
        
            /**
             *  Record the current state of the automatic session and store it in our cookie string format
             *  into the browser's local storage. This is used to restore the session data when the cookie
             *  expires.
             */
            _self.backup = () => {
                _setStorage(_self.automaticSession.id, _self.automaticSession.acquisitionDate, _self.automaticSession.renewalDate);
            };
        
            /**
             *  Use config.namePrefix + ai_session cookie data or local storage data (when the cookie is unavailable) to
             *  initialize the automatic session.
             */
            function _initializeAutomaticSession() {
                const cookie = Util.getCookie(_logger, _storageNamePrefix());
                if (cookie && typeof cookie.split === "function") {
                    _initializeAutomaticSessionWithData(cookie);
                } else {
                    // There's no cookie, but we might have session data in local storage
                    // This can happen if the session expired or the user actively deleted the cookie
                    // We only want to recover data if the cookie is missing from expiry. We should respect the user's wishes if the cookie was deleted actively.
                    // The User class handles this for us and deletes our local storage object if the persistent user cookie was removed.
                    const storage = Util.getStorage(_logger, _storageNamePrefix());
                    if (storage) {
                        _initializeAutomaticSessionWithData(storage);
                    }
                }
        
                if (!_self.automaticSession.id) {
                    _renew();
                }
            }
        
            /**
             *  Extract id, acquisitionDate, and renewalDate from an ai_session payload string and
             *  use this data to initialize automaticSession.
             *
             *  @param {string} sessionData - The string stored in an ai_session cookie or local storage backup
             */
            function _initializeAutomaticSessionWithData(sessionData: string) {
                const params = sessionData.split("|");
        
                if (params.length > 0) {
                    _self.automaticSession.id = params[0];
                }
        
                try {
                    if (params.length > 1) {
                        const acq = +params[1];
                        _self.automaticSession.acquisitionDate = +new Date(acq);
                        _self.automaticSession.acquisitionDate = _self.automaticSession.acquisitionDate > 0 ? _self.automaticSession.acquisitionDate : 0;
                    }
        
                    if (params.length > 2) {
                        const renewal = +params[2];
                        _self.automaticSession.renewalDate = +new Date(renewal);
                        _self.automaticSession.renewalDate = _self.automaticSession.renewalDate > 0 ? _self.automaticSession.renewalDate : 0;
                    }
                } catch (e) {
                    _logger.throwInternal(LoggingSeverity.CRITICAL,
        
                        _InternalMessageId.ErrorParsingAISessionCookie,
                        "Error parsing ai_session cookie, session will be reset: " + Util.getExceptionName(e),
                        { exception: dumpObj(e) });
                }
        
                if (_self.automaticSession.renewalDate === 0) {
                    _logger.throwInternal(LoggingSeverity.WARNING,
                        _InternalMessageId.SessionRenewalDateIsZero,
                        "AI session renewal date is 0, session will be reset.");
                }
            }
        
            function _renew() {
                const now = new Date().getTime();
        
                _self.automaticSession.id = Util.newId((_self.config && _self.config.idLength) ? _self.config.idLength() : 22);
                _self.automaticSession.acquisitionDate = now;
                _self.automaticSession.renewalDate = now;
        
                _setCookie(_self.automaticSession.id, _self.automaticSession.acquisitionDate, _self.automaticSession.renewalDate);
        
                // If this browser does not support local storage, fire an internal log to keep track of it at this point
                if (!Util.canUseLocalStorage()) {
                    _logger.throwInternal(LoggingSeverity.WARNING,
                        _InternalMessageId.BrowserDoesNotSupportLocalStorage,
                        "Browser does not support local storage. Session durations will be inaccurate.");
                }
            }
        
            function _setCookie(guid: string, acq: number, renewal: number) {
                // Set cookie to expire after the session expiry time passes or the session renewal deadline, whichever is sooner
                // Expiring the cookie will cause the session to expire even if the user isn't on the page
                const acquisitionExpiry = acq + _self.config.sessionExpirationMs();
                const renewalExpiry = renewal + _self.config.sessionRenewalMs();
                const cookieExpiry = new Date();
                const cookie = [guid, acq, renewal];
        
                if (acquisitionExpiry < renewalExpiry) {
                    cookieExpiry.setTime(acquisitionExpiry);
                } else {
                    cookieExpiry.setTime(renewalExpiry);
                }
        
                const cookieDomain = _self.config.cookieDomain ? _self.config.cookieDomain() : null;
        
                // if sessionExpirationMs is set to 0, it means the expiry is set to 0 for this session cookie
                // A cookie with 0 expiry in the session cookie will never expire for that browser session.  If the browser is closed the cookie expires.  
                // Another browser instance does not inherit this cookie.
                const UTCString = _self.config.sessionExpirationMs() === 0 ? '0' : cookieExpiry.toUTCString();
                Util.setCookie(_logger, _storageNamePrefix(), cookie.join('|') + ';expires=' + UTCString, cookieDomain);
        
                _cookieUpdatedTimestamp = new Date().getTime();
            }
        
            function _setStorage(guid: string, acq: number, renewal: number) {
                // Keep data in local storage to retain the last session id, allowing us to cleanly end the session when it expires
                // Browsers that don't support local storage won't be able to end sessions cleanly from the client
                // The server will notice this and end the sessions itself, with loss of accurate session duration
                Util.setStorage(_logger, _storageNamePrefix(), [guid, acq, renewal].join('|'));
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