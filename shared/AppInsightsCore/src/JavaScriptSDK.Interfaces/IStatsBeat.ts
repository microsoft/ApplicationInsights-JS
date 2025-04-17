import { IAppInsightsCore } from "./IAppInsightsCore";
import { IPayloadData } from "./IXHROverride";

export interface IStatsBeat {
    initialize(core: IAppInsightsCore, statsBeatConfig: IStatsBeatConfig) : void;
    isInitialized(): boolean;
    count(status: number, payloadData: IPayloadData, endpoint: string): void;
    countException(endpoint: string, exceptionType: string): void;
    getEndpoint(): string;
}

export interface IStatsBeatConfig {
    ikey: string;
    endpoint: string;
    version?: string;
}
