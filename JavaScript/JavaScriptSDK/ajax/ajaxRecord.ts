/// <reference path="../logging.ts" />
/// <reference path="../util.ts" />
/// <reference path="./ajaxUtils.ts" />

module Microsoft.ApplicationInsights {
    "use strict";

    export class ajaxRecord {
        public async = false;
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
        public contentType = null;
        public contentEncoding = null;
        public responseSize = 0;

        //<summary>The timestamp when open method was invoked</summary>
        public requestSentTime = null;

        //<summary>The timestamps when first byte was received</summary>
        public responseStartedTime = null;

        //<summary>The timestamp when last byte was received</summary>
        public responseFinishedTime = null;

        //<summary>The timestamp when onreadystatechange callback in readyState 4 finished</summary>
        public callbackFinishedTime = null;

        //<summary>True, if this request was performed when dom was loading, before document was interactive, otherwise false</summary>
        public loadingRequest = false;

        //<summary>The timestamp at which ajax was ended</summary>
        public endTime = null;

        //<summary>The original xhr onreadystatechange event</summary>
        public originalOnreadystatechage = null;

        //<summary>True, if onreadyStateChangeCallback function attached to xhr, otherwise false</summary>
        public onreadystatechangeCallbackAttached = false;

        //<summary>Determines whether or not JavaScript exception occured in xhr.onreadystatechange code. 1 if occured, otherwise 0.</summary>
        public clientFailure = 0;

        public getAbsoluteUrl = function () {
            return this.requestUrl ? Util.getAbsoluteUrl(this.requestUrl) : null;
        }

        public CalculateMetrics = function () {
            var self = this;
            self.ttfb = dateTime.GetDuration(self.requestSentTime, self.responseStartedTime);
            self.responseReceivingDuration = dateTime.GetDuration(self.responseStartedTime, self.responseFinishedTime);
            self.callbackDuration = dateTime.GetDuration(self.responseFinishedTime, self.callbackFinishedTime);

            var timeStamps = [self.responseStartedTime, self.responseFinishedTime, self.callbackFinishedTime];
            for (var i = timeStamps.length - 1; i >= 0; i--) {
                if (timeStamps[i] !== null) {
                    self.endTime = timeStamps[i];
                    self.ajaxTotalDuration = dateTime.GetDuration(self.requestSentTime, self.endTime);
                    break;
                }
            }
        };
    };           

}