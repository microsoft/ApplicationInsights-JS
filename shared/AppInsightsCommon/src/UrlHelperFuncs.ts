// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { getDocument, isString } from "@microsoft/applicationinsights-core-js";

let _document: any = getDocument() || {};

let _htmlAnchorIdx: number = 0;
// Use an array of temporary values as it's possible for multiple calls to parseUrl() will be called with different URLs
// Using a cache size of 5 for now as it current depth usage is at least 2, so adding a minor buffer to handle future updates
let _htmlAnchorElement: HTMLAnchorElement[] = [null, null, null, null, null];

export function urlParseUrl(url: string): HTMLAnchorElement {
    let anchorIdx = _htmlAnchorIdx;
    let anchorCache = _htmlAnchorElement;
    let tempAnchor = anchorCache[anchorIdx];
    if (!_document.createElement) {
        // Always create the temp instance if createElement is not available
        tempAnchor = { host: urlParseHost(url, true) } as HTMLAnchorElement;
    } else if (!anchorCache[anchorIdx]) {
        // Create and cache the unattached anchor instance
        tempAnchor = anchorCache[anchorIdx] = _document.createElement("a");
    }

    tempAnchor.href = url;

    // Move the cache index forward
    anchorIdx++;
    if (anchorIdx >= anchorCache.length) {
        anchorIdx = 0;
    }

    _htmlAnchorIdx = anchorIdx;

    return tempAnchor;
}

export function urlGetAbsoluteUrl(url: string): string {
    let result: string;
    const a = urlParseUrl(url);
    if (a) {
        result = a.href;
    }

    return result;
}

export function urlGetPathName(url: string): string {
    let result: string;
    const a = urlParseUrl(url);
    if (a) {
        result = a.pathname;
    }

    return result;
}

export function urlGetCompleteUrl(method: string, absoluteUrl: string) {
    if (method) {
        return method.toUpperCase() + " " + absoluteUrl;
    }

    return absoluteUrl;
}

// Fallback method to grab host from url if document.createElement method is not available
export function urlParseHost(url: string, inclPort?: boolean) {
    let fullHost = urlParseFullHost(url, inclPort) || "";
    if (fullHost) {
        const match = fullHost.match(/(www[0-9]?\.)?(.[^/:]+)(\:[\d]+)?/i);
        if (match != null && match.length > 3 && isString(match[2]) && match[2].length > 0) {
            return match[2] + (match[3] || "");
        }
    }

    return fullHost;
}

export function urlParseFullHost(url: string, inclPort?: boolean) {
    let result = null;
    if (url) {
        const match = url.match(/(\w*):\/\/(.[^/:]+)(\:[\d]+)?/i);
        if (match != null && match.length > 2 && isString(match[2]) && match[2].length > 0) {
            result = match[2] || "";
            if (inclPort && match.length > 2) {
                const protocol = (match[1] || "").toLowerCase();
                let port = match[3] || "";
                // IE includes the standard port so pass it off if it's the same as the protocol
                if (protocol === "http" && port === ":80") {
                    port = "";
                } else if (protocol === "https" && port === ":443") {
                    port = "";
                }

                result += port;
            }
        }
    }

    return result;
}
