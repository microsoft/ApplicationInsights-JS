
/** IPayloadData describes interface of payload sent via POST channel */
export interface IPayloadData {
    urlString: string;
    data: Uint8Array | string;
    headers?: { [name: string]: string };
    timeout?: number;
    disableXhrSync?: boolean;
    disableFetchKeepAlive?: boolean;
}

/**
* SendPOSTFunction type defines how an HTTP POST request is sent to an ingestion server
* @param payload - The payload object that should be sent, contains the url, bytes/string and headers for the request
* @param oncomplete - The function to call once the request has completed whether a success, failure or timeout
* @param sync - A boolean flag indicating whether the request should be sent as a synchronous request.
*/
export type SendPOSTFunction = (payload: IPayloadData, oncomplete: (status: number, headers: { [headerName: string]: string; }, response?: string) => void, sync?: boolean) => void;

/**
* The IXHROverride interface overrides the way HTTP requests are sent.
*/
export interface IXHROverride {
   /**
    * This method sends data to the specified URI using a POST request. If sync is true,
    * then the request is sent synchronously. The <i>oncomplete</i> function should always be called after the request is
    * completed (either successfully or timed out or failed due to errors).
    */
   sendPOST: SendPOSTFunction;
}

