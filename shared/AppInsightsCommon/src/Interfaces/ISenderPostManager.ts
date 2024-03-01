import { IPayloadData, OnCompleteCallback } from "@microsoft/applicationinsights-core-js";
import { IXDomainRequest } from "./IXDomainRequest";

/**
 * internal interface
 * Define functions when xhr/xdr/fetch requests are successfully returned. If they are not defined, oncomplete with be called instead
 * @internal for internal use only
 */
export interface _ISenderOnComplete {
    /**
     * defined xdr onload function to handle response
     * @param dxr xdr request object
     * @param oncomplete oncomplete function
     * @since version after 3.1.0
     */
    xdrOnComplete?(xdr: IXDomainRequest, onComplete: OnCompleteCallback, payload?: IPayloadData): void;
    /**
     * defined fetch on complete function to handle response
     * @param response response object
     * @param onComplete oncomplete function
     * @param resValue response.text().value
     * @since version after 3.1.0
     */
    fetchOnComplete?(response: Response, onComplete: OnCompleteCallback, resValue?: string, payload?: IPayloadData): void;
    /**
     * defined xhr onreadystatechange function to handle response
     * @param request request object
     * @param oncomplete oncomplete function
     * @since version after 3.1.0
     */
    xhrOnComplete?(request: XMLHttpRequest, onComplete: OnCompleteCallback, payload?: IPayloadData):void;

    /**
     * Define functions during beacon can not send payload after first attempt. If not defined, will be apyload will be retried with fallback sender.
     * @param data payload data
     * @param onComplete oncomplete function
     * @param canSend can the current data sent by beacon sender
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
     * Is beacon disabled during asunc sending
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
     * Identifies functions when xhr/xdr/fetch requests are successfully returned. If they are not defined, oncomplete with be called instead
     * @since version after 3.1.0
     */
    senderOnCompleteCallBack?: _ISenderOnComplete;

}