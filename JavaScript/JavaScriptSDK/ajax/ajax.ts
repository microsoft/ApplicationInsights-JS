/// <reference path="../logging.ts" />
/// <reference path="../util.ts" />
/// <reference path="./ajaxUtils.ts" />
/// <reference path="./ajaxRecord.ts" />

module Microsoft.ApplicationInsights {
    "use strict";

    export class AjaxMonitor {

        private appInsights: Microsoft.ApplicationInsights.AppInsights;
        private ajaxMonitorInternal = null;

        constructor(appInsights: Microsoft.ApplicationInsights.AppInsights) {
            this.appInsights = appInsights;
                        
            ///<summary>The function object that provides ajax monitoring on the page</summary>
            function ajaxMonitoring(appInsights: Microsoft.ApplicationInsights.AppInsights) {
                var appInsights = appInsights;

                var initiated = false;

                ///<summary>The main function that needs to be called in order to start Ajax Monitoring</summary>
                this.Init = function () {
                    if (supportMonitoring()) {
                        interceptOpen();
                        interceptSetRequestHeader();
                        interceptSend();
                        interceptAbort();
                        initiated = true;
                    }
                };


                ///<summary>Function that returns property name which will identify that monitoring for given instance of XmlHttpRequest is disabled</summary>
                this.GetDisabledPropertyName = function () {
                    return getDisabledPropertyName();
                };


                function getDisabledPropertyName() {
                    return "Microsoft_ApplicationInsights_BypassAjaxInstrumentation";
                }

                ///<summary>Verifies that particalar instance of XMLHttpRequest needs to be monitored</summary>
                ///<param name="excludeAjaxDataValidation">Optional parameter. True if ajaxData must be excluded from verification</param>
                ///<returns type="bool">True if instance needs to be monitored, otherwise false</returns>
                function isMonitoredInstance(excludeAjaxDataValidation) {

                    // checking to see that all interested functions on xhr were intercepted
                    return initiated

                    // checking on ajaxData to see that it was not removed in user code
                        && (excludeAjaxDataValidation === true || !extensions.IsNullOrUndefined(this.ajaxData))

                    // check that this instance is not not used by ajax call performed inside client side monitoring to send data to collector
                        && commands.TryCatchTraceWrapper.call(this, "Check_If_Monitoring_Enabled_For_XmlHttpRequest_Instance", function () {
                            return this[getDisabledPropertyName()];
                        }) !== true;

                }

                ///<summary>Determines whether ajax monitoring can be enabled on this document</summary>
                ///<returns>True if Ajax monitoring is supported on this page, otherwise false</returns>
                function supportMonitoring() {
                    var result = false;
                    if (!extensions.IsNullOrUndefined(XMLHttpRequest)) {
                        result = true;
                    }

                    return result;
                }

                function interceptOpen() {
                    var originalOpen = XMLHttpRequest.prototype.open;
                    XMLHttpRequest.prototype.open = function (method, url, async) {
                        if (isMonitoredInstance.call(this, true)) {
                            this.ajaxData = new ajaxRecord();
                            attachToOnReadyStateChange.call(this);
                            commands.TryCatchTraceWrapper.call(this, "openPrefix", function () {
                                var self = this;
                                self.ajaxData.method = method;
                                self.ajaxData.requestUrl = url;
                                self.ajaxData.requestSize += url.length;

                                // If not set async defaults to true 
                                self.ajaxData.async = extensions.IsNullOrUndefined(async) ? true : async;

                            });
                        }

                        return originalOpen.apply(this, arguments);
                    };
                }

                function interceptSend() {
                    var originalSend = XMLHttpRequest.prototype.send;
                    XMLHttpRequest.prototype.send = function (content) {
                        sendPrefixInterceptor.call(this, content);
                        return originalSend.apply(this, arguments);
                    };
                }

                function sendPrefixInterceptor(content) {
                    if (isMonitoredInstance.call(this)) {
                        commands.TryCatchTraceWrapper.call(this, "sendPrefix", function () {
                            if (!extensions.IsNullOrUndefined(content) && !extensions.IsNullOrUndefined(content.length)) {

                                // http://www.w3.org/TR/XMLHttpRequest/: If the request method is a case-sensitive match for GET or HEAD act as if data is null.
                                if (this.ajaxData.method !== "GET" && this.ajaxData.method !== "HEAD") {
                                    this.ajaxData.requestSize += content.length;
                                }
                            }

                            this.ajaxData.requestSentTime = dateTime.Now();
                            this.ajaxData.loadingRequest = document.readyState === "loading";

                            if (!this.ajaxData.onreadystatechangeCallbackAttached) {

                                // IE 8 and below does not support xmlh.addEventListener. This the last place for the browsers that does not support addEventListenener to intercept onreadystatechange
                                var that = this;
                                setTimeout(function () {
                                    if (that.readyState === 4) {

                                        // ajax is cached, onreadystatechange didn't fire, but it is completed
                                        commands.TryCatchTraceWrapper.call(that, "readyState(4)", collectResponseData);
                                        onAjaxComplete.call(that);
                                    }
                                    else {
                                        interceptOnReadyStateChange.call(that);
                                    }
                                }, 5);
                            }
                        });
                    }
                }

                function interceptAbort() {
                    var originalAbort = XMLHttpRequest.prototype.abort;
                    XMLHttpRequest.prototype.abort = function () {
                        if (isMonitoredInstance.call(this)) {
                            this.ajaxData.aborted = 1;
                        }

                        return originalAbort.apply(this, arguments);
                    };
                }

                ///<summary>Intercept onreadystatechange callback</summary>
                ///<returns>True, if onreadystatechange is intercepted, otherwise false</returns>
                function interceptOnReadyStateChange() {
                    var result = false;

                    // do not intercept onreadystatechange if it is defined and not a function, because we are not able to call original function in this case, which happends on Firefox 13 and lower
                    if (extensions.IsNullOrUndefined(this.onreadystatechange) || (typeof (this.onreadystatechange) === "function")) {
                        this.ajaxData.originalOnreadystatechage = this.onreadystatechange;
                        this.onreadystatechange = onreadystatechangeWrapper;
                        result = true;
                    }

                    return result;
                }

                function attachToOnReadyStateChange() {
                    this.ajaxData.onreadystatechangeCallbackAttached = commands.AttachEvent(this, "readystatechange", onreadyStateChangeCallback);
                }

                function onreadyStateChangeCallback() {
                    if (isMonitoredInstance.call(this)) {
                        if (this.onreadystatechange !== onreadystatechangeWrapper) {

                            if (this.readyState < 3) {

                                // it is possible to define onreadystatechange event after xhr.send method was invoked.
                                // intercepting xhr.onreadystatechange in order to measure callback time
                                interceptOnReadyStateChange.call(this);
                            }
                            else {

                                // On Firefox 13- we cannot override readystatechange, because it is not a function. 
                                // In this case we don't include callback time in Ajax Total time on this browser
                                onReadStateChangePrefix.call(this);
                                onReadyStateChangePostfix.call(this);
                            }
                        }
                    }
                }

                function onreadystatechangeWrapper() {
                    if (isMonitoredInstance.call(this)) {
                        onReadStateChangePrefix.call(this);
                        try {

                            // customer's callback can raise exception. We need to proceed monitor ajax call in this case as well.
                            if (!extensions.IsNullOrUndefined(this.ajaxData.originalOnreadystatechage)) {
                                this.ajaxData.originalOnreadystatechage.call(this);
                            }
                        } catch (ex) {
                            this.ajaxData.clientFailure = 1;
                            throw ex;

                        } finally {
                            if (!extensions.IsNullOrUndefined(this.ajaxData.originalOnreadystatechage)) {
                                commands.TryCatchTraceWrapper.call(this, "callbackFinishedTime", function () {
                                    if (this.readyState === 4) {
                                        this.ajaxData.callbackFinishedTime = dateTime.Now();
                                    }
                                });
                            }

                            onReadyStateChangePostfix.call(this);
                        }
                    }
                };

                function onReadStateChangePrefix() {
                    switch (this.readyState) {
                        case 3:
                            commands.TryCatchTraceWrapper.call(this, "readyState(3)", function () {
                                this.ajaxData.responseStartedTime = dateTime.Now();
                            });
                            break;
                        case 4:
                            commands.TryCatchTraceWrapper.call(this, "readyState(4)", collectResponseData);
                            break;
                    }
                }

                function onReadyStateChangePostfix() {
                    if (this.readyState === 4) {
                        onAjaxComplete.call(this);
                    }
                }

                function onAjaxComplete() {
                    commands.TryCatchTraceWrapper.call(this, "publishData", function () {
                        this.ajaxData.CalculateMetrics();

                        var successStatuses = [200, 201, 202, 203, 204, 301, 302, 303, 304];

                        appInsights.trackAjax(
                            this.ajaxData.getAbsoluteUrl(),
                            this.ajaxData.async,
                            this.ajaxData.ajaxTotalDuration,
                            successStatuses.indexOf(+this.ajaxData.status) != -1
                            );
                    });

                    commands.TryCatchTraceWrapper.call(this, "deleteAjaxData", function () {
                        commands.DetachEvent(this, "readystatechange", onreadyStateChangeCallback);
                        delete this.ajaxData;
                    });
                }

                function collectResponseData() {
                    var currentTime = dateTime.Now();
                    var self = this;
                    self.ajaxData.responseFinishedTime = currentTime;

                    // Next condition is TRUE sometimes, when ajax request is not authorised by server.
                    // See TFS #11632 for details.
                    if (self.ajaxData.responseStartedTime === null) {
                        self.ajaxData.responseStartedTime = currentTime;
                    }

                    // FF throws exception on accessing properties of xhr when network error occured during ajax call
                    // http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)

                    try {
                        this.ajaxData.status = this.status;
                        this.ajaxData.contentType = this.getResponseHeader("Content-Type");
                        this.ajaxData.responseSize = this.responseText.length;
                        this.ajaxData.responseSize += this.getAllResponseHeaders().length;

                        //add 'HTTP/1.1 200 OK' length
                        this.ajaxData.responseSize += 17;
                    } catch (e) {
                        _InternalLogging.throwInternalNonUserActionable(
                            LoggingSeverity.CRITICAL,
                            "Failed to collect response data: "
                            + Microsoft.ApplicationInsights.Util.dump(e));
                    }
                }

                function interceptSetRequestHeader() {
                    var originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
                    XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
                        if (isMonitoredInstance.call(this)) {
                            commands.TryCatchTraceWrapper.call(this, "Adding size of header to total request size", function () {
                                // 2 is the length of ": " which is added to each header
                                this.ajaxData.requestSize += stringUtils.GetLength(name) + stringUtils.GetLength(value) + 2;
                            });
                        }

                        return originalSetRequestHeader.apply(this, arguments);
                    };
                }
            };

            
            var ajaxMonitoringObject = new ajaxMonitoring(this.appInsights);
            ajaxMonitoringObject.Init();
            this.ajaxMonitorInternal = ajaxMonitoringObject;            
        }
    }
}