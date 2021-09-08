// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrForEach, IPlugin, isString } from "@microsoft/applicationinsights-core-js";

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

    totalms = Math.round(totalms);

    let ms = "" + totalms % 1000;
    let sec = "" + Math.floor(totalms / 1000) % 60;
    let min = "" + Math.floor(totalms / (1000 * 60)) % 60;
    let hour = "" + Math.floor(totalms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(totalms / (1000 * 60 * 60 * 24));

    ms = ms.length === 1 ? "00" + ms : ms.length === 2 ? "0" + ms : ms;
    sec = sec.length < 2 ? "0" + sec : sec;
    min = min.length < 2 ? "0" + min : min;
    hour = hour.length < 2 ? "0" + hour : hour;

    return (days > 0 ? days + "." : "") + hour + ":" + min + ":" + sec + "." + ms;
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
