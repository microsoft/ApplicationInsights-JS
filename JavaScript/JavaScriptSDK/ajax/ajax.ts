/// <reference path="../logging.ts" />
/// <reference path="../util.ts" />
/// <reference path="./ajaxUtils.ts" />
/// <reference path="./ajaxRecord.ts" />

module Microsoft.ApplicationInsights {
    "use strict";

    export interface XMLHttpRequestInstrumented extends XMLHttpRequest {
        ajaxData: ajaxRecord;
    }

    export class AjaxMonitor {
        private appInsights: AppInsights;
        private initiated: boolean;
        private static instrumentedByAppInsightsName = "InstrumentedByAppInsights";

        constructor(appInsights: Microsoft.ApplicationInsights.AppInsights) {
            this.appInsights = appInsights;
            var initiated = false;
            this.Init();
        }

        ///<summary>The main function that needs to be called in order to start Ajax Monitoring</summary>
        private Init = function () {
            if (this.supportsMonitoring()) {
                this.instrumentOpen();
                this.instrumentSetRequestHeader();
                this.instrumentSend();
                this.instrumentAbort();
                this.initiated = true;
            }
        };


        ///<summary>Function that returns property name which will identify that monitoring for given instance of XmlHttpRequest is disabled</summary>
        public static DisabledPropertyName: string = "Microsoft_ApplicationInsights_BypassAjaxInstrumentation";

        ///<summary>Verifies that particalar instance of XMLHttpRequest needs to be monitored</summary>
        ///<param name="excludeAjaxDataValidation">Optional parameter. True if ajaxData must be excluded from verification</param>
        ///<returns type="bool">True if instance needs to be monitored, otherwise false</returns>
        private isMonitoredInstance(xhr: XMLHttpRequestInstrumented, excludeAjaxDataValidation?: boolean): boolean {

            // checking to see that all interested functions on xhr were instrumented
            return this.initiated

            // checking on ajaxData to see that it was not removed in user code
                && (excludeAjaxDataValidation === true || !extensions.IsNullOrUndefined(xhr.ajaxData))

            // check that this instance is not not used by ajax call performed inside client side monitoring to send data to collector
                && xhr[AjaxMonitor.DisabledPropertyName] !== true;

        }

        ///<summary>Determines whether ajax monitoring can be enabled on this document</summary>
        ///<returns>True if Ajax monitoring is supported on this page, otherwise false</returns>
        private supportsMonitoring(): boolean {
            var result = false;
            if (!extensions.IsNullOrUndefined(XMLHttpRequest)) {
                result = true;
            }

            return result;
        }

        private instrumentOpen() {
            var originalOpen = XMLHttpRequest.prototype.open;
            var ajaxMonitorInstance = this;
            XMLHttpRequest.prototype.open = function (method, url, async) {
                try {
                    if (ajaxMonitorInstance.isMonitoredInstance(this, true)) {
                        var ajaxData = new ajaxRecord();
                        ajaxData.method = method;
                        ajaxData.requestUrl = url;
                        ajaxData.requestSize += url.length;
                        // If not set async defaults to true 
                        ajaxData.async = extensions.IsNullOrUndefined(async) ? true : async;
                        this.ajaxData = ajaxData;

                        ajaxMonitorInstance.attachToOnReadyStateChange(this);
                    }
                } catch (e) {
                    _InternalLogging.throwInternalNonUserActionable(
                        LoggingSeverity.CRITICAL,
                        "Failed to monitor XMLHttpRequest.open"
                        + AjaxMonitor.getFailedAjaxDiagnosticsMessage(this)
                        + ", monitoring data for this ajax call may be incorrect: "
                        + Microsoft.ApplicationInsights.Util.dump(e));
                }

                return originalOpen.apply(this, arguments);
            };
        }

        private instrumentSetRequestHeader() {
            var originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
            var ajaxMonitorInstance = this;
            XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
                try {
                    if (ajaxMonitorInstance.isMonitoredInstance(this)) {                    
                        // 2 is the length of ": " which is added to each header
                        this.ajaxData.requestSize += stringUtils.GetLength(name) + stringUtils.GetLength(value) + 2;
                    }
                } catch (e) {
                    _InternalLogging.throwInternalNonUserActionable(
                        LoggingSeverity.CRITICAL,
                        "Failed to monitor XMLHttpRequest.setRequestHeader"
                        + AjaxMonitor.getFailedAjaxDiagnosticsMessage(this)
                        + ", monitoring data for this ajax call may be incorrect: "
                        + Microsoft.ApplicationInsights.Util.dump(e));
                }

                return originalSetRequestHeader.apply(this, arguments);
            };
        }

        public static getFailedAjaxDiagnosticsMessage(xhr: XMLHttpRequestInstrumented): string {
            var result = "";
            try {
                if (!extensions.IsNullOrUndefined(xhr) &&
                    !extensions.IsNullOrUndefined(xhr.ajaxData) &&
                    !extensions.IsNullOrUndefined(xhr.ajaxData.requestUrl)) {
                    result += "(url: '" + xhr.ajaxData.requestUrl + "')";
                }
            } catch (e) { }

            return result;
        }

        private instrumentSend() {
            var originalSend = XMLHttpRequest.prototype.send;
            var ajaxMonitorInstance = this;
            XMLHttpRequest.prototype.send = function (content) {
                try {
                    ajaxMonitorInstance.sendPrefixInstrumentor(this, content);
                } catch (e) {
                    _InternalLogging.throwInternalNonUserActionable(
                        LoggingSeverity.CRITICAL,
                        "Failed to monitor XMLHttpRequest.send"
                        + AjaxMonitor.getFailedAjaxDiagnosticsMessage(this)
                        + ", monitoring data for this ajax call may be incorrect: "
                        + Microsoft.ApplicationInsights.Util.dump(e));
                }

                return originalSend.apply(this, arguments);
            };
        }

        private sendPrefixInstrumentor(xhr: XMLHttpRequestInstrumented, content) {
            if (this.isMonitoredInstance(xhr)) {
                if (!extensions.IsNullOrUndefined(content) && !extensions.IsNullOrUndefined(content.length)) {

                    // http://www.w3.org/TR/XMLHttpRequest/: If the request method is a case-sensitive match for GET or HEAD act as if data is null.
                    if (xhr.ajaxData.method !== "GET" && xhr.ajaxData.method !== "HEAD") {
                        xhr.ajaxData.requestSize += content.length;
                    }
                }

                xhr.ajaxData.requestSentTime = dateTime.Now();
                xhr.ajaxData.loadingRequest = document.readyState === "loading";

                if (!xhr.ajaxData.onreadystatechangeCallbackAttached) {

                    // IE 8 and below does not support xmlh.addEventListener. 
                    // This is the last place for the browsers that does not support addEventListenener to instrument onreadystatechange

                    var ajaxMonitorInstance = this;
                    setTimeout(function () {
                        try {
                            if (xhr.readyState === 4) {
                                // ajax is cached, onreadystatechange didn't fire, but it is completed
                                ajaxMonitorInstance.collectResponseData(xhr);
                                ajaxMonitorInstance.onAjaxComplete(xhr)
                            }
                            else {
                                ajaxMonitorInstance.instrumentOnReadyStateChange(xhr);
                            }
                        } catch (e) {
                            _InternalLogging.throwInternalNonUserActionable(
                                LoggingSeverity.CRITICAL,
                                "Failed to instrument XMLHttpRequest.onreadystatechange"
                                + AjaxMonitor.getFailedAjaxDiagnosticsMessage(xhr)
                                + ", monitoring data for this ajax call may be incorrect: "
                                + Microsoft.ApplicationInsights.Util.dump(e));
                        }
                    }, 5);
                }
            }
        }

        private instrumentAbort() {
            var originalAbort = XMLHttpRequest.prototype.abort;
            var ajaxMonitorInstance = this;
            XMLHttpRequest.prototype.abort = function () {
                try {
                    if (ajaxMonitorInstance.isMonitoredInstance(this)) {
                        this.ajaxData.aborted = 1;
                    }
                } catch (e) {
                    _InternalLogging.throwInternalNonUserActionable(
                        LoggingSeverity.CRITICAL,
                        "Failed to monitor XMLHttpRequest.abort"
                        + AjaxMonitor.getFailedAjaxDiagnosticsMessage(this)
                        + ", monitoring data for this ajax call may be incorrect: "
                        + Microsoft.ApplicationInsights.Util.dump(e));
                }

                return originalAbort.apply(this, arguments);
            };
        }

        ///<summary>instrument onreadystatechange callback</summary>
        ///<returns>True, if onreadystatechange is instrumented, otherwise false</returns>
        private instrumentOnReadyStateChange(xhr: XMLHttpRequestInstrumented): boolean {
            var result = false;

            // do not instrument onreadystatechange if it is defined and not a function, because we are not able to call original function in this case, which happends on Firefox 13 and lower
            if (extensions.IsNullOrUndefined(xhr.onreadystatechange) ||
                (typeof (xhr.onreadystatechange) === "function" && !xhr.onreadystatechange[AjaxMonitor.instrumentedByAppInsightsName])) {
                xhr.ajaxData.originalOnreadystatechage = xhr.onreadystatechange;
                xhr.onreadystatechange = this.onreadystatechangeWrapper(xhr);
                result = true;
            }

            return result;
        }

        private attachToOnReadyStateChange(xhr: XMLHttpRequestInstrumented) {
            var ajaxMonitorInstance = this;
            xhr.ajaxData.onreadystatechangeCallbackAttached = EventHelper.AttachEvent(xhr, "readystatechange", () => {
                try {
                    ajaxMonitorInstance.onreadyStateChangeCallback(xhr);
                } catch (e) {
                    _InternalLogging.throwInternalNonUserActionable(
                        LoggingSeverity.CRITICAL,
                        "Failed to monitor XMLHttpRequest 'readystatechange' event handler"
                        + AjaxMonitor.getFailedAjaxDiagnosticsMessage(xhr)
                        + ", monitoring data for this ajax call may be incorrect: "
                        + Microsoft.ApplicationInsights.Util.dump(e));
                }
            });
        }

        private onreadyStateChangeCallback(xhr: XMLHttpRequestInstrumented) {
            if (this.isMonitoredInstance(xhr)) {
                if (!xhr.onreadystatechange || !xhr.onreadystatechange[AjaxMonitor.instrumentedByAppInsightsName]) {
                    if (xhr.readyState < 3) {

                        // it is possible to define onreadystatechange event after xhr.send method was invoked.
                        // instrumenting xhr.onreadystatechange in order to measure callback time
                        this.instrumentOnReadyStateChange(xhr);
                    }
                    else {

                        // On Firefox 13- we cannot override readystatechange, because it is not a function. 
                        // In this case we don't include callback time in Ajax Total time on this browser
                        this.onReadStateChangePrefix(xhr);
                        this.onReadyStateChangePostfix(xhr);
                    }
                }
            }
        }

        private onreadystatechangeWrapper(xhr: XMLHttpRequestInstrumented): () => any {
            var ajaxMonitorInstance = this;
            var wrapper = () => {
                try {
                    // NOTE: this is onreadystatechange event handler of XMLHttpRequest. Therefore 'this' refers to the current instance of XMLHttpRequest.
                    if (ajaxMonitorInstance.isMonitoredInstance(xhr)) {
                        ajaxMonitorInstance.onReadStateChangePrefix(xhr);
                        try {
                            if (!extensions.IsNullOrUndefined(xhr.ajaxData.originalOnreadystatechage)) {
                                xhr.ajaxData.originalOnreadystatechage.call(xhr);
                            }
                        } catch (ex) {
                            xhr.ajaxData.clientFailure = 1;
                            throw ex;
                        } finally {
                            if (!extensions.IsNullOrUndefined(xhr.ajaxData.originalOnreadystatechage)) {
                                if (xhr.readyState === 4) {
                                    xhr.ajaxData.callbackFinishedTime = dateTime.Now();
                                }
                            }

                            ajaxMonitorInstance.onReadyStateChangePostfix(xhr);
                        }
                    }
                } catch (e) {
                    _InternalLogging.throwInternalNonUserActionable(
                        LoggingSeverity.CRITICAL,
                        "Failed to monitor XMLHttpRequest.onreadystatechange"
                        + AjaxMonitor.getFailedAjaxDiagnosticsMessage(xhr)
                        + ", monitoring data for this ajax call may be incorrect: "
                        + Microsoft.ApplicationInsights.Util.dump(e));
                }
            }
            wrapper[AjaxMonitor.instrumentedByAppInsightsName] = true;

            return wrapper;
        }

        private onReadStateChangePrefix(xhr: XMLHttpRequestInstrumented) {
            switch (xhr.readyState) {
                case 3:
                    xhr.ajaxData.responseStartedTime = dateTime.Now();
                    break;
                case 4:
                    this.collectResponseData(xhr);
                    break;
            }
        }

        private onReadyStateChangePostfix(xhr: XMLHttpRequestInstrumented) {
            if (xhr.readyState === 4) {
                this.onAjaxComplete(xhr);
            }
        }

        private onAjaxComplete(xhr: XMLHttpRequestInstrumented) {
            try {
                xhr.ajaxData.CalculateMetrics();
                
                this.appInsights.trackAjax(
                    xhr.ajaxData.getHostName(),
                    xhr.ajaxData.getAbsoluteUrl(),
                    xhr.ajaxData.async,
                    xhr.ajaxData.ajaxTotalDuration,
                    (+(xhr.ajaxData.status)) < 400
                    );
            } catch (e) {
                _InternalLogging.throwInternalNonUserActionable(
                    LoggingSeverity.CRITICAL,
                    "Failed to complete monitoring of this ajax call: "
                    + Microsoft.ApplicationInsights.Util.dump(e));
            }
            finally {
                try {
                    EventHelper.DetachEvent(xhr, "readystatechange", this.onreadyStateChangeCallback);
                    delete xhr.ajaxData;
                } catch (e) {
                    _InternalLogging.throwInternalNonUserActionable(
                        LoggingSeverity.WARNING,
                        "Failed to rollback instrumentation of current instance of XMLHttpRequest" + AjaxMonitor.getFailedAjaxDiagnosticsMessage(xhr) + ": "
                        + Microsoft.ApplicationInsights.Util.dump(e));
                }
            }
        }

        private collectResponseData(xhr: XMLHttpRequestInstrumented) {
            var currentTime = dateTime.Now();
            var self = this;
            xhr.ajaxData.responseFinishedTime = currentTime;

            // Next condition is TRUE sometimes, when ajax request is not authorised by server.
            if (xhr.ajaxData.responseStartedTime === null) {
                xhr.ajaxData.responseStartedTime = currentTime;
            }

            // FF throws exception on accessing properties of xhr when network error occured during ajax call
            // http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)

            try {
                xhr.ajaxData.status = xhr.status;
                xhr.ajaxData.contentType = xhr.getResponseHeader("Content-Type");
                xhr.ajaxData.responseSize = xhr.responseText.length;
                xhr.ajaxData.responseSize += xhr.getAllResponseHeaders().length;

                //add 'HTTP/1.1 200 OK' length
                xhr.ajaxData.responseSize += 17;
            } catch (e) {
                _InternalLogging.throwInternalNonUserActionable(
                    LoggingSeverity.CRITICAL,
                    "Failed to collect response data"
                    + AjaxMonitor.getFailedAjaxDiagnosticsMessage(xhr) + ": "
                    + Microsoft.ApplicationInsights.Util.dump(e));
            }
        }

    }
}