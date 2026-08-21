// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IXHROverride, TransportType } from "@microsoft/applicationinsights-core-js";

/**
 * How a `PageviewData` telemetry item should be represented in OTLP.
 */
export type OtlpPageViewMode = "span" | "log";

/**
 * How values that the Common Schema marks as PII or customer content should be handled. OTLP has no
 * equivalent of the Common Schema `ext.metadata` markers so the value must either be removed,
 * emitted with a marker attribute, or replaced.
 */
export type OtlpPiiMode = "drop" | "keep" | "hash";

/**
 * Configuration for the OTLP channel, supplied via the `extensionConfig` using the `OtlpChannel`
 * identifier.
 *
 * @example
 * ```typescript
 * const appInsights = new ApplicationInsights({
 *     config: {
 *         instrumentationKey: "YOUR_KEY",
 *         extensionConfig: {
 *             ["OtlpChannel"]: {
 *                 endpointUrl: "https://collector.example.com"
 *             }
 *         }
 *     }
 * });
 * ```
 */
export interface IOtlpChannelConfig {
    /**
     * The base OTLP/HTTP endpoint. The signal specific path (`/v1/traces` or `/v1/logs`) is appended
     * to this value, so `https://collector.example.com` results in
     * `https://collector.example.com/v1/traces`.
     */
    endpointUrl?: string;

    /**
     * The complete url used to export spans. When supplied this takes precedence over
     * {@link IOtlpChannelConfig.endpointUrl} and no path is appended.
     */
    tracesEndpointUrl?: string;

    /**
     * The complete url used to export log records. When supplied this takes precedence over
     * {@link IOtlpChannelConfig.endpointUrl} and no path is appended.
     */
    logsEndpointUrl?: string;

    /**
     * Additional headers to include on every export request, typically used to supply authentication.
     * @remarks
     * Custom headers require the collector to support the resulting CORS preflight and are not
     * supported when the payload is sent using `navigator.sendBeacon`.
     */
    headers?: { [key: string]: string };

    /**
     * Additional resource attributes, these are merged over the values derived from the telemetry
     * context so they may be used to override the derived `service.name` and friends.
     */
    resourceAttributes?: { [key: string]: string | number | boolean };

    /**
     * The instrumentation scope name reported for all exported records.
     * Defaults to `@microsoft/applicationinsights-web`.
     */
    scopeName?: string;

    /**
     * The instrumentation scope version reported for all exported records.
     * Defaults to the version of this package.
     */
    scopeVersion?: string;

    /**
     * Convert and serialize each record as it is received rather than when the batch is sent.
     * @remarks
     * This is the default (and recommended) mode, it moves all of the conversion cost onto the
     * (already asynchronous) `processTelemetry` path so that sending a batch -- including during page
     * unload -- performs no conversion work at all. Set to `false` to retain the converted objects
     * and serialize the whole payload at send time.
     * Defaults to `true`.
     */
    preSerialize?: boolean;

    /**
     * Whether a page view is exported as a span or a log record.
     * Defaults to `span`.
     */
    pageViewAs?: OtlpPageViewMode;

    /**
     * Export `MetricData` items as log records. The OTLP metrics signal is not yet supported, so when
     * this is `false` metric items are ignored.
     * Defaults to `false`.
     */
    metricsAsLogs?: boolean;

    /**
     * The percentage of telemetry to retain. Sampling is deterministic when a user or operation id is
     * available. MetricData is never sampled out, matching the classic Sender.
     * Defaults to `100`.
     */
    samplingPercentage?: number;

    /**
     * How values marked as PII or customer content should be handled.
     * Defaults to `drop`.
     */
    piiMode?: OtlpPiiMode;

    /**
     * The maximum number of bytes of serialized records that will be sent in a single request. When
     * the buffered payload reaches this size a send is triggered.
     * Defaults to `65536`.
     */
    maxBatchSizeInBytes?: number;

    /**
     * The maximum number of records that will be sent in a single request. When the buffer reaches
     * this many records a send is triggered.
     * Defaults to `512`.
     */
    maxRecordsPerBatch?: number;

    /**
     * The maximum number of milliseconds to buffer records before sending them.
     * Defaults to `15000`.
     */
    maxBatchInterval?: number;

    /**
     * The maximum number of records to hold in memory. Once reached the oldest records are dropped
     * and an `eventsDiscarded` notification is raised.
     * Defaults to `10000`.
     */
    eventsLimitInMem?: number;

    /**
     * The ordered transports to use when sending asynchronously.
     */
    transports?: TransportType | TransportType[];

    /**
     * The ordered transports to use when sending during page unload.
     */
    unloadTransports?: TransportType | TransportType[];

    /**
     * A user supplied transport used in preference to the built in transports.
     */
    httpXHROverride?: IXHROverride;

    /**
     * The `credentials` value used for `fetch` based requests.
     */
    fetchCredentials?: RequestCredentials;

    /**
     * Disable the use of synchronous `XMLHttpRequest` during unload.
     */
    disableXhrSync?: boolean;

    /**
     * Disable the use of `fetch` with `keepalive` during unload.
     */
    disableFetchKeepAlive?: boolean;

    /**
     * The timeout (in milliseconds) applied to `XMLHttpRequest` based requests.
     */
    xhrTimeout?: number;

    /**
     * The maximum number of times a failed batch is retried before it is discarded.
     * Defaults to `6`.
     */
    maxRetryAttempts?: number;

    /**
     * Disable retrying failed export requests.
     * Defaults to `false`.
     */
    isRetryDisabled?: boolean;

    /**
     * The HTTP status codes that should be retried. When omitted the channel uses its standard
     * retryable status set.
     */
    retryCodes?: number[];

    /**
     * Compress asynchronous request bodies with gzip when CompressionStream is available.
     * The root SDK `zipPayload` feature flag also enables this behavior.
     * Defaults to `false`.
     */
    enablePayloadCompression?: boolean;

    /**
     * The maximum number of times a failed batch is retried while the page is unloading.
     * Values are limited to `0` through `10` so a synchronous unload transport cannot recurse
     * without bound.
     * Defaults to `2`.
     */
    maxUnloadRetryAttempts?: number;

    /**
     * Stop the channel from converting and sending any telemetry, items are still passed along the
     * plugin chain.
     * Defaults to `false`.
     */
    disableTelemetry?: boolean;

    /**
     * Stop passing telemetry items to the next plugin in the chain once this channel has converted
     * them. Only enable this when the OTLP channel is the only consumer of the telemetry.
     * Defaults to `false`.
     */
    consumeEvents?: boolean;

    /**
     * Include the instrumentation key as the `microsoft.instrumentation_key` resource attribute.
     * Defaults to `false`.
     */
    includeIKeyInResource?: boolean;
}
