// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    utlCanUseSessionStorage, utlGetSessionStorage, utlRemoveSessionStorage, utlSetSessionStorage
} from "@microsoft/applicationinsights-common";
import {
    IDiagnosticLogger, _warnToConsole, dateNow, dumpObj, getJSON, hasJSON, objDefineAccessors, throwError
} from "@microsoft/applicationinsights-core-js";

/**
 * Used to track page visit durations
 */
export class PageVisitTimeManager {

    /**
     * Creates a new instance of PageVisitTimeManager
     * @param pageVisitTimeTrackingHandler Delegate that will be called to send telemetry data to AI (when trackPreviousPageVisit is called)
     * @returns {}
     */
    constructor(logger: IDiagnosticLogger, pageVisitTimeTrackingHandler: (pageName: string, pageUrl: string, pageVisitTime: number) => void) {
        let prevPageVisitDataKeyName: string = "prevPageVisitData";

        dynamicProto(PageVisitTimeManager, this, (_self) => {
            _self.trackPreviousPageVisit = (currentPageName: string, currentPageUrl: string) => {

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
            };
        
            /**
             * Stops timing of current page (if exists) and starts timing for duration of visit to pageName
             * @param pageName Name of page to begin timing visit duration
             * @returns {PageVisitData} Page visit data (including duration) of pageName from last call to start or restart, if exists. Null if not.
             */
            function restartPageVisitTimer(pageName: string, pageUrl: string) {
                let prevPageVisitData: PageVisitData = null;
                try {
                    prevPageVisitData = stopPageVisitTimer();
                    startPageVisitTimer(pageName, pageUrl);
        
                } catch (e) {
                    _warnToConsole(logger, "Call to restart failed: " + dumpObj(e));
                    prevPageVisitData = null;
                }

                return prevPageVisitData;
            }
        
            /**
             * Starts timing visit duration of pageName
             * @param pageName
             * @returns {}
             */
            function startPageVisitTimer(pageName: string, pageUrl: string) {
                try {
                    if (utlCanUseSessionStorage()) {
                        if (utlGetSessionStorage(logger, prevPageVisitDataKeyName) != null) {
                            throwError("Cannot call startPageVisit consecutively without first calling stopPageVisit");
                        }
        
                        const currPageVisitData = new PageVisitData(pageName, pageUrl);
                        const currPageVisitDataStr = getJSON().stringify(currPageVisitData);
                        utlSetSessionStorage(logger, prevPageVisitDataKeyName, currPageVisitDataStr);
                    }
                } catch (e) {
                    // TODO: Remove this catch in next phase, since if start is called twice in a row the exception needs to be propagated out
                    _warnToConsole(logger, "Call to start failed: " + dumpObj(e));
                }
            }
        
            /**
             * Stops timing of current page, if exists.
             * @returns {PageVisitData} Page visit data (including duration) of pageName from call to start, if exists. Null if not.
             */
            function stopPageVisitTimer() {
                let prevPageVisitData: PageVisitData = null;
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

            // For backward compatibility
            objDefineAccessors(_self, "_logger", () => logger);
            objDefineAccessors(_self, "pageVisitTimeTrackingHandler", () => pageVisitTimeTrackingHandler);
        });
    }

    /**
    * Tracks the previous page visit time telemetry (if exists) and starts timing of new page visit time
    * @param currentPageName Name of page to begin timing for visit duration
    * @param currentPageUrl Url of page to begin timing for visit duration
    */
    public trackPreviousPageVisit(currentPageName: string, currentPageUrl: string): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}

export class PageVisitData {

    public pageName: string;
    public pageUrl: string;
    public pageVisitStartTime: number;
    public pageVisitTime: number;

    constructor(pageName: string, pageUrl: string) {
        this.pageVisitStartTime = dateNow();
        this.pageName = pageName;
        this.pageUrl = pageUrl;
    }
}
