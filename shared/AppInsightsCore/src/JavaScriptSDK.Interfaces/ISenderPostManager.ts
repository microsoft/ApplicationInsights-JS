import { ITimerHandler } from "@nevware21/ts-utils";
import { TransportType } from "../JavaScriptSDK.Enums/SendRequestReason";
import { IXDomainRequest } from "./IXDomainRequest";
import { IPayloadData, IXHROverride, OnCompleteCallback } from "./IXHROverride";

/**
 * internal interface
 * Define functions when xhr/xdr/fetch requests are successfully returned. If they are not defined, oncomplete with be called instead
 * @internal for internal use only
 */
export interface _ISenderOnComplete {
    /**
     * defined xdr onload function to handle response
     * @param dxr - xdr request object

     * @param oncomplete - oncomplete function
     * @since version after 3.1.0
     */
    xdrOnComplete?(xdr: IXDomainRequest, onComplete: OnCompleteCallback, payload?: IPayloadData): void;
    /**
     * defined fetch on complete function to handle response
     * @param response - response object
     * @param onComplete - oncomplete function
     * @param resValue - response.text().value
     * @since version after 3.1.0
     */
    fetchOnComplete?(response: Response, onComplete: OnCompleteCallback, resValue?: string, payload?: IPayloadData): void;
    /**
     * defined xhr onreadystatechange function to handle response
     * @param request - request object
     * @param oncomplete - oncomplete function
     * @since version after 3.1.0
     */
    xhrOnComplete?(request: XMLHttpRequest, onComplete: OnCompleteCallback, payload?: IPayloadData):void;

    /**
     * Define functions during beacon can not send payload after first attempt. If not defined, will be apyload will be retried with fallback sender.
     * @param data - payload data
     * @param onComplete - oncomplete function
     * @param canSend - can the current data sent by beacon sender
     * @since version after 3.1.0
     */
    beaconOnRetry?(data: IPayloadData, onComplete: OnCompleteCallback, canSend:(payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => boolean): void;
}

/**
 * Internal interface for SendPostMnager
 * @internal for internal use only
 */
export interface _ISendPostMgrConfig {
    /**
     * Enable the sender interface to return a promise
     * Note: Enabling this may cause unhandled promise rejection errors to occur if you do not listen and handle any rejection response,
     * Defaults to false
     * @since version after 3.1.0
     */
    enableSendPromise?: boolean,
    /**
     * Identifies if the sender is 1ds post channel
     * Default is false
     * @since version after 3.1.0
     */
    isOneDs?: boolean,
    /**
     * Identify if Credentials should be disabled for 1ds post channel, application insights sender will igore this config
     * Default is false
     * @since version after 3.1.0
     */
    disableCredentials?: boolean;

    /**
     * Identifies if XMLHttpRequest or XDomainRequest (for IE < 9) should be used
     * Default: false
     * @since version after 3.1.0
     */
    disableXhr?: boolean;
    
    /**
     * Is beacon disabled during async sending
     * Default: false
     * @since version after 3.1.0
     */
    disableBeacon?: boolean;
  
    /**
     * Is beacon disabled during sync sending
     * Default: false
     * @since version after 3.1.0
     */
    disableBeaconSync?: boolean;

    /**
     * Is FetchKeepAlive disabled during sync sending
     * Default: false
     * @since version after 3.1.0
     */
    disableFetchKeepAlive?: boolean

    /**
     * Identifies functions when xhr/xdr/fetch requests are successfully returned. If they are not defined, oncomplete with be called instead
     * @since version after 3.1.0
     */
    senderOnCompleteCallBack?: _ISenderOnComplete;

    /**
     * time wrapper to handle payload timeout
     * this is for 1ds post channel only
     * Default: null
     * @since version after 3.1.0
     */
    timeWrapper?: _ITimeoutOverrideWrapper;
    
    /**
     * [Optional] flag to indicate whether the sendBeacon and fetch (with keep-alive flag) should add the "NoResponseBody" query string
     * value to indicate that the server should return a 204 for successful requests. Defaults to true
     * this is for 1ds post channel only
     * Default: true
     * @since version after 3.1.0
     */
    addNoResponse?: boolean;

    /**
     * [Optional] Specify whether cross-site Access-Control fetch requests should include credentials such as cookies,
     * authentication headers, or TLS client certificates.
     *
     * Possible values:
     * - "omit": never send credentials in the request or include credentials in the response.
     * - "include": always include credentials, even cross-origin.
     * - "same-origin": only send and include credentials for same-origin requests.
     *
     * If not set, the default value will be "include".
     *
     * For more information, refer to:
     * - [Fetch API - Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#including_credentials)
     * @since version after 3.3.1
     */
    fetchCredentials?: RequestCredentials;

}

/**
* Internal interface
* Simple internal timeout wrapper
* @internal
* @since version after 3.1.0
*/
export interface _ITimeoutOverrideWrapper {
    set: (callback: (...args: any[]) => void, ms: number, ...args: any[]) => ITimerHandler;
}


/**
* Internal interface
* internal sendpost interface
* @internal
* @since version after 3.1.0
*/
export interface _IInternalXhrOverride extends IXHROverride {
    _transport?: TransportType;
    _isSync?: boolean;
}
