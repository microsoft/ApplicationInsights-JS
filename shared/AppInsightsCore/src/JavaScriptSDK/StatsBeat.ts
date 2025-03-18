import dynamicProto from "@microsoft/dynamicproto-js";
import { strIncludes, utcNow } from "@nevware21/ts-utils";
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IStatsBeat } from "../JavaScriptSDK.Interfaces/IStatsBeat";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { IPayloadData } from "../JavaScriptSDK.Interfaces/IXHROverride";
import { NetworkStatsbeat } from "./NetworkStatsbeat";

const INSTRUMENTATION_KEY = "c4a29126-a7cb-47e5-b348-11414998b11e";
const STATS_COLLECTION_SHORT_INTERVAL: number = 900000; // 15 minutes
const STATSBEAT_LANGUAGE = "JavaScript";
const STATSBEAT_TYPE = "Browser";

export class Statsbeat implements IStatsBeat {
    constructor() {
        let _networkCounter: NetworkStatsbeat;
        let _handle: any;
        let _isEnabled: boolean;
        let _core: IAppInsightsCore;

        // Custom dimensions
        let _cikey: string;
        let _language: string;
        let _sdkVersion: string;
        let _os: string;
        let _runTimeVersion: string;
        dynamicProto(Statsbeat, this, (_self, _base) => {
            _self.initialize = (core: IAppInsightsCore, ikey: string, endpoint: string, version?: string) => {
                _core = core;
                _networkCounter = new NetworkStatsbeat(endpoint);
                _isEnabled = true;
                _sdkVersion = version;

                _getCustomProperties(ikey);
                if (!_handle) {
                    _handle = setInterval(() => {
                        this.trackShortIntervalStatsbeats();
                    }, STATS_COLLECTION_SHORT_INTERVAL);
                }

            }

            _self.isInitialized = (): boolean => {
                return !!_isEnabled;
            }

            _self.setInitialized = (value: boolean) => {
                _isEnabled = value;
            }

            _self.count = (status: number, payloadData: IPayloadData, endpoint: string) => {
                if (!_isEnabled || !_checkEndpoint(endpoint)) {
                    return;
                }
                _networkCounter.totalRequestCount++;
                if (payloadData && payloadData["statsBeatData"] && payloadData["statsBeatData"]["startTime"]) {
                    _networkCounter.intervalRequestExecutionTime += utcNow() - payloadData["statsBeatData"]["startTime"];
                }
                if (status === 200) {
                    _networkCounter.succesfulRequestCount++;
                } else if (strIncludes("307,308,401,402,403,408,429,439,500,503", status.toString())) {
                    // These statuses are not considered failures
                    if (strIncludes("401,403,408,429,500,503", status.toString())) {
                        _networkCounter.retry_Count[status] = (_networkCounter.retry_Count[status] || 0) + 1;
                    }
                    if (strIncludes("402,439", status.toString())) {
                        _networkCounter.throttleCount++;
                    }
                } else {
                    _networkCounter.requests_Failure_Count[status] = (_networkCounter.requests_Failure_Count[status] || 0) + 1;
                }
            };
            
            _self.countException = (endpoint: string, event: ErrorEvent) => {
                if (!_isEnabled || !_checkEndpoint(endpoint)) {
                    return;
                }
                _networkCounter.exception_Count[event.error.name] = (_networkCounter.exception_Count[event.error.name] || 0) + 1;
            }
            

            _self.trackShortIntervalStatsbeats = (): void => {
                _trackSendRequestDuration();
                _trackSendRequestsCount();
                _networkCounter = new NetworkStatsbeat(_networkCounter.host);
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
                currentCounter.time = utcNow();
                var intervalRequests = (currentCounter.totalRequestCount - currentCounter.lastRequestCount) || 0;
                var elapsedMs = currentCounter.time - currentCounter.lastTime;
                var averageRequestExecutionTime = ((currentCounter.intervalRequestExecutionTime - currentCounter.lastIntervalRequestExecutionTime) / intervalRequests) || 0;
                currentCounter.lastIntervalRequestExecutionTime = currentCounter.intervalRequestExecutionTime; // reset
                if (elapsedMs > 0 && intervalRequests > 0) {
                    _sendStatsbeats("Request_Duration", averageRequestExecutionTime);
                }
            }
          

            function _trackSendRequestsCount() {
                var currentCounter = _networkCounter;
                if (currentCounter.succesfulRequestCount > 0) {
                    _sendStatsbeats("Request_Success_Count", currentCounter.succesfulRequestCount);
                }
                
                for (const code in currentCounter.requests_Failure_Count) {
                    const count = currentCounter.requests_Failure_Count[code];
                    _sendStatsbeats("Requests_Failure_Count", count, { statusCode: code });
                }

                for (const code in currentCounter.retry_Count) {
                    const count = currentCounter.retry_Count[code];
                    _sendStatsbeats("Retry_Count", count, { statusCode: code });
                }

                for (const code in currentCounter.exception_Count) {
                    const count = currentCounter.exception_Count[code];
                    _sendStatsbeats("Exception_Count", count, { exceptionType: code });
                }
            
                if (currentCounter.throttleCount > 0) {
                    _sendStatsbeats("Throttle_Count", currentCounter.throttleCount);
                }
               
            }
        })
    };
    
    public initialize(core: IAppInsightsCore, ikey: string, endpoint: string, version?: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public isInitialized(): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    }

    public setInitialized(value: boolean) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public count(status: number, payloadData: IPayloadData, endpoint: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
  
    public countException(endpoint: string, event: ErrorEvent) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public trackShortIntervalStatsbeats() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

}
