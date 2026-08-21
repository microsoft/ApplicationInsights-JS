/*
 * Validation rules for the OTLP payloads produced by the Application Insights OTLP channel.
 *
 * This module is deliberately dependency free and is used both by the mock collector (so a manual
 * run can see the results in the browser) and by the automated Puppeteer driven test.
 */

const HEX_32 = /^[0-9a-f]{32}$/;
const HEX_16 = /^[0-9a-f]{16}$/;
const DIGITS = /^[0-9]+$/;

const ANY_VALUE_MEMBERS = [
    "stringValue", "boolValue", "intValue", "doubleValue", "arrayValue", "kvlistValue", "bytesValue"
];

/**
 * Creates a result collector.
 */
function createResults() {
    return {
        passed: [],
        failed: [],
        check(condition, description, detail) {
            if (condition) {
                this.passed.push(description);
            } else {
                this.failed.push({ description, detail: detail === undefined ? null : detail });
            }

            return !!condition;
        }
    };
}

function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

/**
 * Validates a single OTLP `AnyValue`, which is a `oneof` so exactly one member must be set.
 */
function validateAnyValue(results, value, path) {
    if (!isPlainObject(value)) {
        results.check(false, path + " is an object", value);
        return;
    }

    const keys = Object.keys(value);
    // An AnyValue with no members represents an empty value which is legal
    results.check(keys.length <= 1, path + " sets at most one AnyValue member", keys);

    keys.forEach((key) => {
        results.check(ANY_VALUE_MEMBERS.indexOf(key) !== -1, path + " uses a known AnyValue member", key);
    });

    if (typeof value.intValue !== "undefined") {
        results.check(typeof value.intValue === "string" && DIGITS.test(value.intValue.replace("-", "")),
            path + ".intValue is an integer encoded as a string", value.intValue);
    }

    if (typeof value.doubleValue !== "undefined") {
        results.check(typeof value.doubleValue === "number" && isFinite(value.doubleValue),
            path + ".doubleValue is a finite number", value.doubleValue);
    }

    if (typeof value.stringValue !== "undefined") {
        results.check(typeof value.stringValue === "string", path + ".stringValue is a string", value.stringValue);
    }

    if (value.arrayValue) {
        results.check(Array.isArray(value.arrayValue.values), path + ".arrayValue.values is an array");
        (value.arrayValue.values || []).forEach((entry, idx) => {
            validateAnyValue(results, entry, path + ".arrayValue[" + idx + "]");
        });
    }
}

/**
 * Validates an OTLP attribute list, including that no key is duplicated (a duplicate key has
 * undefined behaviour in OTLP).
 */
function validateAttributes(results, attributes, path) {
    if (typeof attributes === "undefined") {
        return {};
    }

    if (!results.check(Array.isArray(attributes), path + " is an array", attributes)) {
        return {};
    }

    const seen = {};
    const map = {};

    attributes.forEach((attr, idx) => {
        const attrPath = path + "[" + idx + "]";
        if (!results.check(isPlainObject(attr) && typeof attr.key === "string" && attr.key.length > 0,
            attrPath + " has a non empty string key", attr)) {
            return;
        }

        results.check(!seen[attr.key], path + " does not repeat the key '" + attr.key + "'");
        seen[attr.key] = true;

        validateAnyValue(results, attr.value, attrPath + "(" + attr.key + ").value");
        map[attr.key] = attr.value;
    });

    return map;
}

/**
 * Validates an OTLP `timeUnixNano` value, which must be an integer number of nanoseconds since the
 * unix epoch encoded as a decimal string.
 */
function validateUnixNano(results, value, path, options) {
    options = options || {};

    if (!results.check(typeof value === "string", path + " is a string (int64 values must not be JSON numbers)", value)) {
        return null;
    }

    if (!results.check(DIGITS.test(value), path + " contains only digits", value)) {
        return null;
    }

    // A current timestamp in nanoseconds has 19 digits. This is the assertion that catches the
    // precision loss that occurs if the value is ever computed using JavaScript number arithmetic.
    results.check(value.length === 19, path + " has nanosecond resolution (19 digits)", value);

    const millis = Number(value.substring(0, 13));
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    if (!options.allowAnyTime) {
        results.check(millis > now - dayMs && millis < now + dayMs,
            path + " is within a day of now", new Date(millis).toISOString());
    }

    return value;
}

/**
 * Compares two `timeUnixNano` decimal strings.
 */
function compareUnixNano(a, b) {
    if (a.length !== b.length) {
        return a.length - b.length;
    }

    return a < b ? -1 : (a > b ? 1 : 0);
}

function validateResource(results, resource, path) {
    if (!results.check(isPlainObject(resource), path + " is present", resource)) {
        return {};
    }

    const attrs = validateAttributes(results, resource.attributes, path + ".attributes");

    results.check(!!attrs["service.name"], path + " declares service.name");
    results.check(!!attrs["telemetry.sdk.name"], path + " declares telemetry.sdk.name");
    results.check(attrs["telemetry.sdk.language"] && attrs["telemetry.sdk.language"].stringValue === "webjs",
        path + " declares telemetry.sdk.language of webjs", attrs["telemetry.sdk.language"]);
    results.check(!!attrs["telemetry.sdk.version"], path + " declares telemetry.sdk.version");

    // The instrumentation key must never leak into the resource unless it was explicitly opted into
    results.check(!attrs["microsoft.instrumentation_key"],
        path + " does not include the instrumentation key by default");

    return attrs;
}

function validateScope(results, scope, path) {
    if (!results.check(isPlainObject(scope), path + " is present", scope)) {
        return;
    }

    results.check(typeof scope.name === "string" && scope.name.length > 0, path + ".name is set", scope.name);
}

/**
 * Validates a single OTLP span.
 */
function validateSpan(results, span, path) {
    results.check(HEX_32.test(span.traceId || ""), path + ".traceId is 32 lowercase hex characters", span.traceId);
    results.check(HEX_16.test(span.spanId || ""), path + ".spanId is 16 lowercase hex characters", span.spanId);

    if (typeof span.parentSpanId !== "undefined") {
        results.check(HEX_16.test(span.parentSpanId), path + ".parentSpanId is 16 lowercase hex characters",
            span.parentSpanId);
        results.check(span.parentSpanId !== span.spanId, path + " is not its own parent", span.spanId);
    }

    results.check(typeof span.name === "string" && span.name.length > 0, path + ".name is set", span.name);

    // The canonical proto3 JSON encoding omits fields that hold their default value, so a collector's
    // own re-serialization drops `kind: 0` and `status.code: 0`. An absent value therefore means the
    // default rather than a missing field.
    const kind = typeof span.kind === "undefined" ? 0 : span.kind;
    results.check([0, 1, 2, 3, 4, 5].indexOf(kind) !== -1, path + ".kind is a valid SpanKind", span.kind);

    const start = validateUnixNano(results, span.startTimeUnixNano, path + ".startTimeUnixNano");
    const end = validateUnixNano(results, span.endTimeUnixNano, path + ".endTimeUnixNano");

    if (start && end) {
        results.check(compareUnixNano(end, start) >= 0, path + " ends at or after it starts",
            { start, end });
    }

    if (typeof span.status !== "undefined") {
        const statusCode = typeof span.status.code === "undefined" ? 0 : span.status.code;
        results.check([0, 1, 2].indexOf(statusCode) !== -1, path + ".status.code is a valid StatusCode",
            span.status.code);
    }

    const attrs = validateAttributes(results, span.attributes, path + ".attributes");

    // Semantic convention correctness. These cannot be caught by shape checks alone, and are exactly
    // the kind of thing that looks well formed while being wrong.
    const serverAddress = attrs["server.address"] && attrs["server.address"].stringValue;
    if (serverAddress) {
        results.check(serverAddress.indexOf("://") === -1 && serverAddress.indexOf("/") === -1,
            path + ".server.address is a host rather than a url", serverAddress);
        results.check(serverAddress.indexOf(":") === -1,
            path + ".server.address does not embed the port (server.port is used for that)", serverAddress);
    }

    const peerService = attrs["peer.service"] && attrs["peer.service"].stringValue;
    if (peerService) {
        results.check(peerService.indexOf("://") === -1, path + ".peer.service is a host rather than a url",
            peerService);
    }

    const urlFull = attrs["url.full"] && attrs["url.full"].stringValue;
    if (urlFull) {
        results.check(/^[a-z][a-z0-9+.-]*:\/\//i.test(urlFull), path + ".url.full is an absolute url", urlFull);
    }

    if (attrs["server.port"]) {
        results.check(typeof attrs["server.port"].intValue === "string",
            path + ".server.port is an integer", attrs["server.port"]);
    }

    // A hierarchical Application Insights id of the form "|<traceId>.<spanId>" carries a recoverable
    // span id, so seeing one preserved as a fallback attribute means the real span id was discarded
    // and the parent/child relationships in the trace are broken.
    const preservedId = attrs["microsoft.telemetry_id"] && attrs["microsoft.telemetry_id"].stringValue;
    if (preservedId) {
        results.check(!/^\|[0-9a-f]{32}\.[0-9a-f]{16}/.test(preservedId),
            path + " did not discard a recoverable span id", preservedId);
    }

    return attrs;
}

/**
 * Validates a single OTLP log record.
 */
function validateLogRecord(results, record, path) {
    validateUnixNano(results, record.timeUnixNano, path + ".timeUnixNano");
    validateUnixNano(results, record.observedTimeUnixNano, path + ".observedTimeUnixNano");

    // As above, the canonical encoding omits a severityNumber of 0
    const severityNumber = typeof record.severityNumber === "undefined" ? 0 : record.severityNumber;
    results.check([0, 1, 5, 9, 13, 17, 21].indexOf(severityNumber) !== -1,
        path + ".severityNumber is a known severity", record.severityNumber);
    results.check(typeof record.severityText === "string" && record.severityText.length > 0,
        path + ".severityText is set", record.severityText);

    if (typeof record.traceId !== "undefined") {
        results.check(HEX_32.test(record.traceId), path + ".traceId is 32 lowercase hex characters", record.traceId);
    }

    if (typeof record.spanId !== "undefined") {
        results.check(HEX_16.test(record.spanId), path + ".spanId is 16 lowercase hex characters", record.spanId);
    }

    if (typeof record.body !== "undefined") {
        validateAnyValue(results, record.body, path + ".body");
    }

    return validateAttributes(results, record.attributes, path + ".attributes");
}

/**
 * Walks every request captured by the mock collector and validates the OTLP structure.
 * @param requests - The captured requests, each `{ signal, url, body }`.
 * @returns A validation report.
 */
function validatePayloads(requests) {
    const results = createResults();
    const summary = {
        requests: requests.length,
        spans: 0,
        logs: 0,
        services: {},
        spanNames: {},
        spanKinds: {},
        spanStatuses: {},
        spansWithHttpMethod: 0,
        spansWithUrl: 0,
        telemetryTypes: {},
        markersByService: {}
    };

    results.check(requests.length > 0, "The collector received at least one OTLP request");

    requests.forEach((request, requestIdx) => {
        const path = "request[" + requestIdx + "]";
        const body = request.body;

        if (!results.check(isPlainObject(body), path + " has a JSON object body")) {
            return;
        }

        const isTrace = request.signal === "traces";
        results.check(request.url.indexOf(isTrace ? "/v1/traces" : "/v1/logs") !== -1,
            path + " was posted to the correct signal endpoint", request.url);
        results.check((request.contentType || "").indexOf("application/json") === 0,
            path + " declared a JSON content type", request.contentType);

        const resourceKey = isTrace ? "resourceSpans" : "resourceLogs";
        const scopeKey = isTrace ? "scopeSpans" : "scopeLogs";
        const recordKey = isTrace ? "spans" : "logRecords";

        const bodyKeys = Object.keys(body);
        results.check(bodyKeys.length === 1 && bodyKeys[0] === resourceKey,
            path + " uses only the " + resourceKey + " envelope", bodyKeys);

        if (!Array.isArray(body[resourceKey])) {
            results.check(false, path + "." + resourceKey + " is an array", body[resourceKey]);
            return;
        }

        body[resourceKey].forEach((resourceEntry, resourceIdx) => {
            const resourcePath = path + "." + resourceKey + "[" + resourceIdx + "]";
            const resourceAttrs = validateResource(results, resourceEntry.resource, resourcePath + ".resource");

            const serviceName = resourceAttrs["service.name"] && resourceAttrs["service.name"].stringValue;
            const marker = resourceAttrs["test.instance.marker"] && resourceAttrs["test.instance.marker"].stringValue;
            if (serviceName) {
                summary.services[serviceName] = (summary.services[serviceName] || 0) + 1;
            }

            if (!Array.isArray(resourceEntry[scopeKey])) {
                results.check(false, resourcePath + "." + scopeKey + " is an array", resourceEntry[scopeKey]);
                return;
            }

            resourceEntry[scopeKey].forEach((scopeEntry, scopeIdx) => {
                const scopePath = resourcePath + "." + scopeKey + "[" + scopeIdx + "]";
                validateScope(results, scopeEntry.scope, scopePath + ".scope");

                const records = scopeEntry[recordKey];
                if (!Array.isArray(records)) {
                    results.check(false, scopePath + "." + recordKey + " is an array", records);
                    return;
                }

                records.forEach((record, recordIdx) => {
                    const recordPath = scopePath + "." + recordKey + "[" + recordIdx + "]";
                    const attrs = isTrace
                        ? validateSpan(results, record, recordPath)
                        : validateLogRecord(results, record, recordPath);

                    if (isTrace) {
                        summary.spans++;
                        summary.spanNames[record.name] = (summary.spanNames[record.name] || 0) + 1;

                        // Normalize the omitted-default encoding so the counts are comparable whether
                        // the payload came from the channel or from a collector's re-serialization
                        const kind = typeof record.kind === "undefined" ? 0 : record.kind;
                        const statusCode = record.status && typeof record.status.code !== "undefined"
                            ? record.status.code : 0;

                        summary.spanKinds[kind] = (summary.spanKinds[kind] || 0) + 1;
                        summary.spanStatuses[statusCode] = (summary.spanStatuses[statusCode] || 0) + 1;

                        if (attrs["http.request.method"]) {
                            summary.spansWithHttpMethod++;
                        }
                        if (attrs["url.full"]) {
                            summary.spansWithUrl++;
                        }
                    } else {
                        summary.logs++;
                    }

                    const telemetryType = attrs["microsoft.telemetry_type"] &&
                        attrs["microsoft.telemetry_type"].stringValue;
                    if (telemetryType) {
                        summary.telemetryTypes[telemetryType] = (summary.telemetryTypes[telemetryType] || 0) + 1;
                    }

                    // Cross instance isolation: a record must never carry a marker belonging to a
                    // different instance than the resource it was exported under.
                    const recordMarker = attrs["test.marker"] && attrs["test.marker"].stringValue;
                    if (marker && recordMarker) {
                        results.check(recordMarker === marker,
                            recordPath + " carries the marker of its own instance",
                            { resourceMarker: marker, recordMarker });
                    }

                    if (serviceName && recordMarker) {
                        const bucket = summary.markersByService[serviceName] ||
                            (summary.markersByService[serviceName] = {});
                        bucket[recordMarker] = (bucket[recordMarker] || 0) + 1;
                    }
                });
            });
        });
    });

    return { results, summary };
}

/**
 * Applies the expectations that describe a complete, correct run of the example site.
 */
function validateExpectations(requests, options) {
    options = options || {};
    const { results, summary } = validatePayloads(requests);

    const expectedServices = options.expectedServices || ["storefront-web", "checkout-widget"];
    expectedServices.forEach((service) => {
        results.check(!!summary.services[service], "Telemetry was received for the '" + service + "' service");
    });

    // Each service must only ever carry its own marker
    Object.keys(summary.markersByService).forEach((service) => {
        const markers = Object.keys(summary.markersByService[service]);
        results.check(markers.length === 1,
            "The '" + service + "' service only carries telemetry from a single instance", markers);
    });

    results.check(Object.keys(summary.markersByService).length >= expectedServices.length ||
        Object.keys(summary.services).length >= expectedServices.length,
        "Both instances exported telemetry independently", summary.services);

    results.check(summary.spans > 0, "At least one span was exported");
    results.check(summary.logs > 0, "At least one log record was exported");

    // Span coverage: the example produces page views and manual spans (INTERNAL) as well as
    // automatically collected fetch / XHR dependencies (CLIENT).
    results.check(summary.spanKinds[1] > 0, "At least one INTERNAL span was exported (page view / manual span)",
        summary.spanKinds);
    results.check(summary.spanKinds[3] > 0, "At least one CLIENT span was exported (auto collected dependency)",
        summary.spanKinds);
    results.check(summary.spansWithHttpMethod > 0, "At least one span carries the http.request.method attribute");
    results.check(summary.spansWithUrl > 0, "At least one span carries the url.full attribute");
    results.check(summary.spanStatuses[2] > 0,
        "At least one span reports an ERROR status (the deliberately failing request)", summary.spanStatuses);
    results.check(summary.spanStatuses[1] > 0, "At least one span reports an OK status", summary.spanStatuses);

    const expectedTypes = options.expectedTelemetryTypes ||
        ["MessageData", "ExceptionData", "EventData", "MetricData"];
    expectedTypes.forEach((type) => {
        results.check(!!summary.telemetryTypes[type],
            "A log record was exported for " + type, Object.keys(summary.telemetryTypes));
    });

    return { results, summary };
}

/**
 * Runs the full validation and returns a plain report object.
 */
function validate(requests, options) {
    const { results, summary } = validateExpectations(requests, options);

    return {
        ok: results.failed.length === 0,
        passedCount: results.passed.length,
        failedCount: results.failed.length,
        failures: results.failed,
        summary
    };
}

module.exports = {
    validate,
    validatePayloads,
    validateExpectations,
    compareUnixNano
};
