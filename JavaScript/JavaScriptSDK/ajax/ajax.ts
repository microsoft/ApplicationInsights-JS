/// <reference path="../logging.ts" />
/// <reference path="../util.ts" />
/// <reference path="./ajaxUtils.ts" />
/// <reference path="./ajaxRecord.ts" />

module Microsoft.ApplicationInsights {
    "use strict";

    export class AjaxMonitor {
        private appInsights: AppInsights;
        private initiated: boolean;

        constructor(appInsights: Microsoft.ApplicationInsights.AppInsights) {
            this.appInsights = appInsights;
            var initiated = false;
            this.Init();
        }

        ///<summary>The main function that needs to be called in order to start Ajax Monitoring</summary>
        private Init = function () {
            if (this.supportMonitoring()) {
                this.interceptOpen();
                this.interceptSetRequestHeader();
                this.interceptSend();
                this.interceptAbort();
                this.initiated = true;
            }
        };


        ///<summary>Function that returns property name which will identify that monitoring for given instance of XmlHttpRequest is disabled</summary>
        private GetDisabledPropertyName = function () {
            return "Microsoft_ApplicationInsights_BypassAjaxInstrumentation";
        };

        ///<summary>Verifies that particalar instance of XMLHttpRequest needs to be monitored</summary>
        ///<param name="excludeAjaxDataValidation">Optional parameter. True if ajaxData must be excluded from verification</param>
        ///<returns type="bool">True if instance needs to be monitored, otherwise false</returns>
        private isMonitoredInstance(xhr: XMLHttpRequest, excludeAjaxDataValidation?: boolean) {

            // checking to see that all interested functions on xhr were intercepted
            return this.initiated

            // checking on ajaxData to see that it was not removed in user code
                && (excludeAjaxDataValidation === true || !extensions.IsNullOrUndefined((<any>xhr).ajaxData))

            // check that this instance is not not used by ajax call performed inside client side monitoring to send data to collector
                && xhr[this.GetDisabledPropertyName()] !== true;

        }

        ///<summary>Determines whether ajax monitoring can be enabled on this document</summary>
        ///<returns>True if Ajax monitoring is supported on this page, otherwise false</returns>
        private supportMonitoring() {
            var result = false;
            if (!extensions.IsNullOrUndefined(XMLHttpRequest)) {
                result = true;
            }

            return result;
        }

        private interceptOpen() {
            var originalOpen = XMLHttpRequest.prototype.open;
            var ajaxMonitorInstance = this;
            XMLHttpRequest.prototype.open = function (method, url, async) {
                try {
                    if (ajaxMonitorInstance.isMonitoredInstance(this, true)) {
                        ajaxMonitorInstance.attachToOnReadyStateChange(this);

                        var ajaxData = new ajaxRecord();
                        ajaxData.method = method;
                        ajaxData.requestUrl = url;
                        ajaxData.requestSize += url.length;
                        // If not set async defaults to true 
                        ajaxData.async = extensions.IsNullOrUndefined(async) ? true : async;

                        this.ajaxData = ajaxData;
                    }
                } catch (e) {
                    // TODO
                }

                return originalOpen.apply(this, arguments);
            };
        }

        private interceptSend() {
            var originalSend = XMLHttpRequest.prototype.send;
            var ajaxMonitorInstance = this;
            XMLHttpRequest.prototype.send = function (content) {
                ajaxMonitorInstance.sendPrefixInterceptor(this, content);
                return originalSend.apply(this, arguments);
            };
        }

        private sendPrefixInterceptor(xhr: XMLHttpRequest, content) {
            try {
                if (this.isMonitoredInstance(xhr)) {
                    if (!extensions.IsNullOrUndefined(content) && !extensions.IsNullOrUndefined(content.length)) {

                        // http://www.w3.org/TR/XMLHttpRequest/: If the request method is a case-sensitive match for GET or HEAD act as if data is null.
                        if ((<any>xhr).ajaxData.method !== "GET" && (<any>this).ajaxData.method !== "HEAD") {
                            (<any>xhr).ajaxData.requestSize += content.length;
                        }
                    }

                    (<any>xhr).ajaxData.requestSentTime = dateTime.Now();
                    (<any>xhr).ajaxData.loadingRequest = document.readyState === "loading";

                    if (!(<any>xhr).ajaxData.onreadystatechangeCallbackAttached) {

                        // IE 8 and below does not support xmlh.addEventListener. 
                        // This is the last place for the browsers that does not support addEventListenener to intercept onreadystatechange
                        
                        var ajaxMonitorInstance = this;
                        setTimeout(function () {
                            if (xhr.readyState === 4) {
                                // ajax is cached, onreadystatechange didn't fire, but it is completed
                                ajaxMonitorInstance.collectResponseData(xhr);
                                ajaxMonitorInstance.onAjaxComplete(xhr)
                            }
                            else {
                                ajaxMonitorInstance.interceptOnReadyStateChange(xhr);
                            }
                        }, 5);
                    }
                }
            } catch (e) {
                // TODO
            }
        }

        private interceptAbort() {
            var originalAbort = XMLHttpRequest.prototype.abort;
            var ajaxMonitorInstance = this;
            XMLHttpRequest.prototype.abort = function () {
                if (ajaxMonitorInstance.isMonitoredInstance(this)) {
                    this.ajaxData.aborted = 1;
                }

                return originalAbort.apply(this, arguments);
            };
        }

        ///<summary>Intercept onreadystatechange callback</summary>
        ///<returns>True, if onreadystatechange is intercepted, otherwise false</returns>
        private interceptOnReadyStateChange(xhr: XMLHttpRequest) {
            var result = false;

            // do not intercept onreadystatechange if it is defined and not a function, because we are not able to call original function in this case, which happends on Firefox 13 and lower
            if (extensions.IsNullOrUndefined((<any>xhr).onreadystatechange) || (typeof ((<any>xhr).onreadystatechange) === "function")) {
                (<any>xhr).ajaxData.originalOnreadystatechage = (<any>xhr).onreadystatechange;
                (<any>xhr).onreadystatechange = this.onreadystatechangeWrapper(xhr);
                result = true;
            }

            return result;
        }

        private attachToOnReadyStateChange(xhr: XMLHttpRequest) {
            (<any>xhr).ajaxData.onreadystatechangeCallbackAttached = commands.AttachEvent(xhr, "readystatechange", () => { this.onreadyStateChangeCallback(xhr); });
        }

        private onreadyStateChangeCallback(xhr: XMLHttpRequest) {
            if (this.isMonitoredInstance(xhr)) {
                if (xhr.onreadystatechange !== this.onreadystatechangeWrapper) {

                    if (xhr.readyState < 3) {

                        // it is possible to define onreadystatechange event after xhr.send method was invoked.
                        // intercepting xhr.onreadystatechange in order to measure callback time
                        this.interceptOnReadyStateChange(xhr);
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

        private onreadystatechangeWrapper(xhr: XMLHttpRequest) {
            var ajaxMonitorInstance = this;
            return () => {
                // NOTE: this is onreadystatechange event handler of XMLHttpRequest. Therefore 'this' refers to the current instance of XMLHttpRequest.
                if (ajaxMonitorInstance.isMonitoredInstance(xhr)) {
                    ajaxMonitorInstance.onReadStateChangePrefix(xhr);
                    try {
                        // 'this' refers an instance of XHR here
                        if (!extensions.IsNullOrUndefined((<any>this).ajaxData.originalOnreadystatechage)) {
                            (<any>this).ajaxData.originalOnreadystatechage.call(this);
                        }
                    } catch (ex) {
                        (<any>this).ajaxData.clientFailure = 1;
                        throw ex;

                    } finally {
                        if (!extensions.IsNullOrUndefined((<any>this).ajaxData.originalOnreadystatechage)) {
                            try {
                                if ((<any>this).readyState === 4) {
                                    (<any>this).ajaxData.callbackFinishedTime = dateTime.Now();
                                }
                            } catch (e) {
                                // TODO
                            }
                        }

                        ajaxMonitorInstance.onReadyStateChangePostfix(xhr);
                    }
                }
            }
        }

        private onReadStateChangePrefix(xhr: XMLHttpRequest) {
            switch (xhr.readyState) {
                case 3:
                    (<any>xhr).ajaxData.responseStartedTime = dateTime.Now();
                    break;
                case 4:
                    this.collectResponseData(xhr);
                    break;
            }
        }

        private onReadyStateChangePostfix(xhr: XMLHttpRequest) {
            if (xhr.readyState === 4) {
                this.onAjaxComplete(xhr);
            }
        }

        private onAjaxComplete(xhr: XMLHttpRequest) {
            commands.TryCatchTraceWrapper.call(this, "publishData", function () {
                (<any>xhr).ajaxData.CalculateMetrics();

                var successStatuses = [200, 201, 202, 203, 204, 301, 302, 303, 304];

                this.appInsights.trackAjax(
                    (<any>xhr).ajaxData.getAbsoluteUrl(),
                    (<any>xhr).ajaxData.async,
                    (<any>xhr).ajaxData.ajaxTotalDuration,
                    successStatuses.indexOf(+(<any>xhr).ajaxData.status) != -1
                    );

                commands.DetachEvent(xhr, "readystatechange", this.onreadyStateChangeCallback);
                delete (<any>xhr).ajaxData;
            });
        }

        private collectResponseData(xhr: XMLHttpRequest) {
            var currentTime = dateTime.Now();
            var self = this;
            (<any>xhr).ajaxData.responseFinishedTime = currentTime;

            // Next condition is TRUE sometimes, when ajax request is not authorised by server.
            if ((<any>xhr).ajaxData.responseStartedTime === null) {
                (<any>xhr).ajaxData.responseStartedTime = currentTime;
            }

            // FF throws exception on accessing properties of xhr when network error occured during ajax call
            // http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)

            try {
                (<any>xhr).ajaxData.status = xhr.status;
                (<any>xhr).ajaxData.contentType = xhr.getResponseHeader("Content-Type");
                (<any>xhr).ajaxData.responseSize = xhr.responseText.length;
                (<any>xhr).ajaxData.responseSize += xhr.getAllResponseHeaders().length;

                //add 'HTTP/1.1 200 OK' length
                (<any>xhr).ajaxData.responseSize += 17;
            } catch (e) {
                _InternalLogging.throwInternalNonUserActionable(
                    LoggingSeverity.CRITICAL,
                    "Failed to collect response data: "
                    + Microsoft.ApplicationInsights.Util.dump(e));
            }
        }

        private interceptSetRequestHeader() {
            var originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
            XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
                if (this.isMonitoredInstance.call(this)) {
                    commands.TryCatchTraceWrapper.call(this, "Adding size of header to total request size", function () {
                        // 2 is the length of ": " which is added to each header
                        this.ajaxData.requestSize += stringUtils.GetLength(name) + stringUtils.GetLength(value) + 2;
                    });
                }

                return originalSetRequestHeader.apply(this, arguments);
            };
        }
    }
}