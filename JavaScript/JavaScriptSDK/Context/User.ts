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

        public setAuthId(id: string, accountId? : string) {
            this.authId = id;
            var authCookie = this.authId;

            if (accountId) {
                this.accountId = accountId;
                authCookie = [this.authId, this.accountId].join(User.cookieSeparator);
            }
            
            // Set the suth id cookie. No expiration date because this is a session cookie (expires when browser closed).
            Util.setCookie('ai_authUser', authCookie);
        }

        public clearAuthId() {
            this.authId = null;
            this.accountId = null;
            Util.deleteCookie('ai_authUser');
        }

        constructor(accountId: string) {
            
           //get userId or create new one if none exists
            var cookie = Util.getCookie('ai_user');
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
                Util.setCookie('ai_user', newCookie.join(User.cookieSeparator) + ';expires=' + date.toUTCString());
            }

            this.accountId = accountId;

            // get authId and accountId from cookie
            var authCookie = Util.getCookie('ai_authUser');
            if (authCookie) {
                var kvps = authCookie.split(User.cookieSeparator);
                if (kvps.length > 0) {
                    this.authId = kvps[0];
                }
                if (kvps.length > 1) {
                    this.accountId = kvps[1];
                }
            }
        }
    }
}