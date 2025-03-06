import { IChannelControls } from "./IChannelControls";

export interface IStatsBeat {
    initialize(ikey: string, channel: IChannelControls, endpoint: string, version?: string): void;
    isInitialized(): boolean;
    setInitialized(value: boolean): void;
    countRequest(endpoint: string, duration: number, success: boolean): void;
    countException(endpoint: string): void;
    countThrottle(endpoint: string): void;
    countRetry(endpoint: string): void;
    trackShortIntervalStatsbeats(): void;
}
