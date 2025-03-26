/**
* BatchNotificationActions.ts
* @author Nev Wylie (newylie)
* @copyright Microsoft 2020
*/
import { EventSendType } from "@microsoft/1ds-core-js";
import { EventBatchNotificationReason } from "./DataModels";
import { EventBatch } from "./EventBatch";

export type BatchNotificationAction = (batches: EventBatch[], reason?: EventBatchNotificationReason, isSyncRequest?: boolean, sendType?: EventSendType) => void;

// tslint:disable-next-line:interface-name
export interface BatchNotificationActions {
    /**
     * Attempts have been made to send the events but all failed.
     * Requeue the events (if possible) for resending.
     */
    requeue?: BatchNotificationAction;

    /**
     * The batch is about to be sent
     */
    send?: BatchNotificationAction;

    /**
     * The batch has been sent acknowledged by the server
     */
    sent?: BatchNotificationAction;

    /**
     * The events of the batch have been dropped
     */
    drop?: BatchNotificationAction;

    /**
     * The events of the batch have been dropped after being sent but not acknowledged
     */
    rspFail?: BatchNotificationAction;

    /**
     * Default callback action to call when no specific action could be identified for the reason
     */
    oth?: BatchNotificationAction;
}
