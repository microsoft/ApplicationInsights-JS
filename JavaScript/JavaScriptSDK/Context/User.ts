/// <reference path="../util.ts" />

module Microsoft.ApplicationInsights.Context {
    "use strict";

    export class User {

        /**
         * The user ID.
         */
        public id: string;

        /**
         * Authorized user id
         */
        public authId: string;

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

        static cookieSeparator: string = '|';
        static userCookieName: string = 'ai_user'; 
        static authUserCookieName: string = 'ai_authUser'; 

        /**
         * Sets the autheticated user id and the account id in this session.
         * @param id {string} - The autheticated user id
         * @param accountId {string} - The account id.
         * @returns {} 
         */
        public setAuthUserContext(id: string, accountId?: string) {

            // Validate inputs to ensure no cookie control characters.
            this.validateUserInput(id);
            if (accountId) {
                this.validateUserInput(accountId);
            }

            // Create cookie string.
            this.authId = id;
            var authCookie = this.authId;
            if (accountId) {
                this.accountId = accountId;
                authCookie = [this.authId, this.accountId].join(User.cookieSeparator);
            }
            
            // Set the cookie. No expiration date because this is a session cookie (expires when browser closed).
            // Encoding the cookie to handle unexpected unicode characters.
            Util.setCookie(User.authUserCookieName, encodeURI(authCookie));
        }

        /**
         * Clears the authenticated user id and the account id from the user context.
         * @returns {} 
         */
        public clearAuthUserContext() {
            this.authId = null;
            this.accountId = null;
            Util.deleteCookie(User.authUserCookieName);
        }

        constructor(accountId: string) {
            
           //get userId or create new one if none exists
            var cookie = Util.getCookie(User.userCookieName);
            if (cookie) {
                var params = cookie.split(User.cookieSeparator);
                if (params.length > 0) {
                    this.id = params[0];
                }
            }

            if (!this.id) {
                this.id = Util.newGuid();
                var date = new Date();
                var acqStr = Util.toISOStringForIE8(date);
                this.accountAcquisitionDate = acqStr;
                // without expiration, cookies expire at the end of the session
                // set it to a year from now
                // 365 * 24 * 60 * 60 * 1000 = 31536000000 
                date.setTime(date.getTime() + 31536000000);
                var newCookie = [this.id, acqStr];
                Util.setCookie(User.userCookieName, newCookie.join(User.cookieSeparator) + ';expires=' + date.toUTCString());
            }

            // We still take the account id from the ctor param for backward compatibility. 
            // But if the the customer set the accountId through the newer setAuthUserContext API, we will override it.
            this.accountId = accountId;

            // Get the auth user id and account id from the cookie if exists
            // Cookie is in the pattern: <authId>|<accountId>
            var authCookie = Util.getCookie(User.authUserCookieName);
            if (authCookie) {
                authCookie = decodeURI(authCookie);
                var authCookieString = authCookie.split(User.cookieSeparator);
                if (authCookieString[0]) {
                    this.authId = authCookieString[0];
                }
                if (authCookieString.length > 1 && authCookieString[1]) {
                    this.accountId = authCookieString[1];
                }
            }
        }

        private validateUserInput(id: string) {
            // Validate:
            // 1. Id is a non-empty string.
            // 2. It does not contain special characters for cookies.
            if (typeof id !== 'string' ||
                !id ||
                id.match(/,|;|=| |\|/)) {
                throw new Error("User auth id and account id should be of type string. They should not contain commas, semi-colons, equal signs, spaces, or vertical-bars.");
            }
        }
    }
       
}