// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="TelemetryContext.ts" />
/// <reference path="./Telemetry/Common/Data.ts"/>
/// <reference path="./Util.ts"/>
/// <reference path="./Telemetry/PageViewManager.ts"/>
/// <reference path="./Telemetry/PageVisitTimeManager.ts"/>
/// <reference path="./Telemetry/RemoteDependencyData.ts"/>
/// <reference path="./ajax/ajax.ts"/>
/// <reference path="./SplitTest.ts"/>
/// <reference path="../JavaScriptSDK.Interfaces/IAppInsights.ts"/>

module Microsoft.ApplicationInsights {

    "use strict";

    export var Version = "1.0.20";

    /**
    * Internal interface to pass appInsights object to subcomponents without coupling
    */
    export interface IAppInsightsInternal {
        sendPageViewInternal(name?: string, url?: string, duration?: number, properties?: Object, measurements?: Object);
        sendPageViewPerformanceInternal(pageViewPerformance: ApplicationInsights.Telemetry.PageViewPerformance);
        flush();
    }

    /**
     * The main API that sends telemetry to Application Insights.
     * Learn more: http://go.microsoft.com/fwlink/?LinkID=401493
     */
    export class AppInsights implements IAppInsightsInternal, IAppInsights {

        // Counts number of trackAjax invokations.
        // By default we only monitor X ajax call per view to avoid too much load.
        // Default value is set in config.
        // This counter keeps increasing even after the limit is reached.
        private _trackAjaxAttempts: number = 0;

        private _eventTracking: Timing;
        private _pageTracking: Timing;
        private _pageViewManager: Microsoft.ApplicationInsights.Telemetry.PageViewManager;
        private _pageVisitTimeManager: Microsoft.ApplicationInsights.Telemetry.PageVisitTimeManager;
        private _ajaxMonitor: Microsoft.ApplicationInsights.AjaxMonitor;

        public config: IConfig;
        public context: TelemetryContext;
        public queue: (() => void)[];
        public static defaultConfig: IConfig;

        constructor(config: IConfig) {
            this.config = config || <IConfig>{};

            // load default values if specified
            var defaults: IConfig = AppInsights.defaultConfig;
            if (defaults !== undefined) {
                for (var field in defaults) {
                    // for each unspecified field, set the default value
                    if (this.config[field] === undefined) {
                        this.config[field] = defaults[field];
                    }
                }
            }

            _InternalLogging.verboseLogging = () => this.config.verboseLogging;
            _InternalLogging.enableDebugExceptions = () => this.config.enableDebug;
            var configGetters: ApplicationInsights.ITelemetryConfig = {
                instrumentationKey: () => this.config.instrumentationKey,
                accountId: () => this.config.accountId,
                sessionRenewalMs: () => this.config.sessionRenewalMs,
                sessionExpirationMs: () => this.config.sessionExpirationMs,
                endpointUrl: () => this.config.endpointUrl,
                emitLineDelimitedJson: () => this.config.emitLineDelimitedJson,
                maxBatchSizeInBytes: () => {
                    return (!this.config.isBeaconApiDisabled && Util.IsBeaconApiSupported()) ?
                        Math.min(this.config.maxBatchSizeInBytes, Sender.MaxBeaconPayloadSize) :
                        this.config.maxBatchSizeInBytes;
                },
                maxBatchInterval: () => this.config.maxBatchInterval,
                disableTelemetry: () => this.config.disableTelemetry,
                sampleRate: () => this.config.samplingPercentage,
                cookieDomain: () => this.config.cookieDomain,
                enableSessionStorageBuffer: () => {
                    // Disable Session Storage buffer if telemetry is sent using Beacon API
                    return ((this.config.isBeaconApiDisabled || !Util.IsBeaconApiSupported()) && this.config.enableSessionStorageBuffer);
                },
                isRetryDisabled: () => this.config.isRetryDisabled,
                isBeaconApiDisabled: () => this.config.isBeaconApiDisabled,
                sdkExtension: () => this.config.sdkExtension,
                isBrowserLinkTrackingEnabled: () => this.config.isBrowserLinkTrackingEnabled,
                appId: () => this.config.appId,
            }

            if (this.config.isCookieUseDisabled) {
                Util.disableCookies();
            }

            if (this.config.isStorageUseDisabled) {
                Util.disableStorage();
            }

            this.context = new ApplicationInsights.TelemetryContext(configGetters);

            this._pageViewManager = new Microsoft.ApplicationInsights.Telemetry.PageViewManager(this, this.config.overridePageViewDuration);

            // initialize event timing
            this._eventTracking = new Timing("trackEvent");
            this._eventTracking.action = (name?: string, url?: string, duration?: number, properties?: Object, measurements?: Object) => {
                if (!measurements) {
                    measurements = { duration: duration };
                }
                else {
                    // do not override existing duration value
                    if (isNaN(measurements["duration"])) {
                        measurements["duration"] = duration;
                    }
                }
                var event = new Telemetry.Event(name, properties, measurements);
                var data = new ApplicationInsights.Telemetry.Common.Data<ApplicationInsights.Telemetry.Event>(Telemetry.Event.dataType, event);
                var envelope = new Telemetry.Common.Envelope(data, Telemetry.Event.envelopeType);

                this.context.track(envelope);
            }

            // initialize page view timing
            this._pageTracking = new Timing("trackPageView");
            this._pageTracking.action = (name, url, duration, properties, measurements) => {
                this.sendPageViewInternal(name, url, duration, properties, measurements);
            }

            this._pageVisitTimeManager = new ApplicationInsights.Telemetry.PageVisitTimeManager(
                (pageName, pageUrl, pageVisitTime) => this.trackPageVisitTime(pageName, pageUrl, pageVisitTime));

            if (!this.config.disableAjaxTracking) {
                this._ajaxMonitor = new Microsoft.ApplicationInsights.AjaxMonitor(this);
            }
        }

        public sendPageViewInternal(name?: string, url?: string, duration?: number, properties?: Object, measurements?: Object) {
            var pageView = new Telemetry.PageView(name, url, duration, properties, measurements, this.context.operation.id);
            var data = new ApplicationInsights.Telemetry.Common.Data<ApplicationInsights.Telemetry.PageView>(Telemetry.PageView.dataType, pageView);
            var envelope = new Telemetry.Common.Envelope(data, Telemetry.PageView.envelopeType);

            this.context.track(envelope);

            // reset ajaxes counter
            this._trackAjaxAttempts = 0;
        }

        public sendPageViewPerformanceInternal(pageViewPerformance: ApplicationInsights.Telemetry.PageViewPerformance) {
            var pageViewPerformanceData = new ApplicationInsights.Telemetry.Common.Data<ApplicationInsights.Telemetry.PageViewPerformance>(
                Telemetry.PageViewPerformance.dataType, pageViewPerformance);
            var pageViewPerformanceEnvelope = new Telemetry.Common.Envelope(pageViewPerformanceData, Telemetry.PageViewPerformance.envelopeType);
            this.context.track(pageViewPerformanceEnvelope);
        }

        /**
         * Starts the timer for tracking a page load time. Use this instead of `trackPageView` if you want to control when the page view timer starts and stops,
         * but don't want to calculate the duration yourself. This method doesn't send any telemetry. Call `stopTrackPage` to log the end of the page view
         * and send the event.
         * @param name A string that idenfities this item, unique within this HTML document. Defaults to the document title.
         */
        public startTrackPage(name?: string) {
            try {
                if (typeof name !== "string") {
                    name = window.document && window.document.title || "";
                }

                this._pageTracking.start(name);
            } catch (e) {
                _InternalLogging.throwInternal(
                    LoggingSeverity.CRITICAL,
                    _InternalMessageId.StartTrackFailed,
                    "startTrackPage failed, page view may not be collected: " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }


        /**
         * Stops the timer that was started by calling `startTrackPage` and sends the pageview load time telemetry with the specified properties and measurements.
         * The duration of the page view will be the time between calling `startTrackPage` and `stopTrackPage`.
         * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
         * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
         * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        public stopTrackPage(name?: string, url?: string, properties?: Object, measurements?: Object) {
            try {
                if (typeof name !== "string") {
                    name = window.document && window.document.title || "";
                }

                if (typeof url !== "string") {
                    url = window.location && window.location.href || "";
                }

                this._pageTracking.stop(name, url, properties, measurements);

                if (this.config.autoTrackPageVisitTime) {
                    this._pageVisitTimeManager.trackPreviousPageVisit(name, url);
                }

            } catch (e) {
                _InternalLogging.throwInternal(
                    LoggingSeverity.CRITICAL,
                    _InternalMessageId.StopTrackFailed,
                    "stopTrackPage failed, page view will not be collected: " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }

        /**
         * Logs that a page or other item was viewed.
         * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
         * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
         * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
         * @param   duration    number - the number of milliseconds it took to load the page. Defaults to undefined. If set to default value, page load time is calculated internally.
         */
        public trackPageView(name?: string, url?: string, properties?: Object, measurements?: Object, duration?: number) {
            try {
                this._pageViewManager.trackPageView(name, url, properties, measurements, duration);

                if (this.config.autoTrackPageVisitTime) {
                    this._pageVisitTimeManager.trackPreviousPageVisit(name, url);
                }

            } catch (e) {
                _InternalLogging.throwInternal(
                    LoggingSeverity.CRITICAL,
                    _InternalMessageId.TrackPVFailed,
                    "trackPageView failed, page view will not be collected: " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }

        /**
         * Start timing an extended event. Call `stopTrackEvent` to log the event when it ends.
         * @param   name    A string that identifies this event uniquely within the document.
         */
        public startTrackEvent(name: string) {
            try {
                this._eventTracking.start(name);
            } catch (e) {
                _InternalLogging.throwInternal(LoggingSeverity.CRITICAL,
                    _InternalMessageId.StartTrackEventFailed,
                    "startTrackEvent failed, event will not be collected: " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }

        /**
         * Log an extended event that you started timing with `startTrackEvent`.
         * @param   name    The string you used to identify this event in `startTrackEvent`.
         * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        public stopTrackEvent(name: string, properties?: Object, measurements?: Object) {
            try {
                this._eventTracking.stop(name, undefined, properties, measurements);
            } catch (e) {
                _InternalLogging.throwInternal(LoggingSeverity.CRITICAL,
                    _InternalMessageId.StopTrackEventFailed,
                    "stopTrackEvent failed, event will not be collected: " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }

        /**
         * Log a user action or other occurrence.
         * @param   name    A string to identify this event in the portal.
         * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        public trackEvent(name: string, properties?: Object, measurements?: Object) {
            try {
                var eventTelemetry = new Telemetry.Event(name, properties, measurements);
                var data = new ApplicationInsights.Telemetry.Common.Data<ApplicationInsights.Telemetry.Event>(Telemetry.Event.dataType, eventTelemetry);
                var envelope = new Telemetry.Common.Envelope(data, Telemetry.Event.envelopeType);
                this.context.track(envelope);
            } catch (e) {
                _InternalLogging.throwInternal(LoggingSeverity.CRITICAL,
                    _InternalMessageId.TrackEventFailed,
                    "trackEvent failed, event will not be collected: " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }

        /**
         * Log a dependency call
         * @param id    unique id, this is used by the backend o correlate server requests. Use Util.newId() to generate a unique Id.
         * @param method    represents request verb (GET, POST, etc.)
         * @param absoluteUrl   absolute url used to make the dependency request
         * @param command   command name
         * @param totalTime total request time
         * @param success   indicates if the request was sessessful
         * @param resultCode    response code returned by the dependency request
         * @param properties    map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
         * @param measurements  map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        public trackDependency(id: string, method: string, absoluteUrl: string, command: string, totalTime: number, success: boolean, resultCode: number, properties?: Object, measurements?: Object) {
            if (this.config.maxAjaxCallsPerView === -1 ||
                this._trackAjaxAttempts < this.config.maxAjaxCallsPerView) {
                var dependency = new Telemetry.RemoteDependencyData(id, absoluteUrl, command, totalTime, success, resultCode, method, properties, measurements);
                var dependencyData = new ApplicationInsights.Telemetry.Common.Data<ApplicationInsights.Telemetry.RemoteDependencyData>(
                    Telemetry.RemoteDependencyData.dataType, dependency);
                var envelope = new Telemetry.Common.Envelope(dependencyData, ApplicationInsights.Telemetry.RemoteDependencyData.envelopeType);
                this.context.track(envelope);
            } else if (this._trackAjaxAttempts === this.config.maxAjaxCallsPerView) {
                _InternalLogging.throwInternal(LoggingSeverity.CRITICAL,
                    _InternalMessageId.MaxAjaxPerPVExceeded,
                    "Maximum ajax per page view limit reached, ajax monitoring is paused until the next trackPageView(). In order to increase the limit set the maxAjaxCallsPerView configuration parameter.",
                    true);
            }

            ++this._trackAjaxAttempts;
        }

         /**
         * Logs dependency call
         * @param dependencyData dependency data object
         */
        public trackDependencyData(dependency: Telemetry.RemoteDependencyData) {
            if (this.config.maxAjaxCallsPerView === -1 || this._trackAjaxAttempts < this.config.maxAjaxCallsPerView) {
                var dependencyData = new ApplicationInsights.Telemetry.Common.Data<ApplicationInsights.Telemetry.RemoteDependencyData>(
                    Telemetry.RemoteDependencyData.dataType, dependency);
                var envelope = new Telemetry.Common.Envelope(dependencyData, ApplicationInsights.Telemetry.RemoteDependencyData.envelopeType);
                this.context.track(envelope);
            } else if (this._trackAjaxAttempts === this.config.maxAjaxCallsPerView) {
                _InternalLogging.throwInternal(LoggingSeverity.CRITICAL,
                    _InternalMessageId.MaxAjaxPerPVExceeded,
                    "Maximum ajax per page view limit reached, ajax monitoring is paused until the next trackPageView(). In order to increase the limit set the maxAjaxCallsPerView configuration parameter.",
                    true);
            }

            ++this._trackAjaxAttempts;
        }

        /**
         * trackAjax method is obsolete, use trackDependency instead
         */
        public trackAjax(id: string, absoluteUrl: string, pathName: string, totalTime: number, success: boolean, resultCode: number, method?: string) {
            this.trackDependency(id, null, absoluteUrl, pathName, totalTime, success, resultCode);
        }

        /**
         * Log an exception you have caught.
         * @param   exception   An Error from a catch clause, or the string error message.
         * @param   handledAt   Not used
         * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
         * @param   severityLevel   AI.SeverityLevel - severity level
         */
        public trackException(exception: Error, handledAt?: string, properties?: Object, measurements?: Object, severityLevel?: AI.SeverityLevel) {
            try {
                if (!Util.isError(exception)) {
                    // ensure that we have an error object (user could pass a string/message)
                    try {
                        throw new Error(<any>exception);
                    } catch (error) {
                        exception = error;
                    }
                }

                var exceptionTelemetry = new Telemetry.Exception(exception, properties, measurements, severityLevel);
                var data = new ApplicationInsights.Telemetry.Common.Data<ApplicationInsights.Telemetry.Exception>(Telemetry.Exception.dataType, exceptionTelemetry);
                var envelope = new Telemetry.Common.Envelope(data, Telemetry.Exception.envelopeType);
                this.context.track(envelope);
            } catch (e) {
                _InternalLogging.throwInternal(LoggingSeverity.CRITICAL,
                    _InternalMessageId.TrackExceptionFailed,
                    "trackException failed, exception will not be collected: " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }

        /**
         * Log a numeric value that is not associated with a specific event. Typically used to send regular reports of performance indicators.
         * To send a single measurement, use just the first two parameters. If you take measurements very frequently, you can reduce the
         * telemetry bandwidth by aggregating multiple measurements and sending the resulting average at intervals.
         * @param   name    A string that identifies the metric.
         * @param   average Number representing either a single measurement, or the average of several measurements.
         * @param   sampleCount The number of measurements represented by the average. Defaults to 1.
         * @param   min The smallest measurement in the sample. Defaults to the average.
         * @param   max The largest measurement in the sample. Defaults to the average.
         */
        public trackMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: Object) {
            try {
                var telemetry = new Telemetry.Metric(name, average, sampleCount, min, max, properties);
                var data = new ApplicationInsights.Telemetry.Common.Data<ApplicationInsights.Telemetry.Metric>(Telemetry.Metric.dataType, telemetry);
                var envelope = new Telemetry.Common.Envelope(data, Telemetry.Metric.envelopeType);

                this.context.track(envelope);
            } catch (e) {
                _InternalLogging.throwInternal(LoggingSeverity.CRITICAL,
                    _InternalMessageId.TrackMetricFailed,
                    "trackMetric failed, metric will not be collected: " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }

        /**
        * Log a diagnostic message.
        * @param   message A message string
        * @param   properties  map[string, string] - additional data used to filter traces in the portal. Defaults to empty.
        * @param   severityLevel   AI.SeverityLevel - severity level
        */
        public trackTrace(message: string, properties?: Object, severityLevel?: AI.SeverityLevel) {
            try {
                var telemetry = new Telemetry.Trace(message, properties, severityLevel);
                var data = new ApplicationInsights.Telemetry.Common.Data<ApplicationInsights.Telemetry.Trace>(Telemetry.Trace.dataType, telemetry);
                var envelope = new Telemetry.Common.Envelope(data, Telemetry.Trace.envelopeType);

                this.context.track(envelope);
            } catch (e) {
                _InternalLogging.throwInternal(LoggingSeverity.WARNING,
                    _InternalMessageId.TrackTraceFailed,
                    "trackTrace failed, trace will not be collected: " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }

        /**
       * Log a page visit time
       * @param    pageName    Name of page
       * @param    pageVisitDuration Duration of visit to the page in milleseconds
       */
        private trackPageVisitTime(pageName: string, pageUrl: string, pageVisitTime: number) {
            var properties = { PageName: pageName, PageUrl: pageUrl };
            this.trackMetric("PageVisitTime", pageVisitTime, 1, pageVisitTime, pageVisitTime, properties);
        }

        /**
         * Immediately send all queued telemetry.
         * @param {boolean} async - If flush should be call asynchronously
         */
        public flush(async = true) {
            try {
                this.context._sender.triggerSend(async);
            } catch (e) {
                _InternalLogging.throwInternal(LoggingSeverity.CRITICAL,
                    _InternalMessageId.FlushFailed,
                    "flush failed, telemetry will not be collected: " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }

        /**
         * Sets the authenticated user id and the account id.
         * User auth id and account id should be of type string. They should not contain commas, semi-colons, equal signs, spaces, or vertical-bars.
         *
         * By default the method will only set the authUserID and accountId for all events in this page view. To add them to all events within
         * the whole session, you should either call this method on every page view or set `storeInCookie = true`.
         *
         * @param authenticatedUserId {string} - The authenticated user id. A unique and persistent string that represents each authenticated user in the service.
         * @param accountId {string} - An optional string to represent the account associated with the authenticated user.
         * @param storeInCookie {boolean} - AuthenticateUserID will be stored in a cookie and added to all events within this session.
         */
        public setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie = false) {
            try {
                this.context.user.setAuthenticatedUserContext(authenticatedUserId, accountId, storeInCookie);
            } catch (e) {
                _InternalLogging.throwInternal(LoggingSeverity.WARNING,
                    _InternalMessageId.SetAuthContextFailed,
                    "Setting auth user context failed. " + Util.getExceptionName(e),
                    { exception: Util.dump(e) },
                    true);
            }
        }

        /**
         * Clears the authenticated user id and the account id from the user context.
         */
        public clearAuthenticatedUserContext() {
            try {
                this.context.user.clearAuthenticatedUserContext();
            } catch (e) {
                _InternalLogging.throwInternal(LoggingSeverity.WARNING,
                    _InternalMessageId.SetAuthContextFailed,
                    "Clearing auth user context failed. " + Util.getExceptionName(e),
                    { exception: Util.dump(e) },
                    true);
            }
        }

        /**
        * In case of CORS exceptions - construct an exception manually.
        * See this for more info: http://stackoverflow.com/questions/5913978/cryptic-script-error-reported-in-javascript-in-chrome-and-firefox
        */
        private SendCORSException(properties: any) {
            var exceptionData = Microsoft.ApplicationInsights.Telemetry.Exception.CreateSimpleException(
                "Script error.",
                "Error", "unknown", "unknown",
                "The browser's same-origin policy prevents us from getting the details of this exception. Consider using 'crossorigin' attribute.",
                0);
            exceptionData.properties = properties;

            var data = new ApplicationInsights.Telemetry.Common.Data<ApplicationInsights.Telemetry.Exception>(Telemetry.Exception.dataType, exceptionData);
            var envelope = new Telemetry.Common.Envelope(data, Telemetry.Exception.envelopeType);
            this.context.track(envelope);
        }

        /**
         * The custom error handler for Application Insights
         * @param {string} message - The error message
         * @param {string} url - The url where the error was raised
         * @param {number} lineNumber - The line number where the error was raised
         * @param {number} columnNumber - The column number for the line where the error was raised
         * @param {Error}  error - The Error object
         */
        public _onerror(message: string, url: string, lineNumber: number, columnNumber: number, error: Error) {
            try {
                var properties = { url: url ? url : document.URL };

                if (Util.isCrossOriginError(message, url, lineNumber, columnNumber, error)) {
                    this.SendCORSException(properties);
                } else {
                    if (!Util.isError(error)) {
                        var stack = "window.onerror@" + properties.url + ":" + lineNumber + ":" + (columnNumber || 0);
                        error = new Error(message);
                        error["stack"] = stack;
                    }
                    this.trackException(error, null, properties);
                }
            } catch (exception) {
                var errorString =
                    error ? (error.name + ", " + error.message) : "null";

                var exceptionDump: string = Util.dump(exception);

                _InternalLogging.throwInternal(LoggingSeverity.CRITICAL,
                    _InternalMessageId.ExceptionWhileLoggingError,
                    "_onerror threw exception while logging error, error will not be collected: " + Util.getExceptionName(exception),
                    { exception: exceptionDump, errorString: errorString });
            }
        }

    }

    /**
     * Used to record timed events and page views.
     */
    class Timing {
        private _name;
        private _action: (ITimingDetail, number) => void;
        private _events: {
            [key: string]: number;
        };

        constructor(name: string) {
            this._name = name;
            this._events = {};
        }

        public start(name: string) {
            if (typeof this._events[name] !== "undefined") {
                _InternalLogging.throwInternal(
                    LoggingSeverity.WARNING, _InternalMessageId.StartCalledMoreThanOnce, "start was called more than once for this event without calling stop.",
                    { name: this._name, key: name }, true);
            }

            this._events[name] = +new Date;
        }

        public stop(name: string, url: string, properties?: Object, measurements?: Object) {
            var start = this._events[name];
            if (isNaN(start)) {
                _InternalLogging.throwInternal(
                    LoggingSeverity.WARNING, _InternalMessageId.StopCalledWithoutStart, "stop was called without a corresponding start.",
                    { name: this._name, key: name }, true);
            } else {
                var end = +new Date;
                var duration = Telemetry.PageViewPerformance.getDuration(start, end);
                this.action(name, url, duration, properties, measurements);
            }

            delete this._events[name];
            this._events[name] = undefined;
        }

        public action: (name?: string, url?: string, duration?: number, properties?: Object, measurements?: Object) => void;
    }
}
