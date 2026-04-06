// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IConfiguration } from "@microsoft/applicationinsights-web";

/**
 * Configuration options for the `getSdkLoaderScript()` helper function, which generates
 * a ready-to-use SDK Loader (snippet) script string for embedding in an HTML page.
 *
 * This is a simplified configuration interface intended for server-side rendering scenarios
 * where you want to programmatically generate the snippet. For the full set of snippet
 * configuration options used by the snippet itself, see {@link ISnippetConfig}.
 *
 * **Important:** You MUST provide either `connectionString` or `instrumentationKey`. Failure
 * to provide at least one of these will result in the SDK not loading, failing to initialize,
 * or reporting an error.
 *
 * @example
 * ```typescript
 * import { getSdkLoaderScript } from "@microsoft/applicationinsights-web-snippet";
 *
 * const script = getSdkLoaderScript({
 *     connectionString: "YOUR_CONNECTION_STRING",
 *     sri: true
 * });
 * // Insert `script` into your HTML page's <head> section
 * ```
 */
export interface SdkLoaderConfig {
    /**
     * The Application Insights instrumentation key. Either this or `connectionString` MUST be
     * provided — prefer using `connectionString` instead.
     */
    instrumentationKey?: string;

    /**
     * The Application Insights connection string. Either this or `instrumentationKey` MUST be
     * provided. This is the recommended approach as it configures both the endpoint and
     * instrumentation key in a single value.
     */
    connectionString?: string;

    /**
     * (Optional) The full URL for where to load the SDK from.
     * Defaults to `"https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js"` when not supplied.
     *
     * **Note:** When Internet Explorer is detected by the SDK Loader, the URL is automatically
     * rewritten to load the v2.x SDK (e.g. `ai.3.gbl.min.js` becomes `ai.2.gbl.min.js`).
     */
    src?: string;

    /**
     * (Optional) The global name for the initialized SDK instance. Defaults to `"appInsights"`.
     */
    name?: string;

    /**
     * (Optional) Defines the load delay (in ms) before attempting to load the SDK.
     * Default is 0ms. A negative value immediately adds the script tag to the `<head>`,
     * to attempt to block the page load event (not all browsers honour this) until the script is loaded or fails.
     */
    ld?: number;

    /**
     * (Optional) Use XHR instead of fetch to report SDK load failures. Only needed in
     * environments where fetch would fail to send the failure events.
     */
    useXhr?: boolean;

    /**
     * (Optional) The `crossOrigin` attribute value for the script tag added to download the SDK.
     * Recommended values: `""`, `"anonymous"`. When not defined, no crossOrigin attribute is added.
     */
    crossOrigin?: string;

    /**
     * (Optional) The [IConfiguration](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IConfiguration.html)
     * configuration object passed to the Application Insights SDK during initialization.
     */
    cfg?: any;

    /**
     * (Optional) Controls CDN fallback retry behavior. By default (`true`), if the SDK fails
     * to load from the configured `src` URL, the snippet automatically attempts to load from
     * multiple supported CDN domains in case one or more of them is temporarily unavailable.
     * Set to `false` to disable this fallback and only attempt the single configured `src` URL.
     */
    cr?: boolean;

    /**
     * (Optional) Disable Load Error reporting, when set to `true`, prevents the SDK from reporting load failure telemetry.
     */
    dle?: boolean;

    /**
     * (Optional) Sub-resource Integrity (SRI) checking. When set to `true`, enables Sub-Resource Integrity (SRI) checking.
     * The snippet will fetch an integrity file and validate the SDK script hash before execution.
     */
    sri?: boolean;

    /**
     * (Optional) Trusted Type policy support. When set to `true`, enables Trusted Type policy validation on the snippet.
     */
    pl?: boolean;

    /**
     * (Optional) The name of the Trusted Type policy to use. Defaults to `"aiPolicy"`.
     */
    pn?: string;

    /**
     * (Optional) A pre-created `TrustedTypePolicy` instance to apply to the snippet `src` URL.
     */
    ttp?: TrustedTypePolicy;
}

export abstract class TrustedTypePolicy {
    readonly name: string;
    createHTML?: ((input: string, ...args: any[]) => string) | undefined;
    createScript?: ((input: string, ...args: any[]) => string) | undefined;
    createScriptURL?: ((input: string, ...args: any[]) => string) | undefined;
}

/**
 * Configuration options for the Application Insights SDK Loader (snippet) that is embedded
 * directly in an HTML page. These options control how the SDK script is loaded from the CDN,
 * error reporting behavior, security policies, and the SDK initialization configuration.
 *
 * This interface represents the configuration object passed to the self-executing snippet function.
 * For a simplified interface used with the `getSdkLoaderScript()` helper, see {@link SdkLoaderConfig}.
 *
 * **Internet Explorer Fallback:** When the SDK Loader detects Internet Explorer (via the `msie` or
 * `trident/` user agent strings), it automatically rewrites the `src` URL to load the v2.x SDK
 * instead of v3.x (e.g. `ai.3.gbl.min.js` becomes `ai.2.gbl.min.js`). This means v3.x-only
 * APIs — including the new OpenTelemetry-based APIs — will not be available for those users.
 *
 * @example
 * ```html
 * <script type="text/javascript">
 * !function(T,l,y){/* snippet code *\/}(window, document, {
 *   src: "https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js",
 *   crossOrigin: "anonymous",
 *   onInit: function (sdk) {
 *     sdk.addTelemetryInitializer(function (envelope) {
 *       envelope.data.someField = 'This item passed through my telemetry initializer';
 *     });
 *   },
 *   cfg: {
 *     connectionString: "YOUR_CONNECTION_STRING"
 *   }
 * });
 * </script>
 * ```
 */
export interface ISnippetConfig {
    /**
     * **[required]** The full URL for where to load the SDK from. This value is used for the `src`
     * attribute of a dynamically added `<script>` tag. You can use the public CDN location or your
     * own privately hosted one.
     *
     * **Note:** When Internet Explorer is detected, the SDK Loader automatically rewrites this URL
     * to load the v2.x SDK (e.g. `ai.3.gbl.min.js` becomes `ai.2.gbl.min.js`).
     *
     * @example
     * ```
     * src: "https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js"
     * ```
     */
    src: string;

    /**
     * (Optional) The global name for the initialized SDK instance. Defaults to `"appInsights"`.
     * So `window.appInsights` will be a reference to the initialized instance. If you provide a
     * name value or a previous instance appears to be assigned (via the global name `appInsightsSDK`),
     * this name will also be defined in the global namespace as `window.appInsightsSDK=<name value>`.
     */
    name?: string;

    /**
     * (Optional) Defines the load delay (in ms) before attempting to load the SDK.
     * Default is 0ms. A negative value immediately adds the script tag to the `<head>` region,
     * blocking the page load event until the script is loaded or fails.
     */
    ld?: number;

    /**
     * (Optional) Use XHR instead of fetch to report SDK load failures. Only needed in
     * environments where fetch would fail to send the failure events.
     */
    useXhr?: boolean;

    /**
     * (Optional) The `crossOrigin` attribute value for the script tag added to download the SDK.
     * Recommended values: not defined (the default), `""`, or `"anonymous"`.
     * See [HTML attribute: crossorigin](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin).
     */
    crossOrigin?: string;

    /**
     * (Optional) Callback function called after the main SDK script has been successfully loaded
     * and initialized from the CDN. It receives a reference to the SDK instance and is called
     * _before_ the first initial page view. If the SDK has already been loaded and initialized,
     * this callback will still be called.
     *
     * **Note:** As this callback is called during the processing of the `sdk.queue` array, you
     * CANNOT add additional items to the queue — they will be ignored and dropped.
     *
     * @example
     * ```
     * onInit: function (sdk) {
     *   sdk.addTelemetryInitializer(function (envelope) {
     *     envelope.data.someField = 'custom value';
     *   });
     * }
     * ```
     */
    onInit?: any;

    /**
     * **[required]** The [IConfiguration](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IConfiguration.html)
     * configuration object passed to the Application Insights SDK during initialization.
     *
     * @example
     * ```
     * cfg: {
     *   connectionString: "YOUR_CONNECTION_STRING",
     *   enableAutoRouteTracking: true
     * }
     * ```
     */
    cfg: IConfiguration;

    /**
     * (Optional) Controls CDN fallback retry behavior. By default (`true`), if the SDK fails
     * to load from the configured `src` URL, the snippet automatically attempts to load from
     * multiple supported CDN domains in case one or more of them is temporarily unavailable.
     * Set to `false` to disable this fallback and only attempt the single configured `src` URL.
     */
    cr?: boolean;

    /**
     * (Optional) When set to `true`, prevents the SDK from reporting load failure telemetry.
     */
    dle?: boolean;

    /**
     * (Optional) When set to `true`, enables Sub-Resource Integrity (SRI) checking. The snippet
     * will fetch an integrity file and validate the SDK script hash before execution. When this
     * option is used, the integrity file is loaded first, affecting the load order and script
     * execution. The `ld` option will be ignored. Additionally, if the page navigates away before
     * the integrity file is loaded, some events may be lost.
     */
    sri?: boolean;

    /**
     * (Optional) When set to `true`, enables Trusted Type policy validation on the snippet.
     */
    pl?: boolean;

    /**
     * (Optional) The name of the Trusted Type policy to use. Defaults to `"aiPolicy"`.
     */
    pn?: string;

    /**
     * (Optional) A pre-created `TrustedTypePolicy` instance to apply to the snippet `src` URL.
     */
    ttp?: TrustedTypePolicy;

    /**
     * (Optional) The nonce attribute value that will be applied to the script tag when it is
     * added to the page, for use with Content Security Policy (CSP).
     */
    nt?: string;
}

export interface Fields {
    strIngestionendpoint?: any;
    endpointsuffix?: any;
    location?: any;

    // Add other properties as needed
}
