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

    var browser = {
        supportOnBeforeUnload: null,
        supportPerformanceTimingApi: null,

        ///<summary>Determines whether browser supports onbeforeunload event</summary>
        SupportOnBeforeUnload: function () {
            if (browser.supportOnBeforeUnload === null) {
                browser.supportOnBeforeUnload = typeof (window.onbeforeunload) !== csmConstants.udf;

                if (browser.supportOnBeforeUnload === false) {

                    // special trick for FF 3.6. On FF 3.6 window.onbeforeunload is undefined, but event is supported
                    var el = document.createElement('div');
                    el.setAttribute('onbeforeunload', '');
                    browser.supportOnBeforeUnload = typeof (el.onbeforeunload) === "function";
                }
            }

            return browser.supportOnBeforeUnload;
        },

        ///<summary>Determines whether browser supports performance timing API</summary>
        SupportPerformanceTimingApi: function () {
            if (browser.supportPerformanceTimingApi === null) {
                browser.supportPerformanceTimingApi = !extensions.IsNullOrUndefined(window.performance)
                && !extensions.IsNullOrUndefined(window.performance.timing)
                && !extensions.IsNullOrUndefined(window.performance.timing.responseStart);
            }

            return browser.supportPerformanceTimingApi;
        }
    };

    var domProcessing = {
        onBeforeUnloadFired: false,
        onLoadFired: false,

        ///<summary>Attaching to document object model events</summary>
        AttachToDomEvents: function () {
            commands.AttachEvent(window, "load", function () {
                commands.TryCatchTraceWrapper("OnLoadHandler", function () {
                    domProcessing.onLoadFired = true;
                    if (browser.SupportOnBeforeUnload()) {
                        setTimeout(function () {
                            pageRecord.Send();
                        }, cookieStorage.visitLifeTimeMs);
                    }
                    else {
                        if (browser.SupportPerformanceTimingApi()) {
                            domProcessing.sendPageInfoTimer = setInterval(function () {
                                if (window.performance.timing.loadEventEnd !== 0) {
                                    clearInterval(domProcessing.sendPageInfoTimer);
                                    pageRecord.Send();
                                }
                            }, 1000);

                        } else {
                            pageRecord.Send();
                        }
                    }
                });
            });

            commands.AttachEvent(window, "beforeunload", function () {
                commands.TryCatchTraceWrapper("OnBeforeUnloadHandler", function () {
                    domProcessing.onBeforeUnloadFired = true;
                    pageRecord.Send();
                });
            });
        }
    };

    ///<summary>Factory object that contains logic for determining visitor and visits with HTML 5 DOM Storage</summary>
    var domStorage = {

        ///<summary>Gets user information. This function is not idempotent. Each call is treated as a separate user information request.</summary>
        /// <param name="requestTimeOffset">Time difference in ms between the request was happening and user information about request is retrieved</param>
        /// <returns>User instance if determined, otherwise null </returns>
        GetUser: function (requestTimeOffset) {
            var cookieUser = null;

            ///<summary>Gets user information from cookie</summary>
            ///<returns type="User">User if cookies are enabled, otherwise null</returns>
            function updateCookieUser(timeOffset) {
                if (cookieUser === null) {
                    cookieUser = factory.GetCookieStorage().GetUser(timeOffset);
                }

                return cookieUser;
            }

            // for cookies we are limiting visitor id lifetime to a year because of security restrictions. For DOM storage we are not limiting visitor id lifetime.
            var visitor = domStorage._GetStorageInfo(extensions.GetWindowLocalStorage(), cookieStorage.visitorLifeTimeMs, requestTimeOffset);
            if (visitor === null) {
                updateCookieUser(requestTimeOffset);
                if (!extensions.IsNullOrUndefined(cookieUser)) {
                    visitor = cookieUser.Visitor;
                }
            }

            var visit = domStorage._GetStorageInfo(window.sessionStorage, cookieStorage.visitLifeTimeMs, requestTimeOffset);
            if (visit === null) {
                updateCookieUser(requestTimeOffset);
                if (!extensions.IsNullOrUndefined(cookieUser)) {
                    visit = cookieUser.Visit;
                }
            }

            var result = null;
            if (visitor !== null || visit !== null) {
                result = new User(visitor, visit);
            }

            return result;
        },

        /// <summary>
        /// Gets value from storage
        /// </summary>
        /// <param name="storage">window.sessionStorage or localStorage</param>
        /// <param name="lifetime">The lifetime in milliseconds of the storage item. If lifetime is 0 - item lifetime is infinitive</param>
        /// <param name="itemOffset">The request time offset for the item</param>
        /// <returns>StorageInfo object if local storage quota is not reached, otherwise null.</returns>
        _GetStorageInfo: function (storageObject, lifetime, itemOffset) {

            // stores data in dom storage (localStorage, sessionStorage) in format key / value = [instrumentKey]{53300005-808B-482E-B641-5282899C65DF} / [timestamp][guid]
            var key = monitoredApplication.GetApplicationInstrumentKey() + "{53300005-808B-482E-B641-5282899C65DF}";
            var result = null;
            if (extensions.IsNullOrUndefined(storageObject)) {
                //  related to IE, FF.
            }
            else {
                var dateTimeUtcNow = dateTime.UtcNow();
                var itemValue = null;
                try {
                    itemValue = storageObject.getItem(key);
                } catch (ex) {
                    // DomStorage is disabled or is full.
                }

                var id = null;
                if (!extensions.IsNullOrUndefined(itemValue)) {
                    var array = itemValue.split(storageApplication.valueDelimiter);
                    if (array.length === 2) {
                        var timeStamp = parseInt(array[0]);
                        if (!isNaN(timeStamp)) {
                            var timeDiff = dateTime.GetDuration(array[0], dateTimeUtcNow);
                            timeDiff = timeDiff - itemOffset;
                            if (timeDiff < lifetime) {
                                id = array[1];
                            }
                        }
                    }
                }

                if (id === null) {
                    try {
                        id = guid.New();
                        var newItemValue = (dateTimeUtcNow - itemOffset) + storageApplication.valueDelimiter + id;
                        storageObject.setItem(key, newItemValue);
                        if (storageObject.getItem(key) === newItemValue) {
                            result = new storageInfo(id, 0);
                        }
                    } catch (quotaExceededException) {
                        // storage.setItem fires exception when storage is disabled on Chrome OR localStroage is full on any browser
                        // we don't trace this information as it is non actionable
                    }
                } else {
                    result = new storageInfo(id, 1);
                }
            }

            return result;
        }
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

    //<summary>Represents an application that is stored in permanent cookie</summary>
    var storageApplication = function (instrumentKey, visitorId, visitId, lastUpdateTime) {
        this.instrumentKey = instrumentKey;
        this.visitorId = visitorId;
        this.visitId = visitId;
        this.lastUpdateTime = lastUpdateTime;

        ///<returns>String respresentation of the storage application in format instrumentKey|visitorId|visitId|timestamp</returns>
        this.Serialize = function () {
            return this.instrumentKey + storageApplication.valueDelimiter + this.visitorId + storageApplication.valueDelimiter + this.visitId + storageApplication.valueDelimiter + this.lastUpdateTime;
        };
    };

    storageApplication.valueDelimiter = "|";

    ///<summary>Deserialize string that represents the StorageApplication into object instance</summary>
    storageApplication.Deserialize = function (str) {
        var result = null;
        var applicationData = str.split(storageApplication.valueDelimiter);

        // verify untrusted data
        if (applicationData !== null & applicationData.length === 4) {
            var lastUpdateTime = parseInt(applicationData[3]);
            if (!isNaN(lastUpdateTime)) {
                result = new storageApplication(applicationData[0], applicationData[1], applicationData[2], lastUpdateTime);
            }
        }

        return result;
    };

    ///<summary>Factory object that contains logic for determining visitor and visits with cookies</summary>
    var cookieStorage = function () {
        var visitor = null;
        var visit = null;

        var applicationManager = new storageApplicationManager();
        var cookiesWrapper = new cookies();

        ///<summary>Gets User information. This call is not idempotent. Each call to the function is treated as separated user information request</summary>
        ///<param name="requestTimeOffset">Time difference in ms between the request was happening and user information about request is retrieved</param>
        ///<returns type="User">User instance if user determined, otherwise null</returns>
        this.GetUser = function (requestTimeOffset) {
            var result = null;
            if (initialize(requestTimeOffset)) {
                result = new User(visitor, visit);
            }

            return result;
        };

        ///<summary>Initializes cookieStorage object. Calculates all required information for interface methods</summary>
        ///<param name="requestTimeOffset">Time difference in ms between the request was happening and user information about request is retrieved</param>
        ///<returns type="boolean">True if initialize succeeds, otherwise false</returns>
        function initialize(requestTimeOffset) {
            var result = false;
            if (applicationManager.Enabled()) {

                var currentApplication = applicationManager.GetApplication(monitoredApplication.GetApplicationInstrumentKey());
                var isReturningVisit, isReturningVisitor;
                var utcNow = dateTime.UtcNow();
                var requestTimestamp = utcNow - requestTimeOffset;
                if (currentApplication === null) {
                    // new visitor, new visit
                    isReturningVisitor = 0;
                    isReturningVisit = 0;
                    currentApplication = new storageApplication(monitoredApplication.GetApplicationInstrumentKey(), guid.New(), guid.New(), requestTimestamp);
                } else {
                    // returning visitor
                    isReturningVisitor = 1;
                    if (requestTimestamp - currentApplication.lastUpdateTime > cookieStorage.visitLifeTimeMs) {
                        // new visit
                        isReturningVisit = 0;
                        currentApplication.visitId = guid.New();
                    } else {
                        // returning visit
                        isReturningVisit = 1;
                    }

                    currentApplication.lastUpdateTime = utcNow;
                }


                if (applicationManager.UpdateApplication(currentApplication)) {
                    // application was update in full correctly
                    visitor = new storageInfo(currentApplication.visitorId, isReturningVisitor);
                    visit = new storageInfo(currentApplication.visitId, isReturningVisit);
                } else {
                    // application was not updated in full. Determine which fields are correct and set them
                    var updatedApplication = applicationManager.GetApplication(monitoredApplication.GetApplicationInstrumentKey());
                    if (updatedApplication !== null) {
                        if (updatedApplication.visitorId === currentApplication.visitorId) {
                            visitor = new storageInfo(currentApplication.visitorId, isReturningVisitor);
                        }

                        if (updatedApplication.visitId === currentApplication.visitId) {
                            visit = new storageInfo(currentApplication.visitId, isReturningVisit);
                        }
                    }
                }

                result = true;
            }

            return result;
        }

        ///<summary>Provides a type-safe way to create and manipulate individual HTTP cookies</summary>
        function cookies() {

            ///<summary>Gets a value that shows whether cookie are enabled on the browser or not </summary>
            ///<result>True if cookie are enabled, otherwise false</result>
            this.Enabled = function (testCookieName) {

                ///<summary>Determines whether cookie exists</summary>
                ///<returns>True, if cookie exists, otherwise false</returns>
                function cookieExists() {
                    return document.cookie.indexOf(testCookieName) !== -1;
                }

                var result = false;

                if (!extensions.IsNullOrUndefined(navigator) && !extensions.IsNullOrUndefined(navigator.cookieEnabled)) {
                    // works only in IE
                    result = navigator.cookieEnabled;
                }
                else if (!extensions.IsNullOrUndefined(document.cookie)) {
                    if (cookieExists()) {
                        result = true;
                    }
                    else {
                        document.cookie = testCookieName;
                        result = cookieExists();
                    }
                }

                return result;
            };

            ///<summary>Sets cookie as permanent cookie (expiration date ~ now + 2 years).</summary>
            ///<returns>True, if cookie was set successfully, otherwise false</returns>
            this.Set = function (name, value) {
                var result = false;
                try {
                    var expiresDate = new Date(new Date().getTime() + cookieStorage.visitorLifeTimeMs);

                    //  The best way to set this date is to use the toGMTString of the Date object. The other to-string methods (toString and toUTCString) can be used, but are not guaranteed to work on all platforms for setting cookie expiration dates.
                    var cookieValue = name + "=" + escape(value) + ";expires=" + expiresDate.toGMTString() + ";path=/";
                    document.cookie = cookieValue;

                    // on IE9 user can set to show prompt window OR silently block cookies on each write operation to cookie. 
                    // in these cases cookies are not written and exception is not thrown.
                    // checking to see that cookie was set correctly
                    var newValue = this.Get(name);
                    result = newValue === value;
                }
                catch (ex) {
                    diagnostics.TraceException("COOKIE_NOT_SET", ex);
                }

                return result;
            };

            ///<returns>Cookie value if found, othwerwise string empty</returns>
            this.Get = function (name) {
                return unescape(strings.Substring(document.cookie, name + "=", ";", false));
            };

        }

        ///<summary>Manages applications in cookie storage</summary>
        function storageApplicationManager() {
            var cookieName = "__csms";
            var maxCookieSize = 4000; /*Limit on cookie length in chars*/
            var cookieShrinkCount = 10;
            var applicationsDelimiter = "||";

            ///<summary>Gets application information</summary>
            ///<param name="instrumentKey">Application instrument key</param>>
            ///<returns>Application if it exists, otherwise null</returns>
            this.GetApplication = function (instrumentKey) {
                var result = null;
                var cookieValue = cookiesWrapper.Get(cookieName);
                if (cookieValue !== "") {
                    var applicationString = strings.Substring(cookieValue, instrumentKey, applicationsDelimiter, true);
                    if (applicationString !== "") {
                        result = storageApplication.Deserialize(applicationString);
                    }
                }

                return result;
            };

            ///<summary>Updates application information</summary>
            ///<param name="app">application object to overwrite</param>>
            ///<returns>True if application was updated, otherwise false</returns>
            this.UpdateApplication = function (app) {
                var cookie = cookiesWrapper.Get(cookieName);
                if (cookie.length > maxCookieSize) {
                    cookie = getShrinkCookie(cookie);
                }

                cookie = getRemoveApplicationCookie(app, cookie);
                cookie = getAddApplicationCookie(app, cookie);
                return cookiesWrapper.Set(cookieName, cookie);
            };

            ///<summary>Determines whether application storage is enabled</summary>
            ///<returns>True if enabled, otherwise false</returns>
            this.Enabled = function () {
                return cookiesWrapper.Enabled(cookieName);
            };

            ///<summary>Removes application from cookie</summary>
            ///<param name="app">Application to remove</param>
            ///<param name="cookieValue">Cookie value in which application must be removed</param>
            ///<returns>Cookie value with removed application</returns>
            function getRemoveApplicationCookie(app, cookieValue) {
                var result = cookieValue;
                if (cookieValue !== "") {
                    var from = cookieValue.indexOf(app.instrumentKey);
                    if (from !== -1) {
                        var to = cookieValue.indexOf(applicationsDelimiter, from);
                        if (to >= 0) {
                            to += applicationsDelimiter.length - 1;
                        }

                        result = strings.Remove(cookieValue, from, to);
                    }
                }

                return result;
            }

            ///<summary>Add application to the cookie</summary>
            ///<param name="app">Application to add</param>
            ///<param name="cookieValue">Cookie value in which to add the application</param>
            ///<returns>Cookie value with added application</returns>
            function getAddApplicationCookie(app, cookieValue) {
                var result = app.Serialize();
                if (cookieValue !== "") {
                    result += applicationsDelimiter;
                }

                result += cookieValue;
                return result;
            }

            ///<summary>Shrinks cookie in case it contains big amount of applications</summary>
            ///<param name="cookie">Initial cookie value</param>
            ///<returns>Cookie value after shrink</returns>
            function getShrinkCookie(cookie) {
                var result = "";
                var start = cookie.length - 1;
                for (var i = 0; i < cookieShrinkCount; i++) {
                    start = cookie.lastIndexOf(applicationsDelimiter, start) - 1;
                    if (start < 0) {
                        break;
                    }
                }

                if (start > 0) {
                    result = cookie.substring(0, start);
                }
                return result;
            }
        }
    };

    /// <summary>The maximum lifetime of the visit. If a user is inactive on site for more that specified amount in lifetime, any future activity will be attributed to a new visit</summary>
    cookieStorage.visitLifeTimeMs = 1000 * 60 * 30; // 30 min

    /// <summary>Visitor lifetime</summary>
    cookieStorage.visitorLifeTimeMs = 63072000000; /*2 years = 2 * 365 * 24 * 60 * 60 * 1000*/

    // Required only for test
    this.CookieStorage = cookieStorage;

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

    var basePage = {

        ///<summary>The timestamp when last loading ajax was finished</summary>
        LastLoadingAjaxTime: null,

        GetMetrics: function () {
            var result = new pageMetrics();

            if (domProcessing.onBeforeUnloadFired) {
                result.TimeSpentOnPageAbortedState = 0;
            }
            else {
                // onbefore unload didn't fire. we don't know how much time user spent on the page exactly
                result.TimeSpentOnPageAbortedState = 1;
            }

            var screenWidth = window.screen.width;
            if (typeof (screenWidth) !== csmConstants.udf) {
                result.ScreenWidth = screenWidth;
            }

            var screenHeight = window.screen.height;
            if (typeof (screenHeight !== csmConstants.udf)) {
                result.ScreenHeight = screenHeight;
            }

            result.Referrer = stringUtils.TruncateString(document.referrer, 256).string;

            if (basePage.LastLoadingAjaxTime !== null) {
                result.TimeToLastLoadingAjax = dateTime.GetDuration(factory.GetPageProcessor().GetNavigationStart(), basePage.LastLoadingAjaxTime);
            }

            return result;
        },

        ///<summary>Determines whether document is loading and page is not interactive</summary>
        ///<returns>True if document is loading and not interactive, otherwise false</returns>
        Loading: function () {
            return document.readyState === "loading";
        }
    };

    /// <summary>Page information collected with injected timestamps</summary>
    var nativePage = {
        GetMetrics: function () {
            var result = basePage.GetMetrics();
            result.EventDateOffset = dateTime.Now() - __csm_pa.InstrumentationData.ttfb;
            if (!domProcessing.onLoadFired) {
                result.TimeToLoadAbortedState = 1;
            }

            if (browser.SupportOnBeforeUnload()) {
                result.TimeSpentOnPage = result.EventDateOffset;
            }

            return result;
        },

        ///<summary>Gets the time when first byte was received</summary>
        GetNavigationStart: function () {
            // on non HTML 5 browsers we don't take into consideration network time
            return __csm_pa.InstrumentationData.ttfb;
        }
    };

    /// <summary>Page information collected with Performance Timing API</summary>
    var performanceTimingPage = {

        ///<summary>Time when navigation was started to the page</summary>
        navigationStart: null,

        /// <summary>Gets page load time</summary>
        /// <returns>Metric object, if it exists, otherwise null</returns>
        GetMetrics: function () {
            var result = basePage.GetMetrics();
            var unloadTimeStamp = dateTime.Now();
            var timing = window.performance.timing;
            var lastEndTime = timing.loadEventEnd;
            if (lastEndTime === 0) {
                lastEndTime = unloadTimeStamp;
                result.TimeToLoadAbortedState = 1;
            }

            var navigationStart = performanceTimingPage.GetNavigationStart();
            result.TimeToLoad = dateTime.GetDuration(navigationStart, lastEndTime);
            result.UnloadEventTime = dateTime.GetDuration(timing.unloadEventStart, timing.unloadEventEnd);

            // UnloadEvent and Redirect can go in parallel. Calcualating RedirectTime from navigationStart therefore
            result.RedirectTime = dateTime.GetDuration(timing.navigationStart, timing.redirectEnd);
            result.DomainLookupTime = dateTime.GetDuration(timing.redirectEnd, timing.domainLookupEnd);
            result.SslHandshakeTime = dateTime.GetDuration(timing.requestStart, timing.secureConnectionStart);
            result.ServerTime = dateTime.GetDuration(timing.requestStart, timing.responseStart);

            if (timing.secureConnectionStart === 0 || extensions.IsNullOrUndefined(timing.secureConnectionStart)) {
                result.ServerTime += dateTime.GetDuration(timing.domainLookupEnd, timing.requestStart);
            }
            else {

                // do not inlcude SSL handshake time in server time
                result.ServerTime += dateTime.GetDuration(timing.domainLookupEnd, timing.secureConnectionStart);
            }

            result.NetworkResponseTime = dateTime.GetDuration(timing.responseStart, timing.responseEnd);
            result.LoadingTime = dateTime.GetDuration(timing.responseEnd, timing.domInteractive);
            if (result.LoadingTime !== null && result.LoadingTime < 0) {
                // IE has issue that sometime responseEnd can be greater than domInteractive timestamp.
                // Considering in this case LoadingTime as 0. TFS #484706
                result.LoadingTime = 0;
            }
            result.InteractiveTime = dateTime.GetDuration(timing.domInteractive, timing.domContentLoadedEventStart);
            result.ContentLoadingTime = dateTime.GetDuration(timing.domContentLoadedEventStart, timing.loadEventStart);
            result.LoadEventTime = dateTime.GetDuration(timing.loadEventStart, timing.loadEventEnd);
            result.RedirectCount = window.performance.navigation.redirectCount;

            if (browser.SupportOnBeforeUnload()) {
                result.TimeSpentOnPage = unloadTimeStamp - window.performance.timing.responseStart;
            }

            result.EventDateOffset = unloadTimeStamp - navigationStart;
            return result;
        },

        ///<summary>Gets the time when first byte was received</summary>
        GetNavigationStart: function () {
            if (performanceTimingPage.navigationStart === null) {
                performanceTimingPage.navigationStart = window.performance.timing.navigationStart;
                if (performanceTimingPage.navigationStart <= 0) {

                    // mihailsm: Win8 #281832 on IE9 : msPerformance: Do not zero out navigationStart in cross-origin redirected navigation
                    // take fetchStart instead of navigationStart
                    performanceTimingPage.navigationStart = window.performance.timing.fetchStart;
                }
            }

            return performanceTimingPage.navigationStart;
        }
    };

    ///<summary>Page metrics</summary>
    var pageMetrics = function () {

        ///<summary>Optional</summary>
        this.TimeToLoad = null;

        ///<summary>Required</summary>
        this.TimeToLoadAbortedState = 0;

        ///<summary>Optional. In case browser support onbeforeunload determines the time user spent on page, otherwise null</summary>
        this.TimeSpentOnPage = null;

        ///<summary>Optional. 0 - TimeSpent on page is exactly determined. 1 - TimeSpent on page is at least the big value (30 min) specified in TimeSpentOnPage</summary>
        this.TimeSpentOnPageAbortedState = 0;

        ///<summary>Required</summary>
        this.EventDateOffset = null;

        ///<summary>Optional</summary>
        this.ScreenWidth = null;

        ///<summary>Optional</summary>
        this.ScreenHeight = null;

        ///<summary>Optional. Determines time between opening the page and the last ajax that startind during page loading</summary>
        this.TimeToLastLoadingAjax = null;

        ///<summary>
        /// Optional. The URL of the document that loaded the current document. 
        /// Contains a value only when the user reaches the current document through a link from the previous document. 
        /// Otherwise, contains an empty string; it also contains an empty string when the link is from a secure site.
        ///</summary>
        this.Referrer = null;

        ///<summary>Optional. Time spent for executing winlow.unload event</summary>
        this.UnloadEventTime = null;

        ///<summary>Optional. Time spent between first and last redirect</summary>
        this.RedirectTime = null;

        ///<summary>Optional. Time spent for domain lookup</summary>
        this.DomainLookupTime = null;

        ///<summary>Optional. Time spent for SSL handshake process</summary>
        this.SslHandshakeTime = null;

        ///<summary>Optional. Time between user agent start establishing connection with the web server and first byte is retrieved from web server</summary>
        this.ServerTime = null;

        ///<summary>Optional. Time between receiving response first and last byte</summary>
        this.NetworkResponseTime = null;

        ///<summary>Optional. Time when document was in loading state</summary>
        this.LoadingTime = null;

        ///<summary>Optional. Time when document was in interactive state</summary>
        this.InteractiveTime = null;

        ///<summary>Optional. Time when document was loading content resources</summary>
        this.ContentLoadingTime = null;

        ///<summary>Optional. Time spent for executing window.onload event</summary>
        this.LoadEventTime = null;

        ///<summary>Optional. Indicates how many redirects have taken place until the final page has been reached, if any</summary>
        this.RedirectCount = null;
    };

    ///<summary>Represents the object that incapsulates information about base record</summary>
    var baseRecord = {

        ///<summary>Populates common statistics information for page and ajax statistic requests</summary>
        ///<param name="params">Parameters array to populate</param>
        ///<param name="isPage">True if this method is called for page record, otherwise false</param>
        /// <param name="requestTimeOffset">Time difference in ms between the request was happening and user information about request is retrieved</param>
        PopulateBaseRecord: function (params, isPage, requestTimeOffset) {
            var user = userCache.GetUser(isPage, requestTimeOffset);
            if (user !== null) {
                var visitor = user.Visitor;
                if (visitor !== null) {
                    params["&vi="] = visitor.id;
                    params["&ir="] = visitor.isReturning;
                }

                var visit = user.Visit;
                if (visit !== null) {
                    params["&si="] = visit.id;
                    params["&ies="] = visit.isReturning;
                }
            }
        }
    };


    var pageRecord = {
        // sending data only once on first onbeforeunload to prevent multiple request from page to the collector for the same instance of the page.
        pageRecordSent: false,


        Send: function () {
            if (!pageRecord.pageRecordSent) {
                pageRecord.pageRecordSent = true;
                var metrics = factory.GetPageProcessor().GetMetrics();
                if (metrics !== null) {
                    var params = {

                        // required parameters
                        "&ai=": encodeURIComponent(monitoredApplication.GetApplicationInstrumentKey()),
                        "&ttu=": metrics.EventDateOffset,

                        // optional parameters
                        "&to=": metrics.TimeSpentOnPage,
                        "&ito=": metrics.TimeSpentOnPageAbortedState,
                        "&sw=": metrics.ScreenWidth,
                        "&sh=": metrics.ScreenHeight,
                        "&ra=": metrics.TimeToLoadAbortedState,
                        "&rt=": metrics.TimeToLoad,
                        "&rc=": metrics.RedirectCount,
                        "&ref=": metrics.Referrer,
                        "&ttla=": metrics.TimeToLastLoadingAjax,
                        "&et=": metrics.RedirectTime,
                        "&dl=": metrics.DomainLookupTime,
                        "&sht=": metrics.SslHandshakeTime,
                        "&st=": metrics.ServerTime,
                        "&nt=": metrics.NetworkResponseTime,
                        "&lt=": metrics.LoadingTime,
                        "&it=": metrics.InteractiveTime,
                        "&clt=": metrics.ContentLoadingTime,
                        "&le=": metrics.LoadEventTime
                    };

                    baseRecord.PopulateBaseRecord(params, true, metrics.EventDateOffset);
                    infrastructure.GetRequest(urlBuilder.SerializePageStatistics(params));
                }
            }
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
        cookieStorage: null,

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
        },

        GetCookieStorage: function () {
            if (factory.cookieStorage === null) {
                factory.cookieStorage = new cookieStorage();
            }
            return factory.cookieStorage;
        },

        GetBrowserStorage: function () {
            var result;
            // for browsers that do not support DOM Storage window.sessionStorage is undefined.
            // for browser that support Dom Storage, but it is disabled, window.sessionStorage is null (except Chrome)
            if (!extensions.IsNullOrUndefined(window.sessionStorage) && !extensions.IsNullOrUndefined(extensions.GetWindowLocalStorage())) {
                result = domStorage;
            }
            else {
                result = factory.GetCookieStorage();
            }

            return result;
        },

        ///<summary>Gets the class that determines page metrics</summary>
        GetPageProcessor: function () {
            var result;
            if (browser.SupportPerformanceTimingApi()) {
                result = performanceTimingPage;
            }
            else {
                result = nativePage;
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

        this.Send = function () {
            var requestUrlTrunc = stringUtils.TruncateString(this.requestUrl, 256);

            var params = {

                // required parameters
                "&ai=": encodeURIComponent(monitoredApplication.GetApplicationInstrumentKey()),
                "&m=": encodeURIComponent(this.method),
                "&a=": bool.toInt(this.async),
                "&rqs=": this.requestSize,
                "&rss=": this.responseSize,
                "&ru=": encodeURIComponent(requestUrlTrunc.string),

                // optional parameters
                "&s=": this.status,

                // content-type is not available in case ajax was aborted
                "&ct=": this.contentType,

                "&tfb=": this.ttfb,
                "&rrt=": this.responseReceivingDuration,
                "&clt=": this.callbackDuration,
                "&tt=": this.ajaxTotalDuration,
                "&ra=": this.aborted,
                "&cf=": this.clientFailure
            };

            if (requestUrlTrunc.truncated) {
                params["&iut="] = 1;
            }

            baseRecord.PopulateBaseRecord(params, false, this.ajaxTotalDuration);
            infrastructure.GetRequest(urlBuilder.SerializeAjaxStatistics(params));
        };


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
                    this.ajaxData.loadingRequest = basePage.Loading();

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
                if (this.ajaxData.loadingRequest && this.ajaxData.endTime !== null) {
                    basePage.LastLoadingAjaxTime = this.ajaxData.endTime;
                }
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

    function User(visitor, visit) {
        this.Visitor = visitor;
        this.Visit = visit;
    }

    function UserCache() {
        var lastAccessTime = null;
        var user = null;
        var browserStorage = factory.GetBrowserStorage();

        /// True if visit.isReturning for ajax request has to be set to false, otherwise do not change returning visit flag for ajax
        var forceResetAjaxReturningVisit = false;

        /// True if visit.isReturning for page request has to be set to false, otherwise do not change returning visit flag for page
        var forceResetPageReturningVisit = false;

        /// True if visitor.isReturning for ajax request has to be set to false, otherwise do not change returning visitor flag for ajax
        var forceResetAjaxReturningVisitor = false;

        /// True if visitor.isReturning for page request has to be set to false, otherwise do not change returning visitor flag for page
        var forceResetPageReturningVisitor = false;

        ///<summary>Gets user information</summary>
        ///<param name="isPage">True, if data must be forced updated in browser storage, false, if data can be just read from cache and not forced to update in browser storage</param>
        ///<param name="requestTimeOffset">Time difference in ms between the request was happening and user information about request is retrieved</param>
        this.GetUser = function (isPage, requestTimeOffset) {
            var result = null;
            if (isPage) {
                result = getUserForPage(requestTimeOffset);

            } else {
                result = getUserForAjax(requestTimeOffset);
            }

            return result;
        };

        ///<summary>Gets user information for page request</summary>
        ///<param name="requestTimeOffset">Time difference in ms between the request was happening and user information about request is retrieved</param>
        ///<returns type="User">User information or null</returns>
        function getUserForPage(requestTimeOffset) {
            var result = null;
            user = browserStorage.GetUser(requestTimeOffset);
            lastAccessTime = dateTime.UtcNow();
            if (user !== null) {
                result = extensions.Clone(user);
                if (result.Visit !== null) {
                    if (forceResetPageReturningVisit) {
                        result.Visit.isReturning = 0;
                        forceResetPageReturningVisit = false;
                    }
                    else if (result.Visit.isReturning === 0) {
                        forceResetAjaxReturningVisit = true;
                    }
                }

                if (result.Visitor !== null) {
                    if (forceResetPageReturningVisitor) {
                        result.Visitor.isReturning = 0;
                        forceResetPageReturningVisitor = false;
                    }
                    else if (result.Visitor.isReturning === 0) {
                        forceResetAjaxReturningVisitor = true;
                    }
                }
            }

            return result;
        }

        ///<summary>Gets user information for ajax request</summary>
        ///<param name="requestTimeOffset">Time difference in ms between the request was happening and user information about request is retrieved</param>
        ///<returns type="User">User information or null</returns>
        function getUserForAjax(requestTimeOffset) {
            var result = null;
            var userRetrievedFromCache = true;
            var utcNow = dateTime.UtcNow();

            // adding 10 sec latency for cache in order to mitigate situation when page request will come after visitLifeTimeMs interval 
            // and it has to have old user information
            if (lastAccessTime === null || user === null
                || dateTime.GetDuration(lastAccessTime, utcNow) > (cookieStorage.visitLifeTimeMs + 10000)) {
                user = browserStorage.GetUser(requestTimeOffset);
                lastAccessTime = utcNow;
                userRetrievedFromCache = false;
            }

            if (user !== null) {
                result = extensions.Clone(user);
                if (userRetrievedFromCache) {
                    // isReturning values storing in cache has to be changed for the current call, 
                    // because it is call from returning user
                    if (result.Visit !== null && result.Visit.isReturning === 0) {
                        result.Visit.isReturning = 1;
                    }

                    if (result.Visitor !== null && result.Visitor.isReturning === 0) {
                        result.Visitor.isReturning = 1;
                    }
                }

                if (result.Visit !== null) {
                    if (forceResetAjaxReturningVisit) {
                        result.Visit.isReturning = 0;
                        forceResetAjaxReturningVisit = false;
                    } else if (result.Visit.isReturning === 0) {
                        forceResetPageReturningVisit = true;
                    }
                }

                if (result.Visitor !== null) {
                    if (forceResetAjaxReturningVisitor) {
                        result.Visitor.isReturning = 0;
                        forceResetAjaxReturningVisitor = false;
                    } else if (result.Visitor.isReturning === 0) {
                        forceResetPageReturningVisitor = true;
                    }
                }
            }

            return result;
        }
    }

    // initialization
    var monitoredApplication = factory.GetMonitoredApplication();
    this.MonitoredApplication = monitoredApplication;
    var userCache = new UserCache();

    // required only for Unit Tests to expose the objects
    this.DomStorage = domStorage;

    this.Factory = factory;
    this.UserCache = userCache;
    this.Extensions = extensions;
    var ajaxMonitoringObject = new ajaxMonitoring();
    ajaxMonitoringObject.Init();

    //(function () {
    //    commands.TryCatchTraceWrapper("AttachToDomEvents", function () { domProcessing.AttachToDomEvents(); });
    //})();
};

new $$CsmSt();



// ------------------------------------------------- Dev Analytics Script -----------------------------------------

// Copyright (c) 2012 by Microsoft Corporation. All rights reserved.
//
/////////////////////////////////////////////////////////////////////////////////

// Download a json2.min.js file only if JSON object does not already exist. We create the
// methods in a closure to avoid creating global variables.
// TODO: Retire the need for this... only  < IE7 and IOS 3.2 browsers lack this support.
if (typeof JSON !== 'object' && window.__dajson != true) {
    var url = "//az364895.vo.msecnd.net/scripts/json2_min.js";
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url;
    // TOFINO BUG #505364: loading of this JSON script may cause an exception if there is no head element in the document.
    var currentScript = document.getElementsByTagName("script")[0];
    currentScript.parentNode.insertBefore(script, currentScript);
    window.__dajson = true; // should prevent double initialization. tofino bug 505471
}

(function () {
    // aliases
    var w = window, ap = Array.prototype;

    function $Clean(data) {
        switch (typeof (data)) {
            case "string":
                return encodeURIComponent(data);
                break;
            default:
                return data;
                break;
        }
    }

    function $AssertValue(data) {
        return typeof (data) != "undefined" && data != null;
    };

    function $AssertType(data, dataType) {
        return $AssertValue(data) && typeof (data) == dataType;
    };


    ///<summary>Creates XMLHttpRequest object that is not monitored by client side monitoring</summary>
    function $CreateXmlHttpRequest() {
        var result = null;
        if ($AssertValue(__csm_st) && $AssertValue(__csm_st.Commands)) {
            result = __csm_st.Commands.CreateXmlHttpRequest();
        } else {
            result = new XMLHttpRequest();
        }

        return result;
    }


    // if there isn't one, add a string format function

    var string = {
        format: function (word, args) {
            var reg, formatedString = word;
            for (var i = 0; i < args.length; i++) {
                reg = new RegExp('\\{' + i + '\\}', 'g');
                formatedString = formatedString.replace(reg, args[i]);
            }
            return formatedString;
        },

        getHostName: function (word) {
            var pattern = new RegExp('^(?:f|ht)tp(?:s)?\://([^/|:]+)', 'im');

            var matches = word.match(pattern);
            if (matches != null && matches.length >= 2) {
                return matches[1];
            }
            return null;
        }
    };


    // enum & string data types.

    var $DebugMessageType = {
        Error: 0,
        Warning: 1,
        Information: 2
    };

    var $ListNodeType = {
        Attribute: 1,
        Variable: 2
    };


    var $DataType = {
        String: "string",
        Number: "number",
        Object: "object"
    };

    var $PayLoadType = {
        Page: "page",
        Cart: "cart",
        Link: "link",
        Event: "event",
        Timed: "time",
        Purchase: "purchase",
        action: "action",
        Perf: "perf"
    };

    var $PropertyName = {
        Data: "data",
        Type: "type"
    };

    var $LinkType = {
        Outbound: "o",
        Download: "d"
    };


    var $TaxonomyNames =
        {
            PageAlias: "PageAlias",
            ProfileId: "ProfileId",
            UserIdentity: "UserIdentity",
            Referrer: "Referrer",
            Language: "Language",
            TimeZone: "Timezone",
            Screen: "Screen",
            TargetPage: "TargetPage",
            Links: "Links",
            LinkAlias: "LinkAlias",
            ShoppingCart: "ShoppingCart",
            Events: "Events",
            CustomUserId: "CustomUserId",
            Views: "Views",
            Properties: "Properties",
            CookieCreationDate: "CookieCreationDate",
            PagePerformance: 'PagePerformance'
        };

    var $TaxonomyParams =
        {
            PageAlias: "als",
            ScriptVersion: "jsv",
            ScriptAction: "jsa",
            ProfileId: "pid",
            UserIdentity: "uid",
            Referrer: "rf",
            Language: "lng",
            TimeZone: "tz",
            Screen: "scr",
            TargetPage: "tp",
            Links: "lnk",
            LinkAlias: "als",
            ShoppingCart: "crt",
            Events: "evt",
            CustomUserId: "cuid",
            Views: "vh",
            Properties: "prp",
            CookieCreationDate: "ica",
            PagePerformance: "perf"
        };

    var csmConstants = {
        attachEvent: "attachEvent",
        de: "detachEvent",
        ad: "addEventListener",
        re: "removeEventListener",
        udf: "undefined"
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

    // browser information object.
    var browser = {
        supportOnBeforeUnload: null,
        supportPerformanceTimingApi: null,

        ///<summary>Determines whether browser supports onbeforeunload event</summary>
        SupportOnBeforeUnload: function () {
            if (browser.supportOnBeforeUnload === null) {
                browser.supportOnBeforeUnload = typeof (window.onbeforeunload) !== csmConstants.udf;

                if (browser.supportOnBeforeUnload === false) {

                    // special trick for FF 3.6. On FF 3.6 window.onbeforeunload is undefined, but event is supported
                    var el = document.createElement('div');
                    el.setAttribute('onbeforeunload', '');
                    browser.supportOnBeforeUnload = typeof (el.onbeforeunload) === "function";
                }
            }

            return browser.supportOnBeforeUnload;
        },

        ///<summary>Determines whether browser supports performance timing API</summary>
        SupportPerformanceTimingApi: function () {
            if (browser.supportPerformanceTimingApi === null) {
                browser.supportPerformanceTimingApi = !extensions.IsNullOrUndefined(window.performance)
                && !extensions.IsNullOrUndefined(window.performance.timing)
                && !extensions.IsNullOrUndefined(window.performance.timing.responseStart);
            }

            return browser.supportPerformanceTimingApi;
        }
    };


    var commands = {

        /// <summary>
        /// Wrappes function call in try..catch block and trace exception in case it occurs
        /// <param name="functionName">The name of the function which is wrapped</param>
        /// <param name="funcPointer">Pointer to the function which needs to be wrappped</param>
        /// <param name="params">Array of parameters that will be traced in case exception happends in the function</param>
        /// </summary>
        TryCatchTraceWrapper: function (functionName, funcPointer, params) {

            commands.TryCatchSwallowWrapper(funcPointer);

            // TODO: re-enable tracing attempts once error type transaction is supported in DA.
            //try {
            //    return funcPointer.call(this);
            //}
            //catch (ex) {
            //    commands.TryCatchSwallowWrapper(function () { diagnostics.TraceException(functionName, ex, params); });
            //}
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
                    if (window.confirm("Dev Analytics Error Logging: " + iex.message + "\nDo you want to debug an unhandled exception?")) {
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
        }

        /////<summary>
        ///// Creates XmlHttpRequest object which will not be monitored by client side monitoring
        ///// <returns>XmlHttpRequest instance which will not be monitored by client side monitoring</returns>
        /////</summary>
        // Not used yet in DA script, to be re-enabled once ajax tracking is migrated.
        //CreateXmlHttpRequest: function () {
        //    var result = new XMLHttpRequest();
        //    commands.TryCatchTraceWrapper("Disabling_XmlHttpRequest_monitoring", function () {
        //        result[ajaxMonitoringObject.GetDisabledPropertyName()] = true;
        //    });

        //    return result;
        //}
    };

    // describes a node in a list

    /**
    * @constructor
    */
    function listNode(nodeKey, nodeValue, nodeType) {
        if (nodeKey) {
            this.Key = nodeKey;
        }
        if (nodeValue) {
            this.Data = nodeValue;
        }
        else {
            this.Data = nodeKey;
        }
        if (nodeType) {
            this.Type = nodeType;
        }
        else {
            this.Type = $ListNodeType.Variable;
        }
        this.Next = null;
        this.Previous = null;
    }

    /**
    * @constructor
    */
    function list() {
        this.Root = null;
        this.Last = null;
        this.Count = 0;
    }

    // list collection
    list.prototype =
    {
        add: function (nodeKey, nodeValue, nodeType) {
            if ($AssertType(nodeKey, $DataType.Object)) {
                return false;
            }
            if ($AssertValue(this.find(nodeKey))) {
                return false;
            }
            var newNode = new listNode(nodeKey, nodeValue, nodeType);
            if (!$AssertValue(this.Root)) {
                this.Root = newNode;
                this.Last = newNode;
            } else {
                newNode.Previous = this.Last;
                this.Last.Next = newNode;
                this.Last = newNode;
            }
            this.Count++;
            return true;
        },
        addRange: function (listData) {
            if (!$AssertType(listData, $DataType.String) || listData.length == 0) {
                return false;
            }
            var listNodeCollection = listData.split(";");

            for (var i = 0; i < listNodeCollection.length; i++) {
                var listNodeAttributes = listNodeCollection[i].split(":");

                switch (listNodeAttributes.length) {
                    case 1: this.add(listNodeAttributes[0], null, null);
                        break;
                    case 2: this.add(listNodeAttributes[0], listNodeAttributes[1], null);
                        break;
                    case 3: this.add(listNodeAttributes[0], listNodeAttributes[1], listNodeAttributes[2]);
                        break;
                    default: break;
                }
            }
            return true;
        },
        find: function (searchKey) {
            var start = this.Root;
            var end = this.Last;
            if (!$AssertValue(start) || !$AssertValue(end)) {
                return null;
            }
            if ($AssertType(searchKey, $DataType.String)) {
                searchKey = searchKey.toLowerCase();
            }
            while (start != null && end != null) {
                var sK = $AssertType(start.Key, $DataType.String) ? start.Key.toLowerCase() : start.Key;

                var eK = $AssertType(end.Key, $DataType.String) ? end.Key.toLowerCase() : end.Key;

                if (sK == searchKey || eK == searchKey) {
                    return sK == searchKey ? start : end;
                }
                if (start == end) {
                    break;
                }
                start = start.Next;
                end = end.Previous;
            }
            return null;
        },
        removeAll: function () {
            this.Root = null;
            this.Last = null;
            this.Count = 0;
        },
        remove: function (nodeToRemove) {
            var nodeNext = nodeToRemove.Next;
            var nodePrevious = nodeToRemove.Previous;
            nodePrevious.Next = nodeNext;
            if ($AssertValue(nodeNext)) {
                nodeNext.Previous = nodePrevious;
            }
            if (this.Last == nodeToRemove) {
                this.Last = nodePrevious;
            }
            this.Count--;
            return nodePrevious;
        },
        toString: function () {
            var current = this.Root;
            var dataString = "";
            while (current != null) {
                dataString += current.Data.toString();
                current = current.Next;
            }

            return dataString;
        }
    };

    /**
    * @constructor
    */
    function simpleLink(linkUrl, linkType) {
        this.Url = $Clean(linkUrl);


        this.Type = linkType;
    };

    simpleLink.prototype.toString = function () {
        return "l:" + this.Url + ";" + this.Type + "|";
    };

    /**
    * @constructor
    */
    function simpleEvent(eventName, eventPath, eventDetail) {
        this.Name = $Clean(eventName);
        this.Path = $Clean(eventPath);
        this.Detail = $Clean(eventDetail);
    };

    simpleEvent.prototype.toString = function () {
        // Bug #4818: beacon is not properly encoding data on events
        // Need to check if this.Detail is object. If so then convert it to JSON.
        var detail = '';
        if (typeof this.Detail === "object" && typeof JSON === "object") {
            detail = JSON.stringify(this.Detail);
        } else if (this.Detail != undefined && this.Detail != null) {
            detail = this.Detail;
        }

        var path = '';
        if (this.Path != undefined && this.Path != null && this.Path != '') {
            path = this.Path;
        }

        return "e:" + this.Name + ";" + path + ";" + detail + "|";
    };

    /**
    * @constructor
    */
    function simpleProperty(propertyName, propValue) {
        this.Name = $Clean(propertyName);
        this.Value = $Clean(propValue);
    };

    simpleProperty.prototype.toString = function () {
        return "p:" + this.Name + ";" + this.Value + "|";
    };

    /**
    * @constructor
    */
    function viewHierarchy(viewId, viewStructure) {
        this.Id = $Clean(viewId);
        this.Structure = $Clean(viewStructure);
    };


    viewHierarchy.prototype.toString = function () {
        return "v:" + this.Id + ";" + this.Structure + "|";
    };

    /**
    * @constructor
    */
    function cartItem(productName, unitPrice, quantity) {
        // cart item object

        this.Name = $Clean(productName);

        if ($AssertType(unitPrice, $DataType.Number)) {
            this.Price = unitPrice;
            this.Quantity = 1;
        }
        else {
            this.Price = 0;
            this.Quantity = 0;
        }
        if ($AssertType(quantity, $DataType.Number)) {
            this.Quantity = quantity;
        }
        this.TotalPrice = this.Price * this.Quantity;
    };

    // item serialization to string
    cartItem.prototype.toString = function () {
        return this.Name + ";" + this.Price + ";" + this.Quantity + "|";
    };

    // gets a data object for the delta times of various performance timings.
    function $GetPageMetrics() {
        var getSafeDuration = function (start, end) {
            var result = end - start;
            if (result < 0) {
                result = 0;
            }
            return result;
        };

        return {
            "netCon": getSafeDuration(w.performance.timing.navigationStart, w.performance.timing.connectEnd),
            "sendReq": getSafeDuration(w.performance.timing.requestStart, w.performance.timing.responseStart),
            "recResp": getSafeDuration(w.performance.timing.responseStart, w.performance.timing.responseEnd),
            "clientProc": getSafeDuration(w.performance.timing.domLoading, w.performance.timing.loadEventEnd),
            "ptotal": getSafeDuration(w.performance.timing.domainLookupStart, w.performance.timing.loadEventEnd)
        };
    };
})()
