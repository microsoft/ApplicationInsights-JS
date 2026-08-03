/*
 * A "custom SKU" built directly on AppInsightsCore, wiring the real OfflineChannel in front of the
 * OTLP channel in a single channel queue:
 *
 *     OfflineChannel (priority 1000)  ->  OtlpChannel (priority 1021)
 *
 * This exists to answer a specific question: does the OTLP channel still work when a customer places
 * it behind other channels?
 *
 * The important subtlety is that the offline channel resolves its "online" channel by identifier
 * from `primaryOnlineChannelId`, which defaults to the Application Insights sender and the 1DS post
 * channel. A SKU that has neither must name the OTLP channel explicitly, otherwise the offline
 * channel finds no online channel and silently stores nothing.
 */
import { AppInsightsCore } from "@microsoft/applicationinsights-core-js";
import { OfflineChannel } from "@microsoft/applicationinsights-offlinechannel-js";
import { OtlpChannel } from "@microsoft/applicationinsights-otlpchannel-js";

var _state = null;

function _resolveEndpoint() {
    var match = /[?&]collector=([^&]+)/.exec(window.location.search);
    if (match) {
        return decodeURIComponent(match[1]).replace(/\/+$/, "");
    }

    try {
        var stored = window.localStorage.getItem("otlpExample.collector");
        if (stored) {
            return stored.replace(/\/+$/, "");
        }
    } catch (e) {
        // ignore
    }

    return window.location.origin;
}

/**
 * Builds the custom SKU.
 * @param nameOnlineChannel - When true, the offline channel is told that the OTLP channel is its
 * online channel. When false the default is left in place, which demonstrates the misconfiguration.
 */
export function initSku(nameOnlineChannel) {
    var endpoint = _resolveEndpoint();
    var core = new AppInsightsCore();
    var offlineChannel = new OfflineChannel();
    var otlpChannel = new OtlpChannel();

    var extensionConfig = {};
    extensionConfig[otlpChannel.identifier] = {
        endpointUrl: endpoint,
        maxBatchInterval: 2000,
        maxRecordsPerBatch: 50,
        metricsAsLogs: true,
        resourceAttributes: {
            "service.name": "custom-sku",
            "test.instance.marker": "custom-sku",
            "test.page": "custom-sku"
        }
    };

    extensionConfig[offlineChannel.identifier] = nameOnlineChannel
        ? { primaryOnlineChannelId: [otlpChannel.identifier] }
        : {};

    core.initialize({
        instrumentationKey: "33333333-3333-3333-3333-333333333333",
        endpointUrl: endpoint,
        channels: [[ offlineChannel, otlpChannel ]],
        extensionConfig: extensionConfig
    }, []);

    _state = {
        core: core,
        offlineChannel: offlineChannel,
        otlpChannel: otlpChannel,
        endpoint: endpoint,
        namedOnlineChannel: !!nameOnlineChannel
    };

    window.__customSku = _state;

    return getSkuDiagnostics();
}

/**
 * Reports how the chain actually resolved, which is what needs verifying.
 */
export function getSkuDiagnostics() {
    if (!_state) {
        return { initialized: false };
    }

    var core = _state.core;
    var channels = [];
    var coreChannels = core.getChannels() || [];
    for (var lp = 0; lp < coreChannels.length; lp++) {
        channels.push({
            identifier: coreChannels[lp].identifier,
            priority: coreChannels[lp].priority
        });
    }

    // The offline channel finds its online channel through core.getPlugin(<identifier>)
    var resolved = core.getPlugin(_state.otlpChannel.identifier);
    var offlineSupport = null;
    try {
        var support = _state.otlpChannel.getOfflineSupport();
        offlineSupport = {
            url: support.getUrl(),
            canSerialize: !!support.serialize({
                name: "probe",
                baseType: "MessageData",
                baseData: { message: "probe" }
            })
        };
    } catch (e) {
        offlineSupport = { error: String(e) };
    }

    return {
        initialized: true,
        endpoint: _state.endpoint,
        namedOnlineChannel: _state.namedOnlineChannel,
        channels: channels,
        otlpIsLast: channels.length > 0 && channels[channels.length - 1].identifier === "OtlpChannel",
        otlpResolvableByIdentifier: !!(resolved && resolved.plugin),
        offlineSupport: offlineSupport
    };
}

/**
 * Generates telemetry through the custom SKU.
 */
export function generateSku() {
    if (!_state) {
        return 0;
    }

    var core = _state.core;
    var count = 0;

    function track(item) {
        core.track(item);
        count++;
    }

    track({
        name: "Microsoft.ApplicationInsights.Message",
        iKey: core.config.instrumentationKey,
        baseType: "MessageData",
        baseData: { message: "custom sku trace", severityLevel: 1, properties: { "test.marker": "custom-sku" } }
    });

    track({
        name: "Microsoft.ApplicationInsights.Event",
        iKey: core.config.instrumentationKey,
        baseType: "EventData",
        baseData: { name: "custom-sku-event", properties: { "test.marker": "custom-sku" } }
    });

    track({
        name: "Microsoft.ApplicationInsights.RemoteDependency",
        iKey: core.config.instrumentationKey,
        baseType: "RemoteDependencyData",
        baseData: {
            id: "|4bf92f3577b34da6a3ce929d0e0e4736.00f067aa0ba902b7.",
            name: "GET /custom-sku",
            target: "https://custom.example.com:8443/api",
            type: "Http",
            duration: 12,
            success: true,
            responseCode: 200,
            properties: { "test.marker": "custom-sku" }
        }
    });

    return count;
}

/**
 * Flushes the custom SKU's OTLP channel.
 */
export function flushSku() {
    if (!_state) {
        return Promise.resolve();
    }

    _state.otlpChannel.flush(true);

    return new Promise(function (resolve) {
        setTimeout(resolve, 600);
    });
}

/**
 * Tears the custom SKU down.
 */
export function unloadSku() {
    if (_state && _state.core.isInitialized()) {
        _state.otlpChannel.pause();
        _state.core.unload(false);
    }

    _state = null;
}
