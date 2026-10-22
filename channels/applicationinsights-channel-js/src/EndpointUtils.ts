// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// The authority may only contain hostname characters and an optional numeric port, so userinfo ("@") or a "?", "#" or "\"
// delimiter can never place an ingestion hostname from the query, fragment or path into the matched host.
const _endpointRegex = /^https:\/\/([a-z0-9.-]+)(?::\d+)?\/v2\/track(?:[?#]|$)/i;

// The leading "^" or "." boundary prevents lookalike domains from matching the supported hosts and regional suffixes.
const _hostRegex = /(?:^|\.)(?:dc\.services\.visualstudio\.com|dc\.applicationinsights\.(?:azure\.com|azure\.cn|us))$/i;
const _otherHostRegex = /\.in\.applicationinsights\.azure\.com$|^(?:breeze\.aimon\.applicationinsights\.io|dc-int\.services\.visualstudio\.com)$/i;

export function isCompressionEndpoint(endpointUrl: string): boolean {
    let match = _endpointRegex.exec(endpointUrl || "");
    return !!match && (_hostRegex.test(match[1]) || _otherHostRegex.test(match[1]));
}