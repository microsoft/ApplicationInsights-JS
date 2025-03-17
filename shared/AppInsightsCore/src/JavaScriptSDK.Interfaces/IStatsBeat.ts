import { IChannelControls } from "./IChannelControls";
import { IStatsBeatEvent } from "./IStatsBeatEvent";

export interface IStatsBeat {
    initialize(ikey: string, channel: IChannelControls, endpoint: string, version?: string): void;
    isInitialized(): boolean;
    setInitialized(value: boolean): void;
    count(status: number, payloadData: IStatsBeatEvent, endpoint: string): void;
    countException(endpoint: string): void;
    trackShortIntervalStatsbeats(): void;
}
