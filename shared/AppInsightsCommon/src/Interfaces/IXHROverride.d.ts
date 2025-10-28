import { IPromise } from "@nevware21/ts-async";
import { SendRequestReason } from "../Enums/SendRequestReason";

/** IPayloadData describes interface of payload sent via POST channel */
export interface IPayloadData {
    urlString: string;
    data: Uint8Array | string;
    headers?: {
        [name: string]: string;
    };
    timeout?: number;
    disableXhrSync?: boolean;
    disableFetchKeepAlive?: boolean;
    sendReason?: SendRequestReason;
}
/**
* SendPOSTFunction type defines how an HTTP POST request is sent to an ingestion server
* @param payload - The payload object that should be sent, contains the url, bytes/string and headers for the request
* @param oncomplete - The function to call once the request has completed whether a success, failure or timeout
* @param sync - A boolean flag indicating whether the request should be sent as a synchronous request.
*/
export type SendPOSTFunction = (payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => void | IPromise<boolean>;
export type OnCompleteCallback = (status: number, headers: {
    [headerName: string]: string;
}, response?: string, payload?: IPayloadData) => void;
/**
* The IXHROverride interface overrides the way HTTP requests are sent.
*/
export interface IXHROverride {
    sendPOST: SendPOSTFunction;
}
