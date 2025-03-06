import dynamicProto from "@microsoft/dynamicproto-js";
import { objKeys, utcNow } from "@nevware21/ts-utils";
import { IChannelControls } from "../JavaScriptSDK.Interfaces/IChannelControls";
import { IStatsBeat } from "../JavaScriptSDK.Interfaces/IStatsBeat";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { NetworkStatsbeat } from "./NetworkStatsbeat";

export const StatsbeatCounter = {
    REQUEST_SUCCESS: "Request Success Count",
    REQUEST_FAILURE: "Requests Failure Count",
    REQUEST_DURATION: "Request Duration",
    RETRY_COUNT: "Retry Count",
    THROTTLE_COUNT: "Throttle Count",
    EXCEPTION_COUNT: "Exception Count"
}

const INSTRUMENTATION_KEY = "c4a29126-a7cb-47e5-b348-11414998b11e";
const STATS_COLLECTION_SHORT_INTERVAL: number = 900000; // 15 minutes
const NETWORK = "Network";
const STATSBEAT_LANGUAGE = "JavaScript";
const STATSBEAT_TYPE = "Browser";

export class Statsbeat implements IStatsBeat {
    constructor() {
        let _networkCounter: NetworkStatsbeat;
        let _handle: any;
        let _statsbeatMetrics: { properties?: {} };
        let _isEnabled: boolean;
        let _channel: IChannelControls;

        // Custom dimensions
        let _cikey: string;
        let _language: string;
        let _sdkVersion: string;
        let _os: string;
        let _runTimeVersion: string;
        dynamicProto(Statsbeat, this, (_self, _base) => {
            _self.initialize = (ikey: string, channel: IChannelControls, endpoint: string, version?: string) => {
                _networkCounter = new NetworkStatsbeat(endpoint);
                _statsbeatMetrics = {};
                _isEnabled = true;
                _channel = channel;
                _sdkVersion = version;
                if (_isEnabled) {
                    _getCustomProperties(ikey);
                    if (!_handle) {
                        _handle = setInterval(() => {
                            this.trackShortIntervalStatsbeats();
                        }, STATS_COLLECTION_SHORT_INTERVAL);
                    }
                }
            }

            _self.isInitialized = (): boolean => {
                return !!_isEnabled;
            }

            _self.setInitialized = (value: boolean) => {
                _isEnabled = value;
            }

            _self.countRequest = (endpoint: string, duration: number, success: boolean) => {
                if (!_isEnabled || !_checkEndpoint(endpoint)) {
                    return;
                }
                _networkCounter.totalRequestCount++;
                _networkCounter.intervalRequestExecutionTime += duration;
                if (success === false) {
                    _networkCounter.totalFailedRequestCount++;
                } else {
                    _networkCounter.totalSuccesfulRequestCount++;
                }
                
            }

            _self.countException = (endpoint: string) => {
                if (!_isEnabled || !_checkEndpoint(endpoint)) {
                    return;
                }
                _networkCounter.exceptionCount++;
            }
            
            _self.countThrottle = (endpoint: string) => {
                if (!_isEnabled || !_checkEndpoint(endpoint)) {
                    return;
                }
                _networkCounter.throttleCount++;
            }

            _self.countRetry = (endpoint: string) => {
                if (!_isEnabled || !_checkEndpoint(endpoint)) {
                    return;
                }
                _networkCounter.retryCount++;
            }

            _self.trackShortIntervalStatsbeats = (): void => {
                _trackRequestDuration();
                _trackRequestsCount();
                _sendStatsbeats();
            }

            function _checkEndpoint(endpoint: string) {
                return _networkCounter && _networkCounter.host === endpoint;
            }

            function _getCustomProperties(ikey: string) {
                _cikey = ikey;
                _language = STATSBEAT_LANGUAGE;
                _os = STATSBEAT_TYPE;
                _runTimeVersion = STATSBEAT_TYPE;
            }

          

            function _sendStatsbeats() {
                // Add extra properties
                let networkProperties = {
                    "cikey": _cikey,
                    "runtimeVersion": _runTimeVersion,
                    "language": _language,
                    "version": _sdkVersion,
                    "os": _os
                }
                if (objKeys(_statsbeatMetrics)) {
                    let statsbeat: ITelemetryItem = {
                        iKey: INSTRUMENTATION_KEY,
                        name: NETWORK,
                        baseData: {
                            name: NETWORK,
                            average: 0,
                            properties: {"host": _networkCounter.host, ..._statsbeatMetrics.properties, ...networkProperties}
                        },
                        baseType: "StatsbeatData"
                        // baseType: Metric.dataType
                    };
                    _channel.processTelemetry(statsbeat);
                }
                _statsbeatMetrics = {};
                _channel.flush(true);
            }

            function _trackRequestDuration() {
                var currentCounter = _networkCounter;
                currentCounter.time = utcNow();
                var intervalRequests = (currentCounter.totalRequestCount - currentCounter.lastRequestCount) || 0;
                var elapsedMs = currentCounter.time - currentCounter.lastTime;
                var averageRequestExecutionTime = ((currentCounter.intervalRequestExecutionTime - currentCounter.lastIntervalRequestExecutionTime) / intervalRequests) || 0;
                currentCounter.lastIntervalRequestExecutionTime = currentCounter.intervalRequestExecutionTime; // reset
                if (elapsedMs > 0 && intervalRequests > 0) {
                    _statsbeatMetrics.properties = _statsbeatMetrics.properties || {};
                    _statsbeatMetrics.properties[StatsbeatCounter.REQUEST_DURATION] = averageRequestExecutionTime;
                }
                // Set last counters
                currentCounter.lastRequestCount = currentCounter.totalRequestCount;
                currentCounter.lastTime = currentCounter.time;
            }

            function _trackRequestsCount() {
                var currentCounter = _networkCounter;
                if (currentCounter.totalSuccesfulRequestCount > 0) {
                    _statsbeatMetrics.properties = _statsbeatMetrics.properties || {};
                    _statsbeatMetrics.properties[StatsbeatCounter.REQUEST_SUCCESS] = currentCounter.totalSuccesfulRequestCount;
                    currentCounter.totalSuccesfulRequestCount = 0; //Reset
                }
                if (currentCounter.totalFailedRequestCount > 0) {
                    _statsbeatMetrics.properties = _statsbeatMetrics.properties || {};
                    _statsbeatMetrics.properties[StatsbeatCounter.REQUEST_FAILURE] = currentCounter.totalFailedRequestCount;
                    currentCounter.totalFailedRequestCount = 0; //Reset
                }
                if (currentCounter.retryCount > 0) {
                    _statsbeatMetrics.properties = _statsbeatMetrics.properties || {};
                    _statsbeatMetrics.properties[StatsbeatCounter.RETRY_COUNT] = currentCounter.retryCount;
                    currentCounter.retryCount = 0; //Reset
                }
                if (currentCounter.throttleCount > 0) {
                    _statsbeatMetrics.properties = _statsbeatMetrics.properties || {};
                    _statsbeatMetrics.properties[StatsbeatCounter.THROTTLE_COUNT] = currentCounter.throttleCount;
                    currentCounter.throttleCount = 0; //Reset
                }
                if (currentCounter.exceptionCount > 0) {
                    _statsbeatMetrics.properties = _statsbeatMetrics.properties || {};
                    _statsbeatMetrics.properties[StatsbeatCounter.EXCEPTION_COUNT] = currentCounter.exceptionCount;
                    currentCounter.exceptionCount = 0; //Reset
                }
            }
        })
    }
    
    public initialize(ikey: string, channel: IChannelControls, endpoint: string, version?: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public isInitialized(): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    }

    public setInitialized(value: boolean) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public countRequest(endpoint: string, duration: number, success: boolean) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public countException(endpoint: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public countThrottle(endpoint: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public countRetry(endpoint: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public trackShortIntervalStatsbeats() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

}
