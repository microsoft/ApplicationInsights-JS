import { NetworkStatsbeat } from "./NetworkStatsbeat";
import { Sender } from "./Sender";
import { StatsbeatCounter } from "./Constants";
import { IConfig, Metric } from "@microsoft/applicationinsights-common";
import { IConfiguration, IAppInsightsCore, IPlugin, ITelemetryPluginChain, ITelemetryItem, objKeys, dateNow,  } from '@microsoft/applicationinsights-core-js';
import dynamicProto from '@microsoft/dynamicproto-js';

export class Statsbeat {
    public static INSTRUMENTATION_KEY = "c4a29126-a7cb-47e5-b348-11414998b11e";
    public static STATS_COLLECTION_SHORT_INTERVAL: number = 900000; // 15 minutes
    public static NETWORK = "Network";

    constructor() {
        let _networkCounter: NetworkStatsbeat;
        let _sender: Sender;
        let _handle: any;
        let _statsbeatMetrics: { name?: string; value?: number, properties?: {} };
        let _config: IConfiguration & IConfig;
        let _isEnabled: boolean;

        // Custom dimensions
        let _cikey: string;
        dynamicProto(Statsbeat, this, (_self, _base) => {
            _self.initialize = (config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain, endpoint?: string) => {
                _networkCounter = new NetworkStatsbeat(endpoint);
                _sender = new Sender(undefined);
                let senderConfig = {...config};
                senderConfig.instrumentationKey = Statsbeat.INSTRUMENTATION_KEY;
                _sender.initialize(senderConfig, core, extensions, pluginChain, endpoint);
                _statsbeatMetrics = {};
                _config = config;
                _isEnabled = _config.disableStatsbeat !== true;
                if (_isEnabled) {
                    _getCustomProperties();
                    if (!_handle) {
                        _handle = setInterval(() => {
                            this.trackShortIntervalStatsbeats();
                        }, Statsbeat.STATS_COLLECTION_SHORT_INTERVAL);
                    }
                }
            }

            _self.isInitialized = (): boolean => {
                return !!_isEnabled;
            }

            _self.countRequest = (endpoint: string, duration: number, success: boolean) => {
                if (!_isEnabled) {
                    return;
                }
                let counter: NetworkStatsbeat = _getNetworkStatsbeatCounter(endpoint);
                counter.totalRequestCount++;
                counter.intervalRequestExecutionTime += duration;
                if (success === false) {
                    counter.totalFailedRequestCount++;
                }
                else {
                    counter.totalSuccesfulRequestCount++;
                }
            }

            _self.countException = (endpoint: string) => {
                if (!_isEnabled) {
                    return;
                }
                let counter: NetworkStatsbeat = _getNetworkStatsbeatCounter(endpoint);
                counter.exceptionCount++;
            }
            
            _self.countThrottle = (endpoint: string) => {
                if (!_isEnabled) {
                    return;
                }
                let counter: NetworkStatsbeat = _getNetworkStatsbeatCounter(endpoint);
                counter.throttleCount++;
            }

            _self.countRetry = (endpoint: string) => {
                if (!_isEnabled) {
                    return;
                }
                let counter: NetworkStatsbeat = _getNetworkStatsbeatCounter(endpoint);
                counter.retryCount++;
            }

            _self.trackShortIntervalStatsbeats = (): void => {
                _trackRequestDuration();
                _trackRequestsCount();
                _sendStatsbeats();
            }

            function _getCustomProperties() {
                _cikey = _config.instrumentationKey;
            }

            function _getNetworkStatsbeatCounter(host: string): NetworkStatsbeat {
                // Check if counter is available
                if (_networkCounter && _networkCounter.host === host) {
                    return _networkCounter;
                }
                // Create a new one if not found
                let newCounter = new NetworkStatsbeat(host);
                return newCounter;
            }

            function _sendStatsbeats() {
                // Add extra properties
                let networkProperties = {
                    "cikey": _cikey,
                }
                if (objKeys(_statsbeatMetrics)) {
                    let statsbeat: ITelemetryItem = {
                        iKey: Statsbeat.INSTRUMENTATION_KEY,
                        name: Statsbeat.NETWORK,
                        baseData: {
                            name: Statsbeat.NETWORK,
                            average: 1,
                            properties: {"host": _networkCounter.host, ..._statsbeatMetrics.properties, ...networkProperties},
                        },
                        baseType: Metric.dataType
                    };
                    _sender.processTelemetry(statsbeat);
                }
                _statsbeatMetrics = {};
                _sender.triggerSend();
            }

            function _trackRequestDuration() {
                var currentCounter = _networkCounter;
                currentCounter.time = dateNow();
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
    
    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain, endpoint?: string) {
         // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public isInitialized(): boolean {
         // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
         return false;
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
