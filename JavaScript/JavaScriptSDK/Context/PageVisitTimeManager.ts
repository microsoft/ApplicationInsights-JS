
module Microsoft.ApplicationInsights.Context {
    "use strict";

    /**
     * Used to track page visit durations
     */
    export class PageVisitTimeManager {

        private prevPageVisitDataKeyName = "prevPageVisitData";

        /**
         * Stops timing of current page (if exists) and starts timing for duration of visit to pageName
         * @param pageName Name of page to begin timing visit duration
         * @returns {PageVisitData} Page visit data (including duration) of pageName from last call to start or restart, if exists. Null if not. 
         */
        restartPageVisitTimer(pageName: string, pageUrl: string) {

            var prevPageVisitData = this.stopPageVisitTimer();
            this.startPageVisitTimer(pageName, pageUrl);

            return prevPageVisitData;
        }

        /**
         * Starts timing visit duration of pageName
         * @param pageName 
         * @returns {} 
         */
        startPageVisitTimer(pageName: string, pageUrl: string) {
            if (this.checkSessionStorageSupported()) {
                if (window.sessionStorage.getItem(this.prevPageVisitDataKeyName) != null) {
                    throw new Error("Cannot call startPageVisit consecutively without first calling stopPageVisit");
                }

                var currPageVisitData = new PageVisitData(pageName, pageUrl);
                var currPageVisitDataStr = JSON.stringify(currPageVisitData);
                window.sessionStorage.setItem(this.prevPageVisitDataKeyName, currPageVisitDataStr);
            }
        }

        /**
         * Stops timing of current page, if exists.
         * @returns {PageVisitData} Page visit data (including duration) of pageName from call to start, if exists. Null if not.  
         */
        stopPageVisitTimer() {
            if (this.checkSessionStorageSupported()) {

                // Define end time of page's visit
                var pageVisitEndTime = Date.now();

                // Try to retrieve  page name and start time from session storage
                var pageVisitDataJsonStr = window.sessionStorage.getItem(this.prevPageVisitDataKeyName);
                if (pageVisitDataJsonStr) {

                    // if previous page data exists, set end time of visit
                    var prevPageVisitData : PageVisitData = JSON.parse(pageVisitDataJsonStr);
                    prevPageVisitData.pageVisitTime = pageVisitEndTime - prevPageVisitData.pageVisitStartTime;

                    // Remove data from storage since we already used it
                    window.sessionStorage.removeItem(this.prevPageVisitDataKeyName);

                    // Return page visit data
                    return prevPageVisitData;
                } else {
                    return null;
                }

            }
            return null;
        }

        private checkSessionStorageSupported() {
            if (window.sessionStorage) {
                return true;
            } else {
                _InternalLogging.warnToConsole("Session storage does not exist, visit time will not be collected.");
                return false;
            }
        }
    }

    export class PageVisitData {

        public pageName: string;
        public pageUrl: string;
        public pageVisitStartTime: number;
        public pageVisitTime: number;

        constructor(pageName, pageUrl) {
            this.pageVisitStartTime = Date.now();
            this.pageName = pageName;
            this.pageUrl = pageUrl;
        }
    }
}