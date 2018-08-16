/// <reference path="../Logging.ts" />
/// <reference path="../Util.ts" />
/// <reference path="./ajaxUtils.ts" />
/// <reference path="./ajaxRecord.ts" />
/// <reference path="../RequestResponseHeaders.ts" />
/// <reference path="../Telemetry/RemoteDependencyData.ts" />
/// <reference path="../AppInsights.ts" />

module Microsoft.ApplicationInsights {
    "use strict";

    export class FetchMonitor {
        private appInsights: AppInsights;
        private initialized: boolean;
        public static instrumentedByAppInsightsName = "InstrumentedByAppInsights";
        private currentWindowHost: string;

        constructor(appInsights: Microsoft.ApplicationInsights.AppInsights) {
            this.currentWindowHost = window.location.host && window.location.host.toLowerCase();
            this.appInsights = appInsights;
            this.initialized = false;
            this.Init();
        }

        private Init(): void {
            if (this.supportsMonitoring()) {
                this.instrumentFetch();
                this.initialized = true;
            }
        }

        public static DisabledPropertyName: string = "Microsoft_ApplicationInsights_BypassFetchInstrumentation";

        private isMonitoredInstance(input: Request | string): boolean {
            return this.initialized && input[FetchMonitor.DisabledPropertyName] !== true;
        }

        private supportsMonitoring(): boolean {
            let result: boolean = true;
            if (extensions.IsNullOrUndefined((window as any).Request) ||
                extensions.IsNullOrUndefined((window as any).Request.prototype) ||
                extensions.IsNullOrUndefined(window.fetch) ||
                window.fetch.toString().indexOf("new XMLHttpRequest") !== -1) {
                result = false;
            }
            return result;
        }

        private instrumentFetch(): void {
            let originalFetch: (input?: Request | string, init?: RequestInit) => Promise<Response> = window.fetch;
            let fetchMonitorInstance: FetchMonitor = this;
            window.fetch = function fetch(input?: Request | string, init?: RequestInit): Promise<Response> {
                let ajaxData: ajaxRecord;
                if (fetchMonitorInstance.isMonitoredInstance(input)) {
                    try {
                        ajaxData = fetchMonitorInstance.createAjaxRecord(input, init);
                        init = fetchMonitorInstance.includeCorrelationHeaders(ajaxData, input, init);
                    } catch (e) {
                        _InternalLogging.throwInternal(
                            LoggingSeverity.CRITICAL,
                            _InternalMessageId.FailedMonitorAjaxOpen,
                            "Failed to monitor Window.fetch, monitoring data for this fetch call may be incorrect.",
                            {
                                ajaxDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(input),
                                exception: Microsoft.ApplicationInsights.Util.dump(e)
                            });
                    }
                }
                return originalFetch(input, init)
                    .then(response => {
                        fetchMonitorInstance.onFetchComplete(response, ajaxData);
                        return response;
                    })
                    .catch(reason => {
                        fetchMonitorInstance.onFetchFailed(input, ajaxData, reason);
                        throw reason;
                    });
            };
            window.fetch[FetchMonitor.instrumentedByAppInsightsName] = true;
        }

        private createAjaxRecord(input?: Request | string, init?: RequestInit): ajaxRecord {
            // this format corresponds with activity logic on server-side and is required for the correct correlation
            let id: string = `|${this.appInsights.context.operation.id}.${Util.newId()}`;
            let ajaxData: ajaxRecord = new ajaxRecord(id);
            ajaxData.requestSentTime = dateTime.Now();
            if (input instanceof Request) {
                (input as any).ajaxData = ajaxData;
                ajaxData.requestUrl = input ? input.url : "";
            } else {
                ajaxData.requestUrl = input;
            }
            if (init && init.method) {
                ajaxData.method = init.method;
            } else if (input && input instanceof Request) {
                ajaxData.method = input.method;
            } else {
                ajaxData.method = "GET";
            }
            return ajaxData;
        }

        private includeCorrelationHeaders(ajaxData: ajaxRecord, input?: Request | string, init?: RequestInit) {
            if (CorrelationIdHelper.canIncludeCorrelationHeader(this.appInsights.config, ajaxData.getAbsoluteUrl(), this.currentWindowHost)) {
                if (!init) {
                    init = {};
                }
                // init headers override original request headers
                // so, if they exist use only them, otherwise use request's because they should have been applied in the first place
                // not using original request headers will result in them being lost
                init.headers = new Headers(init.headers || (input instanceof Request ? (input.headers || {}) : {}));
                init.headers.set(RequestHeaders.requestIdHeader, ajaxData.id);
                let appId: string = this.appInsights.context ? this.appInsights.context.appId() : null;
                if (appId) {
                    init.headers.set(RequestHeaders.requestContextHeader, RequestHeaders.requestContextAppIdFormat + appId);
                }
            }
            return init;
        }

        private static getFailedFetchDiagnosticsMessage(input: Request | Response | string): string {
            let result: string = "";
            try {
                if (!extensions.IsNullOrUndefined(input)) {
                    if (typeof (input) === "string") {
                        result += `(url: '${input}')`;
                    } else {
                        result += `(url: '${input.url}')`;
                    }
                }
                // tslint:disable-next-line:no-empty
            } catch (e) { }

            return result;
        }

        private onFetchComplete(response: Response, ajaxData: ajaxRecord): void {
            if (!ajaxData) {
                return;
            }
            try {
                ajaxData.responseFinishedTime = dateTime.Now();
                ajaxData.CalculateMetrics();

                if (ajaxData.ajaxTotalDuration < 0) {
                    _InternalLogging.throwInternal(
                        LoggingSeverity.WARNING,
                        _InternalMessageId.FailedMonitorAjaxDur,
                        "Failed to calculate the duration of the fetch call, monitoring data for this fetch call won't be sent.",
                        {
                            fetchDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(response),
                            requestSentTime: ajaxData.requestSentTime,
                            responseFinishedTime: ajaxData.responseFinishedTime
                        });
                } else {
                    let dependency: Telemetry.RemoteDependencyData = new Telemetry.RemoteDependencyData(
                        ajaxData.id,
                        ajaxData.getAbsoluteUrl(),
                        ajaxData.getPathName(),
                        ajaxData.ajaxTotalDuration,
                        response.status >= 200 && response.status < 400,
                        response.status,
                        ajaxData.method);

                    // enrich dependency target with correlation context from the server
                    let correlationContext: string = this.getCorrelationContext(response);
                    if (correlationContext) {
                        dependency.target = dependency.target + " | " + correlationContext;
                    }

                    this.appInsights.trackDependencyData(dependency);
                }
            } catch (e) {
                _InternalLogging.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.FailedMonitorAjaxGetCorrelationHeader,
                    "Failed to calculate the duration of the fetch call, monitoring data for this fetch call won't be sent.",
                    {
                        fetchDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(response),
                        exception: Microsoft.ApplicationInsights.Util.dump(e)
                    });
            }
        }

        private onFetchFailed(input: Request | string, ajaxData: ajaxRecord, reason: any): void {
            if (!ajaxData) {
                return;
            }
            try {
                ajaxData.responseFinishedTime = dateTime.Now();
                ajaxData.CalculateMetrics();

                if (ajaxData.ajaxTotalDuration < 0) {
                    _InternalLogging.throwInternal(
                        LoggingSeverity.WARNING,
                        _InternalMessageId.FailedMonitorAjaxDur,
                        "Failed to calculate the duration of the failed fetch call, monitoring data for this fetch call won't be sent.",
                        {
                            fetchDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(input),
                            requestSentTime: ajaxData.requestSentTime,
                            responseFinishedTime: ajaxData.responseFinishedTime
                        });
                } else {
                    let dependency: Telemetry.RemoteDependencyData = new Telemetry.RemoteDependencyData(
                        ajaxData.id,
                        ajaxData.getAbsoluteUrl(),
                        ajaxData.getPathName(),
                        ajaxData.ajaxTotalDuration,
                        false,
                        0,
                        ajaxData.method);
                    dependency.properties = { error: reason.message };
                    this.appInsights.trackDependencyData(dependency);
                }
            } catch (e) {
                _InternalLogging.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.FailedMonitorAjaxGetCorrelationHeader,
                    "Failed to calculate the duration of the failed fetch call, monitoring data for this fetch call won't be sent.",
                    {
                        fetchDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(input),
                        exception: Microsoft.ApplicationInsights.Util.dump(e)
                    });
            }
        }

        private getCorrelationContext(response: Response): string {
            try {
                let responseHeader: string = response.headers.get(RequestHeaders.requestContextHeader);
                return CorrelationIdHelper.getCorrelationContext(responseHeader);
            } catch (e) {
                _InternalLogging.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.FailedMonitorAjaxGetCorrelationHeader,
                    "Failed to get Request-Context correlation header as it may be not included in the response or not accessible.",
                    {
                        fetchDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(response),
                        exception: Microsoft.ApplicationInsights.Util.dump(e)
                    });
            }
        }
    }
}
