# OTLP Channel Test Site

A multi page, multi instance test harness for
`@microsoft/applicationinsights-otlpchannel-js`.

Three pages each run **two completely independent Application Insights instances**, both exporting
through their own OTLP channel to a local mock collector. It verifies that

- every kind of telemetry the SDK produces converts to **well formed OTLP**,
- the exported records carry all the **expected attributes**,
- the two instances **do not clobber each other's globals**, configuration or telemetry.

## Prerequisites

The example bundles straight from the built `dist-es5` output of the workspace packages, so the SDK
must be built first:

```bash
# from the repository root
npm install          # or: node common/scripts/install-run-rush.js update
node common/scripts/install-run-rush.js rebuild
```

## Manual run

```bash
cd examples/otlp
npm run build
npm run serve
```

Then open <http://localhost:8099/>.

On every page:

1. The **Instance isolation** checklist renders as soon as the page loads. All seven checks must say
   `PASS` &mdash; they compare the two instances' core, channel, configuration object, instrumentation
   key and `service.name` by identity.
2. Press **Generate telemetry**. This produces, *on each of the two instances*, a page view, a custom
   event, five traces (one per severity), an exception, a metric, a manual dependency, a real
   `fetch`, a real `XMLHttpRequest`, a deliberately failing request, and a real OpenTelemetry span
   created through `startSpan()`.
3. Press **Validate collected** to run the full rule set over everything the collector has received.
   The report shows the pass/fail counts and the details of any failure.
4. Visit **Products** and **Checkout** and repeat, then validate again to confirm telemetry from all
   three pages is correct.
5. On **Checkout**, press **Unload first instance only** and then **Generate telemetry** again. Only
   the surviving instance may continue to export.

Useful links, also available from the page navigation:

| Endpoint | Purpose |
| --- | --- |
| `/__collected` | Every OTLP request the collector received, including the raw body |
| `/__validate` | Runs the validation rules and returns the report |
| `POST /__reset` | Clears the collected data |

## Automated run

The same scenario driven by a real browser through Puppeteer:

```bash
cd examples/otlp
npm run build
npm test
```

It starts the collector, visits all three pages, validates every payload, and finally verifies that
unloading one instance leaves the other one exporting. It exits non zero on any failure, so it is
suitable for CI.

```
  visited index.html - generated 24 items and 2 span(s)
  visited products.html - generated 24 items and 2 span(s)
  visited checkout.html - generated 24 items and 2 span(s)

OTLP requests received : 12
Spans exported         : 36
Log records exported   : 54
Services seen          : {"storefront-web":6,"checkout-widget":6}
Span kinds             : {"1":12,"3":24}
Telemetry types        : {"EventData":6,"MessageData":30,"ExceptionData":6,"MetricData":6,"PageviewPerformanceData":6}
Payload assertions     : 7062 passed, 0 failed

After unloading the first instance, services still exporting: ["checkout-widget"]

PASSED - all OTLP payloads are valid and the instances stayed isolated.
```

Add `--headful` to watch the browser: `node tools/automated-test.js --headful`.

## Validating against a REAL OpenTelemetry Collector

The mock collector and the validator only check that a payload is *well formed* against rules written
by hand from the specification. To prove the output is genuinely valid OTLP, run it through a real
collector, which parses the payload with the reference implementation and **rejects anything
malformed with a 4xx** instead of quietly accepting it.

### Get a collector

Either use Docker:

```bash
cd examples/otlp/collector
docker compose up
```

or download the standalone binary (no Docker required):

```powershell
cd examples\otlp\collector
.\get-collector.ps1                 # or ./get-collector.sh on macOS / Linux
.\bin\otelcol.exe --config otel-collector-config.yaml
```

The collector listens for OTLP/HTTP on **4318**, prints everything it parsed via the `debug`
exporter, and re-exports its own canonical OTLP/JSON back to the example's mock collector on 8099.

### Point the site at it

Add `?collector=http://localhost:4318` to any page:

<http://localhost:8099/index.html?collector=http://localhost:4318>

The activity log shows which endpoint is in use. Press **Generate telemetry** and watch the collector
console: every span and log record it successfully parsed is printed. Then press **Validate
collected** to validate the collector's own re-serialization of that data.

### Or run the whole thing automatically

```bash
npm run test:collector
```

This starts the collector and the example server, drives all three pages through a real browser,
verifies the collector never rejected a request, and finally validates the collector's canonical
re-serialization:

```
=== Validation of the REAL collector's own re-serialization ===
Round tripped requests : 6
Spans                  : 36
Log records            : 54
Services               : {"checkout-widget":6,"storefront-web":6}
Span kinds             : {"1":12,"3":24}
Assertions             : 7248 passed, 0 failed

=== What the collector itself parsed (debug exporter) ===
  Span #2
  Name           : GET http://localhost:8099/api/products
  Kind           : Client
  Status code    : Ok
  -> http.request.method: Str(GET)
  -> url.full: Str(http://localhost:8099/api/products)
  -> server.address: Str(localhost)
  -> server.port: Int(8099)

PASSED - a real OpenTelemetry Collector accepted every payload, and its own
         re-serialization of the data satisfies every validation rule.
```

Use `--external` if you are already running a collector yourself:

```bash
node tools/verify-with-collector.js --external
```

> The collector binary is large (~190 MB extracted) and is git ignored via `collector/.gitignore`.

## Seeing exactly what is sent *into* the collector

Posting straight to the collector on 4318 hides the payload &mdash; you only see what the collector
decided to do with it. The example server therefore provides a **tap** that sits in the middle:

```
browser  ->  /tap/v1/traces (records the exact bytes)  ->  real collector :4318
                     |                                             |
                     +------------- relays the collector's real response back
```

Point a page at the tap instead of at the collector:

<http://localhost:8099/index.html?collector=http://localhost:8099/tap>

Then open the **Inspector**:

<http://localhost:8099/inspect.html>

It lists every request the SDK sent, and for each one shows

- the HTTP status the **real collector** returned (green when accepted, red when rejected),
- the collector's response body, including its error message when it rejects something,
- the exact payload that was sent, pretty printed,
- the byte size, record count and timestamp.

Because the tap relays the collector's genuine response, a rejection is seen by the SDK exactly as it
would be without the tap. Sending a deliberately invalid span, for example, shows:

```
400   {"code":3,"message":"ID.UnmarshalJSONIter: length mismatch ..."}
```

Buttons on the inspector:

| Button | Effect |
| --- | --- |
| Refresh | Reload the captured list (auto refresh is on by default) |
| Validate what was sent | Runs the full rule set over the payloads **as sent**, before the collector touched them |
| Reset | Clears the capture |

Endpoints behind it, if you prefer curl:

| Endpoint | Purpose |
| --- | --- |
| `GET /__tapped` | Everything sent to the collector plus the collector's response to each |
| `GET /__tap-validate` | Validates what was sent, and reports anything the collector rejected |

Set a different collector with the `OTLP_COLLECTOR_URL` environment variable before starting the
server (it defaults to `http://localhost:4318`).

## What is validated

`tools/validate.js` holds the rules and is shared by the collector and the automated test.

**Envelope** &mdash; the body uses only `resourceSpans` / `resourceLogs`; the request went to the
matching signal endpoint; the content type is `application/json`.

**Resource** &mdash; declares `service.name`, `telemetry.sdk.name`, `telemetry.sdk.language`
(`webjs`) and `telemetry.sdk.version`, and does **not** leak the instrumentation key by default.

**Spans** &mdash; `traceId` is 32 lowercase hex characters, `spanId` is 16, `parentSpanId` (when
present) is valid and never equal to the span's own id, `kind` is a valid `SpanKind`, `status.code`
is a valid `StatusCode`, and the span ends at or after it starts.

**Log records** &mdash; `timeUnixNano` and `observedTimeUnixNano` are present, `severityNumber` is one
of the known values and `severityText` is set.

**Timestamps** &mdash; every `timeUnixNano` is a *string* of digits, exactly 19 long, and within a day
of now. The 19 digit assertion is what catches the precision loss that occurs if a nanosecond
timestamp is ever computed with JavaScript number arithmetic.

**Attributes** &mdash; every `AnyValue` sets at most one member and uses a known member name,
`intValue` is a string, `doubleValue` is a finite number, and **no attribute key is ever repeated**
within a record.

**Coverage** &mdash; both services are present, at least one `INTERNAL` and one `CLIENT` span were
exported, at least one span carries `http.request.method` and `url.full`, at least one span reports
`OK` and at least one reports `ERROR`, and log records were exported for `MessageData`,
`ExceptionData`, `EventData` and `MetricData`.

**Isolation** &mdash; each instance uses a distinct core, channel and configuration object; a record
tagged with one instance's marker never appears under the other instance's resource; each service
only ever carries telemetry from a single instance; and unloading one instance stops only that
instance.

## Layout

```
examples/otlp/
  src/otlp-example.js      the two SDK instances and the telemetry generators
  public/                  the three pages, shared page glue and styles
  tools/server.js          static server + mock OTLP collector
  tools/validate.js        the validation rules (shared)
  tools/automated-test.js  the Puppeteer driven end to end test
  tools/manual-check.js    verifies the button driven manual flow still works
  tools/diagnose.js        scans every span for missing ids / duplicate keys
  tools/dump-samples.js    prints one full example of each span and log shape
  tools/verify-with-collector.js
                           validates against a REAL OpenTelemetry Collector
  collector/               collector config, docker-compose and download scripts
```

## Inspecting the output by hand

Structural validation only proves a payload is *well formed*, not that it is *semantically right*.
`tools/dump-samples.js` prints the raw request body plus one complete example of each shape (an
OTel `startSpan()` span, an auto collected dependency, a failed dependency, a page view span, an
exception log record and the shared resource), which is how the semantic convention problems listed
in the channel's design notes were found:

```bash
node tools/dump-samples.js
```

## Notes

- Both instances point the built in Application Insights sender at `/breeze/v2/track` on the mock
  collector, so nothing ever reaches the real ingestion endpoint. This also means the example
  exercises the OTLP channel **coexisting** with the standard sender in the same channel queue.
- `/api/missing` returns 404 on purpose, to produce an unsuccessful dependency span.
- The collector keeps everything in memory; restart it (or `POST /__reset`) to start over.
