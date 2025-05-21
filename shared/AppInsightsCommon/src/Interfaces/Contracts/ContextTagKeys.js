"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextTagKeys = void 0;
var applicationinsights_core_js_1 = require("@microsoft/applicationinsights-core-js");
function _aiNameFunc(baseName) {
    var aiName = "ai." + baseName + ".";
    return function (name) {
        return aiName + name;
    };
}
var _aiApplication = _aiNameFunc("application");
var _aiDevice = _aiNameFunc("device");
var _aiLocation = _aiNameFunc("location");
var _aiOperation = _aiNameFunc("operation");
var _aiSession = _aiNameFunc("session");
var _aiUser = _aiNameFunc("user");
var _aiCloud = _aiNameFunc("cloud");
var _aiInternal = _aiNameFunc("internal");
var ContextTagKeys = /** @class */ (function (_super) {
    __extends(ContextTagKeys, _super);
    function ContextTagKeys() {
        return _super.call(this) || this;
    }
    return ContextTagKeys;
}((0, applicationinsights_core_js_1.createClassFromInterface)({
    applicationVersion: _aiApplication("ver"),
    applicationBuild: _aiApplication("build"),
    applicationTypeId: _aiApplication("typeId"),
    applicationId: _aiApplication("applicationId"),
    applicationLayer: _aiApplication("layer"),
    deviceId: _aiDevice("id"),
    deviceIp: _aiDevice("ip"),
    deviceLanguage: _aiDevice("language"),
    deviceLocale: _aiDevice("locale"),
    deviceModel: _aiDevice("model"),
    deviceFriendlyName: _aiDevice("friendlyName"),
    deviceNetwork: _aiDevice("network"),
    deviceNetworkName: _aiDevice("networkName"),
    deviceOEMName: _aiDevice("oemName"),
    deviceOS: _aiDevice("os"),
    deviceOSVersion: _aiDevice("osVersion"),
    deviceRoleInstance: _aiDevice("roleInstance"),
    deviceRoleName: _aiDevice("roleName"),
    deviceScreenResolution: _aiDevice("screenResolution"),
    deviceType: _aiDevice("type"),
    deviceMachineName: _aiDevice("machineName"),
    deviceVMName: _aiDevice("vmName"),
    deviceBrowser: _aiDevice("browser"),
    deviceBrowserVersion: _aiDevice("browserVersion"),
    locationIp: _aiLocation("ip"),
    locationCountry: _aiLocation("country"),
    locationProvince: _aiLocation("province"),
    locationCity: _aiLocation("city"),
    operationId: _aiOperation("id"),
    operationName: _aiOperation("name"),
    operationParentId: _aiOperation("parentId"),
    operationRootId: _aiOperation("rootId"),
    operationSyntheticSource: _aiOperation("syntheticSource"),
    operationCorrelationVector: _aiOperation("correlationVector"),
    sessionId: _aiSession("id"),
    sessionIsFirst: _aiSession("isFirst"),
    sessionIsNew: _aiSession("isNew"),
    userAccountAcquisitionDate: _aiUser("accountAcquisitionDate"),
    userAccountId: _aiUser("accountId"),
    userAgent: _aiUser("userAgent"),
    userId: _aiUser("id"),
    userStoreRegion: _aiUser("storeRegion"),
    userAuthUserId: _aiUser("authUserId"),
    userAnonymousUserAcquisitionDate: _aiUser("anonUserAcquisitionDate"),
    userAuthenticatedUserAcquisitionDate: _aiUser("authUserAcquisitionDate"),
    cloudName: _aiCloud("name"),
    cloudRole: _aiCloud("role"),
    cloudRoleVer: _aiCloud("roleVer"),
    cloudRoleInstance: _aiCloud("roleInstance"),
    cloudEnvironment: _aiCloud("environment"),
    cloudLocation: _aiCloud("location"),
    cloudDeploymentUnit: _aiCloud("deploymentUnit"),
    internalNodeName: _aiInternal("nodeName"),
    internalSdkVersion: _aiInternal("sdkVersion"),
    internalAgentVersion: _aiInternal("agentVersion"),
    internalSnippet: _aiInternal("snippet"),
    internalSdkSrc: _aiInternal("sdkSrc")
})));
exports.ContextTagKeys = ContextTagKeys;
