// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IPromise } from "@nevware21/ts-async";
import { IAppInsightsCore } from "./IAppInsightsCore";
import { IChannelControls } from "./IChannelControls";
import { ICookieMgrConfig } from "./ICookieMgr";
import { IExceptionConfig } from "./IExceptionConfig";
import { IFeatureOptIn } from "./IFeatureOptIn";
import { INotificationManager } from "./INotificationManager";
import { IPerfManager } from "./IPerfManager";
import { ITelemetryPlugin } from "./ITelemetryPlugin";

//import { IStatsBeatConfig } from "./IStatsBeat";
"use strict";

/**
 * Configuration provided to SDK core
 */
export interface IConfiguration {
    /**
     * Instrumentation key of resource. Either this or connectionString must be specified.
     */
    instrumentationKey?: string| IPromise<string>;

    /**
     * Connection string of resource. Either this or instrumentationKey must be specified.
     */
    connectionString?: string | IPromise<string> ;

    /**
     * Set the timer interval (in ms) for internal logging queue, this is the
     * amount of time to wait after logger.queue messages are detected to be sent.
     * Note: since 3.0.1 and 2.8.13 the diagnostic logger timer is a normal timeout timer
     * and not an interval timer. So this now represents the timer "delay" and not
     * the frequency at which the events are sent.
     */
    diagnosticLogInterval?: number;

    /**
     * Maximum number of iKey transmitted logging telemetry per page view
     */
    maxMessageLimit?: number;

    /**
     * Console logging level. All logs with a severity level higher
     * than the configured level will be printed to console. Otherwise
     * they are suppressed. ie Level 2 will print both CRITICAL and
     * WARNING logs to console, level 1 prints only CRITICAL.
     *
     * Note: Logs sent as telemetry to instrumentation key will also
     * be logged to console if their severity meets the configured loggingConsoleLevel
     *
     * 0: ALL console logging off
     * 1: logs to console: severity \>= CRITICAL
     * 2: logs to console: severity \>= WARNING
     */
    loggingLevelConsole?: number;

    /**
     * Telemtry logging level to instrumentation key. All logs with a severity
     * level higher than the configured level will sent as telemetry data to
     * the configured instrumentation key.
     *
     * 0: ALL iKey logging off
     * 1: logs to iKey: severity \>= CRITICAL
     * 2: logs to iKey: severity \>= WARNING
     */
    loggingLevelTelemetry?: number

    /**
     * If enabled, uncaught exceptions will be thrown to help with debugging
     */
    enableDebug?: boolean;

    /**
     * Endpoint where telemetry data is sent
     */
    endpointUrl?: string | IPromise<string>;

    /**
     * Extension configs loaded in SDK
     */
    extensionConfig?: { [key: string]: any }; // extension configs;

    /**
     * Additional plugins that should be loaded by core at runtime
     */
    readonly extensions?: ITelemetryPlugin[];

    /**
     * Channel queues that is setup by caller in desired order.
     * If channels are provided here, core will ignore any channels that are already setup, example if there is a SKU with an initialized channel
     */
    readonly channels?: IChannelControls[][];

    /**
     * Flag that disables the Instrumentation Key validation.
     */
    disableInstrumentationKeyValidation?: boolean;
    
    /**
     * [Optional] When enabled this will create local perfEvents based on sections of the code that have been instrumented
     * to emit perfEvents (via the doPerf()) when this is enabled. This can be used to identify performance issues within
     * the SDK, the way you are using it or optionally your own instrumented code.
     * The provided IPerfManager implementation does NOT send any additional telemetry events to the server it will only fire
     * the new perfEvent() on the INotificationManager which you can listen to.
     * This also does not use the window.performance API, so it will work in environments where this API is not supported.
     */
    enablePerfMgr?: boolean;

    /**
     * [Optional] Callback function that will be called to create a the IPerfManager instance when required and `enablePerfMgr`
     * is enabled, this enables you to override the default creation of a PerfManager() without needing to `setPerfMgr()`
     * after initialization.
     */
    createPerfMgr?: (core: IAppInsightsCore, notificationManager: INotificationManager) => IPerfManager;

    /**
     * [Optional] Fire every single performance event not just the top level root performance event. Defaults to false.
     */
    perfEvtsSendAll?: boolean;

    /**
     * [Optional] Identifies the default length used to generate random session and user id's if non currently exists for the user / session.
     * Defaults to 22, previous default value was 5, if you need to keep the previous maximum length you should set this value to 5.
     */
    idLength?: number;

    /**
     * @description Custom cookie domain. This is helpful if you want to share Application Insights cookies across subdomains. It
     * can be set here or as part of the cookieCfg.domain, the cookieCfg takes precedence if both are specified.
     * @defaultValue ""
     */
    cookieDomain?: string;

    /**
     * @description Custom cookie path. This is helpful if you want to share Application Insights cookies behind an application
     * gateway. It can be set here or as part of the cookieCfg.domain, the cookieCfg takes precedence if both are specified.
     * @defaultValue ""
     */
    cookiePath?: string;

    /**
     * [Optional] A boolean that indicated whether to disable the use of cookies by the SDK. If true, the SDK will not store or
     * read any data from cookies. Cookie usage can be re-enabled after initialization via the core.getCookieMgr().enable().
     */
    disableCookiesUsage?: boolean;

    /**
     * [Optional] A Cookie Manager configuration which includes hooks to allow interception of the get, set and delete cookie
     * operations. If this configuration is specified any specified enabled and domain properties will take precedence over the
     * cookieDomain and disableCookiesUsage values.
     */
    cookieCfg?: ICookieMgrConfig;

    /**
     * [Optional] An array of the page unload events that you would like to be ignored, special note there must be at least one valid unload
     * event hooked, if you list all or the runtime environment only supports a listed "disabled" event it will still be hooked, if required by the SDK.
     * Unload events include "beforeunload", "unload", "visibilitychange" (with 'hidden' state) and "pagehide".
     * 
     * This can be used to avoid jQuery 3.7.1+ deprecation warnings and Chrome warnings about the unload event:
     * @example
     * ```javascript
     * {
     *   disablePageUnloadEvents: ["unload"]
     * }
     * ```
     * 
     * For more details, see the [Page Unload Events documentation](https://microsoft.github.io/ApplicationInsights-JS/PageUnloadEvents.html).
     */
    disablePageUnloadEvents?: string[];

    /**
     * [Optional] An array of page show events that you would like to be ignored, special note there must be at lease one valid show event
     * hooked, if you list all or the runtime environment only supports a listed (disabled) event it will STILL be hooked, if required by the SDK.
     * Page Show events include "pageshow" and "visibilitychange" (with 'visible' state).
     * 
     * @example
     * ```javascript
     * {
     *   disablePageShowEvents: ["pageshow"]
     * }
     * ```
     * 
     * For more details, see the [Page Unload Events documentation](https://microsoft.github.io/ApplicationInsights-JS/PageUnloadEvents.html).
     */
    disablePageShowEvents?: string[];

    /**
     * [Optional] A flag for performance optimization to disable attempting to use the Chrome Debug Extension, if disabled and the extension is installed
     * this will not send any notifications.
     */
    disableDbgExt?: boolean;

    /**
     * Add "&w=0" parameter to support UA Parsing when web-workers don't have access to Document.
     * Default is false
     */
    enableWParam?: boolean;

     /**
     * Custom optional value that will be added as a prefix for storage name.
     * @defaultValue undefined
     */
    storagePrefix?:string;

    /**
     * Custom optional value to opt in features
     * @defaultValue undefined
     */
    featureOptIn?: IFeatureOptIn;

    /**
     * If your connection string, instrumentation key and endpoint url are promises,
     * this config is to manually set timeout for those promises.
     * Default: 50000ms
     * @since 3.3.0
     */
    initTimeOut?: number;

    /**
     * If your connection string, instrumentation key and endpoint url are promises,
     * this config is to manually set in memory proxy track calls count limit before promises finished.
     * Default: 100
     * @since 3.3.0
     */
    initInMemoMaxSize?: number;

    /**
     * [Optional] Set additional configuration for exceptions, such as more scripts to include in the exception telemetry.
     * @since 3.3.2
     */
    expCfg?: IExceptionConfig;

        /**
     * [Optional] A flag to enable or disable the use of the field redaction for urls.
     * @defaultValue true
     */
    redactionEnabled?: boolean;

    ///**
    // * [Optional] Internal SDK configuration for developers
    // * @internal
    // */
    //_sdk?: IInternalSdkConfiguration;
}

///**
// * Internal SDK configuration options
// * @internal
// */
//export interface IInternalSdkConfiguration {
//    /**
//     * [Optional] Enable Internal StatsBeat
//     * @internal
//     */
//    stats?: IStatsBeatConfig;
//}
