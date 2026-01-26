// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    ITimerHandler, arrForEach, isNumber, makeGlobRegex, objDefineProps, scheduleTimeout, strIndexOf, strLower, utcNow
} from "@nevware21/ts-utils";
import { onConfigChange } from "../config/DynamicConfig";
import { STR_EMPTY } from "../constants/InternalConstants";
import { _throwInternal, safeGetLogger } from "../diagnostics/DiagnosticLogger";
import { _eInternalMessageId, eLoggingSeverity } from "../enums/ai/LoggingEnums";
import { eStatsType } from "../enums/ai/StatsType";
import { IAppInsightsCore } from "../interfaces/ai/IAppInsightsCore";
import { IConfiguration } from "../interfaces/ai/IConfiguration";
import { INetworkStatsbeat } from "../interfaces/ai/INetworkStatsbeat";
import { IStatsBeat, IStatsBeatConfig, IStatsBeatState, IStatsEndpointConfig } from "../interfaces/ai/IStatsBeat";
import { IStatsMgr, IStatsMgrConfig } from "../interfaces/ai/IStatsMgr";
import { ITelemetryItem } from "../interfaces/ai/ITelemetryItem";
import { IPayloadData } from "../interfaces/ai/IXHROverride";
import { isFeatureEnabled } from "../utils/HelperFuncsCore";

const STATS_COLLECTION_SHORT_INTERVAL: number = 900000; // 15 minutes
const STATS_MIN_INTERVAL_SECONDS = 60; // 1 minute
const STATSBEAT_LANGUAGE = "JavaScript";
const STATSBEAT_TYPE = "Browser";


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
 * This function retrieves the stats instrumentation key (iKey) for the given endpoint from
 * the statsBeatConfig. It iterates through the keys in the statsBeatConfig and checks if
 * the endpoint matches any of the URLs associated with that key. If a match is found, it
 * returns the corresponding iKey.
 * @param statsBeatConfig - The configuration object for StatsBeat.
 * @param endpoint - The endpoint to check against the URLs in the configuration.
 * @returns The iKey associated with the matching endpoint, or null if no match is found.
 */
function _getIKey(endpointCfg: IStatsEndpointConfig, endpoint: string): string | null {
    let statsKey: string = null;
    if (endpointCfg.keyMap) {
        arrForEach(endpointCfg.keyMap, (keyMap) => {
            if (keyMap.match) {
                arrForEach(keyMap.match, (url) => {
                    if (_isMatchEndpoint(url, endpoint)) {
                        statsKey = keyMap.key || null;

                        // Stop the loop if we found a match
                        return -1;
                    }
                });
            }

            if (statsKey) {
                // Stop the loop if we found a match
                return -1;
            }
        });
    }

    return statsKey;
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
                if (statsConfig && isFeatureEnabled(statsConfig.feature, details.cfg, false) === true) {
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
            let sendEvt = !!statsBeat.type;

            // Fetching the stats key for the endpoint here to support the scenario where the endpoint is changed
            // after the statsbeat instance is created. This will ensure that the correct stats key is used for the endpoint.
            // It also avoids the tracking of the statsbeat event if the endpoint is not in the config.
            let endpointCfg = _getEndpointCfg(_statsBeatConfig, statsBeat.type);
            if (endpointCfg) {
                // Check for key remapping
                let statsKey = _getIKey(endpointCfg, endpoint);
                if (statsKey) {
                    // Using this iKey for the statsbeat event
                    statsBeatEvent.iKey = statsKey;
                    // We have specific config for this endpoint, so we can send the event
                    sendEvt = true;
                }

                if (sendEvt) {
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
