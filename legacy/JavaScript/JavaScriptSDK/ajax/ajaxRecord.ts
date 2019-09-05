// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="../Logging.ts" />
/// <reference path="../Util.ts" />
/// <reference path="./ajaxUtils.ts" />

module Microsoft.ApplicationInsights {
    "use strict";

    export class XHRMonitoringState {
        public openDone: boolean = false;
        public setRequestHeaderDone: boolean = false;
        public sendDone: boolean = false;
        public abortDone: boolean = false;

        //<summary>True, if onreadyStateChangeCallback function attached to xhr, otherwise false</summary>
        public onreadystatechangeCallbackAttached = false;
    }

    export class ajaxRecord {
        public completed = false;
        public requestHeadersSize = null;
        public ttfb = null;
        public responseReceivingDuration = null;
        public callbackDuration = null;
        public ajaxTotalDuration = null;
        public aborted = null;
        public pageUrl = null;
        public requestUrl = null;
        public requestSize = 0;
        public method = null;

        ///<summary>Returns the HTTP status code.</summary>
        public status = null;        
        
        //<summary>The timestamp when open method was invoked</summary>
        public requestSentTime = null;

        //<summary>The timestamps when first byte was received</summary>
        public responseStartedTime = null;

        //<summary>The timestamp when last byte was received</summary>
        public responseFinishedTime = null;

        //<summary>The timestamp when onreadystatechange callback in readyState 4 finished</summary>
        public callbackFinishedTime = null;
        
        //<summary>The timestamp at which ajax was ended</summary>
        public endTime = null;

        //<summary>The original xhr onreadystatechange event</summary>
        public originalOnreadystatechage = null;

        public xhrMonitoringState: XHRMonitoringState = new XHRMonitoringState();

        //<summary>Determines whether or not JavaScript exception occured in xhr.onreadystatechange code. 1 if occured, otherwise 0.</summary>
        public clientFailure = 0;


        public id: string;

        constructor(id: string) {
            this.id = id;
        }


        public getAbsoluteUrl() {
            return this.requestUrl ? UrlHelper.getAbsoluteUrl(this.requestUrl) : null;
        }

        public getPathName() {
            return this.requestUrl ? Telemetry.Common.DataSanitizer.sanitizeUrl(UrlHelper.getCompleteUrl(this.method, this.requestUrl)): null;
        }

        public CalculateMetrics = function () {
            var self = this;
            // round to 3 decimal points
            self.ajaxTotalDuration = Math.round(dateTime.GetDuration(self.requestSentTime, self.responseFinishedTime)*1000)/1000;
        }
    };
};           

