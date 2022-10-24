import { IThrottleMsgKey } from "../Enums";

/**
 * Identifies limit number/percentage of items sent per time
 * If both are provided, minimum number between the two will be used
 */
export interface IThrottleLimit {
    /**
     * Identifies sampling percentage of items per time
     * In /1000, for example: 200 means 0.2
     * Default: 100
     */
    samplingPercentage?: number;

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
     * Default: 3
     */
    monthInterval?: number;

    /**
     * Identifies days that items can be sent within a month
     * Default: 28
     */
    dayInterval?: number;

    /**
     * Identifies max times items can be sent within a month
     * Default: 1
     */
    maxTimesPerMonth?: number;
}

/**
* Identifies basic config
*/
export interface IthrottleMgrConfig {
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
export interface IthrottleLocalStorageObj {
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
export interface IthrottleResult {
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