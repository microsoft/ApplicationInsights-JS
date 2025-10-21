// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export {
    INVALID_TRACE_ID,
    INVALID_SPAN_ID,
    createTraceParent,
    parseTraceParent,
    isValidTraceId,
    isValidSpanId,
    isValidTraceParent,
    isSampledFlag,
    formatTraceParent,
    findW3cTraceParent,
    findAllScripts,
    scriptsInfo
} from "@microsoft/applicationinsights-common";
