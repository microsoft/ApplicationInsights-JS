"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventPersistence = exports.DistributedTracingModes = exports.StorageType = void 0;
var applicationinsights_core_js_1 = require("@microsoft/applicationinsights-core-js");
exports.StorageType = (0, applicationinsights_core_js_1.createEnumStyle)({
    LocalStorage: 0 /* eStorageType.LocalStorage */,
    SessionStorage: 1 /* eStorageType.SessionStorage */
});
exports.DistributedTracingModes = (0, applicationinsights_core_js_1.createEnumStyle)({
    AI: 0 /* eDistributedTracingModes.AI */,
    AI_AND_W3C: 1 /* eDistributedTracingModes.AI_AND_W3C */,
    W3C: 2 /* eDistributedTracingModes.W3C */
});
/**
 * The EventPersistence contains a set of values that specify the event's persistence.
 */
exports.EventPersistence = (0, applicationinsights_core_js_1.createEnumStyle)({
    /**
     * Normal persistence.
     */
    Normal: 1 /* EventPersistenceValue.Normal */,
    /**
     * Critical persistence.
     */
    Critical: 2 /* EventPersistenceValue.Critical */
});
