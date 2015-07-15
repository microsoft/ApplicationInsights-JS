/// <reference path="../util.ts" />

module Microsoft.ApplicationInsights.Context {
    "use strict";

    export class User {

        /**
         * The user ID.
         */
        public id: string;

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
        
        constructor(accountId: string) {
            //get userId or create new one if none exists
            var cookie = Util.getCookie('ai_user');
            if (cookie) {
                var params = cookie.split("|");
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
                Util.setCookie('ai_user', newCookie.join('|') + ';expires=' + date.toUTCString());

                // If we have an ai_session in local storage this means the user actively removed our cookies.
                // We should respect their wishes and clear ourselves from local storage
                if (window.localStorage && localStorage['ai_session']) {
                    localStorage.removeItem('ai_session');
                }
            }

            this.accountId = accountId;
        }
    }
}