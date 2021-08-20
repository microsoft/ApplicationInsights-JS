import { NetworkStatsbeat } from "./NetworkStatsbeat";

export class Statsbeat {
    public static CONNECTION_STRING = "InstrumentationKey=c4a29126-a7cb-47e5-b348-11414998b11e;IngestionEndpoint=https://dc.services.visualstudio.com/";
    private _networkStatsbeatCollection: Array<NetworkStatsbeat>;
    
    constructor() {
        this._networkStatsbeatCollection = [];
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
}