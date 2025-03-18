import { utcNow } from "@nevware21/ts-utils";

export class NetworkStatsbeat {

    public time: number;

    public lastTime: number;

    public host: string;

    public totalRequestCount: number;

    public lastRequestCount: number;

    public succesfulRequestCount: number;

    public failedRequestCount: number;

    public retryCount: number;

    public exceptionCount: number;

    public throttleCount: number;

    public intervalRequestExecutionTime: number;

    public lastIntervalRequestExecutionTime: number;

    public requests_Failure_Count: Record<number, number>;
    public retry_Count: Record<number, number>;
    public exception_Count: Record<number, number>;

    constructor(host: string) {
        this.host = host;
        this.totalRequestCount = 0;
        this.succesfulRequestCount = 0;
        this.failedRequestCount = 0;
        this.retryCount = 0;
        this.exceptionCount = 0;
        this.throttleCount = 0;
        this.intervalRequestExecutionTime = 0;
        this.lastIntervalRequestExecutionTime = 0;
        this.lastTime = utcNow();
        this.lastRequestCount = 0;
        this.requests_Failure_Count = {};
        this.retry_Count = {};
        this.exception_Count = {};
    }
}
