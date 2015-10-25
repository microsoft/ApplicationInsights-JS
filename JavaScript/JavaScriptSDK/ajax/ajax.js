;
var $$CsmSt = function () {
    var csmConstants = {
        attachEvent: "attachEvent",
        de: "detachEvent",
        ad: "addEventListener",
        re: "removeEventListener",
        udf: "undefined"
    };

    ///<summary>Represents an instant in time</summary>
    var dateTime = {
        
        ///<summary>Return the number of milliseconds since 1970/01/01 in local timezon</summary>
        Now: function () {
            return new Date().getTime();
        },

        ///<summary>Gets duration between two timestamps</summary>
        GetDuration: function (start, end) {
            var result = null;
            if (start !== 0 && end !== 0 && !extensions.IsNullOrUndefined(start) && !extensions.IsNullOrUndefined(end)) {
                result = end - start;
            }

            return result;
        }
    };

    /*#endregion*/

    /*#region [Commands]*/
    var commands = {

        /// <summary>
        /// Wrappes function call in try..catch block and trace exception in case it occurs
        /// <param name="functionName">The name of the function which is wrapped</param>
        /// <param name="funcPointer">Pointer to the function which needs to be wrappped</param>
        /// <param name="params">Array of parameters that will be traced in case exception happends in the function</param>
        /// </summary>
        TryCatchTraceWrapper: function (functionName, funcPointer, params) {
            try {
                return funcPointer.call(this);
            }
            catch (ex) {
                window.appInsights.trackException(iex);
            }
        },

        ///<summary>Binds the specified function to an event, so that the function gets called whenever the event fires on the object</summary>
        ///<param name="obj">Object to which </param>
        ///<param name="eventNameWithoutOn">String that specifies any of the standard DHTML Events without "on" prefix</param>
        ///<param name="handlerRef">Pointer that specifies the function to call when event fires</param>
        ///<returns>True if the function was bound successfully to the event, otherwise false</returns>
        AttachEvent: function (obj, eventNameWithoutOn, handlerRef) {
            var result = false;
            if (!extensions.IsNullOrUndefined(obj)) {
                if (!extensions.IsNullOrUndefined(obj.attachEvent)) {

                    // IE before version 9
                    commands.TryCatchTraceWrapper(
                        "attachEvent",
                        function () {
                            obj.attachEvent("on" + eventNameWithoutOn, handlerRef);
                            result = true;
                        },
                        [obj, eventNameWithoutOn, csmConstants.attachEvent]);
                }
                else {
                    if (!extensions.IsNullOrUndefined(obj.addEventListener)) {

                        // all browsers except IE before version 9
                        commands.TryCatchTraceWrapper(
                            "addEventListener",
                            function () {
                                obj.addEventListener(eventNameWithoutOn, handlerRef, false);
                                result = true;
                            },
                            [obj, eventNameWithoutOn, csmConstants.ad]);
                    }
                }
            }

            return result;
        },

        DetachEvent: function (obj, eventNameWithoutOn, handlerRef) {
            if (!extensions.IsNullOrUndefined(obj)) {
                if (!extensions.IsNullOrUndefined(obj.detachEvent)) {
                    commands.TryCatchTraceWrapper(
                        "detachEvent",
                        function () {
                            obj.detachEvent("on" + eventNameWithoutOn, handlerRef);
                        },
                        [obj.toString(), eventNameWithoutOn, csmConstants.de]);
                }
                else {
                    if (!extensions.IsNullOrUndefined(obj.removeEventListener)) {
                        commands.TryCatchTraceWrapper(
                            "removeEventListener",
                            function () {
                                obj.removeEventListener(eventNameWithoutOn, handlerRef, false);
                            },
                            [obj.toString(), eventNameWithoutOn, csmConstants.re]);
                    }
                }
            }
        }
    };
    this.Commands = commands;
    /*#endregion*/

    ///<summary>Extension methods for object type</summary>
    var extensions = {
        IsNullOrUndefined: function (obj) {
            return typeof (obj) === csmConstants.udf || obj === null;
        },

    };

    var stringUtils = {
        GetLength: function (strObject) {
            var res = 0;
            if (!extensions.IsNullOrUndefined(strObject)) {
                var stringified = "";
                try {
                    stringified = strObject.toString();
                } catch (ex) {
                    // some troubles with complex object
                }

                res = parseInt(stringified.length);
                res = isNaN(res) ? 0 : res;
            }

            return res;
        }
    };

    ///<summary>Monitoring information about individual Ajax request</summary>
    function ajaxRecord() {
        this.async = false;
        this.completed = false;
        this.requestHeadersSize = null;
        this.ttfb = null;
        this.responseReceivingDuration = null;
        this.callbackDuration = null;
        this.ajaxTotalDuration = null;
        this.aborted = null;
        this.pageUrl = null;
        this.requestUrl = null;
        this.requestSize = 0;
        this.method = null;

        ///<summary>Returns the HTTP status code.</summary>
        this.status = null;
        this.contentType = null;
        this.contentEncoding = null;
        this.responseSize = 0;

        //<summary>The timestamp when open method was invoked</summary>
        this.requestSentTime = null;

        //<summary>The timestamps when first byte was received</summary>
        this.responseStartedTime = null;

        //<summary>The timestamp when last byte was received</summary>
        this.responseFinishedTime = null;

        //<summary>The timestamp when onreadystatechange callback in readyState 4 finished</summary>
        this.callbackFinishedTime = null;

        //<summary>True, if this request was performed when dom was loading, before document was interactive, otherwise false</summary>
        this.loadingRequest = false;

        //<summary>The timestamp at which ajax was ended</summary>
        this.endTime = null;

        //<summary>The original xhr onreadystatechange event</summary>
        this.originalOnreadystatechage = null;

        //<summary>True, if onreadyStateChangeCallback function attached to xhr, otherwise false</summary>
        this.onreadystatechangeCallbackAttached = false;

        //<summary>Determines whether or not JavaScript exception occured in xhr.onreadystatechange code. 1 if occured, otherwise 0.</summary>
        this.clientFailure = 0;

        this.getAbsoluteUrl = function () {
            return this.requestUrl ? Util.getAbsoluteUrl(this.requestUrl) : null;
        }

        this.CalculateMetrics = function () {
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

    var Util = {
        getAbsoluteUrl: (function () {
            var a;

            return function (url) {
                if (!a) a = document.createElement('a');
                a.href = url;

                return a.href;
            };
        })()
    }

    ///<summary>The function object that provides ajax monitoring on the page</summary>
    function ajaxMonitoring() {

        ///<summary>The main function that needs to be called in order to start Ajax Monitoring</summary>
        this.Init = function () {
            if (supportMonitoring()) {
                interceptOpen();
                interceptSetRequestHeader();
                interceptSend();
                interceptSendAsBinary();
                interceptAbort();
                ajaxMonitoring.initiated = true;
            }
        };


        ///<summary>Function that returns property name which will identify that monitoring for given instance of XmlHttpRequest is disabled</summary>
        this.GetDisabledPropertyName = function () {
            return getDisabledPropertyName();
        };


        function getDisabledPropertyName() {
            return "__csm_disabled";
        }

        ///<summary>Verifies that particalar instance of XMLHttpRequest needs to be monitored</summary>
        ///<param name="excludeAjaxDataValidation">Optional parameter. True if ajaxData must be excluded from verification</param>
        ///<returns type="bool">True if instance needs to be monitored, otherwise false</returns>
        function isMonitoredInstance(excludeAjaxDataValidation) {

            // checking to see that all interested functions on xhr were intercepted
            return ajaxMonitoring.initiated

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
            if (!extensions.IsNullOrUndefined(window.XMLHttpRequest)) {
                result = true;
            }

            return result;
        }

        function interceptOpen() {
            var originalOpen = window.XMLHttpRequest.prototype.open;
            window.XMLHttpRequest.prototype.open = function (method, url, async) {
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
            var originalSend = window.XMLHttpRequest.prototype.send;
            window.XMLHttpRequest.prototype.send = function (content) {
                sendPrefixInterceptor.call(this, content);
                return originalSend.apply(this, arguments);
            };
        }

        ///<summary>FF since 3.0 has method XMLHttpRequest.sendAsBinary. Verifying its existance and intercepting it.</summary>
        function interceptSendAsBinary() {
            if (typeof (window.XMLHttpRequest.prototype.sendAsBinary) === "function") {
                var originalSendAsBinary = window.XMLHttpRequest.prototype.sendAsBinary;
                window.XMLHttpRequest.prototype.sendAsBinary = function (content) {
                    sendPrefixInterceptor.call(this, content);
                    return originalSendAsBinary.apply(this, arguments);
                };
            }
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
            var originalAbort = window.XMLHttpRequest.prototype.abort;
            window.XMLHttpRequest.prototype.abort = function () {
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

                window.appInsights.trackAjax(
                    this.ajaxData.getAbsoluteUrl(),
                    this.ajaxData.async,
                    this.ajaxData.ajaxTotalDuration,
                    this.ajaxData.status == "200"
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
                window.appInsights.trackException(e);
            }
        }

        function interceptSetRequestHeader() {
            var originalSetRequestHeader = window.XMLHttpRequest.prototype.setRequestHeader;
            window.XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
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

    var ajaxMonitoringObject = new ajaxMonitoring();
    ajaxMonitoringObject.Init();
};

new $$CsmSt();
