// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { EventPersistence } from "@microsoft/applicationinsights-common";
import { INotificationManager, ITelemetryItem, NotificationManager, generateW3CId } from "@microsoft/applicationinsights-core-js";
import { isString, objKeys, strSubstr } from "@nevware21/ts-utils";
import { isValidPersistenceLevel } from "../Providers/IndexDbProvider";
import { IPostTransmissionTelemetryItem } from "../applicationinsights-offlinechannel-js";

// Endpoint schema
// <prefix>.<suffix>
//Prefix: Defines a service.
//Suffix: Defines the common domain name.

/**
 * Get domian from an endpoint url.
 * for example, https://test.com?auth=true, will return test.com
 * @param endpoint endpoint url
 * @returns domain string
 */
export function getEndpointDomain(endpoint: string) {
    try {
        let url = endpoint.replace(/^https?:\/\/|^www\./, "");
        url = url.replace(/\?/, "/");
        let arr = url.split("/");
        if (arr && arr.length > 0) {
            return arr[0];
        }
      
    } catch (e) {
        // eslint-disable-next-line no-empty
    }
    // if we can't get domain, entire endpoint will be used
    return endpoint;
}

/**
 * If current value is equal or greater than zero.
 * @param value number
 * @returns boolean
 */
export function isGreaterThanZero(value: number) {
    return value >= 0;
}


//Base64 is a binary encoding rather than a text encoding,
// it were added to the web platform before it supported binary data types.
// As a result, the two functions use strings to represent binary data
const _base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
/**
 * Base64-encodes a Uint8Array.
 *
 * @param data the Uint8Array or string to encode.
 *
 * @return the base64-encoded output string.
 */
export function base64Encode(data: string | Uint8Array) {
    let line = "";
    let input = "";

    if (isString(data)) {
        input = data;
    } else {
        input = data.toString();
    }

    let output = "";
    // tslint:disable-next-line:one-variable-per-declaration
    let chr1, chr2, chr3;

    let lp = 0;
    while (lp < input.length) {
        chr1 = input.charCodeAt(lp++);
        chr2 = input.charCodeAt(lp++);
        chr3 = input.charCodeAt(lp++);

        // encode 4 character group
        line += _base64.charAt(chr1 >> 2);
        line += _base64.charAt(((chr1 & 3) << 4) | (chr2 >> 4));
        if (isNaN(chr2)) {
            line += "==";
        } else {
            line += _base64.charAt(((chr2 & 15) << 2) | (chr3 >> 6));
            line += isNaN(chr3) ? "=" : _base64.charAt(chr3 & 63);
        }
    }

    output += line;

    return output;
}

/**
 * Base64-decodes an encoded string and transforms it back to a Uint8Array.
 * @param input the encoded string to decode
 * @return  Uint8Array
 */
export function base64Decode(input: string) {
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;

    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    while (i < input.length) {

        enc1 = _base64.indexOf(input.charAt(i++));
        enc2 = _base64.indexOf(input.charAt(i++));
        enc3 = _base64.indexOf(input.charAt(i++));
        enc4 = _base64.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
        }

    }
    let arr = output.split(",").map(c => Number(c));
    return new Uint8Array(arr);

}

/**
 * Get number value of current time and append a random float number.
 * For example, if current time value is 12345678, so "12345678.randomfl" will be returned
 * @returns time id string
 */
export function getTimeId(): string {
    let time = (new Date()).getTime();
    // append random digits to avoid same timestamp value
    const random = strSubstr(generateW3CId(), 0, 8);
    // function to create spanid();
    return time + "." + random;
}

/**
 * Get time value from a time id that is generated from getTimeId() function.
 * For example, if time id is "12345678.randomfl", 12345678 will be returned
 * @param id time id string
 * @returns time value number
 */
export function getTimeFromId(id: string) {
    try {
        let regex = new RegExp(/\d+\./g);
        if (id && isString(id) && regex.test(id)) {
            let arr = id.split(".");
            return parseInt(arr[0]);
 
        }
    } catch (e) {
        // eslint-disable-next-line no-empty
    }
    return 0;
}

/**
 * Get persistence level from a telemetry item.
 * Persistence level will be get from root, baseData or data in order.
 * For example, if persistence level is set both in root and baseData, the root one will be returned.
 * If no valid persistence level defined, normal level will be returned.
 * @param item telemetry item
 * @returns persistent level
 */
export function getPersistence(item: ITelemetryItem | IPostTransmissionTelemetryItem): number | EventPersistence {
    let rlt = EventPersistence.Normal;
    // if item is null, return normal level
    if (!item) {
        return rlt;
    }
    try {
        let iItem = item as IPostTransmissionTelemetryItem;
        let level = iItem.persistence || (iItem.baseData && iItem.baseData.persistence) || (iItem.data && iItem.data.persistence);
        if (level && isValidPersistenceLevel(level)) {
            return level;
        }
    } catch (e) {
        // eslint-disable-next-line no-empty
    }
    return rlt;
}

export const EVT_DISCARD_STR = "eventsDiscarded";
export const EVT_STORE_STR = "offlineEventsStored";
export const EVT_SENT_STR = "offlineBatchSent";
export const BATCH_DROP_STR = "offlineBatchDrop";

export function forEachMap<T>(map: { [key: string]: T }, callback: (value: T, key: string) => boolean, ordered?: boolean): void {
    if (map) {
        let keys = objKeys(map);
        if (!!ordered && keys) {
            let time = (new Date()).getTime();
            keys = keys.sort((a,b) => {
                try {
                    // if getTimeFromId returns 0, mean the time is not valid
                    let aTime = getTimeFromId(a) || time;
                    let bTime = getTimeFromId(b) || time;
                    return aTime - bTime;
                } catch(e) {
                    // eslint-disable-next-line no-empty
                }
                return -1;
            });
        }
        for (let lp = 0; lp < keys.length; lp++) {
            let key = keys[lp];
            if (!callback(map[key], key)) {
                break;
            }
        }
    }
}

 
export function callNotification(mgr: INotificationManager, evtName: string, theArgs: any[]) {
    let manager = (mgr || ({} as NotificationManager));
    let notifyFunc = manager[evtName];
    if (notifyFunc) {
        try {
            notifyFunc.apply(manager, theArgs);
        } catch (e) {
            // eslint-disable-next-line no-empty
        }
    }
}

export function batchDropNotification(mgr: INotificationManager, cnt: number, reason?: number) {
    if (mgr && cnt > 0) {
        callNotification(mgr, BATCH_DROP_STR, [cnt, reason]);
    }
    return;
}





// OneCollector:
// 200-OK – Success or partial success.
// 204-NoContent – Success or partial success. Regarding accepting events, identical to 200-OK. If the request header contains NoResponseBody with the value of true and the request was successful/partially successful, 204-NoContent status code is returned instead of 200-OK.
// 400-BadRequest – all events were rejected.
// 403-Forbidden – client is above its quota and all events were throttled.
// 413-RequestEntityTooLarge – the request doesn’t conform to limits described in Request constraints section.
// 415-UnsupportedMediaType – the Content-Type or Content-Encoding header has an unexpected value.
// 429-TooManyRequests – the server decided to throttle given request (no data accepted) as the client (device, client version, …) generates too much traffic.
// 401-Unauthorized – Can occur under two conditions:
//   All tenant tokens included in this request are invalid (unauthorized). kill-tokens header indicates which one(s). WWW-Authenticate: Token realm="ingestion" (see: rfc2617 for more details) header is added.
// The client has supplied the “strict” header (see section 3.3), and at least one MSA and/or XAuth event token cannot be used as a source of trusted user or device information.  The event failure reason “TokenCrackingFailure” will be present in the response’ JSON body.  In this scenario, the client is expected to fix or replace the offending ticket and retry.
// 500-InternalServerError – an unexpected exception while handling the request.
// 503-ServiceUnavailable – a machine serving this request is overloaded or shutting down. The request should be retried to a different machine. The server adds Connection: Close header to enforce TCP connection closing.



// Breeze
// 0 ad blockers
// 200 Success!
// 206 - Partial Accept
// 307/308 - Redirect
// 400 - Invalid
//  400 can also be caused by Azure AD authentication.
//  400 is not retriable and SDK should drop invalid data.
// 401 - Unauthorized
//  401 can be also caused by an AAD outage.
//  401 is retriable.
// 402 - Daily Quota Exceeded, drop the data.
//  There is no retry-after in the response header for 402.
// 403 - Forbidden
//  403 can also caused by misconfiguring the access control assigned to the Application Insights resource.
//  403 is retriable.
// 404 - Ingestion is allowed only from stamp specific endpoint
//  Telemetry will be dropped and customer must update their connection string.
//  404 is not retriable and SDK should drop the data.
// 408 - Timeout, retry it later. (offline might get this)
// 429 - Too Many Requests, Breeze returns retry-after for status code 429 only.
// 500 - Internal Server Error, retry it later.
// 502 - Bad Gateway, retry it later.
// 503 - Service Unavailable, retry it later. (offline)
// 504 - Gateway timeout, retry it later.
// All other response codes, SDK should drop the data.
