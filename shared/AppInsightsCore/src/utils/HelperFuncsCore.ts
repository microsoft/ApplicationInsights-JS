// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrForEach, isString, mathFloor, mathRound } from "@nevware21/ts-utils";
import { STR_EMPTY } from "../constants/InternalConstants";
import { IPlugin } from "../interfaces/ai/ITelemetryPlugin";
import { isTimeSpan } from "../internal/timeHelpers";

/*#__NO_SIDE_EFFECTS__*/
export function stringToBoolOrDefault(str: any, defaultValue = false): boolean {
    if (str === undefined || str === null) {
        return defaultValue;
    }

    return str.toString().toLowerCase() === "true";
}

/**
 * Convert ms to c# time span format
 */
/*#__NO_SIDE_EFFECTS__*/
export function msToTimeSpan(totalms: number | string): string {
    if (isTimeSpan(totalms)) {
        // Already in time span format
        return totalms;
    }

    if (isNaN(totalms) || totalms < 0) {
        totalms = 0;
    }

    totalms = mathRound(totalms);

    let ms = STR_EMPTY + totalms % 1000;
    let sec = STR_EMPTY + mathFloor(totalms / 1000) % 60;
    let min = STR_EMPTY + mathFloor(totalms / (1000 * 60)) % 60;
    let hour = STR_EMPTY + mathFloor(totalms / (1000 * 60 * 60)) % 24;
    const days = mathFloor(totalms / (1000 * 60 * 60 * 24));

    ms = ms.length === 1 ? "00" + ms : ms.length === 2 ? "0" + ms : ms;
    sec = sec.length < 2 ? "0" + sec : sec;
    min = min.length < 2 ? "0" + min : min;
    hour = hour.length < 2 ? "0" + hour : hour;

    return (days > 0 ? days + "." : STR_EMPTY) + hour + ":" + min + ":" + sec + "." + ms;
}

/*#__NO_SIDE_EFFECTS__*/
export function getExtensionByName(extensions: IPlugin[], identifier: string): IPlugin | null {
    let extension: IPlugin = null;
    arrForEach(extensions, (value) => {
        if (value.identifier === identifier) {
            extension = value;
            return -1;
        }
    });

    return extension;
}

/*#__NO_SIDE_EFFECTS__*/
export function isCrossOriginError(message: string|Event, url: string, lineNumber: number, columnNumber: number, error: Error | Event): boolean {
    return !error && isString(message) && (message === "Script error." || message === "Script error");
}
