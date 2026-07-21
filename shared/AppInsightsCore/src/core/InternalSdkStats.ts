// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { doAwaitResponse } from "@nevware21/ts-async";
import {
    ITimerHandler, arrIndexOf, isNumber, isString, objDefineProps, objForEachKey, scheduleTimeout, strEndsWith, strIndexOf, strLower,
    strStartsWith, strSubstring, utcNow
} from "@nevware21/ts-utils";
import { onConfigChange } from "../config/DynamicConfig";
import { DEFAULT_BREEZE_PATH, DisabledPropertyName } from "../constants/Constants";
import { STR_EMPTY } from "../constants/InternalConstants";
import { _throwInternal, safeGetLogger } from "../diagnostics/DiagnosticLogger";
import { _eInternalMessageId, eLoggingSeverity } from "../enums/ai/LoggingEnums";
import { IAppInsightsCore } from "../interfaces/ai/IAppInsightsCore";
import { IConfiguration } from "../interfaces/ai/IConfiguration";
import {
    IInternalSdkStats, IInternalSdkStatsCfgResult, IInternalSdkStatsState, InternalSdkStatsCfgFetchFn
} from "../interfaces/ai/IInternalSdkStats";
import { IInternalSdkStatsNetwork } from "../interfaces/ai/IInternalSdkStatsNetwork";
import { IStatsMgr } from "../interfaces/ai/IStatsMgr";
import { ITelemetryItem } from "../interfaces/ai/ITelemetryItem";
import { IPayloadData } from "../interfaces/ai/IXHROverride";
import { IConfigDefaults } from "../interfaces/config/IConfigDefaults";
import { MetricDataType } from "../telemetry/ai/DataTypes";
import { getJSON, isFetchSupported, isXhrSupported } from "../utils/EnvUtils";
import { getResponseText, isFeatureEnabled, openXhr } from "../utils/HelperFuncs";

const STATS_COLLECTION_SHORT_INTERVAL: number = 900000; // 15 minutes
const STATS_MIN_INTERVAL_SECONDS = 60; // 1 minute
const STATS_LANGUAGE = "JavaScript";
const STATS_TYPE = "Browser";

/**
 * The placeholder instrumentation key used when reporting SDK statistics to the distro-owned
 * SDK Stats ingestion endpoint. The endpoint does not require authentication, the placeholder
 * key only satisfies the connection-string / envelope iKey requirement and is ignored
 * server-side. This matches the convention used by the Microsoft OpenTelemetry distros.
 */
export const STATS_SDK_IKEY = "00000000-0000-0000-0000-000000000000";

/**
 * SDK Stats config endpoints (`cfg/v1.json`). The `{ ver, enabled, url }` JSON is read at runtime to
 * gate collection and resolve the ingestion host. EU endpoint is used for EU data-boundary regions.
 */
export const STATS_SDK_CFG_URL_NON_EU = "https://data.stats.monitor.azure.com/cfg/v1.json";
export const STATS_SDK_CFG_URL_EU = "https://eu-data.stats.monitor.azure.com/cfg/v1.json";

/** Ingestion path for future 1DS (OneCollector) SDK Stats; the AI SKU uses {@link DEFAULT_BREEZE_PATH}. */
export const STATS_SDK_ONECOLLECTOR_PATH = "/OneCollector/1.0";

/**
 * The transient marker key, set on the {@link ITelemetryItem.data} of a SDK Stats event, that
 * carries the destination SDK Stats ingestion endpoint. The sending channel reads this value to
 * redirect the event to the SDK Stats endpoint and removes it before serializing the event.
 */
export const STATS_SDK_ENDPOINT_KEY = "_sdkStatsEndpoint";

/**
 * The default feature name used to gate the SDK Stats manager. SDK Stats is enabled by default
 * and can be opted-out via the featureOptIn configuration using this name.
 */
export const STATS_SDK_FEATURE = "sdkStats";

// EU data-boundary regions, mirrors the EU region set used by the Azure Monitor OpenTelemetry exporter
const STATS_EU_REGIONS = [
    "francecentral", "francesouth", "germanywestcentral", "northeurope", "norwayeast", "norwaywest",
    "swedencentral", "switzerlandnorth", "switzerlandwest", "uksouth", "ukwest", "westeurope"
];

/**
 * Determine whether the provided customer endpoint maps to an EU data-boundary region. The region
 * is extracted from the host (the leading host label, with any region replica suffix removed) and
 * matched against the known EU data-boundary regions.
 * @param endpoint - The customer breeze endpoint that the SDK Stats are being collected for.
 * @returns true when the endpoint maps to an EU region, false otherwise (including unknown regions).
 */
function _isEuEndpoint(endpoint: string): boolean {
    let isEU = false;
    if (endpoint) {
        let host = strLower(endpoint);
        // Strip the scheme
        let schemeIdx = strIndexOf(host, "://");
        if (schemeIdx !== -1) {
            host = strSubstring(host, schemeIdx + 3);
        }

        // Extract the leading host label, e.g. "westeurope-5" from "westeurope-5.in.applicationinsights.azure.com/"
        let label = host.split("/")[0].split(".")[0];
        // Remove any trailing region replica suffix, e.g. "westeurope-5" => "westeurope"
        let dashIdx = strIndexOf(label, "-");
        if (dashIdx !== -1) {
            label = strSubstring(label, 0, dashIdx);
        }

        isEU = arrIndexOf(STATS_EU_REGIONS, label) !== -1;
    }

    return isEU;
}

/**
 * Returns the SDK Stats config URL (`cfg/v1.json`) for the endpoint (EU vs non-EU).
 */
export function getStatsCfgUrl(endpoint: string): string {
    return _isEuEndpoint(endpoint) ? STATS_SDK_CFG_URL_EU : STATS_SDK_CFG_URL_NON_EU;
}

/** Parse the SDK Stats config JSON (`{ ver, enabled, url }`); null if empty or unparseable. */
function _parseStatsCfg(response: string): IInternalSdkStatsCfgResult {
    let result: IInternalSdkStatsCfgResult = null;
    let json = getJSON();
    if (response && json) {
        try {
            let cfg = json.parse(response);
            if (cfg) {
                result = {
                    // Fail-closed: only treat as enabled when explicitly true
                    enabled: cfg.enabled === true,
                    url: isString(cfg.url) ? cfg.url : null
                };
            }
        } catch (e) {
            // Unparseable -> no config available
        }
    }

    return result;
}

/** Default SDK Stats config fetch (fetch, else XHR); calls oncomplete with the parsed config or null. */
function _defaultStatsCfgFetch(cfgUrl: string, oncomplete: (result: IInternalSdkStatsCfgResult) => void): void {
    function _complete(response?: string) {
        try {
            oncomplete(response ? _parseStatsCfg(response) : null);
        } catch (e) {
            // Ignore callback errors
        }
    }

    try {
        if (isFetchSupported()) {
            let init: RequestInit = { method: "GET" };
            init[DisabledPropertyName] = true;

            doAwaitResponse(fetch(cfgUrl, init), (result) => {
                let response = result.value;
                if (!result.rejected && response && response.ok) {
                    doAwaitResponse(response.text(), (res) => {
                        _complete(res.rejected ? null : res.value);
                    });
                } else {
                    _complete();
                }
            });
        } else if (isXhrSupported()) {
            // openXhr marks the request disabled so it isn't self-tracked
            let xhr = openXhr("GET", cfgUrl, false, true, false, 10000);
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    _complete(xhr.status >= 200 && xhr.status < 400 ? getResponseText(xhr) : null);
                }
            };
            xhr.onerror = () => {
                _complete();
            };
            xhr.ontimeout = () => {
                _complete();
            };
            xhr.send();
        } else {
            _complete();
        }
    } catch (e) {
        _complete();
    }
}

/** Build the ingestion endpoint from the config host: `https://<host>` + {@link DEFAULT_BREEZE_PATH}. */
function _buildStatsEndpoint(host: string): string {
    let endpoint: string = null;
    if (host) {
        let base = strStartsWith(strLower(host), "http") ? host : "https://" + host;
        if (strEndsWith(base, "/")) {
            base = strSubstring(base, 0, base.length - 1);
        }

        endpoint = base + DEFAULT_BREEZE_PATH;
    }

    return endpoint;
}


/**
 * An internal interface to allow the IInternalSdkStats instance to call back to the manager for
 * critical tasks, like starting the timer, sending the events and to inform the manager
 * that this instance is stopping. This is used to ensure that the manager is able to
 * track and control the lifecycle of the instance.
 * @internal
 */
interface _IMgrCallbacks {
    /**
     * Provides a callback to the manager to start a timer for the internalSdkStats instance.
     * This is used to ensure that the manager is able to control the lifecycle of the instance
     * @param cb - The callback to call when the timer is started
     * @returns A handle to the timer that was started, this can be used to cancel the timer if needed
     */
    start: (cb: () => void) => ITimerHandler;

    /**
     * Provides a callback to the manager to send the internalSdkStats event to the core.
     * This is used to ensure that the manager is able to control the lifecycle of the instance
     * @param internalSdkStatsEvent - The internalSdkStats event to send to the core
     * @param endpoint - The endpoint to send the event to
     */
    track: (internalSdkStats: IInternalSdkStats, internalSdkStatsEvent: ITelemetryItem) => void;
}

/**
 * Creates a new IInternalSdkStatsNetwork instance with the specified host.
 * @param host - The host for the IInternalSdkStatsNetwork instance.
 * @returns A new IInternalSdkStatsNetwork instance.
 */
function _createInternalSdkStatsNetwork(host: string): IInternalSdkStatsNetwork {
    return {
        host,
        totalRequest: 0,
        success: 0,
        throttle: {},
        failure: {},
        retry: {},
        exception: {},
        requestDuration: 0
    };
}

/**
 * Creates a new IInternalSdkStats instance with the specified manager callbacks and internalSdkStats state.
 * @param mgr - The manager callbacks to use for the IInternalSdkStats instance.
 * @param internalSdkStatsStats - The internalSdkStats state to use for the IInternalSdkStats instance.
 * @returns A new IInternalSdkStats instance.
 */
function _createInternalSdkStats(mgr: _IMgrCallbacks, internalSdkStatsStats: IInternalSdkStatsState): IInternalSdkStats {
    let _networkCounter: IInternalSdkStatsNetwork = _createInternalSdkStatsNetwork(internalSdkStatsStats.endpoint);
    let _timeoutHandle: ITimerHandler;      // Handle to the timer for sending telemetry. This way, we would not send telemetry when system sleep.
    let _isEnabled: boolean = true;         // Flag to check if internalSdkStats is enabled or not

    function _setupTimer() {
        if (_isEnabled && !_timeoutHandle) {
            _timeoutHandle = mgr.start(() => {
                _timeoutHandle = null;
                trackInternalSdkStats();
            });
        }
    }

    function trackInternalSdkStats() {
        if (_isEnabled) {
            _trackSendRequestDuration();
            _trackSendRequestsCount();
            _networkCounter = _createInternalSdkStatsNetwork(_networkCounter.host);
            _timeoutHandle && _timeoutHandle.cancel();
            _timeoutHandle = null;
        }
    }

    /**
     * This is a simple helper that checks if the currently reporting endpoint is the same as this instance was
     * created with. This is used to ensure that we only send internalSdkStats events to the endpoint that was used
     * when the instance was created. This is important as the endpoint can change during the lifetime of the
     * instance and we don't want to send internalSdkStats events to the wrong endpoint.
     * @param endpoint
     * @returns true if the endpoint is the same as the one used to create the instance, false otherwise
     */
    function _checkEndpoint(endpoint: string) {
        return _networkCounter.host === endpoint;
    }

    function _inc(counter: { [key: string]: number }, key: string | number) {
        counter[key] = (counter[key] || 0) + 1;
    }

    /**
     * Attempt to send internalSdkStats events to the server. This is done by creating a new event and sending it to the core.
     * The event is created with the name and value passed in, and any additional properties are added to the event as well.
     * This will only send the event when
     * - the internalSdkStats is enabled
     * - the internalSdkStats key is set for the current endpoint
     * - the value is greater than 0
     * @param name - The name of the event to send
     * @param val - The value of the event to send
     * @param properties - Optional additional properties to add to the event
     */
    function _sendInternalSdkStatss(name: string, val: number, properties?: { [name: string]: any }) {
        if (_isEnabled && val && val > 0){
            // Add extra properties
            let baseProperties = {
                "rp": "unknown",
                "attach": "Manual",
                "cikey": internalSdkStatsStats.cKey,
                "os": STATS_TYPE,
                "language": STATS_LANGUAGE,
                "version": internalSdkStatsStats.sdkVer || "unknown",
                "endpoint": "breeze",
                "host": _networkCounter.host
            } as { [key: string]: any };

            let combinedProps: { [key: string]: any } = {};
            objForEachKey(properties, (key, value) => {
                combinedProps[key] = value;
            });
            objForEachKey(baseProperties, (key, value) => {
                combinedProps[key] = value;
            });

            let internalSdkStatsEvent: ITelemetryItem = {
                name: name,
                baseData: {
                    name: name,
                    average: val,
                    properties: combinedProps
                },
                baseType: MetricDataType
            };

            // The destination iKey and (optional) SDK Stats ingestion endpoint are resolved and
            // stamped by the manager (see _track) based on the current (dynamic) configuration.
            mgr.track(internalSdkStats, internalSdkStatsEvent);
        }
    }

    function _trackSendRequestDuration() {
        var totalRequest = _networkCounter.totalRequest;

        if (totalRequest > 0 ) {
            _sendInternalSdkStatss("Request_Duration", _networkCounter.requestDuration / totalRequest);
        }
    }

    function _sendCounts(counts: { [code: string]: number }, name: string, codeKey: string) {
        for (const code in counts) {
            let props: { [key: string]: any } = {};
            props[codeKey] = code;
            _sendInternalSdkStatss(name, counts[code], props);
        }
    }

    function _trackSendRequestsCount() {
        var currentCounter = _networkCounter;
        _sendInternalSdkStatss("Request_Success_Count", currentCounter.success);
        _sendCounts(currentCounter.failure, "failure", "statusCode");
        _sendCounts(currentCounter.retry, "retry", "statusCode");
        _sendCounts(currentCounter.exception, "exception", "exceptionType");
        _sendCounts(currentCounter.throttle, "Throttle_Count", "statusCode");
    }

    function _setEnabled(isEnabled: boolean) {
        _isEnabled = isEnabled;
        if (!_isEnabled) {
            if (_timeoutHandle) {
                _timeoutHandle.cancel();
                _timeoutHandle = null;
            }
        }
    }

    // THE internalSdkStats instance being created and returned
    let internalSdkStats: IInternalSdkStats = {
        enabled: !!_isEnabled,
        endpoint: STR_EMPTY,
        count: (status: number, payloadData: IPayloadData, endpoint: string) => {
            if (_isEnabled && _checkEndpoint(endpoint)) {
                let statsData = payloadData && (payloadData as any)["statsData"];
                let startTime = statsData && statsData["startTime"];
                if (startTime) {
                    _networkCounter.totalRequest++;
                    _networkCounter.requestDuration += utcNow() - startTime;
                }

                let retryArray = [401, 403, 408, 429, 500, 502, 503, 504];
                let throttleArray = [402, 439];

                if (status >= 200 && status < 300) {
                    _networkCounter.success++;
                } else if (retryArray.indexOf(status) !== -1) {
                    _inc(_networkCounter.retry, status);
                } else if (throttleArray.indexOf(status) !== -1) {
                    _inc(_networkCounter.throttle, status);
                } else if (status !== 307 && status !== 308) {
                    _inc(_networkCounter.failure, status);
                }

                _setupTimer();
            }
        },
        countException: (endpoint: string, exceptionType: string) => {
            if (_isEnabled && _checkEndpoint(endpoint)) {
                _inc(_networkCounter.exception, exceptionType);
                _setupTimer();
            }
        }
    };

    // Make the properties readonly / reactive to changes
    return objDefineProps(internalSdkStats, {
        enabled: { g: () => _isEnabled, s: _setEnabled },
        endpoint: { g: () => _networkCounter.host }
    });
}

export function createStatsMgr(): IStatsMgr {
    let _isMgrEnabled: boolean = false; // Flag to check if internalSdkStats is enabled or not
    let _core: IAppInsightsCore; // The core instance that is used to send telemetry
    let _shortInterval = STATS_COLLECTION_SHORT_INTERVAL;
    let _statsCfgFetchFn: InternalSdkStatsCfgFetchFn;
    // Resolved remote config cached per cfg URL (EU / non-EU); tracks in-flight fetch and last result.
    let _cfgCache: { [cfgUrl: string]: { pending: boolean, result: IInternalSdkStatsCfgResult } } = {};

    // Lazily initialize the manager and start listening for configuration changes
    // This is also required to handle "unloading" and then re-initializing again
    function _init<CfgType extends IConfiguration = IConfiguration>(core: IAppInsightsCore<CfgType>, featureName?: string) {
        if (_core) {
            // If the core is already set, then just return with an empty unload hook
            _throwInternal(safeGetLogger(core), eLoggingSeverity.WARNING, _eInternalMessageId.InternalSdkStatsManagerException, "InternalSdkStats manager is already initialized");
            return null;
        }

        _core = core;
        if (core && core.isInitialized()) {
            // Start listening for configuration changes from the single global config, within a config
            // change handler. This supports the scenario where the config is changed after the manager
            // has been created (including CDN / dynamic config updates).
            return onConfigChange<IConfiguration>(core.config, (details) => {
                // Re-evaluate the feature flag on every config change (enabled by default, opt-out via featureOptIn)
                _isMgrEnabled = false;
                _statsCfgFetchFn = null;
                if (isFeatureEnabled(featureName || STATS_SDK_FEATURE, details.cfg, true) === true) {
                    // Seed the SDK Stats defaults into the single global config so they remain dynamic and
                    // can be overridden via the CDN / dynamic config or by the SKU.
                    details.setDf(details.cfg, _sdkStatsDefaults);
                    // Read the nested stats config directly (registers the dynamic dependency on the
                    // stats object) and copy the individual values into local (minifiable) variables
                    // instead of holding the config object and repeatedly reading its properties.
                    let statsCfg = details.cfg.stats;
                    if (statsCfg) {
                        _isMgrEnabled = true;
                        // Make the override fetch fn a dynamic property before snapshotting it so a later
                        // merged (CDN / updateCfg) change to it re-runs this handler and refreshes the local.
                        _statsCfgFetchFn = details.set(statsCfg, "overrideCfgFn", statsCfg.overrideCfgFn);
                        _shortInterval = STATS_COLLECTION_SHORT_INTERVAL; // Reset to the default in-case the config is removed / changed
                        if (isNumber(statsCfg.shrtInt) && statsCfg.shrtInt > STATS_MIN_INTERVAL_SECONDS) {
                            _shortInterval = statsCfg.shrtInt * 1000; // Convert to milliseconds
                        }
                    }
                }
            });
        }
    }

    /**
     * Resolve the remote SDK Stats config for the endpoint, starting a fetch on first use. Returns
     * null until resolved (or on failure) so the caller skips sending.
     */
    function _resolveStatsCfg(endpoint: string): IInternalSdkStatsCfgResult {
        let cfgUrl = getStatsCfgUrl(endpoint);
        let entry = _cfgCache[cfgUrl];
        if (!entry) {
            entry = _cfgCache[cfgUrl] = { pending: false, result: null };
        }

        if (!entry.result && !entry.pending) {
            entry.pending = true;
            let fetchFn = _statsCfgFetchFn || _defaultStatsCfgFetch;
            try {
                fetchFn(cfgUrl, (result) => {
                    entry.pending = false;
                    // null on failure so a later interval retries
                    entry.result = result;
                });
            } catch (e) {
                // Reset so a later interval retries
                entry.pending = false;
            }
        }

        return entry.result;
    }

    function _track(internalSdkStats: IInternalSdkStats, internalSdkStatsEvent: ITelemetryItem) {
        if (_isMgrEnabled) {
            // The remote cfg file is the sole authority for whether collection is enabled and where
            // to send the events. Re-resolved here (rather than cached on the instance) to support the
            // endpoint changing after the instance was created.
            let cfgResult = _resolveStatsCfg(internalSdkStats.endpoint);
            if (!cfgResult || !cfgResult.enabled) {
                // Not resolved yet, or disabled -> skip
                return;
            }

            let url = _buildStatsEndpoint(cfgResult.url);
            if (!url) {
                // Enabled but no usable host -> skip
                return;
            }

            internalSdkStatsEvent.iKey = STATS_SDK_IKEY;
            // Carry the SDK Stats ingestion endpoint so the sending channel can redirect the event
            // away from the customer's breeze endpoint. This marker is removed by the channel before
            // the event is serialized.
            internalSdkStatsEvent.data = internalSdkStatsEvent.data || {};
            internalSdkStatsEvent.data[STATS_SDK_ENDPOINT_KEY] = url;

            _core.track(internalSdkStatsEvent);
        }
    }

    function _createInstance(state: IInternalSdkStatsState): IInternalSdkStats {
        let instance: IInternalSdkStats = null;

        if (_isMgrEnabled) {
            // Prefetch the remote config so it's ready by the first interval
            if (state && state.endpoint) {
                _resolveStatsCfg(state.endpoint);
            }

            let callbacks: _IMgrCallbacks = {
                start: (cb: () => void) => {
                    return scheduleTimeout(cb, _shortInterval);
                },
                track: _track
            };

            instance = _createInternalSdkStats(callbacks, state);
        }

        return instance;
    }

    let theMgr = {
        enabled: false,
        newInst: _createInstance,
        init: _init
    };

    return objDefineProps(theMgr, {
        "enabled": { g: () => _isMgrEnabled }
    });
}

/**
 * The default {@link IInternalSdkStatsConfig} values for SDK Stats collection. These are seeded into the
 * single global config (via {@link IWatchDetails.setDf}) by the manager so they remain dynamic and
 * can be overridden at runtime via the CDN / dynamic config or by the SKU (AISKU / 1DS). The events
 * are routed to the distro-owned SDK Stats ingestion endpoint, whose host (and whether collection is
 * enabled) is read at runtime from the SDK Stats configuration (`data.stats.monitor.azure.com` /
 * `eu-data.stats.monitor.azure.com`). SDK Stats are enabled by default and can be opted-out using the
 * `featureOptIn` configuration with the {@link STATS_SDK_FEATURE} name.
 */
const _sdkStatsDefaults: IConfigDefaults<IConfiguration> = {
    // Seeding an (empty) stats object enables the manager by default; the destination and enabled
    // state are resolved per-event from the remote SDK Stats configuration. A plain object (rather
    // than cfgDfMerge) is used so setDf seeds and makes the stats property dynamic without marking
    // it as a reference (avoiding the in-place reference side effect).
    stats: {}
};
