# Microsoft Application Insights JavaScript SDK - OTLP/JSON Channel

An Application Insights channel that converts telemetry into [OTLP/JSON](https://github.com/open-telemetry/opentelemetry-proto/blob/main/docs/specification.md)
and exports it to an OpenTelemetry Protocol (OTLP) HTTP endpoint.

The channel sits at the end of the plugin chain and receives every telemetry item the SDK produces
(`trackEvent`, `trackTrace`, `trackException`, `trackPageView`, `trackDependencyData`, and any spans
created through `startSpan`), converts it in memory, and POSTs it to `/v1/traces` and `/v1/logs`.

No `@opentelemetry/*` package is required.

## Getting Started

### Install

```bash
npm install --save @microsoft/applicationinsights-otlpchannel-js
```

### Basic usage

A channel must be supplied through the `channels` configuration, not `extensions`.

```js
import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { OtlpChannel } from "@microsoft/applicationinsights-otlpchannel-js";

const otlpChannel = new OtlpChannel();

const appInsights = new ApplicationInsights({
    config: {
        instrumentationKey: "YOUR_INSTRUMENTATION_KEY",
        channels: [[ otlpChannel ]],
        extensionConfig: {
            [otlpChannel.identifier]: {
                endpointUrl: "https://your-collector.example.com"
            }
        }
    }
});

appInsights.loadAppInsights();
```

### Exporting to both Application Insights and an OTLP collector

Use the tee channel to send the same telemetry to more than one channel queue.

```js
import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { TeeChannel } from "@microsoft/applicationinsights-teechannel-js";
import { OtlpChannel } from "@microsoft/applicationinsights-otlpchannel-js";

const teeChannel = new TeeChannel();
const otlpChannel = new OtlpChannel();

const appInsights = new ApplicationInsights({
    config: {
        instrumentationKey: "YOUR_INSTRUMENTATION_KEY",
        channels: [[ teeChannel ], [ otlpChannel ]],
        extensionConfig: {
            [otlpChannel.identifier]: {
                endpointUrl: "https://your-collector.example.com"
            }
        }
    }
});
```

## How it works

The channel converts each telemetry item into its **final OTLP representation as the item is
received**, not when a batch is sent. Converted records are serialized immediately and appended to
buffers that are already grouped by resource and signal, with the payload size tracked
incrementally. The original telemetry items are retained alongside the serialized fragments until
the batch completes so notification listeners and SDK stats receive item-accurate callbacks.

Sending a batch is therefore only a string join and an HTTP POST -- no mapping, no attribute
building and no serialization. This matters most during page unload, where the browser gives the
page very little time to finish its work.

Set `preSerialize: false` to keep the converted objects and serialize the whole payload at send
time instead. The item to OTLP conversion still happens at ingress in that mode.

## Signal mapping

| Application Insights `baseType` | OTLP |
| --- | --- |
| `RequestData` | Span, `kind = SERVER` |
| `RemoteDependencyData` | Span, `kind = CLIENT` (or `INTERNAL` for an `InProc` dependency) |
| `PageviewData` | Span, `kind = INTERNAL` (configurable, see `pageViewAs`) |
| `MessageData` | LogRecord |
| `ExceptionData` | LogRecord with the `exception.*` attributes |
| `EventData` | LogRecord with `eventName` |
| `PageviewPerformanceData` | LogRecord |
| `MetricData` | Ignored unless `metricsAsLogs` is enabled (the OTLP metrics signal is not supported yet) |

Context tags such as `ai.cloud.role`, `ai.cloud.roleInstance` and `ai.application.ver` are promoted
onto the OTLP `Resource` as `service.name`, `service.instance.id` and `service.version`, so they are
not repeated on every record. Everything else -- custom properties, measurements, Part C, the Part A
extensions and the remaining tags -- becomes record attributes. Values that have no OpenTelemetry
semantic convention equivalent are emitted under the `microsoft.` namespace.

## Configuration

All values below are supplied under the `OtlpChannel` key of `extensionConfig` and may be changed at
runtime.

| Name | Default | Description |
| --- | --- | --- |
| `endpointUrl` | | The base OTLP/HTTP endpoint. `/v1/traces` and `/v1/logs` are appended. |
| `tracesEndpointUrl` | | The complete url used to export spans, overrides `endpointUrl`. |
| `logsEndpointUrl` | | The complete url used to export log records, overrides `endpointUrl`. |
| `headers` | | Additional headers added to every request, typically for authentication. |
| `resourceAttributes` | | Additional resource attributes, these override the derived values. |
| `scopeName` | `@microsoft/applicationinsights-web` | The reported instrumentation scope name. |
| `scopeVersion` | package version | The reported instrumentation scope version. |
| `preSerialize` | `true` | Serialize each record as it is received rather than when it is sent. |
| `pageViewAs` | `"span"` | Whether a page view is exported as a `span` or a `log`. |
| `metricsAsLogs` | `true` | Export `MetricData` as log records instead of ignoring it. |
| `samplingPercentage` | `100` | Percentage of telemetry to retain; MetricData is never sampled out. |
| `piiMode` | `"drop"` | How Common Schema PII / customer content values are handled: `drop`, `keep` or `hash`. |
| `maxBatchSizeInBytes` | `65536` | Send once this many bytes have been buffered. |
| `maxRecordsPerBatch` | `512` | Send once this many records have been buffered. |
| `maxBatchInterval` | `15000` | The maximum time (ms) to buffer records before sending. |
| `eventsLimitInMem` | `10000` | The maximum records held in memory, then the oldest are dropped. |
| `enableSessionStorageBuffer` | `true` | Persist unsent and unacknowledged records across page reloads. |
| `namePrefix` | | Prefix used for this channel's session-storage keys. |
| `bufferOverride` | `false` | Custom storage implementation used instead of session storage. |
| `transports` | | The ordered transports to use when sending asynchronously. |
| `unloadTransports` | | The ordered transports to use during page unload. |
| `httpXHROverride` | | A user supplied transport used in preference to the built in transports. |
| `fetchCredentials` | | The `credentials` value used for `fetch` based requests. |
| `disableXhrSync` | `false` | Disable synchronous `XMLHttpRequest` during unload. |
| `disableFetchKeepAlive` | `false` | Disable `fetch` with `keepalive` during unload. |
| `disableSendBeaconSplit` | `true` | Disable single-record unload splitting for keepalive-sized payloads. |
| `xhrTimeout` | | The timeout (ms) applied to `XMLHttpRequest` based requests. |
| `maxRetryAttempts` | `6` | The maximum retries before a failed batch is discarded. |
| `isRetryDisabled` | `false` | Disable retrying failed export requests. |
| `retryCodes` | | Override the HTTP status codes that trigger a retry. |
| `enablePayloadCompression` | `false` | Gzip asynchronous payloads when `CompressionStream` is available. |
| `maxUnloadRetryAttempts` | `2` | The maximum retries while the page is unloading (maximum `10`). |
| `disableTelemetry` | `false` | Stop exporting, items still flow down the plugin chain. |
| `consumeEvents` | `false` | Stop passing items to the next plugin once converted. |
| `includeIKeyInResource` | `false` | Include the instrumentation key as a resource attribute. |

## Channel ordering

The channel calls `processNext`, sorts last by priority, and is discoverable by identifier, so it can
be placed behind other channels in the same channel queue:

| Channel | Priority |
| --- | --- |
| `TeeChannel` | 999 |
| `OfflineChannel` | 1000 |
| `Sender` (Application Insights) | 1001 |
| `PostChannel` (1DS) | 1011 |
| **`OtlpChannel`** | **1021** |

Set `consumeEvents: true` if this channel is genuinely last and nothing after it should see the item.

The channel includes its own Sender-equivalent session-storage buffer and online/offline listener.
It intentionally does not advertise the generic `OfflineChannel` adapter: that adapter supports one
endpoint per stored payload, while OTLP requires separate trace and log envelopes and endpoints.

## Privacy

The Common Schema marks individual fields as PII or customer content, and OTLP has no equivalent
marker. By default (`piiMode: "drop"`) any value carrying such a marker is **omitted** from the
exported payload. Set `piiMode` to `"hash"` to export a stable non reversible hash instead, or to
`"keep"` to export the value along with a `microsoft.pii.<key>` marker attribute so that a
downstream collector can scrub it.

The channel does not use `navigator.sendBeacon` because it cannot reliably preserve OTLP's
`application/json` content type or authentication headers. A collector must allow the CORS preflight
that OTLP/JSON with custom headers requires.

## Retries and partial success

Requests that fail with `401`, `403`, `408`, `429`, `500`, `502`, `503`, `504`, or that do not
complete at all, are retried with an exponential backoff (honouring any `Retry-After` header) up to
`maxRetryAttempts`. Use `retryCodes` to replace the HTTP status list or `isRetryDisabled` to disable
retries.

A `200` response whose body reports `partialSuccess` means the collector permanently rejected some
records; those are **not** retried. The rejection is logged and reported through the
`eventsDiscarded` notification.

The channel emits the same send lifecycle notifications used by the classic Sender:
`eventsSendRequest`, `eventsSent`, `eventsRetry`, and `eventsDiscarded`. `isCompletelyIdle()` reports
whether the channel has buffered, in-flight, or pending retry work.

## Persistent storage and offline recovery

Session-storage persistence is enabled by default. Serialized OTLP records remain in an unsent
buffer until dispatch, then move to an unacknowledged sent buffer until the collector responds.
Both buffers are recovered after a page reload, including requests interrupted while in flight.

When the browser is known to be offline, records remain persisted and are sent after the online
event. An offline unload does not consume the retry budget or discard recoverable records.

Fetch keepalive reports success when the browser queues an unload request, not when the collector
acknowledges it. The channel therefore retains unload records for at-least-once replay after reload;
duplicate delivery is preferred over silent telemetry loss.

Use `namePrefix` to isolate storage keys between SDK instances, or `bufferOverride` to provide the
same custom storage contract supported by the classic Sender.

## Limitations

- The OTLP metrics signal (`/v1/metrics`) is not implemented.
- Span events and links are not populated.
- Telemetry created from a span has already been flattened into the Application Insights shape by
  the time the channel sees it, so the conversion back to OTLP is not perfectly lossless. Custom
  attributes are preserved verbatim through `baseData.properties`.

## Build

```bash
npm install
npm run build --silent
```

## Test

```bash
npm run test
```

## Data Collection

As this SDK is designed to enable applications to perform data collection which is sent to the
Microsoft collection endpoints the following is required to identify our privacy statement.

The software may collect information about you and your use of the software and send it to Microsoft.
Microsoft may use this information to provide services and improve our products and services. You may
turn off the telemetry as described in the repository. There are also some features in the software
that may enable you and Microsoft to collect data from users of your applications. If you use these
features, you must comply with applicable law, including providing appropriate notices to users of
your applications together with a copy of Microsoft's privacy statement. Our privacy statement is
located at https://go.microsoft.com/fwlink/?LinkID=824704. You can learn more about data collection
and use in the help documentation and our privacy statement. Your use of the software operates as
your consent to these practices.

## License

[MIT](LICENSE)
