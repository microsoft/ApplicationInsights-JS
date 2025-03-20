export interface NetworkStatsbeat {
    host: string;
    totalRequest: number;
    success: number;
    throttle: number;
    failure: Record<number, number>;
    retry: Record<number, number>;
    exception: Record<string, number>;
    requestDuration: number;
}
export function createNetworkStatsbeat(host: string): NetworkStatsbeat {
    return {
        host,
        totalRequest: 0,
        success: 0,
        throttle: 0,
        failure: {},
        retry: {},
        exception: {},
        requestDuration: 0
    };
}
