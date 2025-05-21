"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestHeaders = void 0;
var applicationinsights_core_js_1 = require("@microsoft/applicationinsights-core-js");
exports.RequestHeaders = (0, applicationinsights_core_js_1.createValueMap)({
    requestContextHeader: [0 /* eRequestHeaders.requestContextHeader */, "Request-Context"],
    requestContextTargetKey: [1 /* eRequestHeaders.requestContextTargetKey */, "appId"],
    requestContextAppIdFormat: [2 /* eRequestHeaders.requestContextAppIdFormat */, "appId=cid-v1:"],
    requestIdHeader: [3 /* eRequestHeaders.requestIdHeader */, "Request-Id"],
    traceParentHeader: [4 /* eRequestHeaders.traceParentHeader */, "traceparent"],
    traceStateHeader: [5 /* eRequestHeaders.traceStateHeader */, "tracestate"], // currently not used
    sdkContextHeader: [6 /* eRequestHeaders.sdkContextHeader */, "Sdk-Context"],
    sdkContextHeaderAppIdRequest: [7 /* eRequestHeaders.sdkContextHeaderAppIdRequest */, "appId"],
    requestContextHeaderLowerCase: [8 /* eRequestHeaders.requestContextHeaderLowerCase */, "request-context"]
});
