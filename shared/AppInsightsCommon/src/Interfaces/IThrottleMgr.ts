import { IThrottleMsgKey } from "../Enums";

/**
 * Identifies limit number/percentage of items sent per time
 * If both are provided, minimum number between the two will be used
 */
export interface IThrottleLimit {
    /**
     * Identifies sampling percentage of items per time
     * The percentage is set to 4 decimal places, for example: 1 means 0.0001%
     * Default: 100 (0.01%)
     */
    samplingRate?: number;

    /**
     * Identifies limit number of items per time
     * Default: 1
     */
    maxSendNumber?: number;
}

/**
 * Identifies frequency of items sent
 * Default: send data on 28th every 3 month each year
 */
export interface IThrottleInterval {
    /**
     * Identifies month interval that items can be sent
     * For example, if it is set to 2 and start date is in Jan, items will be sent out every two months (Jan, March, May etc.)
     * If both monthInterval and dayInterval are undefined, it will be set to 3
     */
    monthInterval?: number;

    /**
     * Identifies days Interval from start date that items can be sent
     * Default: undefined
     */
    dayInterval?: number;

     /**
     * Identifies days within each month that items can be sent
     * If both monthInterval and dayInterval are undefined, it will be default to [28]
     */
    daysOfMonth?: number[];
}

/**
* Identifies basic config
*/
export interface IThrottleMgrConfig {
    /**
    * Identifies message key to be used for local storage key
    */
    msgKey: IThrottleMsgKey;

    /**
    * Identifies if throttle is disabled
    * Default: false
    */
    disabled?: boolean;

    /**
    * Identifies limit number/percentage of items sent per time
    */
    limit?: IThrottleLimit;

    /**
    * Identifies frequency of items sent
    * Default: send data on 28th every 3 month each year
    */
    interval?: IThrottleInterval;
}

/**
* Identifies object for local storage
*/
export interface IThrottleLocalStorageObj {
    /**
    * Identifies start date
    */
    date: Date;

    /**
    * Identifies current count
    */

    count: number;

    /**
     * identifies previous triggered throttle date
     */
    preTriggerDate?: Date;
}

/**
* Identifies throttle result
*/
export interface IThrottleResult {
    /**
    * Identifies if items are sent
    */
    isThrottled: boolean;

    /**
    * Identifies numbers of items are sent
    * if isThrottled is false, it will be set to 0
    */
    throttleNum: number;
}