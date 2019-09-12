// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="../Util.ts" />
/// <reference path="../../JavaScriptSDK.Interfaces/Context/IUser.ts" />

module Microsoft.ApplicationInsights.Context {

    "use strict";

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
         * The account ID.
         */
        public accountId: string;

        /**
         * The account acquisition date.
         */
        public accountAcquisitionDate: string;

        /**
         * The user agent string.
         */
        public agent: string;

        /**
         * The store region.
         */
        public storeRegion: string;

        /**
        * Sets the authenticated user id and the account id in this session.
        *   
        * @param authenticatedUserId {string} - The authenticated user id. A unique and persistent string that represents each authenticated user in the service.
        * @param accountId {string} - An optional string to represent the account associated with the authenticated user.
        */
        public setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie = false) {

            // Validate inputs to ensure no cookie control characters.
            var isInvalidInput = !this.validateUserInput(authenticatedUserId) || (accountId && !this.validateUserInput(accountId));
            if (isInvalidInput) {
                _InternalLogging.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.SetAuthContextFailedAccountName,
                    "Setting auth user context failed. " +
                    "User auth/account id should be of type string, and not contain commas, semi-colons, equal signs, spaces, or vertical-bars.",
                    true);
                return;
            }

            // Create cookie string.
            this.authenticatedId = authenticatedUserId;
            var authCookie = this.authenticatedId;
            if (accountId) {
                this.accountId = accountId;
                authCookie = [this.authenticatedId, this.accountId].join(User.cookieSeparator);
            }

            if (storeInCookie) {
                // Set the cookie. No expiration date because this is a session cookie (expires when browser closed).
                // Encoding the cookie to handle unexpected unicode characters.
                Util.setCookie(User.authUserCookieName, encodeURI(authCookie), this.config.cookieDomain());
            }
        }

        /**
         * Clears the authenticated user id and the account id from the user context.
         * @returns {} 
         */
        public clearAuthenticatedUserContext() {
            this.authenticatedId = null;
            this.accountId = null;
            Util.deleteCookie(User.authUserCookieName);
        }

        constructor(config: ITelemetryConfig) {

            //get userId or create new one if none exists
            var cookie = Util.getCookie(User.userCookieName);
            if (cookie) {
                var params = cookie.split(User.cookieSeparator);
                if (params.length > 0) {
                    this.id = params[0];
                }
            }

            this.config = config;

            if (!this.id) {
                this.id = Util.newId();
                var date = new Date();
                var acqStr = Util.toISOStringForIE8(date);
                this.accountAcquisitionDate = acqStr;
                // without expiration, cookies expire at the end of the session
                // set it to 365 days from now
                // 365 * 24 * 60 * 60 * 1000 = 31536000000 
                date.setTime(date.getTime() + 31536000000);
                var newCookie = [this.id, acqStr];
                var cookieDomain = this.config.cookieDomain ? this.config.cookieDomain() : undefined;

                Util.setCookie(User.userCookieName, newCookie.join(User.cookieSeparator) + ';expires=' + date.toUTCString(), cookieDomain);

                // If we have an ai_session in local storage this means the user actively removed our cookies.
                // We should respect their wishes and clear ourselves from local storage
                Util.removeStorage('ai_session');
            }

            // We still take the account id from the ctor param for backward compatibility. 
            // But if the the customer set the accountId through the newer setAuthenticatedUserContext API, we will override it.
            this.accountId = config.accountId ? config.accountId() : undefined;

            // Get the auth user id and account id from the cookie if exists
            // Cookie is in the pattern: <authenticatedId>|<accountId>
            var authCookie = Util.getCookie(User.authUserCookieName);
            if (authCookie) {
                authCookie = decodeURI(authCookie);
                var authCookieString = authCookie.split(User.cookieSeparator);
                if (authCookieString[0]) {
                    this.authenticatedId = authCookieString[0];
                }
                if (authCookieString.length > 1 && authCookieString[1]) {
                    this.accountId = authCookieString[1];
                }
            }
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

}