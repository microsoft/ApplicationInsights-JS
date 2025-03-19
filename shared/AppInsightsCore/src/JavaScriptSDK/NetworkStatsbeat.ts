
export class NetworkStatsbeat {

    public host: string;

    public totalRequest: number;
    public success: number;
    public throttle: number;
    public failure: Record<number, number>;
    public retry: Record<number, number>;
    public exception: Record<string, number>;

    public requestDuration: number;

    constructor(host: string) {
        this.host = host;
        this.totalRequest = 0;
        this.success = 0;
        this.throttle = 0;
        this.requestDuration = 0;
        this.failure = {};
        this.retry = {};
        this.exception = {};
    }
}
