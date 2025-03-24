import dynamicProto from "@microsoft/dynamicproto-js";
import { ITimerHandler, scheduleTimeout, utcNow } from "@nevware21/ts-utils";
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IStatsBeat } from "../JavaScriptSDK.Interfaces/IStatsBeat";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { IPayloadData } from "../JavaScriptSDK.Interfaces/IXHROverride";
import { NetworkStatsbeat, createNetworkStatsbeat } from "./NetworkStatsbeat";

const INSTRUMENTATION_KEY = "c4a29126-a7cb-47e5-b348-11414998b11e";
const STATS_COLLECTION_SHORT_INTERVAL: number = 900000; // 15 minutes
const STATSBEAT_LANGUAGE = "JavaScript";
const STATSBEAT_TYPE = "Browser";

export class Statsbeat implements IStatsBeat {
    constructor() {
        let _networkCounter: NetworkStatsbeat;
        let _isEnabled: boolean = false;
        let _core: IAppInsightsCore;
        let _timeoutHandle: ITimerHandler;      // Handle to the timer for sending telemetry. This way, we would not send telemetry when system sleep.
        // Custom dimensions
        let _cikey: string;
        let _language: string;
        let _sdkVersion: string;
        let _os: string;
        let _runTimeVersion: string;
        dynamicProto(Statsbeat, this, (_self, _base) => {
            _self.initialize = (core: IAppInsightsCore, ikey: string, endpoint: string, version?: string) => {
                _core = core;
                _networkCounter = createNetworkStatsbeat(endpoint);
                _isEnabled = true;
                _sdkVersion = version;
                _getCustomProperties(ikey);
            }

            _self.isInitialized = (): boolean => {
                return !!_isEnabled;
            }

            _self.count = (status: number, payloadData: IPayloadData, endpoint: string) => {
                if (!_isEnabled || !_checkEndpoint(endpoint)) {
                    return;
                }
                if (payloadData && payloadData["statsBeatData"] && payloadData["statsBeatData"]["startTime"]) {
                    _networkCounter.totalRequest++;
                    _networkCounter.requestDuration += utcNow() - payloadData["statsBeatData"]["startTime"];
                }
                let retryArray = [401, 403, 408, 429, 500, 503];
                let throttleArray = [402, 439];
                if (status === 200) {
                    _networkCounter.success++;
                } else if (retryArray.includes(status)) {
                    _networkCounter.retry[status] = (_networkCounter.retry[status] || 0) + 1;
                } else if (throttleArray.includes(status)) {
                    _networkCounter.throttle[status] = (_networkCounter.throttle[status] || 0) + 1;
                } else if (status !== 307 && status !== 308) {
                    _networkCounter.failure[status] = (_networkCounter.failure[status] || 0) + 1;
                }
                _setupTimer();
            };

            
            
            _self.countException = (endpoint: string, exceptionType: string) => {
                if (!_isEnabled || !_checkEndpoint(endpoint)) {
                    return;
                }
                _networkCounter.exception[exceptionType] = (_networkCounter.exception[exceptionType] || 0) + 1;
                _setupTimer();
            }

            function _setupTimer() {
                if (!_timeoutHandle) {
                    _timeoutHandle = scheduleTimeout(() => {
                        _timeoutHandle = null;
                        this.trackShortIntervalStatsbeats();
                    }, STATS_COLLECTION_SHORT_INTERVAL);
                }
            }

            _self.trackShortIntervalStatsbeats = (): void => {
                _trackSendRequestDuration();
                _trackSendRequestsCount();
                _networkCounter = createNetworkStatsbeat(_networkCounter.host);
                _timeoutHandle && _timeoutHandle.cancel();
                _timeoutHandle = null;
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

            function _sendStatsbeats(name: string, val: number, properties?: {}) {
                if (val <= 0){
                    return;
                }
                // Add extra properties
                let baseProperties = {
                    "rp": "unknown",
                    "attach": "Manual",
                    "cikey": _cikey,
                    "runtimeVersion": _runTimeVersion,
                    "os": _os,
                    "language": _language,
                    "version": _sdkVersion,
                    "endpoint": "breeze",
                    "host": _networkCounter.host
                }
                let statsbeatEvent: ITelemetryItem = {
                    iKey: INSTRUMENTATION_KEY,
                    name: name,
                    baseData: {
                        name: name,
                        average: val,
                        properties: {"host": _networkCounter.host, ...properties, ...baseProperties}
                    },
                    baseType: "MetricData"
                };
                _core.track(statsbeatEvent);
            }

            function _trackSendRequestDuration() {
                var currentCounter = _networkCounter;
                if (currentCounter.totalRequest > 0 ) {
                    var averageRequestExecutionTime = currentCounter.requestDuration  / currentCounter.totalRequest;
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
        });
    }
    
    public initialize(core: IAppInsightsCore, ikey: string, endpoint: string, version?: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public isInitialized(): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    }

    public count(status: number, payloadData: IPayloadData, endpoint: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
  
    public countException(endpoint: string, exceptionType: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public trackShortIntervalStatsbeats() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

}
