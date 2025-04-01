// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPlugin, arrForEach, isString } from "@microsoft/applicationinsights-core-js";
import { mathFloor, mathRound } from "@nevware21/ts-utils";

const strEmpty = "";

export function stringToBoolOrDefault(str: any, defaultValue = false): boolean {
    if (str === undefined || str === null) {
        return defaultValue;
    }

    return str.toString().toLowerCase() === "true";
}

/**
 * Convert ms to c# time span format
 */
export function msToTimeSpan(totalms: number): string {
    if (isNaN(totalms) || totalms < 0) {
        totalms = 0;
    }

    totalms = mathRound(totalms);

    let ms = strEmpty + totalms % 1000;
    let sec = strEmpty + mathFloor(totalms / 1000) % 60;
    let min = strEmpty + mathFloor(totalms / (1000 * 60)) % 60;
    let hour = strEmpty + mathFloor(totalms / (1000 * 60 * 60)) % 24;
    const days = mathFloor(totalms / (1000 * 60 * 60 * 24));

    ms = ms.length === 1 ? "00" + ms : ms.length === 2 ? "0" + ms : ms;
    sec = sec.length < 2 ? "0" + sec : sec;
    min = min.length < 2 ? "0" + min : min;
    hour = hour.length < 2 ? "0" + hour : hour;

    return (days > 0 ? days + "." : strEmpty) + hour + ":" + min + ":" + sec + "." + ms;
}

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

export function isCrossOriginError(message: string|Event, url: string, lineNumber: number, columnNumber: number, error: Error | Event): boolean {
    return !error && isString(message) && (message === "Script error." || message === "Script error");
}
