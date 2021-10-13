// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import { ITelemetryConfig } from "../Interfaces/ITelemetryConfig";
import { utlRemoveStorage, IUserContext, CtxTagKeys } from "@microsoft/applicationinsights-common";
import { _InternalMessageId, LoggingSeverity, IAppInsightsCore, ICookieMgr, safeGetCookieMgr, safeGetLogger, newId, toISOString } from "@microsoft/applicationinsights-core-js";


function _validateUserInput(id: string): boolean {
    // Validate:
    // 1. Id is a non-empty string.
    // 2. It does not contain special characters for cookies.
    if (typeof id !== "string" ||
        !id ||
        id.match(/,|;|=| |\|/)) {
        return false;
    }

    return true;
}

export class User implements IUserContext {

    static cookieSeparator: string = "|";
    static userCookieName: string = "ai_user";
    static authUserCookieName: string = "ai_authUser";

    /**
     * The telemetry configuration.
     */
    public config: ITelemetryConfig;

    /**
     * The user ID.
     */
    public id: string;

    /**
     * Authenticated user id
     */
    public authenticatedId: string;

    /**
     * The localId
     */
    public localId: string;

    /**
     * The account ID.
     */
    public accountId: string;

    /**
     * The account acquisition date.
     */
    public accountAcquisitionDate: string;

    /**
     * A flag indicating whether this represents a new user
     */
    public isNewUser = false;

    /**
     * A flag indicating whether the user cookie has been set
     */
    public isUserCookieSet = false;

    constructor(config: ITelemetryConfig, core: IAppInsightsCore) {
        let _logger = safeGetLogger(core);
        let _cookieManager: ICookieMgr = safeGetCookieMgr(core);
        let _storageNamePrefix: () => string;

        dynamicProto(User, this, (_self) => {
            _self.config = config;
            const userCookiePostfix = (_self.config.userCookiePostfix && _self.config.userCookiePostfix()) ? _self.config.userCookiePostfix() : "";
            _storageNamePrefix = () => User.userCookieName + userCookiePostfix;
            
            // get userId or create new one if none exists
            const cookie = _cookieManager.get(_storageNamePrefix());
            if (cookie) {
                _self.isNewUser = false;
                const params = cookie.split(User.cookieSeparator);
                if (params.length > 0) {
                    _self.id = params[0];
                    // we already have a cookie
                    _self.isUserCookieSet = !!_self.id;
                }
            }

            function _generateNewId() {
                let theConfig = (config || {}) as ITelemetryConfig;
                let getNewId = (theConfig.getNewId ? theConfig.getNewId() : null) || newId;
                let id = getNewId(theConfig.idLength ? config.idLength() : 22);
                return id;
            }

            function _generateNewCookie(userId: string) {
                const acqStr = toISOString(new Date());
                _self.accountAcquisitionDate = acqStr;
                _self.isNewUser = true;
                const newCookie = [userId, acqStr];
                return newCookie;
            }

            function _setUserCookie(cookie: string) {
                // without expiration, cookies expire at the end of the session
                // set it to 365 days from now
                // 365 * 24 * 60 * 60 = 31536000
                const oneYear = 31536000;
                _self.isUserCookieSet = _cookieManager.set(_storageNamePrefix(), cookie, oneYear);
            }

            if (!_self.id) {
                _self.id = _generateNewId();
                const newCookie = _generateNewCookie(_self.id);

                _setUserCookie(newCookie.join(User.cookieSeparator));

                // If we have an config.namePrefix() + ai_session in local storage this means the user actively removed our cookies.
                // We should respect their wishes and clear ourselves from local storage
                const name = config.namePrefix && config.namePrefix() ? config.namePrefix() + "ai_session" : "ai_session";
                utlRemoveStorage(_logger, name);
            }

            // We still take the account id from the ctor param for backward compatibility.
            // But if the the customer set the accountId through the newer setAuthenticatedUserContext API, we will override it.
            _self.accountId = config.accountId ? config.accountId() : undefined;

            // Get the auth user id and account id from the cookie if exists
            // Cookie is in the pattern: <authenticatedId>|<accountId>
            let authCookie = _cookieManager.get(User.authUserCookieName);
            if (authCookie) {
                authCookie = decodeURI(authCookie);
                const authCookieString = authCookie.split(User.cookieSeparator);
                if (authCookieString[0]) {
                    _self.authenticatedId = authCookieString[0];
                }

                if (authCookieString.length > 1 && authCookieString[1]) {
                    _self.accountId = authCookieString[1];
                }
            }

            _self.setAuthenticatedUserContext = (authenticatedUserId: string, accountId?: string, storeInCookie = false) => {

                // Validate inputs to ensure no cookie control characters.
                const isInvalidInput = !_validateUserInput(authenticatedUserId) || (accountId && !_validateUserInput(accountId));
                if (isInvalidInput) {
                    _logger.throwInternal(
                        LoggingSeverity.WARNING,
                        _InternalMessageId.SetAuthContextFailedAccountName,
                        "Setting auth user context failed. " +
                        "User auth/account id should be of type string, and not contain commas, semi-colons, equal signs, spaces, or vertical-bars.",
                        true);
                    return;
                }

                // Create cookie string.
                _self.authenticatedId = authenticatedUserId;
                let authCookie = _self.authenticatedId;
                if (accountId) {
                    _self.accountId = accountId;
                    authCookie = [_self.authenticatedId, _self.accountId].join(User.cookieSeparator);
                }

                if (storeInCookie) {
                    // Set the cookie. No expiration date because this is a session cookie (expires when browser closed).
                    // Encoding the cookie to handle unexpected unicode characters.
                    _cookieManager.set(User.authUserCookieName, encodeURI(authCookie));
                }
            };

            /**
             * Clears the authenticated user id and the account id from the user context.
             * @returns {}
             */
            _self.clearAuthenticatedUserContext = () => {
                _self.authenticatedId = null;
                _self.accountId = null;
                _cookieManager.del(User.authUserCookieName);
            };

            _self.update = (userId?: string) => {
                // Optimizations to avoid setting and processing the cookie when not needed
                if (_self.id !== userId || !_self.isUserCookieSet) {
                    let user_id = userId ? userId : _generateNewId();
                    let user_cookie = _generateNewCookie(user_id);
                    _setUserCookie(user_cookie.join(User.cookieSeparator));
                }
            };
        });
    }

   /**
    * Sets the authenticated user id and the account id in this session.
    *
    * @param authenticatedUserId {string} - The authenticated user id. A unique and persistent string that represents each authenticated user in the service.
    * @param accountId {string} - An optional string to represent the account associated with the authenticated user.
    */
    public setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie = false) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Clears the authenticated user id and the account id from the user context.
     * @returns {}
     */
    public clearAuthenticatedUserContext() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Update or create the user cookie if cookies where previously disabled or the new userId does not match the existing value.
     * If you pass nothing a new random user id will be created.
     * @param userId - Specific either the current (via appInsights.context.user.id) or new id that you want to set
     */
    public update(userId?: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
