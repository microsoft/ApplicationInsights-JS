import { NetworkStatsbeat } from "./NetworkStatsbeat";
import { Sender } from "./Sender";
import { StatsbeatCounter } from "./Constants";
import { IMetricTelemetry, IConfig } from "@microsoft/applicationinsights-common";
import { LoggingSeverity, _InternalMessageId, IConfiguration } from '@microsoft/applicationinsights-core-js';
 
export class Statsbeat {
    public static INSTRUMENTATION_KEY = "c4a29126-a7cb-47e5-b348-11414998b11e";
    public static STATS_COLLECTION_SHORT_INTERVAL: number = 900000; // 15 minutes
    private _networkStatsbeatCollection: Array<NetworkStatsbeat>;
    private _sender: Sender;
    private _handle: any; // ? type
    private _statsbeatMetrics: Array<{ name: string; value: number, properties: {} }>;
    private _config: IConfiguration & IConfig;

    // Custom dimensions
    private _cikey: string;

    public initialize(config: IConfiguration & IConfig) {
        this._networkStatsbeatCollection = [];
        this._sender = new Sender(undefined, true);
        this._statsbeatMetrics = [];
        this._config = config;
        // todo: check config
        // if no (xxx, enabled/disabled/smaple) , add those config
        if (!config.disableStatsbeat) {
            if (!this._handle) {
                this._handle = setInterval(() => {
                    this.trackShortIntervalStatsbeats().catch((error) => {
                        this._sender.core.logger.throwInternal(
                            LoggingSeverity.WARNING,
                            _InternalMessageId.FailedToSendStatsbeatData, ". " +
                            "Cannot send statsbeat collection data.");
                    })
                }, Statsbeat.STATS_COLLECTION_SHORT_INTERVAL);
            }
        }
    }

    public countRequest(endpoint: string, duration: number, success: boolean) {
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
        let counter: NetworkStatsbeat = this._getNetworkStatsbeatCounter(endpoint);
        counter.exceptionCount++;
    }

    public countThrottle(endpoint: string) {
        let counter: NetworkStatsbeat = this._getNetworkStatsbeatCounter(endpoint);
        counter.throttleCount++;
    }

    public countRetry(endpoint: string) {
        let counter: NetworkStatsbeat = this._getNetworkStatsbeatCounter(endpoint);
        counter.retryCount++;
    }

    public async trackShortIntervalStatsbeats() {
        let networkProperties = {
            "cikey": this._cikey,
        }
        this._trackRequestDuration(networkProperties);
        this._trackRequestsCount(networkProperties);
        this._sendStatsbeats();
    }

    private _getCustomProperties() {
        this._cikey = this._config.instrumentationKey;
    }

    private _getNetworkStatsbeatCounter(host: string): NetworkStatsbeat {
        // Check if counter is available
        for (let i = 0; i < this._networkStatsbeatCollection.length; i++) {
            // Same object
            if (host === this._networkStatsbeatCollection[i].host) {
                return this._networkStatsbeatCollection[i];
            }
        }
        // Create a new one if not found
        let newCounter = new NetworkStatsbeat(host);
        this._networkStatsbeatCollection.push(newCounter);
        return newCounter;
    }

    private _sendStatsbeats() {
        for (let i = 0; i < this._statsbeatMetrics.length; i++) {
            let statsbeat: IMetricTelemetry = {
                name: this._statsbeatMetrics[i].name,
                average: this._statsbeatMetrics[i].value,
                properties: this._statsbeatMetrics[i].properties
            };
            this._sender.processTelemetry(statsbeat);
        }
        this._statsbeatMetrics = [];
        this._sender.triggerSend();
    }

    private _trackRequestDuration(commonProperties: {}) {
        for (let i = 0; i < this._networkStatsbeatCollection.length; i++) {
            var currentCounter = this._networkStatsbeatCollection[i];
            currentCounter.time = +new Date;
            var intervalRequests = (currentCounter.totalRequestCount - currentCounter.lastRequestCount) || 0;
            var elapsedMs = currentCounter.time - currentCounter.lastTime;
            var averageRequestExecutionTime = ((currentCounter.intervalRequestExecutionTime - currentCounter.lastIntervalRequestExecutionTime) / intervalRequests) || 0;
            currentCounter.lastIntervalRequestExecutionTime = currentCounter.intervalRequestExecutionTime; // reset
            if (elapsedMs > 0 && intervalRequests > 0) {
                // Add extra properties
                let properties = Object.assign({ "host": this._networkStatsbeatCollection[i].host }, commonProperties);
                this._statsbeatMetrics.push({ name: StatsbeatCounter.REQUEST_DURATION, value: averageRequestExecutionTime, properties: properties });
            }
            // Set last counters
            currentCounter.lastRequestCount = currentCounter.totalRequestCount;
            currentCounter.lastTime = currentCounter.time;
        }
    }

    private _trackRequestsCount(commonProperties: {}) {
        for (let i = 0; i < this._networkStatsbeatCollection.length; i++) {
            var currentCounter = this._networkStatsbeatCollection[i];
            let properties = Object.assign({ "host": currentCounter.host }, commonProperties);
            if (currentCounter.totalSuccesfulRequestCount > 0) {
                this._statsbeatMetrics.push({ name: StatsbeatCounter.REQUEST_SUCCESS, value: currentCounter.totalSuccesfulRequestCount, properties: properties });
                currentCounter.totalSuccesfulRequestCount = 0; //Reset
            }
            if (currentCounter.totalFailedRequestCount > 0) {
                this._statsbeatMetrics.push({ name: StatsbeatCounter.REQUEST_FAILURE, value: currentCounter.totalFailedRequestCount, properties: properties });
                currentCounter.totalFailedRequestCount = 0; //Reset
            }
            if (currentCounter.retryCount > 0) {
                this._statsbeatMetrics.push({ name: StatsbeatCounter.RETRY_COUNT, value: currentCounter.retryCount, properties: properties });
                currentCounter.retryCount = 0; //Reset
            }
            if (currentCounter.throttleCount > 0) {
                this._statsbeatMetrics.push({ name: StatsbeatCounter.THROTTLE_COUNT, value: currentCounter.throttleCount, properties: properties });
                currentCounter.throttleCount = 0; //Reset
            }
            if (currentCounter.exceptionCount > 0) {
                this._statsbeatMetrics.push({ name: StatsbeatCounter.EXCEPTION_COUNT, value: currentCounter.exceptionCount, properties: properties });
                currentCounter.exceptionCount = 0; //Reset
            }
        }
    }
}