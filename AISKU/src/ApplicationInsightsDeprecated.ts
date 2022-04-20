import dynamicProto from "@microsoft/dynamicproto-js";
import {
    DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, IAutoExceptionTelemetry, IConfig, IDependencyTelemetry, IEnvelope, IEventTelemetry,
    IExceptionTelemetry, IMetricTelemetry, IPageViewTelemetry, ITraceTelemetry, ProcessLegacy, SeverityLevel, stringToBoolOrDefault
} from "@microsoft/applicationinsights-common";
import {
    IConfiguration, ICookieMgr, IDiagnosticLogger, ITelemetryItem, arrIndexOf, isFunction, proxyAssign, proxyFunctions, throwError
} from "@microsoft/applicationinsights-core-js";
import { DfltAjaxCorrelationHeaderExDomains } from "@microsoft/applicationinsights-dependencies-js";
import { Initialization as ApplicationInsights, Snippet } from "./Initialization";
import {
    STR_FLUSH, STR_GET_COOKIE_MGR, STR_SNIPPET, STR_START_TRACK_EVENT, STR_START_TRACK_PAGE, STR_STOP_TRACK_EVENT, STR_STOP_TRACK_PAGE
} from "./InternalConstants";

// This is an exclude list of properties that should not be updated during initialization
// They include a combination of private and internal property names
const _ignoreUpdateSnippetProperties = [
    STR_SNIPPET, "getDefaultConfig", "_hasLegacyInitializers", "_queue", "_processLegacyInitializers"
];

function getDefaultConfig(config?: any): any {
    if (!config) {
        config = ({} as any);
    }

    // set default values
    config.endpointUrl = config.endpointUrl || DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
    config.sessionRenewalMs = 30 * 60 * 1000;
    config.sessionExpirationMs = 24 * 60 * 60 * 1000;
    config.maxBatchSizeInBytes = config.maxBatchSizeInBytes > 0 ? config.maxBatchSizeInBytes : 102400; // 100kb
    config.maxBatchInterval = !isNaN(config.maxBatchInterval) ? config.maxBatchInterval : 15000;
    config.enableDebug = stringToBoolOrDefault(config.enableDebug);
    config.disableExceptionTracking = stringToBoolOrDefault(config.disableExceptionTracking);
    config.disableTelemetry = stringToBoolOrDefault(config.disableTelemetry);
    config.verboseLogging = stringToBoolOrDefault(config.verboseLogging);
    config.emitLineDelimitedJson = stringToBoolOrDefault(config.emitLineDelimitedJson);
    config.diagnosticLogInterval = config.diagnosticLogInterval || 10000;
    config.autoTrackPageVisitTime = stringToBoolOrDefault(config.autoTrackPageVisitTime);

    if (isNaN(config.samplingPercentage) || config.samplingPercentage <= 0 || config.samplingPercentage >= 100) {
        config.samplingPercentage = 100;
    }

    config.disableAjaxTracking = stringToBoolOrDefault(config.disableAjaxTracking);
    config.maxAjaxCallsPerView = !isNaN(config.maxAjaxCallsPerView) ? config.maxAjaxCallsPerView : 500;

    config.isBeaconApiDisabled = stringToBoolOrDefault(config.isBeaconApiDisabled, true);
    config.disableCorrelationHeaders = stringToBoolOrDefault(config.disableCorrelationHeaders);
    config.correlationHeaderExcludedDomains = config.correlationHeaderExcludedDomains || DfltAjaxCorrelationHeaderExDomains;
    config.disableFlushOnBeforeUnload = stringToBoolOrDefault(config.disableFlushOnBeforeUnload);
    config.disableFlushOnUnload = stringToBoolOrDefault(config.disableFlushOnUnload, config.disableFlushOnBeforeUnload);
    config.enableSessionStorageBuffer = stringToBoolOrDefault(config.enableSessionStorageBuffer, true);
    config.isRetryDisabled = stringToBoolOrDefault(config.isRetryDisabled);
    config.isCookieUseDisabled = stringToBoolOrDefault(config.isCookieUseDisabled);
    config.isStorageUseDisabled = stringToBoolOrDefault(config.isStorageUseDisabled);
    config.isBrowserLinkTrackingEnabled = stringToBoolOrDefault(config.isBrowserLinkTrackingEnabled);
    config.enableCorsCorrelation = stringToBoolOrDefault(config.enableCorsCorrelation);

    return config;
}
    
export class AppInsightsDeprecated implements IAppInsightsDeprecated {

    public config: IConfig & IConfiguration;
    public snippet: Snippet;
    public context: ITelemetryContext;
    public logger: IDiagnosticLogger;
    public queue: Array<() => void>;
    public appInsightsNew: ApplicationInsights;

    constructor(snippet: Snippet, appInsightsNew: ApplicationInsights) {
        let _hasLegacyInitializers = false;
        let _queue: Array<((env: IEnvelope) => boolean | void)> = [];
        let _config: IConfiguration;

        dynamicProto(AppInsightsDeprecated, this, (_self) => {
            _config = getDefaultConfig(snippet.config);
            _self.config = _config;
            _self.snippet = snippet;
            _self.appInsightsNew = appInsightsNew;
            _self.context = { addTelemetryInitializer: _addTelemetryInitializers.bind(_self) };

            _self.addTelemetryInitializers = _addTelemetryInitializers;

            function _addTelemetryInitializers(callBack: (env: IEnvelope) => boolean | void) {

                // Add initializer to current processing only if there is any old telemetry initializer
                if (!_hasLegacyInitializers) {
        
                    appInsightsNew.addTelemetryInitializer(item => {
                        _processLegacyInitializers(item); // setup call back for each legacy processor
                    })
        
                    _hasLegacyInitializers = true;
                }
        
                _queue.push(callBack);
            }

            proxyFunctions(_self, appInsightsNew, [
                STR_GET_COOKIE_MGR,
                STR_START_TRACK_PAGE,
                STR_STOP_TRACK_PAGE,
                STR_FLUSH,
                STR_START_TRACK_EVENT,
                STR_STOP_TRACK_EVENT
            ]);

            _self.trackPageView = (name?: string, url?: string, properties?: {[key: string]: string }, measurements?: {[key: string]: number }, duration?: number) => {
                const telemetry: IPageViewTelemetry = {
                    name,
                    uri: url,
                    properties,
                    measurements
                };
        
                // fix for props, measurements, duration
                appInsightsNew.trackPageView(telemetry);
            };
        
            _self.trackEvent = (name: string, properties?: Object, measurements?: Object) => {
                appInsightsNew.trackEvent({ name} as IEventTelemetry);
            };
        
            _self.trackDependency = (id: string, method: string, absoluteUrl: string, pathName: string, totalTime: number, success: boolean, resultCode: number) => {
                appInsightsNew.trackDependencyData(
                    {
                        id,
                        target: absoluteUrl,
                        type: pathName,
                        duration: totalTime,
                        properties: { HttpMethod: method },
                        success,
                        responseCode: resultCode
                    } as IDependencyTelemetry);
            };
        
            _self.trackException = (exception: Error, handledAt?: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; }, severityLevel?: any) => {
                appInsightsNew.trackException({
                    exception
                } as IExceptionTelemetry);
            };
        
            _self.trackMetric = (name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: { [name: string]: string; }) => {
                appInsightsNew.trackMetric({name, average, sampleCount, min, max} as IMetricTelemetry);
            };
        
            _self.trackTrace = (message: string, properties?: { [name: string]: string; }, severityLevel?: any) => {
                appInsightsNew.trackTrace({ message, severityLevel } as ITraceTelemetry);
            };
        
            _self.setAuthenticatedUserContext = (authenticatedUserId: string, accountId?: string, storeInCookie?: boolean) => {
                appInsightsNew.context.user.setAuthenticatedUserContext(authenticatedUserId, accountId, storeInCookie);
            };
        
            _self.clearAuthenticatedUserContext = () => {
                appInsightsNew.context.user.clearAuthenticatedUserContext();
            };
        
            _self._onerror = (message: string, url: string, lineNumber: number, columnNumber: number, error: Error) => {
                appInsightsNew._onerror({ message, url, lineNumber, columnNumber, error } as IAutoExceptionTelemetry);
            };
        
            _self.downloadAndSetup = (config: IConfig): void => {
                throwError("downloadAndSetup not implemented in web SKU");
            };
        
            _self.updateSnippetDefinitions = (snippet: Snippet) => {
                // apply full appInsights to the global instance
                // Note: This must be called before loadAppInsights is called
                proxyAssign(snippet, this, (name: string) => {
                    // Not excluding names prefixed with "_" as we need to proxy some functions like _onError
                    return name && arrIndexOf(_ignoreUpdateSnippetProperties, name) === -1;
                });
            };
        
            // note: these are split into methods to enable unit tests
            _self.loadAppInsights = () => {
        
                // initialize global instance of appInsights
                // var appInsights = new Microsoft.ApplicationInsights.AppInsights(_self.config);
        
                // implement legacy version of trackPageView for 0.10<
                if (_self.config["iKey"]) {
                    const originalTrackPageView = _self.trackPageView;
                    _self.trackPageView = (pagePath?: string, properties?: Object, measurements?: Object) => {
                        originalTrackPageView.apply(_self, [null, pagePath, properties, measurements]);
                    }
                }
        
                // implement legacy pageView interface if it is present in the snippet
                const legacyPageView = "logPageView";
                if (isFunction(_self.snippet[legacyPageView])) {
                    this[legacyPageView] = (pagePath?: string, properties?: {[key: string]: string }, measurements?: {[key: string]: number }) => {
                        _self.trackPageView(null, pagePath, properties, measurements);
                    }
                }
        
                // implement legacy event interface if it is present in the snippet
                const legacyEvent = "logEvent";
                if (isFunction(_self.snippet[legacyEvent])) {
                    this[legacyEvent] = (name: string, props?: Object, measurements?: Object) => {
                        _self.trackEvent(name, props, measurements);
                    }
                }
        
                return this;
            };

            function _processLegacyInitializers(item: ITelemetryItem): ITelemetryItem {
                // instead of mapping new to legacy and then back again and repeating in channel, attach callback for channel to call
                item.tags[ProcessLegacy] = _queue;
                return item;
            }
        
        });
    }

    /**
    * The array of telemetry initializers to call before sending each telemetry item.
    */

    public addTelemetryInitializers(callBack: (env: IEnvelope) => boolean | void) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Get the current cookie manager for this instance
     */
    public getCookieMgr(): ICookieMgr {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    startTrackPage(name?: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    stopTrackPage(name?: string, url?: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    trackPageView(name?: string, url?: string, properties?: {[key: string]: string }, measurements?: {[key: string]: number }, duration?: number) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    trackEvent(name: string, properties?: Object, measurements?: Object) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    trackDependency(id: string, method: string, absoluteUrl: string, pathName: string, totalTime: number, success: boolean, resultCode: number) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    trackException(exception: Error, handledAt?: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; }, severityLevel?: any) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    trackMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: { [name: string]: string; }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    trackTrace(message: string, properties?: { [name: string]: string; }, severityLevel?: any) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    flush(async?: boolean) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie?: boolean) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    clearAuthenticatedUserContext() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    _onerror(message: string, url: string, lineNumber: number, columnNumber: number, error: Error) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    startTrackEvent(name: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    stopTrackEvent(name: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    downloadAndSetup?(config: IConfig): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public updateSnippetDefinitions(snippet: Snippet) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    // note: these are split into methods to enable unit tests
    public loadAppInsights() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}

export interface IAppInsightsDeprecated {

    /*
    * Config object used to initialize AppInsights
    */
    config: IConfig;

    context: ITelemetryContext;

    /*
    * Initialization queue. Contains functions to run when appInsights initializes
    */
    queue: Array<() => void>;

    /**
     * Get the current cookie manager for this instance
     */
    getCookieMgr(): ICookieMgr;

   /**
    * Starts timing how long the user views a page or other item. Call this when the page opens.
    * This method doesn't send any telemetry. Call `stopTrackPage` to log the page when it closes.
    * @param   name  A string that identifies this item, unique within this HTML document. Defaults to the document title.
    */
    startTrackPage(name?: string): void;

   /**
    * Logs how long a page or other item was visible, after `startTrackPage`. Call this when the page closes.
    * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
    * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
    * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
    * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
    * @deprecated API is deprecated; supported only if input configuration specifies deprecated=true
    */
    stopTrackPage(name?: string, url?: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; }): void;

    /**
     * Logs that a page or other item was viewed.
     * @param   name  The string you used as the name in `startTrackPage`. Defaults to the document title.
     * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
     * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
     * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
     * @param   duration    number - the number of milliseconds it took to load the page. Defaults to undefined. If set to default value, page load time is calculated internally.
     */
    trackPageView(name?: string, url?: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; }, duration?: number): void;

    /**
     * Start timing an extended event. Call `stopTrackEvent` to log the event when it ends.
     * @param   name    A string that identifies this event uniquely within the document.
     */
    startTrackEvent(name: string): void;


    /**
     * Log an extended event that you started timing with `startTrackEvent`.
     * @param   name    The string you used to identify this event in `startTrackEvent`.
     * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
     * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
     */
    stopTrackEvent(name: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; }): void;

   /**
    * Log a user action or other occurrence.
    * @param   name    A string to identify this event in the portal.
    * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
    * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
    */
    trackEvent(name: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; }): void;

    /**
     * Log a dependency call
     * @param id    unique id, this is used by the backend to correlate server requests. Use newId() to generate a unique Id.
     * @param method    represents request verb (GET, POST, etc.)
     * @param absoluteUrl   absolute url used to make the dependency request
     * @param pathName  the path part of the absolute url
     * @param totalTime total request time
     * @param success   indicates if the request was successful
     * @param resultCode    response code returned by the dependency request
     */
    trackDependency(id: string, method: string, absoluteUrl: string, pathName: string, totalTime: number, success: boolean, resultCode: number): void;

    /**
     * Log an exception you have caught.
     * @param   exception   An Error from a catch clause, or the string error message.
     * @param   handledAt   Not used
     * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
     * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
     * @param   severityLevel   SeverityLevel - severity level
     */
    trackException(exception: Error, handledAt?: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; }, severityLevel?: SeverityLevel): void;

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
    trackMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: { [name: string]: string; }): void;

   /**
    * Log a diagnostic message.
    * @param   message A message string
    * @param   properties  map[string, string] - additional data used to filter traces in the portal. Defaults to empty.
    * @param   severityLevel   SeverityLevel - severity level
    */
    trackTrace(message: string, properties?: { [name: string]: string; }, severityLevel?: SeverityLevel): void;


    /**
     * Immediately send all queued telemetry.
     * @param {boolean} async - If flush should be call asynchronously
     */
    flush(async?: boolean): void;


   /**
    * Sets the autheticated user id and the account id in this session.
    * User auth id and account id should be of type string. They should not contain commas, semi-colons, equal signs, spaces, or vertical-bars.
    *
    * @param authenticatedUserId {string} - The authenticated user id. A unique and persistent string that represents each authenticated user in the service.
    * @param accountId {string} - An optional string to represent the account associated with the authenticated user.
    */
    setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie?: boolean): void;


    /**
     * Clears the authenticated user id and the account id from the user context.
     */
    clearAuthenticatedUserContext(): void;

    /*
    * Downloads and initializes AppInsights. You can override default script download location by specifying url property of `config`.
    */
    downloadAndSetup?(config: IConfig): void;

    /**
     * The custom error handler for Application Insights
     * @param {string} message - The error message
     * @param {string} url - The url where the error was raised
     * @param {number} lineNumber - The line number where the error was raised
     * @param {number} columnNumber - The column number for the line where the error was raised
     * @param {Error}  error - The Error object
     */
    _onerror(message: string, url: string, lineNumber: number, columnNumber: number, error: Error): void;
}

export interface ITelemetryContext {

   /**
    * Adds a telemetry initializer to the collection. Telemetry initializers will be called one by one,
    * in the order they were added, before the telemetry item is pushed for sending.
    * If one of the telemetry initializers returns false or throws an error then the telemetry item will not be sent.
    */
   addTelemetryInitializer(telemetryInitializer: (envelope: IEnvelope) => boolean | void): void;
}
