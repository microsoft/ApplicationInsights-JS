import { IAppInsightsCore } from "./IAppInsightsCore";
import { IStatsBeatEvent } from "./IStatsBeatEvent";

export interface IStatsBeat {
    initialize(core: IAppInsightsCore, ikey: string, endpoint: string, version?: string) : void;
    isInitialized(): boolean;
    setInitialized(value: boolean): void;
    count(status: number, payloadData: IStatsBeatEvent, endpoint: string): void;
    countException(endpoint: string): void;
    trackShortIntervalStatsbeats(): void;
}
