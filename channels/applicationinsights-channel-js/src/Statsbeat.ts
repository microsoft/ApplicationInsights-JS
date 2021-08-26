import { NetworkStatsbeat } from "./NetworkStatsbeat";
import { Sender } from "./Sender";
import { StatsbeatCounter } from "./Constants";
import { IConfig, Metric } from "@microsoft/applicationinsights-common";
import { IConfiguration, IAppInsightsCore, IPlugin, ITelemetryPluginChain, ITelemetryItem, objKeys,  } from '@microsoft/applicationinsights-core-js';
 
export class Statsbeat {
    public static INSTRUMENTATION_KEY = "c4a29126-a7cb-47e5-b348-11414998b11e";
    public static STATS_COLLECTION_SHORT_INTERVAL: number = 900000; // 15 minutes
    private _networkCounter: NetworkStatsbeat;
    private _sender: Sender;
    private _handle: any; // ? type
    private _statsbeatMetrics: { name?: string; value?: number, properties?: {} };
    private _config: IConfiguration & IConfig;
    private _isEnabled: boolean;

    // Custom dimensions
    private _cikey: string;

    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain, endpoint?: string) {
        this._networkCounter = new NetworkStatsbeat(endpoint);
        this._sender = new Sender(undefined);
        this._sender.initialize(config, core, extensions, pluginChain, endpoint);
        this._statsbeatMetrics = {};
        this._config = config;
        this._isEnabled = this._config.disableStatsbeat === undefined ? true : !this._config.disableStatsbeat;
        // todo: check config
        // if no (xxx, enabled/disabled/smaple) , add those config
        if (this._isEnabled) {
            this._getCustomProperties();
            if (!this._handle) {
                this._handle = setInterval(() => {
                    this.trackShortIntervalStatsbeats();
                }, Statsbeat.STATS_COLLECTION_SHORT_INTERVAL);
            }
        }
    }

    public countRequest(endpoint: string, duration: number, success: boolean) {
        if (!this._isEnabled) {
            return;
        }
        let counter: NetworkStatsbeat = this._getNetworkStatsbeatCounter(endpoint);
        counter.totalRequestCount++;
        counter.intervalRequestExecutionTime += duration;
        if (success === false) {
            counter.totalFailedRequestCount++;
        }
        else {
            counter.totalSuccesfulRequestCount++;
        }
    }

    public countException(endpoint: string) {
        if (!this._isEnabled) {
            return;
        }
        let counter: NetworkStatsbeat = this._getNetworkStatsbeatCounter(endpoint);
        counter.exceptionCount++;
    }

    public countThrottle(endpoint: string) {
        if (!this._isEnabled) {
            return;
        }
        let counter: NetworkStatsbeat = this._getNetworkStatsbeatCounter(endpoint);
        counter.throttleCount++;
    }

    public countRetry(endpoint: string) {
        if (!this._isEnabled) {
            return;
        }
        let counter: NetworkStatsbeat = this._getNetworkStatsbeatCounter(endpoint);
        counter.retryCount++;
    }

    public trackShortIntervalStatsbeats() {
        this._trackRequestDuration();
        this._trackRequestsCount();
        this._sendStatsbeats();
    }

    private _getCustomProperties() {
        this._cikey = this._config.instrumentationKey;
    }

    private _getNetworkStatsbeatCounter(host: string): NetworkStatsbeat {
        // Check if counter is available
        if (this._networkCounter && this._networkCounter.host === host) {
            return this._networkCounter;
        }
        // Create a new one if not found
        let newCounter = new NetworkStatsbeat(host);
        return newCounter;
    }

    private _sendStatsbeats() {
        // Add extra properties
        let networkProperties = {
            "cikey": this._cikey,
        }
        if (objKeys(this._statsbeatMetrics)) {
            let statsbeat: ITelemetryItem = {
                iKey: Statsbeat.INSTRUMENTATION_KEY,
                name: this._statsbeatMetrics.name,
                baseData: {
                    properties: {"host": this._networkCounter.host, ...this._statsbeatMetrics.properties, ...networkProperties},
                },
                baseType: Metric.dataType
            };
            this._sender.processTelemetry(statsbeat, undefined, true);
        }
        this._statsbeatMetrics = {};
        this._sender.triggerSend();
    }

    private _trackRequestDuration() {
        var currentCounter = this._networkCounter;
        currentCounter.time = +new Date;
        var intervalRequests = (currentCounter.totalRequestCount - currentCounter.lastRequestCount) || 0;
        var elapsedMs = currentCounter.time - currentCounter.lastTime;
        var averageRequestExecutionTime = ((currentCounter.intervalRequestExecutionTime - currentCounter.lastIntervalRequestExecutionTime) / intervalRequests) || 0;
        currentCounter.lastIntervalRequestExecutionTime = currentCounter.intervalRequestExecutionTime; // reset
        if (elapsedMs > 0 && intervalRequests > 0) {
            this._statsbeatMetrics.properties = this._statsbeatMetrics.properties || {};
            this._statsbeatMetrics.properties[StatsbeatCounter.REQUEST_DURATION] = averageRequestExecutionTime;
        }
        // Set last counters
        currentCounter.lastRequestCount = currentCounter.totalRequestCount;
        currentCounter.lastTime = currentCounter.time;
    }

    private _trackRequestsCount() {
            var currentCounter = this._networkCounter;
            if (currentCounter.totalSuccesfulRequestCount > 0) {
                this._statsbeatMetrics.properties = this._statsbeatMetrics.properties || {};
                this._statsbeatMetrics.properties[StatsbeatCounter.REQUEST_SUCCESS] = currentCounter.totalSuccesfulRequestCount;
                currentCounter.totalSuccesfulRequestCount = 0; //Reset
            }
            if (currentCounter.totalFailedRequestCount > 0) {
                this._statsbeatMetrics.properties = this._statsbeatMetrics.properties || {};
                this._statsbeatMetrics.properties[StatsbeatCounter.REQUEST_FAILURE] = currentCounter.totalFailedRequestCount;
                currentCounter.totalFailedRequestCount = 0; //Reset
            }
            if (currentCounter.retryCount > 0) {
                this._statsbeatMetrics.properties = this._statsbeatMetrics.properties || {};
                this._statsbeatMetrics.properties[StatsbeatCounter.RETRY_COUNT] = currentCounter.retryCount;
                currentCounter.retryCount = 0; //Reset
            }
            if (currentCounter.throttleCount > 0) {
                this._statsbeatMetrics.properties = this._statsbeatMetrics.properties || {};
                this._statsbeatMetrics.properties[StatsbeatCounter.THROTTLE_COUNT] = currentCounter.throttleCount;
                currentCounter.throttleCount = 0; //Reset
            }
            if (currentCounter.exceptionCount > 0) {
                this._statsbeatMetrics.properties = this._statsbeatMetrics.properties || {};
                this._statsbeatMetrics.properties[StatsbeatCounter.EXCEPTION_COUNT] = currentCounter.exceptionCount;
                currentCounter.exceptionCount = 0; //Reset
        }
    }
}