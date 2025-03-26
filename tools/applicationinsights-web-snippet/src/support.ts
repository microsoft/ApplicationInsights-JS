// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

let strEmpty = "";

// Gets the time as an ISO date format, using a function as IE7/8 doesn't support toISOString
export function _getTime() {
    let date = new Date();
    function pad(num: Number) {
        let r = strEmpty + num;
        if (r.length === 1) {
            r = "0" + r;
        }

        return r;
    }

    return date.getUTCFullYear()
        + "-" + pad(date.getUTCMonth() + 1)
        + "-" + pad(date.getUTCDate())
        + "T" + pad(date.getUTCHours())
        + ":" + pad(date.getUTCMinutes())
        + ":" + pad(date.getUTCSeconds())
        + "." + String((date.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5)
        + "Z";
}

