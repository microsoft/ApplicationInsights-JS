import { IThrottleMsgKey } from "../Enums";

/**
 * Identifies limit number/percentage of items sent per time
 * if both are provided, minimum number between the two will be used
 * Default: 1 item per time
 */
export interface IThrottleLimit {
    /**
     * Identifies limit percentage of items
     * in %, for example: 20 means 20%
     * Default 100
     */
    sentPercentage?: number;
    /**
     * Identifies limit number of items
     * Default 1
     */
    maxSentNumber?: number;
}

/**
 * Identifies frequency of items sent
 * Default: send data on 28th every 3 month each year
 */
export interface IThrottleInterval {
    /**
     * Identifies years that items can be sent
     * for example, if it is set to 2 and items will be sent every two years
     * Default 1
     */
    yearInterval?: number
    /**
     * Identifies months that items can be sent within a year
     * Default 3
     */
    monthInterval?: number;
    /**
     * Identifies days that items can be sent within a month
     * Default 28
     */
    dayInterval?: number;
    /**
     * Identifies max times items can be sent within a month
     * Default 1
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
    msgKey: IThrottleMsgKey
    /**
    * Identifies throttle can be used
    * Default: false
    */
    enabled?: boolean;
    /**
    * Identifies limit number/percentage of items sent per time
    * Default: 1 item per time
    */
    limit?: IThrottleLimit;
    /**
    * Identifies frequency of items sent
    * Default: send data on 28th every 3 month each year
    */
    interval?: IThrottleInterval;
}


/**
* Identifies date object
*/
export interface IthrottleDate {
    year: number;
    month: number;
    day: number
}

/**
* Identifies object for local storage
*/
export interface IthrottleLocalStorageObj {
    /**
    * Identifies start date
    */
    date: IthrottleDate;
    /**
    * Identifies current count
    */
    count: number;
}

/**
* Identifies throttle result
*/
export interface IthrottleResult {
    /**
    * Identifies if items are sent
    */
    isThrottled: boolean,
    /**
    * Identifies numbers of items are sent
    * if isThrottled is false, it will be set to 0
    */
    throttleNum: number
}