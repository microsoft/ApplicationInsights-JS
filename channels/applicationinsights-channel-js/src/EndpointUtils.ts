// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { DEFAULT_BREEZE_PATH } from "@microsoft/applicationinsights-core-js";
import { strEndsWith } from "@nevware21/ts-utils";

const _internalEndpointHosts = "|dc.services.visualstudio.com|breeze.aimon.applicationinsights.io|dc-int.services.visualstudio.com|" +
    "dc.applicationinsights.azure.com|dc.applicationinsights.azure.cn|dc.applicationinsights.us|";

// The leading dot prevents lookalike domains from matching these supported regional suffixes.
const _internalEndpointSuffixes: string[] = [
    ".dc.services.visualstudio.com",
    ".in.applicationinsights.azure.com",
    ".dc.applicationinsights.azure.com",
    ".dc.applicationinsights.azure.cn",
    ".dc.applicationinsights.us"
];

export function isCompressionEndpoint(endpointUrl: string): boolean {
    const scheme = "https://";
    if (!endpointUrl || endpointUrl.slice(0, scheme.length).toLowerCase() !== scheme) {
        return false;
    }

    let pathStart = endpointUrl.indexOf("/", scheme.length);
    if (pathStart === -1) {
        return false;
    }

    let authority = endpointUrl.slice(scheme.length, pathStart);
    if (!authority || authority.indexOf("@") !== -1) {
        return false;
    }

    let portStart = authority.lastIndexOf(":");
    if (portStart !== -1) {
        let port = authority.slice(portStart + 1);
        if (!port) {
            return false;
        }
        for (let lp = 0; lp < port.length; lp++) {
            if (port.charCodeAt(lp) < 48 || port.charCodeAt(lp) > 57) {
                return false;
            }
        }
        authority = authority.slice(0, portStart);
    }

    let pathEnd = endpointUrl.length;
    let queryStart = endpointUrl.indexOf("?", pathStart);
    let fragmentStart = endpointUrl.indexOf("#", pathStart);
    if (queryStart !== -1 && queryStart < pathEnd) {
        pathEnd = queryStart;
    }
    if (fragmentStart !== -1 && fragmentStart < pathEnd) {
        pathEnd = fragmentStart;
    }
    if (endpointUrl.slice(pathStart, pathEnd).toLowerCase() !== DEFAULT_BREEZE_PATH) {
        return false;
    }

    let host = authority.toLowerCase();
    if (_internalEndpointHosts.indexOf("|" + host + "|") !== -1) {
        return true;
    }

    for (let lp = 0; lp < _internalEndpointSuffixes.length; lp++) {
        if (strEndsWith(host, _internalEndpointSuffixes[lp])) {
            return true;
        }
    }

    return false;
}
