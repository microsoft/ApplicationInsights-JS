import { IConfig, PageViewPerformance, SeverityLevel, Util,
    IPageViewTelemetry, ITraceTelemetry, IMetricTelemetry,
    IAutoExceptionTelemetry, IDependencyTelemetry, IExceptionTelemetry,
    IEventTelemetry, IEnvelope, ProcessLegacy, HttpMethod } from "@microsoft/applicationinsights-common";
import { Snippet, Initialization as ApplicationInsights } from "./Initialization";
import { ITelemetryItem, IDiagnosticLogger, IConfiguration } from "@microsoft/applicationinsights-core-js";

// ToDo: fix properties and measurements once updates are done to common
export class AppInsightsDeprecated implements IAppInsightsDeprecated {

    private static getDefaultConfig(config?: any): any {
        if (!config) {
            config = ({} as any);
        }

        // set default values
        config.endpointUrl = config.endpointUrl || "https://dc.services.visualstudio.com/v2/track";
        config.sessionRenewalMs = 30 * 60 * 1000;
        config.sessionExpirationMs = 24 * 60 * 60 * 1000;
        config.maxBatchSizeInBytes = config.maxBatchSizeInBytes > 0 ? config.maxBatchSizeInBytes : 102400; // 100kb
        config.maxBatchInterval = !isNaN(config.maxBatchInterval) ? config.maxBatchInterval : 15000;
        config.enableDebug = Util.stringToBoolOrDefault(config.enableDebug);
        config.disableExceptionTracking = Util.stringToBoolOrDefault(config.disableExceptionTracking);
        config.disableTelemetry = Util.stringToBoolOrDefault(config.disableTelemetry);
        config.verboseLogging = Util.stringToBoolOrDefault(config.verboseLogging);
        config.emitLineDelimitedJson = Util.stringToBoolOrDefault(config.emitLineDelimitedJson);
        config.diagnosticLogInterval = config.diagnosticLogInterval || 10000;
        config.autoTrackPageVisitTime = Util.stringToBoolOrDefault(config.autoTrackPageVisitTime);

        if (isNaN(config.samplingPercentage) || config.samplingPercentage <= 0 || config.samplingPercentage >= 100) {
            config.samplingPercentage = 100;
        }

        config.disableAjaxTracking = Util.stringToBoolOrDefault(config.disableAjaxTracking);
        config.maxAjaxCallsPerView = !isNaN(config.maxAjaxCallsPerView) ? config.maxAjaxCallsPerView : 500;

        config.isBeaconApiDisabled = Util.stringToBoolOrDefault(config.isBeaconApiDisabled, true);
        config.disableCorrelationHeaders = Util.stringToBoolOrDefault(config.disableCorrelationHeaders);
        config.correlationHeaderExcludedDomains = config.correlationHeaderExcludedDomains || [
            "*.blob.core.windows.net",
            "*.blob.core.chinacloudapi.cn",
            "*.blob.core.cloudapi.de",
            "*.blob.core.usgovcloudapi.net"];
        config.disableFlushOnBeforeUnload = Util.stringToBoolOrDefault(config.disableFlushOnBeforeUnload);
        config.enableSessionStorageBuffer = Util.stringToBoolOrDefault(config.enableSessionStorageBuffer, true);
        config.isRetryDisabled = Util.stringToBoolOrDefault(config.isRetryDisabled);
        config.isCookieUseDisabled = Util.stringToBoolOrDefault(config.isCookieUseDisabled);
        config.isStorageUseDisabled = Util.stringToBoolOrDefault(config.isStorageUseDisabled);
        config.isBrowserLinkTrackingEnabled = Util.stringToBoolOrDefault(config.isBrowserLinkTrackingEnabled);
        config.enableCorsCorrelation = Util.stringToBoolOrDefault(config.enableCorsCorrelation);

        return config;
    }
    
    public config: IConfig & IConfiguration;
    public snippet: Snippet;
    public context: ITelemetryContext;
    public logger: IDiagnosticLogger;
    queue: Array<() => void>;
    private appInsightsNew: ApplicationInsights;
    private _hasLegacyInitializers = false;
    private _queue = [];

    constructor(snippet: Snippet, appInsightsNew: ApplicationInsights) {
        this.config = AppInsightsDeprecated.getDefaultConfig(snippet.config);
        this.appInsightsNew = appInsightsNew;
        this.context = { addTelemetryInitializer: this.addTelemetryInitializers.bind(this) }
    }

   /**
    * The array of telemetry initializers to call before sending each telemetry item.
    */

    public addTelemetryInitializers(callBack: (env: IEnvelope) => boolean | void) {

        // Add initializer to current processing only if there is any old telemetry initializer
        if (!this._hasLegacyInitializers) {

            this.appInsightsNew.addTelemetryInitializer(item => {
                this._processLegacyInitializers(item); // setup call back for each legacy processor
            })

            this._hasLegacyInitializers = true;
        }

        this._queue.push(callBack);
    }

    startTrackPage(name?: string) {
        this.appInsightsNew.startTrackPage(name);
    }

    stopTrackPage(name?: string, url?: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; }) {
        this.appInsightsNew.stopTrackPage(name, url, properties); // update
    }

    trackPageView(name?: string, url?: string, properties?: {[key: string]: string }, measurements?: {[key: string]: number }, duration?: number) {
        const telemetry: IPageViewTelemetry = {
            name,
            uri: url,
            properties,
            measurements
        };

        // fix for props, measurements, duration
        this.appInsightsNew.trackPageView(telemetry);
    }

    trackEvent(name: string, properties?: Object, measurements?: Object) {
        this.appInsightsNew.trackEvent({ name} as IEventTelemetry);
    }

    trackDependency(id: string, method: string, absoluteUrl: string, pathName: string, totalTime: number, success: boolean, resultCode: number) {
        this.appInsightsNew.trackDependencyData(
            {
                id,
                target: absoluteUrl,
                type: pathName,
                duration: totalTime,
                properties: { HttpMethod: method },
                success,
                responseCode: resultCode
            } as IDependencyTelemetry);
    }

    trackException(exception: Error, handledAt?: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; }, severityLevel?: any) {
        this.appInsightsNew.trackException({
            exception
        } as IExceptionTelemetry);
    }

    trackMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: { [name: string]: string; }) {
        this.appInsightsNew.trackMetric({name, average, sampleCount, min, max} as IMetricTelemetry);
    }

    trackTrace(message: string, properties?: { [name: string]: string; }, severityLevel?: any) {
        this.appInsightsNew.trackTrace({ message, severityLevel } as ITraceTelemetry);
    }

    flush(async?: boolean) {
        this.appInsightsNew.flush(async);
    }

    setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie?: boolean) {
        this.appInsightsNew.context.user.setAuthenticatedUserContext(authenticatedUserId, accountId, storeInCookie);
    }

    clearAuthenticatedUserContext() {
        this.appInsightsNew.context.user.clearAuthenticatedUserContext();
    }

    _onerror(message: string, url: string, lineNumber: number, columnNumber: number, error: Error) {
        this.appInsightsNew._onerror({ message, url, lineNumber, columnNumber, error } as IAutoExceptionTelemetry);
    }


    startTrackEvent(name: string) {
        this.appInsightsNew.startTrackEvent(name);
    }

    stopTrackEvent(name: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; }) {
        this.appInsightsNew.stopTrackEvent(name, properties, measurements);
    }

    downloadAndSetup?(config: IConfig): void {
        throw new Error("downloadAndSetup not implemented in web SKU");
    }

    public updateSnippetDefinitions(snippet: Snippet) {
        // apply full appInsights to the global instance
        // Note: This must be called before loadAppInsights is called
        for (const field in this) {
            if (typeof field === 'string') {
                snippet[field as string] = this[field];
            }
        }
    }

    // note: these are split into methods to enable unit tests
    public loadAppInsights() {

        // initialize global instance of appInsights
        // var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.config);

        // implement legacy version of trackPageView for 0.10<
        if (this.config["iKey"]) {
            const originalTrackPageView = this.trackPageView;
            this.trackPageView = (pagePath?: string, properties?: Object, measurements?: Object) => {
                originalTrackPageView.apply(this, [null, pagePath, properties, measurements]);
            }
        }

        // implement legacy pageView interface if it is present in the snippet
        const legacyPageView = "logPageView";
        if (typeof this.snippet[legacyPageView] === "function") {
            this[legacyPageView] = (pagePath?: string, properties?: {[key: string]: string }, measurements?: {[key: string]: number }) => {
                this.trackPageView(null, pagePath, properties, measurements);
            }
        }

        // implement legacy event interface if it is present in the snippet
        const legacyEvent = "logEvent";
        if (typeof this.snippet[legacyEvent] === "function") {
            this[legacyEvent] = (name: string, props?: Object, measurements?: Object) => {
                this.trackEvent(name, props, measurements);
            }
        }

        return this;
    }

    private _processLegacyInitializers(item: ITelemetryItem): ITelemetryItem {

        // instead of mapping new to legacy and then back again and repeating in channel, attach callback for channel to call
        item.tags[ProcessLegacy] = this._queue;
        return item;
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
    * Starts timing how long the user views a page or other item. Call this when the page opens.
    * This method doesn't send any telemetry. Call `stopTrackPage` to log the page when it closes.
    * @param   name  A string that idenfities this item, unique within this HTML document. Defaults to the document title.
    */
    startTrackPage(name?: string);

   /**
    * Logs how long a page or other item was visible, after `startTrackPage`. Call this when the page closes.
    * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
    * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
    * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
    * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
    * @deprecated API is deprecated; supported only if input configuration specifies deprecated=true
    */
    stopTrackPage(name?: string, url?: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; });

    /**
     * Logs that a page or other item was viewed.
     * @param   name  The string you used as the name in `startTrackPage`. Defaults to the document title.
     * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
     * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
     * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
     * @param   duration    number - the number of milliseconds it took to load the page. Defaults to undefined. If set to default value, page load time is calculated internally.
     */
    trackPageView(name?: string, url?: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; }, duration?: number);

    /**
     * Start timing an extended event. Call `stopTrackEvent` to log the event when it ends.
     * @param   name    A string that identifies this event uniquely within the document.
     */
    startTrackEvent(name: string);


    /**
     * Log an extended event that you started timing with `startTrackEvent`.
     * @param   name    The string you used to identify this event in `startTrackEvent`.
     * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
     * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
     */
    stopTrackEvent(name: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; });

   /**
    * Log a user action or other occurrence.
    * @param   name    A string to identify this event in the portal.
    * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
    * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
    */
    trackEvent(name: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; });

    /**
     * Log a dependency call
     * @param id    unique id, this is used by the backend o correlate server requests. Use Util.newId() to generate a unique Id.
     * @param method    represents request verb (GET, POST, etc.)
     * @param absoluteUrl   absolute url used to make the dependency request
     * @param pathName  the path part of the absolute url
     * @param totalTime total request time
     * @param success   indicates if the request was sessessful
     * @param resultCode    response code returned by the dependency request
     */
    trackDependency(id: string, method: string, absoluteUrl: string, pathName: string, totalTime: number, success: boolean, resultCode: number);

    /**
     * Log an exception you have caught.
     * @param   exception   An Error from a catch clause, or the string error message.
     * @param   handledAt   Not used
     * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
     * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
     * @param   severityLevel   SeverityLevel - severity level
     */
    trackException(exception: Error, handledAt?: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; }, severityLevel?: SeverityLevel);

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
    trackMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: { [name: string]: string; });

   /**
    * Log a diagnostic message.
    * @param   message A message string
    * @param   properties  map[string, string] - additional data used to filter traces in the portal. Defaults to empty.
    * @param   severityLevel   SeverityLevel - severity level
    */
    trackTrace(message: string, properties?: { [name: string]: string; }, severityLevel?: SeverityLevel);


    /**
     * Immediately send all queued telemetry.
     * @param {boolean} async - If flush should be call asynchronously
     */
    flush(async?: boolean);


   /**
    * Sets the autheticated user id and the account id in this session.
    * User auth id and account id should be of type string. They should not contain commas, semi-colons, equal signs, spaces, or vertical-bars.
    *
    * @param authenticatedUserId {string} - The authenticated user id. A unique and persistent string that represents each authenticated user in the service.
    * @param accountId {string} - An optional string to represent the account associated with the authenticated user.
    */
    setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie?: boolean);


    /**
     * Clears the authenticated user id and the account id from the user context.
     */
    clearAuthenticatedUserContext();

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
    _onerror(message: string, url: string, lineNumber: number, columnNumber: number, error: Error);
}

export interface ITelemetryContext {

   /**
    * Adds a telemetry initializer to the collection. Telemetry initializers will be called one by one,
    * in the order they were added, before the telemetry item is pushed for sending.
    * If one of the telemetry initializers returns false or throws an error then the telemetry item will not be sent.
    */
   addTelemetryInitializer(telemetryInitializer: (envelope: IEnvelope) => boolean | void);
}
