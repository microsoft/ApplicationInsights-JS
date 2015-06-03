;
var $$CsmSt = function () {
    var traceModes = {
        Off: 0,
        Error: 1,
        Warning: 2,
        Information: 3,
        Alert: 4
    };

    var traceEventTypes = {
        Error: 1,
        Warning: 2,
        Information: 3
    };

    var configuration = {
        traceMode: traceModes.Error
    };

    var csmConstants = {
        attachEvent: "attachEvent",
        de: "detachEvent",
        ad: "addEventListener",
        re: "removeEventListener",
        udf: "undefined"
    };

    ///<summary>Factory object that contains web application specific logic</summary>
    var webApplication = {
        GetApplicationInstrumentKey: function () {
            return __csm_pa.InstrumentationData.instrumentationKey;
        },

        GetCollectorSite: function () {
            return __csm_pa.InstrumentationData.collectorSite;
        }
    };


    ///<summary>Factory object that contains Windows Store application specific logic</summary>
    var winStoreApplication = {
        applicationId: null,
        GetApplicationInstrumentKey: function () {
            if (winStoreApplication.applicationId === null) {
                winStoreApplication.applicationId = Windows.ApplicationModel.Package.current.id.name;
            }

            return winStoreApplication.applicationId;
        },

        GetCollectorSite: function () {
            return "https://csm.cloudapp.net";
        }
    };

    ///<summary>The object that represents visitors and visits</summary>
    var storageInfo = function (id, isReturning) {

        /// <summary>The unique identifier of the entity</summary>
        this.id = id;

        ///<summary>True, if visit or visitor is returning, false if it is new</summary>
        this.isReturning = isReturning;
    };
    
    ///<summary>Represents an instant in time</summary>
    var dateTime = {

        ///<summary>Return the number of milliseconds since 1970/01/01 in UTC</summary>
        UtcNow: function () {
            var date = new Date();
            var result = date.getTime();
            var offsetMilliseconds = date.getTimezoneOffset() * 60 * 1000;
            result = result + offsetMilliseconds;
            return result;
        },

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

    ///<summary>Represents a set of string functions</summary>
    var strings = {

        ///<summary>Retrieves a substring from this instance</summary>
        ///<param name="startString">The start of the substring</param>
        ///<param name="endString">The substring where to stop including</param>
        ///<param name="includeStartString">True if startString must be included in result, otherwise false</param>
        ///<returns>Substring, if found, otherwise empty string</returns>
        Substring: function (str, startString, endString, includeStartString) {
            var result = "";
            if (!extensions.IsNullOrUndefined(str) && str.length > 0) {
                var start = str.indexOf(startString);
                if (start !== -1) {
                    if (!includeStartString) {
                        start = start + startString.length;
                    }
                    var end = str.indexOf(endString, start);
                    if (end === -1) {
                        end = document.cookie.length;
                    }

                    result = str.substring(start, end);
                }
            }

            return result;
        },

        ///<summary>Returns a new string in which a specified number of characters from the current string are deleted</summary>
        ///<param name="from">Required. The index where to start the removing. First character is at index 0</param>
        ///<param name="to">Optional. The index where to stop the removing. If omitted or < 0, it extracts the rest of the string</param>
        ///<returns>A new string that is equivalent to this instance except for the removed characters.</returns>
        Remove: function (str, from, to) {
            var result = '';
            if (!extensions.IsNullOrUndefined(str)) {
                if (from > 0) {
                    result = str.substring(0, from);
                }
                if (typeof (to) !== csmConstants.udf && to >= 0) {
                    if (to < str.length) {
                        result += str.substring(to);
                    }
                }
            }

            return result;
        }
    };

    var urlBuilder = {
        Serialize: function (params, methodName) {
            var result = monitoredApplication.GetCollectorSite() + "/DataCollection.svc/" + methodName + "?ID=" + dateTime.Now();
            for (key in params) {
                var value = params[key];
                if (value !== 0 && value !== null) {
                    result += key + value;
                }
            }

            return result;
        },

        SerializeAjaxStatistics: function (params) {
            return urlBuilder.Serialize(params, "SendAjaxStatistics");
        },

        SerializePageStatistics: function (params) {
            return urlBuilder.Serialize(params, "SendAnalytics");
        }
    };

    var infrastructure = {
        GetRequest: function (url) {
            var img = new Image(0, 0);
            img.src = url;
        }
    };

    /*#region [Diagnostics]*/
    var diagnostics = {

        // determines if message that DOM storage is disabled is traced already
        isDomStorageDisabledMessageTraced: false,

        /**
        * Logs Trace message
        * @param {String} message - Message to trace.
        * @param {int} traceEventType - Event trace type.
        */
        TraceEvent: function (message, traceEventType) {
            if (extensions.IsNullOrUndefined(traceEventType)) {
                traceEventType = traceEventTypes.Information;
            }
            try {
                if (configuration.traceMode >= traceEventType) {
                    message = message.toString();

                    // Try to write to console (supported in Firefox):
                    try {
                        if (!extensions.IsNullOrUndefined(console)) {
                            if (!extensions.IsNullOrUndefined(console.debug)) {
                                // FF 
                                console.debug("CSM Trace (%s) : %s.", new Date().toString(), message);
                            }

                            if (!extensions.IsNullOrUndefined(console.log)) {
                                // safari                                    
                                console.log("CSM Trace " + new Date().toString() + ": " + message);
                            }
                        }
                    }
                    catch (ex) {
                        // Ignore the error, because we can do nothing here.
                    }

                    if (configuration.traceMode === traceModes.Alert) {
                        alert("CSM Trace:\n" + message + ".");
                    }

                    var url = monitoredApplication.GetCollectorSite() + "/DataCollection.svc/TraceEvent?msg=" + encodeURIComponent(message) + "&tet=" + encodeURIComponent(traceEventType) + "&ID=" + encodeURIComponent(new Date().getTime());
                    infrastructure.GetRequest(url);
                }
            }
            catch (iex) {
                // the block catches unexpected exceptions, must be empty
                ///#DEBUG
                if (typeof (iex) !== csmConstants.udf) {
                    if (window.confirm("CSM Error Logging: " + iex.message + "\nDo you want to debug an unhandled exception?")) {
                        debugger;
                    }
                }
                ///#ENDDEBUG
            }
        },

        /**
        *  Logs uX code Error, tries to extract stack information (at the moment the functionality is available for Mozilla Firefox only)
        * @param {String} errorID String-Identified of error
        * @param {Array} params - Additional parameters to trace
        * @param {Exception} exceptionObject Generated Exception object
        */
        TraceException: function (errorId, exception, params) {
            var traceMessage = errorId;
            // Add extended (only in non-obfuscated mode, only for full log):
            ///#DEBUG
            // Client Time
            traceMessage += "\nDateTime on client: ";
            traceMessage += new Date().toString();
            // browser information:
            if (!extensions.IsNullOrUndefined(navigator) && !extensions.IsNullOrUndefined(navigator.userAgent)) {
                traceMessage += "\nUserAgent: ";
                traceMessage += navigator.userAgent;
            }
            ///#ENDDEBUG

            commands.TryCatchSwallowWrapper(function () {
                if (!extensions.IsNullOrUndefined(exception)) {
                    if (!extensions.IsNullOrUndefined(exception.stack) && exception.stack.length > 0) {
                        // Add stack information if supported (currently in Firefox only) only for full log:
                        traceMessage += "\nStack: " + exception.stack;
                    }
                    traceMessage += ";\nType:" + exception.name; // exception type - one of [EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError]
                    traceMessage += ";\nMessage:" + exception.message; // message/description of the exception
                }

                if (!extensions.IsNullOrUndefined(params)) {
                    traceMessage += ";\nParams:\n";
                    for (var i = 0; i < params.length; i++) {
                        traceMessage += i + ": " + params[i] + "\n";
                    }
                }
            });

            diagnostics.TraceEvent(traceMessage, traceEventTypes.Error);
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
                commands.TryCatchSwallowWrapper(function () { diagnostics.TraceException(functionName, ex, params); });
            }
        },

        /// <summary>
        /// Wrappes function call in try..catch with empty catch block
        /// </summary>
        TryCatchSwallowWrapper: function (funcPointer) {
            try {
                funcPointer.call(this);
            }
            catch (iex) {
                // the block catches unexpected exceptions, must be empty
                ///#DEBUG
                if (typeof (iex) !== csmConstants.udf) {
                    if (window.confirm("CSM Smart Error Logging: " + iex.message + "\nDo you want to debug an unhandled exception?")) {
                        debugger;
                    }
                }
                ///#ENDDEBUG
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
        },

        ///<summary>
        /// Creates XmlHttpRequest object which will not be monitored by client side monitoring
        /// <returns>XmlHttpRequest instance which will not be monitored by client side monitoring</returns>
        ///</summary>
        CreateXmlHttpRequest: function () {
            var result = new XMLHttpRequest();
            commands.TryCatchTraceWrapper("Disabling_XmlHttpRequest_monitoring", function () {
                result[ajaxMonitoringObject.GetDisabledPropertyName()] = true;
            });

            return result;
        }
    };
    this.Commands = commands;
    /*#endregion*/

    var guid = {
        chars: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],

        ///<summary>
        /// Initializes a new instance of the Guid structure without machine specific information.
        ///<summary>
        New: function () {
            var chars = guid.chars, uuid = [];
            var randIndex;

            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4'; // reserved by rfc4122

            for (var i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    // random index: 0 <= randIndex < chars.length
                    randIndex = 0 | Math.random() * chars.length;
                    uuid[i] = chars[randIndex];
                }
            }

            return uuid.join('');
        }
    };

    this.Guid = guid;

    var bool = {
        toInt: function (boolVal) {
            return boolVal ? 1 : 0;
        }
    };

    ///<summary>Extension methods for object type</summary>
    var extensions = {
        IsNullOrUndefined: function (obj) {
            return typeof (obj) === csmConstants.udf || obj === null;
        },
        GetWindowLocalStorage: function () {
            var result = null;
            try {
                result = window.localStorage;
            }
            catch (ex) {
                // On FF 3.6 Security exception is expected here because of FF 3.6 issue https://bugzilla.mozilla.org/show_bug.cgi?id=616202
            }

            return result;
        },

        Clone: function (obj) {
            var result;
            if (typeof (obj) === "undefined") {
                result = undefined;
            } else if (obj === null) {
                result = null;
            } else {
                result = {};
            }

            if (!extensions.IsNullOrUndefined(obj)) {
                for (var i in obj) {
                    if (typeof (obj[i]) === "object") {
                        result[i] = extensions.Clone(obj[i]);
                    } else {
                        result[i] = obj[i];
                    }
                }
            }

            return result;
        }
    };

    var factory = {
        GetMonitoredApplication: function () {
            var result;

            // Do not determine web application based on presense of __csm_pa object - it can be not initiated at this moment on Safari.
            if (typeof (Windows) !== "undefined" && typeof (Windows.ApplicationModel) !== "undefined") {
                result = winStoreApplication;
            }
            else {
                result = webApplication;
            }
            return result;
        }     
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
        },

        ///<summary>Truncate the string</summary>
        ///<param name="str">String to truncate</param>
        ///<param name="len">Max number of characters in truncated string</param>
        TruncateString: function (str, len) {
            /*Result*/
            var res = {
                string: null, /*Truncated String*/
                truncated: false /*Flag, was string truncated or not*/
            };
            if (!extensions.IsNullOrUndefined(str)) {
                if (str.length > len) { // truncate only if required
                    res.string = str.substring(0, len);
                    res.truncated = true; // the string was truncated
                }
                else {
                    res.string = str; /*The string was not truncated*/
                }
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
                        if (!extensions.IsNullOrUndefined(async)) {
                            self.ajaxData.async = async;
                        }
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
                        diagnostics.TraceEvent("Original 'onreadystatechange' handler of Ajax object was called by XhrInterceptor");

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
                
                //this.ajaxData.Send();
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

            commands.TryCatchSwallowWrapper.call(this, function () {
                this.ajaxData.status = this.status;
            });

            commands.TryCatchSwallowWrapper.call(this, function () {
                this.ajaxData.contentType = this.getResponseHeader("Content-Type");
            });

            commands.TryCatchSwallowWrapper.call(this, function () {
                this.ajaxData.contentEncoding = this.getResponseHeader("Content-Encoding");
            });

            commands.TryCatchSwallowWrapper.call(this, function () {
                this.ajaxData.responseSize = this.responseText.length;
                this.ajaxData.responseSize += this.getAllResponseHeaders().length;

                //add 'HTTP/1.1 200 OK' length
                this.ajaxData.responseSize += 17;
            });
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
  
    // initialization
    var monitoredApplication = factory.GetMonitoredApplication();
    this.MonitoredApplication = monitoredApplication;
    
    this.Factory = factory;
    this.Extensions = extensions;
    var ajaxMonitoringObject = new ajaxMonitoring();
    ajaxMonitoringObject.Init();
};

new $$CsmSt();
