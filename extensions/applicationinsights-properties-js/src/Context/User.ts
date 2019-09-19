// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ITelemetryConfig } from '../Interfaces/ITelemetryConfig';
import { Util, IUser } from '@microsoft/applicationinsights-common';
import { IDiagnosticLogger, _InternalMessageId, LoggingSeverity } from '@microsoft/applicationinsights-core-js';

export class User implements IUser {

    static cookieSeparator: string = '|';
    static userCookieName: string = 'ai_user';
    static authUserCookieName: string = 'ai_authUser';

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

    public isNewUser = false;

    private _logger: IDiagnosticLogger;

    constructor(config: ITelemetryConfig, logger: IDiagnosticLogger) {
        this._logger = logger;

        // get userId or create new one if none exists
        const cookie = Util.getCookie(this._logger, User.userCookieName);
        if (cookie) {
            this.isNewUser = false;
            const params = cookie.split(User.cookieSeparator);
            if (params.length > 0) {
                this.id = params[0];
            }
        }

        this.config = config;

        if (!this.id) {
            this.id = Util.newId();
            const date = new Date();
            const acqStr = Util.toISOStringForIE8(date);
            this.accountAcquisitionDate = acqStr;
            this.isNewUser = true;
            // without expiration, cookies expire at the end of the session
            // set it to 365 days from now
            // 365 * 24 * 60 * 60 * 1000 = 31536000000 
            date.setTime(date.getTime() + 31536000000);
            const newCookie = [this.id, acqStr];
            const cookieDomain = this.config.cookieDomain ? this.config.cookieDomain() : undefined;

            Util.setCookie(this._logger, User.userCookieName, newCookie.join(User.cookieSeparator) + ';expires=' + date.toUTCString(), cookieDomain);

            // If we have an config.namePrefix() + ai_session in local storage this means the user actively removed our cookies.
            // We should respect their wishes and clear ourselves from local storage
            const name = config.namePrefix && config.namePrefix() ? config.namePrefix() + 'ai_session' : 'ai_session';
            Util.removeStorage(this._logger, name);
        }

        // We still take the account id from the ctor param for backward compatibility. 
        // But if the the customer set the accountId through the newer setAuthenticatedUserContext API, we will override it.
        this.accountId = config.accountId ? config.accountId() : undefined;

        // Get the auth user id and account id from the cookie if exists
        // Cookie is in the pattern: <authenticatedId>|<accountId>
        let authCookie = Util.getCookie(this._logger, User.authUserCookieName);
        if (authCookie) {
            authCookie = decodeURI(authCookie);
            const authCookieString = authCookie.split(User.cookieSeparator);
            if (authCookieString[0]) {
                this.authenticatedId = authCookieString[0];
            }
            if (authCookieString.length > 1 && authCookieString[1]) {
                this.accountId = authCookieString[1];
            }
        }
    }

   /**
    * Sets the authenticated user id and the account id in this session.
    *   
    * @param authenticatedUserId {string} - The authenticated user id. A unique and persistent string that represents each authenticated user in the service.
    * @param accountId {string} - An optional string to represent the account associated with the authenticated user.
    */
    public setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie = false) {

        // Validate inputs to ensure no cookie control characters.
        const isInvalidInput = !this.validateUserInput(authenticatedUserId) || (accountId && !this.validateUserInput(accountId));
        if (isInvalidInput) {
            this._logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.SetAuthContextFailedAccountName,
                "Setting auth user context failed. " +
                "User auth/account id should be of type string, and not contain commas, semi-colons, equal signs, spaces, or vertical-bars.",
                true);
            return;
        }

        // Create cookie string.
        this.authenticatedId = authenticatedUserId;
        let authCookie = this.authenticatedId;
        if (accountId) {
            this.accountId = accountId;
            authCookie = [this.authenticatedId, this.accountId].join(User.cookieSeparator);
        }

        if (storeInCookie) {
            // Set the cookie. No expiration date because this is a session cookie (expires when browser closed).
            // Encoding the cookie to handle unexpected unicode characters.
            Util.setCookie(this._logger, User.authUserCookieName, encodeURI(authCookie), this.config.cookieDomain());
        }
    }

    /**
     * Clears the authenticated user id and the account id from the user context.
     * @returns {} 
     */
    public clearAuthenticatedUserContext() {
        this.authenticatedId = null;
        this.accountId = null;
        Util.deleteCookie(this._logger, User.authUserCookieName);
    }

    private validateUserInput(id: string): boolean {
        // Validate:
        // 1. Id is a non-empty string.
        // 2. It does not contain special characters for cookies.
        if (typeof id !== 'string' ||
            !id ||
            id.match(/,|;|=| |\|/)) {
            return false;
        }

        return true;
    }
}