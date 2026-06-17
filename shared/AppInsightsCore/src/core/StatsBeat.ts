// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    ITimerHandler, arrForEach, isNumber, makeGlobRegex, objDefineProps, scheduleTimeout, strIndexOf, strLower, utcNow
} from "@nevware21/ts-utils";
import { onConfigChange } from "../config/DynamicConfig";
import { STR_EMPTY } from "../constants/InternalConstants";
import { _throwInternal, safeGetLogger } from "../diagnostics/DiagnosticLogger";
import { _eInternalMessageId, eLoggingSeverity } from "../enums/ai/LoggingEnums";
import { eStatsEndpointType, eStatsType } from "../enums/ai/StatsType";
import { IAppInsightsCore } from "../interfaces/ai/IAppInsightsCore";
import { IConfiguration } from "../interfaces/ai/IConfiguration";
import { INetworkStatsbeat } from "../interfaces/ai/INetworkStatsbeat";
import { IStatsBeat, IStatsBeatConfig, IStatsBeatKeyMap, IStatsBeatState, IStatsEndpointConfig } from "../interfaces/ai/IStatsBeat";
import { IStatsMgr, IStatsMgrConfig } from "../interfaces/ai/IStatsMgr";
import { ITelemetryItem } from "../interfaces/ai/ITelemetryItem";
import { IPayloadData } from "../interfaces/ai/IXHROverride";
import { isFeatureEnabled } from "../utils/HelperFuncs";

const STATS_COLLECTION_SHORT_INTERVAL: number = 900000; // 15 minutes
const STATS_MIN_INTERVAL_SECONDS = 60; // 1 minute
const STATSBEAT_LANGUAGE = "JavaScript";
const STATSBEAT_TYPE = "Browser";

/**
 * The placeholder instrumentation key used when reporting SDK statistics to the distro-owned
 * SDK Stats ingestion endpoint. The endpoint does not require authentication, the placeholder
 * key only satisfies the connection-string / envelope iKey requirement and is ignored
 * server-side. This matches the convention used by the Microsoft OpenTelemetry distros.
 */
export const STATS_SDK_IKEY = "00000000-0000-0000-0000-000000000000";

/**
 * Distro-owned SDK statistics ingestion endpoints. SDK Stats events are routed here instead of
 * to the customer's breeze endpoint. The EU endpoint is used when the customer's endpoint maps
 * to an EU data-boundary region, otherwise the non-EU endpoint is used.
 * @see https://github.com/microsoft/opentelemetry-distro-dotnet
 */
export const STATS_SDK_ENDPOINT_NON_EU = "https://stats.monitor.azure.com/v2/track";
export const STATS_SDK_ENDPOINT_EU = "https://eu.stats.monitor.azure.com/v2/track";

/**
 * The Microsoft-owned instrumentation keys used when reporting SDK statistics to the legacy
 * breeze ingestion endpoints (the customer's own breeze endpoint is used as the host, only the
 * iKey differs so the data lands in the Microsoft SDK Stats resource). The EU key is used when
 * the customer's endpoint maps to an EU data-boundary region, otherwise the non-EU key is used.
 */
export const STATS_BREEZE_IKEY_NON_EU = "c4a29126-a7cb-47e5-b348-11414998b11e";
export const STATS_BREEZE_IKEY_EU = "7dc56bab-3c0c-4e9f-9ebb-d1acadee8d0f";

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
            host = host.substring(schemeIdx + 3);
        }

        // Extract the leading host label, e.g. "westeurope-5" from "westeurope-5.in.applicationinsights.azure.com/"
        let label = host.split("/")[0].split(".")[0];
        // Remove any trailing region replica suffix, e.g. "westeurope-5" => "westeurope"
        let dashIdx = strIndexOf(label, "-");
        if (dashIdx !== -1) {
            label = label.substring(0, dashIdx);
        }

        arrForEach(STATS_EU_REGIONS, (region) => {
            if (region === label) {
                isEU = true;
                return -1;
            }
        });
    }

    return isEU;
}

/**
 * Determine the distro-owned SDK Stats ingestion endpoint for the provided customer endpoint.
 * When the region maps to an EU region the EU endpoint is returned, otherwise (including unknown
 * regions) the non-EU endpoint is returned.
 * @param endpoint - The customer breeze endpoint that the SDK Stats are being collected for.
 * @returns The SDK Stats ingestion endpoint URL.
 */
export function getStatsEndpoint(endpoint: string): string {
    return _isEuEndpoint(endpoint) ? STATS_SDK_ENDPOINT_EU : STATS_SDK_ENDPOINT_NON_EU;
}

/**
 * Determine the Microsoft-owned instrumentation key to use when reporting SDK Stats to the legacy
 * breeze endpoint for the provided customer endpoint. When the region maps to an EU region the EU
 * key is returned, otherwise (including unknown regions) the non-EU key is returned.
 * @param endpoint - The customer breeze endpoint that the SDK Stats are being collected for.
 * @returns The breeze SDK Stats instrumentation key.
 */
export function getStatsBreezeIKey(endpoint: string): string {
    return _isEuEndpoint(endpoint) ? STATS_BREEZE_IKEY_EU : STATS_BREEZE_IKEY_NON_EU;
}


/**
 * An internal interface to allow the IStatsBeat instance to call back to the manager for
 * critical tasks, like starting the timer, sending the events and to inform the manager
 * that this instance is stopping. This is used to ensure that the manager is able to
 * track and control the lifecycle of the instance.
 * @internal
 */
interface _IMgrCallbacks {
    /**
     * Provides a callback to the manager to start a timer for the statsbeat instance.
     * This is used to ensure that the manager is able to control the lifecycle of the instance
     * @param cb - The callback to call when the timer is started
     * @returns A handle to the timer that was started, this can be used to cancel the timer if needed
     */
    start: (cb: () => void) => ITimerHandler;

    /**
     * Provides a callback to the manager to send the statsbeat event to the core.
     * This is used to ensure that the manager is able to control the lifecycle of the instance
     * @param statsbeatEvent - The statsbeat event to send to the core
     * @param endpoint - The endpoint to send the event to
     */
    track: (statsBeat: IStatsBeat, statsbeatEvent: ITelemetryItem) => void;
}

/**
 * This function checks if the provided endpoint matches the provided urlMatch. It
 * compares the endpoint with the urlMatch in a case-insensitive manner and also checks
 * if the endpoint is a substring of the urlMatch. The urlMatch can also be a regex
 * pattern, in which case it will be checked against the endpoint using regex.
 * @param endpoint - The endpoint to check against the URL.
 * @param urlMatch - The URL to check against the endpoint.
 * @returns true if the URL matches the endpoint, false otherwise.
 */
function _isMatchEndpoint(endpoint: string, urlMatch: string): boolean {
    let lwrUrl = strLower(urlMatch);

    // Check if the endpoint is a substring of the URL
    if (strIndexOf(endpoint, lwrUrl) !== -1) {
        return true;
    }

    // If it looks like a regex pattern, check if the endpoint matches the regex
    if (strIndexOf(lwrUrl, "*") != -1 || strIndexOf(lwrUrl, "?") != -1) {
        // Check if the endpoint is a regex pattern
        let regex = makeGlobRegex(lwrUrl);
        if (regex.test(endpoint)) {
            return true;
        }
    }

    return false;
}

/**
 * Creates a new INetworkStatsbeat instance with the specified host.
 * @param host - The host for the INetworkStatsbeat instance.
 * @returns A new INetworkStatsbeat instance.
 */
function _createNetworkStatsbeat(host: string): INetworkStatsbeat {
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
 * Creates a new IStatsBeat instance with the specified manager callbacks and statsbeat state.
 * @param mgr - The manager callbacks to use for the IStatsBeat instance.
 * @param statsBeatStats - The statsbeat state to use for the IStatsBeat instance.
 * @returns A new IStatsBeat instance.
 */
function _createStatsBeat(mgr: _IMgrCallbacks, statsBeatStats: IStatsBeatState): IStatsBeat {
    let _networkCounter: INetworkStatsbeat = _createNetworkStatsbeat(statsBeatStats.endpoint);
    let _timeoutHandle: ITimerHandler;      // Handle to the timer for sending telemetry. This way, we would not send telemetry when system sleep.
    let _isEnabled: boolean = true;         // Flag to check if statsbeat is enabled or not

    function _setupTimer() {
        if (_isEnabled && !_timeoutHandle) {
            _timeoutHandle = mgr.start(() => {
                _timeoutHandle = null;
                trackStatsbeats();
            });
        }
    }

    function trackStatsbeats() {
        if (_isEnabled) {
            _trackSendRequestDuration();
            _trackSendRequestsCount();
            _networkCounter = _createNetworkStatsbeat(_networkCounter.host);
            _timeoutHandle && _timeoutHandle.cancel();
            _timeoutHandle = null;
        }
    }

    /**
     * This is a simple helper that checks if the currently reporting endpoint is the same as this instance was
     * created with. This is used to ensure that we only send statsbeat events to the endpoint that was used
     * when the instance was created. This is important as the endpoint can change during the lifetime of the
     * instance and we don't want to send statsbeat events to the wrong endpoint.
     * @param endpoint
     * @returns true if the endpoint is the same as the one used to create the instance, false otherwise
     */
    function _checkEndpoint(endpoint: string) {
        return _networkCounter.host === endpoint;
    }

    /**
     * Attempt to send statsbeat events to the server. This is done by creating a new event and sending it to the core.
     * The event is created with the name and value passed in, and any additional properties are added to the event as well.
     * This will only send the event when
     * - the statsbeat is enabled
     * - the statsbeat key is set for the current endpoint
     * - the value is greater than 0
     * @param name - The name of the event to send
     * @param val - The value of the event to send
     * @param properties - Optional additional properties to add to the event
     */
    function _sendStatsbeats(name: string, val: number, properties?: { [name: string]: any }) {
        if (_isEnabled && val && val > 0){
            // Add extra properties
            let baseProperties = {
                "rp": "unknown",
                "attach": "Manual",
                "cikey": statsBeatStats.cKey,
                "os": STATSBEAT_TYPE,
                "language": STATSBEAT_LANGUAGE,
                "version": statsBeatStats.sdkVer || "unknown",
                "endpoint": "breeze",
                "host": _networkCounter.host
            } as { [key: string]: any };

            // Manually merge properties instead of using spread syntax
            let combinedProps: { [key: string]: any } = { "host": _networkCounter.host };
            
            // Add properties if present
            if (properties) {
                for (let key in properties) {
                    if (properties.hasOwnProperty(key)) {
                        combinedProps[key] = properties[key];
                    }
                }
            }

            // Add base properties
            for (let key in baseProperties) {
                if (baseProperties.hasOwnProperty(key)) {
                    combinedProps[key] = baseProperties[key];
                }
            }

            let statsbeatEvent: ITelemetryItem = {
                name: name,
                baseData: {
                    name: name,
                    average: val,
                    properties: combinedProps
                },
                baseType: "MetricData"
            };

            // The destination iKey and (optional) SDK Stats ingestion endpoint are resolved and
            // stamped by the manager (see _track) based on the current (dynamic) configuration.
            mgr.track(statsBeat, statsbeatEvent);
        }
    }

    function _trackSendRequestDuration() {
        var totalRequest = _networkCounter.totalRequest;
    
        if (_networkCounter.totalRequest > 0 ) {
            let averageRequestExecutionTime = _networkCounter.requestDuration / totalRequest;
            _sendStatsbeats("Request_Duration", averageRequestExecutionTime);
        }
    }

    function _trackSendRequestsCount() {
        var currentCounter = _networkCounter;
        _sendStatsbeats("Request_Success_Count", currentCounter.success);
        
        for (const code in currentCounter.failure) {
            const count = currentCounter.failure[code];
            _sendStatsbeats("failure", count, { statusCode: code });
        }

        for (const code in currentCounter.retry) {
            const count = currentCounter.retry[code];
            _sendStatsbeats("retry", count, { statusCode: code });
        }

        for (const code in currentCounter.exception) {
            const count = currentCounter.exception[code];
            _sendStatsbeats("exception", count, { exceptionType: code });
        }
    
        for (const code in currentCounter.throttle) {
            const count = currentCounter.throttle[code];
            _sendStatsbeats("Throttle_Count", count, { statusCode: code });
        }
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

    // THE statsbeat instance being created and returned
    let statsBeat: IStatsBeat = {
        enabled: !!_isEnabled,
        endpoint: STR_EMPTY,
        type: eStatsType.SDK,
        count: (status: number, payloadData: IPayloadData, endpoint: string) => {
            if (_isEnabled && _checkEndpoint(endpoint)) {
                if (payloadData && (payloadData as any)["statsBeatData"] && (payloadData as any)["statsBeatData"]["startTime"]) {
                    _networkCounter.totalRequest = (_networkCounter.totalRequest || 0) + 1;
                    _networkCounter.requestDuration += utcNow() - (payloadData as any)["statsBeatData"]["startTime"];
                }

                let retryArray = [401, 403, 408, 429, 500, 502, 503, 504];
                let throttleArray = [402, 439];

                if (status >= 200 && status < 300) {
                    _networkCounter.success++;
                } else if (retryArray.indexOf(status) !== -1) {
                    _networkCounter.retry[status] = (_networkCounter.retry[status] || 0) + 1;
                } else if (throttleArray.indexOf(status) !== -1) {
                    _networkCounter.throttle[status] = (_networkCounter.throttle[status] || 0) + 1;
                } else if (status !== 307 && status !== 308) {
                    _networkCounter.failure[status] = (_networkCounter.failure[status] || 0) + 1;
                }

                _setupTimer();
            }
        },
        countException: (endpoint: string, exceptionType: string) => {
            if (_isEnabled && _checkEndpoint(endpoint)) {
                _networkCounter.exception[exceptionType] = (_networkCounter.exception[exceptionType] || 0) + 1;
                _setupTimer();
            }
        }
    };

    // Make the properties readonly / reactive to changes
    return objDefineProps(statsBeat, {
        enabled: { g: () => _isEnabled, s: _setEnabled },
        type: { g: () => statsBeatStats.type },
        endpoint: { g: () => _networkCounter.host }
    });
}

function _getEndpointCfg(statsBeatConfig: IStatsBeatConfig, type: eStatsType): IStatsEndpointConfig {
    let endpointCfg: IStatsEndpointConfig = null;
    if (statsBeatConfig && statsBeatConfig.endCfg) {
        arrForEach(statsBeatConfig.endCfg, (value) => {
            if (value.type === type) {
                endpointCfg = value;
                return -1; // Stop the loop if we found a match
            }
        });
    }

    return endpointCfg;
}

/**
 * This function retrieves the matching {@link IStatsBeatKeyMap} entry for the given endpoint from
 * the provided endpoint configuration. It iterates through the key maps and checks if the endpoint
 * matches any of the configured URL patterns. If a match is found, the corresponding key map entry
 * (which carries the optional instrumentation key and SDK Stats ingestion endpoint URL) is returned.
 * @param endpointCfg - The endpoint configuration to search.
 * @param endpoint - The endpoint to check against the URLs in the configuration.
 * @returns The matching {@link IStatsBeatKeyMap} entry, or null if no match is found.
 */
function _getKeyMap(endpointCfg: IStatsEndpointConfig, endpoint: string): IStatsBeatKeyMap | null {
    let matched: IStatsBeatKeyMap = null;
    if (endpointCfg.keyMap) {
        arrForEach(endpointCfg.keyMap, (keyMap) => {
            if (keyMap.match) {
                arrForEach(keyMap.match, (url) => {
                    if (_isMatchEndpoint(url, endpoint)) {
                        matched = keyMap;

                        // Stop the loop if we found a match
                        return -1;
                    }
                });
            }

            if (matched) {
                // Stop the loop if we found a match
                return -1;
            }
        });
    }

    return matched;
}

export function createStatsMgr(): IStatsMgr {
    let _isMgrEnabled: boolean = false; // Flag to check if statsbeat is enabled or not
    let _core: IAppInsightsCore; // The core instance that is used to send telemetry
    let _shortInterval = STATS_COLLECTION_SHORT_INTERVAL;
    let _statsBeatConfig: IStatsBeatConfig;

    // Lazily initialize the manager and start listening for configuration changes
    // This is also required to handle "unloading" and then re-initializing again
    function _init<CfgType extends IConfiguration = IConfiguration>(core: IAppInsightsCore<CfgType>, statsConfig: IStatsMgrConfig<CfgType>, featureName?: string) {
        if (_core) {
            // If the core is already set, then just return with an empty unload hook
            _throwInternal(safeGetLogger(core), eLoggingSeverity.WARNING, _eInternalMessageId.StatsBeatManagerException, "StatsBeat manager is already initialized");
            return null;
        }

        _core = core;
        if (core && core.isInitialized()) {
            // Start listening for configuration changes from the core config, within a config change handler
            // This will support the scenario where the config is changed after the statsbeat has been created
            return onConfigChange(core.config, (details) => {
                // Check the feature state again to see if it has changed
                _isMgrEnabled = false;
                if (statsConfig && isFeatureEnabled(statsConfig.feature, details.cfg, true) === true) {
                    // Call the getCfg function to get the latest configuration for the statsbeat instance
                    // This should also evaluate the throttling level and other settings for the statsbeat instance
                    // to determine if it should be enabled or not.
                    _statsBeatConfig = statsConfig.getCfg(core, details.cfg);
                    if (_statsBeatConfig) {
                        _isMgrEnabled = true;
                        _shortInterval = STATS_COLLECTION_SHORT_INTERVAL; // Reset to the default in-case the config is removed / changed
                        if (isNumber(_statsBeatConfig.shrtInt) && _statsBeatConfig.shrtInt > STATS_MIN_INTERVAL_SECONDS) {
                            _shortInterval = _statsBeatConfig.shrtInt * 1000; // Convert to milliseconds
                        }
                    }
                }
            });
        }
    }

    function _track(statsBeat: IStatsBeat, statsBeatEvent: ITelemetryItem) {
        if (_isMgrEnabled && _statsBeatConfig) {
            let endpoint = statsBeat.endpoint;

            // Fetching the matching key map for the endpoint here to support the scenario where the
            // endpoint is changed after the SDK Stats instance is created. This will ensure that the
            // correct key / destination is used for the endpoint, and avoids tracking the event if the
            // endpoint is not in the config.
            let endpointCfg = _getEndpointCfg(_statsBeatConfig, statsBeat.type);
            if (endpointCfg) {
                let keyMap = _getKeyMap(endpointCfg, endpoint);
                // Only send the event if the endpoint matched a configured key map (or the event type
                // is non-zero, preserving the legacy behaviour for explicitly typed stats events).
                if (keyMap || statsBeat.type) {
                    let useBreeze = _statsBeatConfig.mode === eStatsEndpointType.Breeze;

                    // Resolve the iKey to use, falling back to the mode default when the matched key
                    // map does not specify one. Breeze mode uses the Microsoft-owned breeze SDK Stats
                    // iKey (region dependent); the SDK Stats endpoint uses the placeholder iKey.
                    let iKey = (keyMap && keyMap.key) || (useBreeze ? getStatsBreezeIKey(endpoint) : STATS_SDK_IKEY);
                    statsBeatEvent.iKey = iKey;

                    // Resolve the destination SDK Stats ingestion endpoint. When sending to the legacy
                    // breeze endpoint there is no redirect (the event is sent to the customer's endpoint).
                    let url = (keyMap && keyMap.url) || (useBreeze ? null : getStatsEndpoint(endpoint));
                    if (url) {
                        // Carry the SDK Stats ingestion endpoint so the sending channel can redirect the
                        // event away from the customer's breeze endpoint. This marker is removed by the
                        // channel before the event is serialized.
                        statsBeatEvent.data = statsBeatEvent.data || {};
                        statsBeatEvent.data[STATS_SDK_ENDPOINT_KEY] = url;
                    }

                    _core.track(statsBeatEvent);
                }
            }
        }
    }

    function _createInstance(state: IStatsBeatState): IStatsBeat {
        let instance: IStatsBeat = null;

        if (_isMgrEnabled) {
            let callbacks: _IMgrCallbacks = {
                start: (cb: () => void) => {
                    return scheduleTimeout(cb, _shortInterval);
                },
                track: _track
            };

            instance = _createStatsBeat(callbacks, state);
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
 * Create the default {@link IStatsMgrConfig} used to enable the SDK Stats collection. By default the
 * resulting events are routed to the distro-owned SDK Stats ingestion endpoint
 * (`stats.monitor.azure.com` / `eu.stats.monitor.azure.com`). The destination can be changed at
 * runtime via the CDN / dynamic config by setting `config.stats` (an {@link IStatsBeatConfig}) - for
 * example setting `config.stats.mode` to {@link eStatsEndpointType.Breeze} routes SDK Stats to the
 * legacy breeze endpoint instead. SDK Stats are enabled by default and can be opted-out using the
 * `featureOptIn` configuration with the {@link STATS_SDK_FEATURE} name.
 * @returns The {@link IStatsMgrConfig} to pass to {@link IStatsMgr.init}.
 */
export function createSdkStatsMgrConfig<CfgType extends IConfiguration = IConfiguration>(): IStatsMgrConfig<CfgType> {
    return {
        feature: STATS_SDK_FEATURE,
        getCfg: (_core: IAppInsightsCore<CfgType>, cfg: CfgType): IStatsBeatConfig => {
            // Read any CDN / dynamic config overrides. Accessing these inside the (dynamic) config
            // change handler registers the dependency so changes are picked up at runtime.
            let userCfg: IStatsBeatConfig = (cfg && cfg.stats) || {};

            return {
                mode: userCfg.mode || eStatsEndpointType.SdkStats,
                shrtInt: userCfg.shrtInt,
                // The destination iKey / endpoint are resolved per-event in _track based on the mode,
                // so the default key map only needs to match all endpoints. A full key map (including
                // explicit keys / urls) may be supplied via config.stats.endCfg to override this.
                endCfg: userCfg.endCfg || [{
                    type: eStatsType.SDK,
                    keyMap: [{
                        match: ["*"]
                    }]
                }]
            };
        }
    };
}

