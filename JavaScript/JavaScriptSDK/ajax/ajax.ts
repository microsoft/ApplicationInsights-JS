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
        private initialized: boolean;
        private static instrumentedByAppInsightsName = "InstrumentedByAppInsights";

        constructor(appInsights: Microsoft.ApplicationInsights.AppInsights) {
            this.appInsights = appInsights;
            this.initialized = false;
            this.Init();
        }

        ///<summary>The main function that needs to be called in order to start Ajax Monitoring</summary>
        private Init() {
            if (this.supportsMonitoring()) {
                this.instrumentOpen();
                this.instrumentSend();
                this.instrumentAbort();
                this.initialized = true;
            }
        }


        ///<summary>Function that returns property name which will identify that monitoring for given instance of XmlHttpRequest is disabled</summary>
        public static DisabledPropertyName: string = "Microsoft_ApplicationInsights_BypassAjaxInstrumentation";

        ///<summary>Verifies that particalar instance of XMLHttpRequest needs to be monitored</summary>
        ///<param name="excludeAjaxDataValidation">Optional parameter. True if ajaxData must be excluded from verification</param>
        ///<returns type="bool">True if instance needs to be monitored, otherwise false</returns>
        private isMonitoredInstance(xhr: XMLHttpRequestInstrumented, excludeAjaxDataValidation?: boolean): boolean {

            // checking to see that all interested functions on xhr were instrumented
            return this.initialized

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
                    if (ajaxMonitorInstance.isMonitoredInstance(this, true) &&
                        (
                            !(<XMLHttpRequestInstrumented>this).ajaxData ||
                            !(<XMLHttpRequestInstrumented>this).ajaxData.xhrMonitoringState.openDone
                        )) {
                        ajaxMonitorInstance.openHandler(this, method, url, async);
                    }
                } catch (e) {
                    _InternalLogging.throwInternalNonUserActionable(
                        LoggingSeverity.CRITICAL,
                        new _InternalLogMessage("Failed to monitor XMLHttpRequest.open, monitoring data for this ajax call may be incorrect.", {
                            ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(this),
                            exception: Microsoft.ApplicationInsights.Util.dump(e)
                        }));
                }

                return originalOpen.apply(this, arguments);
            };
        }

        private openHandler(xhr: XMLHttpRequestInstrumented, method, url, async) {
            var ajaxData = new ajaxRecord();
            ajaxData.method = method;
            ajaxData.requestUrl = url;
            ajaxData.xhrMonitoringState.openDone = true
            xhr.ajaxData = ajaxData;

            this.attachToOnReadyStateChange(xhr);
        }

        private static getFailedAjaxDiagnosticsMessage(xhr: XMLHttpRequestInstrumented): string {
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
                    if (ajaxMonitorInstance.isMonitoredInstance(this) && !(<XMLHttpRequestInstrumented>this).ajaxData.xhrMonitoringState.sendDone) {
                        ajaxMonitorInstance.sendHandler(this, content);
                    }
                } catch (e) {
                    _InternalLogging.throwInternalNonUserActionable(
                        LoggingSeverity.CRITICAL,
                        new _InternalLogMessage("Failed to monitor XMLHttpRequest, monitoring data for this ajax call may be incorrect.", {
                            ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(this),
                            exception: Microsoft.ApplicationInsights.Util.dump(e)
                        }));
                }

                return originalSend.apply(this, arguments);
            };
        }

        private sendHandler(xhr: XMLHttpRequestInstrumented, content) {
            xhr.ajaxData.requestSentTime = dateTime.Now();            
            xhr.ajaxData.xhrMonitoringState.sendDone = true;
        }

        private instrumentAbort() {
            var originalAbort = XMLHttpRequest.prototype.abort;
            var ajaxMonitorInstance = this;
            XMLHttpRequest.prototype.abort = function () {
                try {
                    if (ajaxMonitorInstance.isMonitoredInstance(this) && !(<XMLHttpRequestInstrumented>this).ajaxData.xhrMonitoringState.abortDone) {
                        (<XMLHttpRequestInstrumented>this).ajaxData.aborted = 1;
                        (<XMLHttpRequestInstrumented>this).ajaxData.xhrMonitoringState.abortDone = true;
                    }
                } catch (e) {
                    _InternalLogging.throwInternalNonUserActionable(
                        LoggingSeverity.CRITICAL,
                        new _InternalLogMessage("Failed to monitor XMLHttpRequest.abort, monitoring data for this ajax call may be incorrect.", {
                            ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(this),
                            exception: Microsoft.ApplicationInsights.Util.dump(e)
                        }));
                }

                return originalAbort.apply(this, arguments);
            };
        }

        private attachToOnReadyStateChange(xhr: XMLHttpRequestInstrumented) {
            var ajaxMonitorInstance = this;
            xhr.ajaxData.xhrMonitoringState.onreadystatechangeCallbackAttached = EventHelper.AttachEvent(xhr, "readystatechange", () => {
                try {
                    if (ajaxMonitorInstance.isMonitoredInstance(xhr)) {
                        if (xhr.readyState === 4) {
                            ajaxMonitorInstance.onAjaxComplete(xhr);
                    }
                    }
                } catch (e) {
                    _InternalLogging.throwInternalNonUserActionable(
                        LoggingSeverity.CRITICAL,
                        new _InternalLogMessage("Failed to monitor XMLHttpRequest 'readystatechange' event handler, monitoring data for this ajax call may be incorrect.", {
                            ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(xhr),
                            exception: Microsoft.ApplicationInsights.Util.dump(e)
                        }));
                }
            });
        }

        private onAjaxComplete(xhr: XMLHttpRequestInstrumented) {
            xhr.ajaxData.responseFinishedTime = dateTime.Now();
            xhr.ajaxData.status = xhr.status;
                xhr.ajaxData.CalculateMetrics();

            if (xhr.ajaxData.ajaxTotalDuration < 0) {
                _InternalLogging.throwInternalNonUserActionable(
                    LoggingSeverity.WARNING,
                    new _InternalLogMessage("Failed to calculate the duration of the ajax call, monitoring data for this ajax call won't be sent.", {
                        ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(xhr),
                        requestSentTime: xhr.ajaxData.requestSentTime,
                        responseFinishedTime: xhr.ajaxData.responseFinishedTime
                    }));
            }
            else {
                this.appInsights.trackAjax(
                    xhr.ajaxData.getAbsoluteUrl(),
                    xhr.ajaxData.getPathName(),
                    xhr.ajaxData.ajaxTotalDuration,
                    (+(xhr.ajaxData.status)) < 400,
                    +xhr.ajaxData.status
                );

                xhr.ajaxData = null;
            }
        }

    }
}