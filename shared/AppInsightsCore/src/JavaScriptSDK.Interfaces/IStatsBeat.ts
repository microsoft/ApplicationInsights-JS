import { IAppInsightsCore } from "./IAppInsightsCore";
import { IPayloadData } from "./IXHROverride";

export interface IStatsBeat {
    initialize(core: IAppInsightsCore, ikey: string, endpoint: string, version?: string) : void;
    isInitialized(): boolean;
    count(status: number, payloadData: IPayloadData, endpoint: string): void;
    countException(endpoint: string, message: string): void;
    trackShortIntervalStatsbeats(): void;
}
