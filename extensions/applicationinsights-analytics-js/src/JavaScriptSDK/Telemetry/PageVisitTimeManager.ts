// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IDiagnosticLogger, _warnToConsole, dateNow, dumpObj, getJSON, hasJSON, throwError, utlCanUseSessionStorage, utlGetSessionStorage,
    utlRemoveSessionStorage, utlSetSessionStorage
} from "@microsoft/applicationinsights-core-js";

export interface IPageVisitData {
    pageName: string;
    pageUrl: string;
    pageVisitStartTime: number;
    pageVisitTime: number;
}

/**
 * Factory function to create a page visit data object
 * @param pageName - Name of the page
 * @param pageUrl - URL of the page
 * @returns IPageVisitData instance
 */
export function createPageVisitData(pageName: string, pageUrl: string): IPageVisitData {
    return {
        pageVisitStartTime: dateNow(),
        pageName: pageName,
        pageUrl: pageUrl,
        pageVisitTime: 0
    };
}

/**
 * Internal interface for PageVisitTimeManager.
 * @internal
 */
export interface IPageVisitTimeManager {
    /**
    * Tracks the previous page visit time telemetry (if exists) and starts timing of new page visit time
    * @param currentPageName - Name of page to begin timing for visit duration
    * @param currentPageUrl - Url of page to begin timing for visit duration
    */
    trackPreviousPageVisit(currentPageName: string, currentPageUrl: string): void;

    // These properties are exposed for backward compatibility with tests
    readonly _logger?: IDiagnosticLogger;
    readonly pageVisitTimeTrackingHandler?: (pageName: string, pageUrl: string, pageVisitTime: number) => void;
}

/**
 * Factory function to create a PageVisitTimeManager instance.
 * @param logger - Diagnostic logger
 * @param pageVisitTimeTrackingHandler - Delegate that will be called to send telemetry data to AI (when trackPreviousPageVisit is called)
 * @returns A new IPageVisitTimeManager instance.
 * @internal
 */
export function createPageVisitTimeManager(logger: IDiagnosticLogger, pageVisitTimeTrackingHandler: (pageName: string, pageUrl: string, pageVisitTime: number) => void): IPageVisitTimeManager {
    let prevPageVisitDataKeyName: string = "prevPageVisitData";

    /**
     * Stops timing of current page (if exists) and starts timing for duration of visit to pageName
     * @param pageName - Name of page to begin timing visit duration
     * @returns {IPageVisitData} Page visit data (including duration) of pageName from last call to start or restart, if exists. Null if not.
     */
    function restartPageVisitTimer(pageName: string, pageUrl: string) {
        let prevPageVisitData: IPageVisitData = null;
        try {
            prevPageVisitData = stopPageVisitTimer();
            if (utlCanUseSessionStorage()) {
                if (utlGetSessionStorage(logger, prevPageVisitDataKeyName) != null) {
                    throwError("Cannot call startPageVisit consecutively without first calling stopPageVisit");
                }

                const currPageVisitDataStr = getJSON().stringify(createPageVisitData(pageName, pageUrl));
                utlSetSessionStorage(logger, prevPageVisitDataKeyName, currPageVisitDataStr);
            }
    
        } catch (e) {
            _warnToConsole(logger, "Call to restart failed: " + dumpObj(e));
            prevPageVisitData = null;
        }

        return prevPageVisitData;
    }

    /**
     * Stops timing of current page, if exists.
     * @returns {IPageVisitData} Page visit data (including duration) of pageName from call to start, if exists. Null if not.
     */
    function stopPageVisitTimer() {
        let prevPageVisitData: IPageVisitData = null;
        try {
            if (utlCanUseSessionStorage()) {

                // Define end time of page's visit
                const pageVisitEndTime = dateNow();

                // Try to retrieve  page name and start time from session storage
                const pageVisitDataJsonStr = utlGetSessionStorage(logger, prevPageVisitDataKeyName);
                if (pageVisitDataJsonStr && hasJSON()) {

                    // if previous page data exists, set end time of visit
                    prevPageVisitData = getJSON().parse(pageVisitDataJsonStr);
                    prevPageVisitData.pageVisitTime = pageVisitEndTime - prevPageVisitData.pageVisitStartTime;

                    // Remove data from storage since we already used it
                    utlRemoveSessionStorage(logger, prevPageVisitDataKeyName);
                }
            }
        } catch (e) {
            _warnToConsole(logger, "Stop page visit timer failed: " + dumpObj(e));
            prevPageVisitData = null;
        }

        return prevPageVisitData;
    }

    return {
        trackPreviousPageVisit: (currentPageName: string, currentPageUrl: string) => {
            try {
                // Restart timer for new page view
                const prevPageVisitTimeData = restartPageVisitTimer(currentPageName, currentPageUrl);
    
                // If there was a page already being timed, track the visit time for it now.
                if (prevPageVisitTimeData) {
                    pageVisitTimeTrackingHandler(prevPageVisitTimeData.pageName, prevPageVisitTimeData.pageUrl, prevPageVisitTimeData.pageVisitTime);
                }
            } catch (e) {
                _warnToConsole(logger, "Auto track page visit time failed, metric will not be collected: " + dumpObj(e));
            }
        },

        // Expose for backward compatibility with tests
        _logger: logger,
        pageVisitTimeTrackingHandler: pageVisitTimeTrackingHandler
    };
}
