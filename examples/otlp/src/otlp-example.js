/*
 * Application Insights OTLP channel - multi page / multi instance test harness.
 *
 * Two completely independent Application Insights instances are created on every page, each with its
 * own OTLP channel pointing at the local mock collector but reporting a different `service.name`.
 * This exercises:
 *
 *  - that every kind of telemetry the SDK produces is converted to well formed OTLP,
 *  - that the two instances do not clobber each other's globals or each other's configuration,
 *  - that telemetry from one instance never appears under the other instance's resource.
 */
import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { OtlpChannel } from "@microsoft/applicationinsights-otlpchannel-js";

var COLLECTOR = window.location.origin;
var ENDPOINT_STORAGE_KEY = "otlpExample.collector";

function _readStoredEndpoint() {
    try {
        return window.localStorage.getItem(ENDPOINT_STORAGE_KEY);
    } catch (e) {
        return null;
    }
}

function _storeEndpoint(value) {
    try {
        if (value) {
            window.localStorage.setItem(ENDPOINT_STORAGE_KEY, value);
        } else {
            window.localStorage.removeItem(ENDPOINT_STORAGE_KEY);
        }
    } catch (e) {
        // Storage is unavailable, the choice simply will not persist across navigations
    }
}

/**
 * The OTLP endpoint may be redirected at a real OpenTelemetry Collector using `?collector=<url>`,
 * for example `?collector=http://localhost:8099/tap`.
 *
 * @remarks
 * The choice is remembered in local storage so that it survives navigating between the pages (whose
 * links would otherwise drop the query string) and so that it is visible to the inspector page in
 * another tab.
 */
function _resolveOtlpEndpoint() {
    var match = /[?&]collector=([^&]+)/.exec(window.location.search);
    if (match) {
        var fromQuery = decodeURIComponent(match[1]).replace(/\/+$/, "");
        _storeEndpoint(fromQuery);
        return fromQuery;
    }

    var stored = _readStoredEndpoint();
    if (stored) {
        return stored.replace(/\/+$/, "");
    }

    return COLLECTOR;
}

var OTLP_ENDPOINT = _resolveOtlpEndpoint();

/**
 * The two instances under test. Each has a distinct instrumentation key, a distinct service name and
 * a distinct marker attribute so that cross contamination between them is detectable.
 */
var INSTANCES = [
    {
        id: "storefront",
        iKey: "11111111-1111-1111-1111-111111111111",
        serviceName: "storefront-web",
        marker: "instance-a",
        globalName: "aiStorefront"
    },
    {
        id: "checkout",
        iKey: "22222222-2222-2222-2222-222222222222",
        serviceName: "checkout-widget",
        marker: "instance-b",
        globalName: "aiCheckout"
    }
];

var _instances = {};
var _errors = [];

function _recordError(context, err) {
    var message = context + ": " + (err && err.message ? err.message : String(err));
    _errors.push(message);
    if (window.console && console.error) {
        console.error(message);
    }
}

function _createInstance(def, pageName) {
    var otlpChannel = new OtlpChannel();

    var extensionConfig = {};
    extensionConfig[otlpChannel.identifier] = {
        endpointUrl: OTLP_ENDPOINT,
        // Keep the batches small and the interval short so that the manual page and the automated
        // test do not have to wait long to see data.
        maxBatchInterval: 2000,
        maxRecordsPerBatch: 50,
        metricsAsLogs: true,
        resourceAttributes: {
            "service.name": def.serviceName,
            "deployment.environment": "otlp-example",
            "test.instance.marker": def.marker,
            "test.page": pageName
        }
    };

    var appInsights = new ApplicationInsights({
        config: {
            instrumentationKey: def.iKey,
            // Point the built in Application Insights sender at the mock collector as well, so that
            // nothing escapes to the real ingestion endpoint while the two channels coexist.
            endpointUrl: COLLECTOR + "/breeze/v2/track",
            channels: [[ otlpChannel ]],
            extensionConfig: extensionConfig,
            disableAjaxTracking: false,
            disableFetchTracking: false,
            enableAutoRouteTracking: false,
            disableExceptionTracking: false,
            // Emit an internal message to the console so problems are visible during a manual run
            loggingLevelConsole: 1
        }
    });

    appInsights.loadAppInsights();

    return {
        def: def,
        appInsights: appInsights,
        channel: otlpChannel
    };
}

/**
 * Creates both instances and publishes each one under its own global.
 * @param pageName - The logical name of the page being loaded.
 */
export function init(pageName) {
    for (var lp = 0; lp < INSTANCES.length; lp++) {
        var def = INSTANCES[lp];
        try {
            var created = _createInstance(def, pageName);
            _instances[def.id] = created;
            window[def.globalName] = created.appInsights;
        } catch (e) {
            _recordError("init(" + def.id + ")", e);
        }
    }

    window.__otlpInstances = _instances;

    return getDiagnostics();
}

/**
 * The OTLP endpoint the channels are currently exporting to.
 */
export function getEndpoint() {
    return OTLP_ENDPOINT;
}

/**
 * The url of the tap, which records what is sent and forwards it to the real collector.
 */
export function getTapEndpoint() {
    return COLLECTOR + "/tap";
}

/**
 * `true` when the channels are exporting through the tap, and so through the real collector.
 */
export function isUsingTap() {
    return OTLP_ENDPOINT === getTapEndpoint();
}

/**
 * Switches which endpoint the channels export to and reloads so the change takes effect. Passing
 * nothing reverts to the built in mock collector.
 * @param endpoint - The endpoint to use, or null for the mock collector.
 */
export function setEndpoint(endpoint) {
    _storeEndpoint(endpoint || null);

    // Drop any collector query string so the stored value is what takes effect
    window.location.href = window.location.pathname;
}

function _each(callback) {
    var results = [];
    for (var key in _instances) {
        if (Object.prototype.hasOwnProperty.call(_instances, key)) {
            try {
                results.push(callback(_instances[key], key));
            } catch (e) {
                _recordError(key, e);
            }
        }
    }

    return results;
}

/**
 * Generates one of every kind of telemetry, on both instances.
 * @param pageName - The logical name of the page generating the telemetry.
 */
export function generateAll(pageName) {
    var generated = 0;

    _each(function (inst, key) {
        var ai = inst.appInsights;
        var marker = inst.def.marker;

        ai.trackPageView({
            name: pageName,
            uri: window.location.href,
            properties: { "test.marker": marker, "test.page": pageName }
        });

        ai.trackEvent({
            name: "example-event-" + pageName,
            properties: { "test.marker": marker, "test.page": pageName, "custom.string": "hello" },
            measurements: { "custom.measurement": 42 }
        });

        ai.trackTrace({
            message: "verbose trace from " + key,
            severityLevel: 0,
            properties: { "test.marker": marker }
        });
        ai.trackTrace({
            message: "information trace from " + key,
            severityLevel: 1,
            properties: { "test.marker": marker }
        });
        ai.trackTrace({
            message: "warning trace from " + key,
            severityLevel: 2,
            properties: { "test.marker": marker }
        });
        ai.trackTrace({
            message: "error trace from " + key,
            severityLevel: 3,
            properties: { "test.marker": marker }
        });
        ai.trackTrace({
            message: "critical trace from " + key,
            severityLevel: 4,
            properties: { "test.marker": marker }
        });

        ai.trackException({
            exception: new Error("example exception from " + key),
            severityLevel: 3,
            properties: { "test.marker": marker }
        });

        ai.trackMetric({
            name: "example-metric",
            average: 12.5,
            sampleCount: 3,
            min: 10,
            max: 15
        }, { "test.marker": marker });

        ai.trackDependencyData({
            id: "manual-dep-" + key + "-" + pageName,
            name: "GET /api/manual",
            responseCode: 200,
            duration: 25,
            success: true,
            type: "Http",
            target: "manual.example.com",
            data: "https://manual.example.com/api/manual",
            properties: { "test.marker": marker }
        });

        generated += 12;
    });

    return generated;
}

/**
 * Issues a real fetch and a real XMLHttpRequest so that the dependency plugin produces automatically
 * collected dependency telemetry on both instances.
 */
export function generateDependencies() {
    var promises = [];

    promises.push(fetch(COLLECTOR + "/api/products").then(function (response) {
        return response.json();
    }).catch(function (e) {
        _recordError("fetch", e);
    }));

    promises.push(new Promise(function (resolve) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", COLLECTOR + "/api/inventory", true);
        xhr.onloadend = function () {
            resolve();
        };
        xhr.onerror = function () {
            resolve();
        };
        xhr.send();
    }));

    // A deliberately failing request so that an unsuccessful dependency span is produced
    promises.push(fetch(COLLECTOR + "/api/missing").catch(function () {
        // expected
    }));

    return Promise.all(promises);
}

/**
 * Creates a real OpenTelemetry span on each instance using the SDK's tracer, which the SDK converts
 * into telemetry and the OTLP channel then converts back into an OTLP span.
 */
export function generateSpans(pageName) {
    var created = 0;

    _each(function (inst, key) {
        var ai = inst.appInsights;
        if (!ai.startSpan) {
            return;
        }

        var span = ai.startSpan("example-span-" + pageName);
        if (span) {
            if (span.setAttribute) {
                span.setAttribute("test.marker", inst.def.marker);
                span.setAttribute("test.page", pageName);
                span.setAttribute("custom.span.attribute", "span-value");
            }

            if (span.end) {
                span.end();
            }

            created++;
        }
    });

    return created;
}

/**
 * Flushes both instances and resolves once the exports have been issued.
 */
export function flushAll() {
    _each(function (inst) {
        inst.channel.flush(true);
    });

    return new Promise(function (resolve) {
        setTimeout(resolve, 500);
    });
}

/**
 * Unloads only the first instance, used to verify that unloading one instance does not disturb the
 * other.
 */
export function unloadFirst() {
    var first = _instances[INSTANCES[0].id];
    if (first) {
        first.appInsights.unload(false);
    }

    return getDiagnostics();
}

/**
 * Collects the information used to verify that the two instances are genuinely independent.
 */
export function getDiagnostics() {
    var diagnostics = {
        errors: _errors.slice(),
        instances: [],
        globals: {}
    };

    for (var lp = 0; lp < INSTANCES.length; lp++) {
        var def = INSTANCES[lp];
        var inst = _instances[def.id];
        if (!inst) {
            continue;
        }

        var core = inst.appInsights.core;
        var channels = [];
        try {
            var coreChannels = core.getChannels() || [];
            for (var c = 0; c < coreChannels.length; c++) {
                channels.push({
                    identifier: coreChannels[c].identifier,
                    priority: coreChannels[c].priority
                });
            }
        } catch (e) {
            _recordError("getChannels(" + def.id + ")", e);
        }

        diagnostics.instances.push({
            id: def.id,
            globalName: def.globalName,
            serviceName: def.serviceName,
            marker: def.marker,
            iKey: core && core.config ? core.config.instrumentationKey : null,
            isInitialized: !!(core && core.isInitialized && core.isInitialized()),
            channelIdentifier: inst.channel.identifier,
            channelPriority: inst.channel.priority,
            channels: channels,
            // The identity of the objects matters: two instances must never share a core, a channel
            // or a configuration object.
            coreId: _objectId(core),
            channelId: _objectId(inst.channel),
            configId: _objectId(core ? core.config : null),
            resourceServiceName: _readResourceServiceName(core, inst.channel)
        });
    }

    // Record the Application Insights related globals so that unexpected collisions are visible
    var globalNames = [];
    for (var name in window) {
        if (name.indexOf("appInsights") === 0 || name.indexOf("Microsoft") === 0 || name.indexOf("ai") === 0) {
            globalNames.push(name);
        }
    }
    diagnostics.globals.names = globalNames.sort();

    return diagnostics;
}

function _readResourceServiceName(core, channel) {
    try {
        var extCfg = core && core.config && core.config.extensionConfig;
        var cfg = extCfg ? extCfg[channel.identifier] : null;
        return cfg && cfg.resourceAttributes ? cfg.resourceAttributes["service.name"] : null;
    } catch (e) {
        return null;
    }
}

var _objectIds = [];

/**
 * Returns a stable identity for an object so that two instances sharing an object can be detected.
 */
function _objectId(obj) {
    if (!obj) {
        return null;
    }

    for (var lp = 0; lp < _objectIds.length; lp++) {
        if (_objectIds[lp] === obj) {
            return lp;
        }
    }

    _objectIds.push(obj);

    return _objectIds.length - 1;
}

/**
 * Runs the whole sequence for a page: generate every kind of telemetry, then flush.
 * @param pageName - The logical name of the page.
 */
export function runPage(pageName) {
    var summary = { page: pageName, generated: 0, spans: 0 };

    summary.generated = generateAll(pageName);
    summary.spans = generateSpans(pageName);

    return generateDependencies().then(function () {
        // Give the dependency plugin a moment to record the completed requests
        return new Promise(function (resolve) {
            setTimeout(resolve, 300);
        });
    }).then(function () {
        return flushAll();
    }).then(function () {
        summary.diagnostics = getDiagnostics();
        window.__otlpPageComplete = summary;
        return summary;
    });
}

export { initSku, getSkuDiagnostics, generateSku, flushSku, unloadSku } from "./custom-sku";
