// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createClassFromInterface } from "@microsoft/applicationinsights-core-js";

function _aiNameFunc(baseName: string) {
    let aiName = "ai." + baseName + ".";
    return function(name: string) {
        return aiName + name;
    }
}

let _aiApplication = _aiNameFunc("application");
let _aiDevice = _aiNameFunc("device");
let _aiLocation = _aiNameFunc("location");
let _aiOperation = _aiNameFunc("operation");
let _aiSession = _aiNameFunc("session");
let _aiUser = _aiNameFunc("user");
let _aiCloud = _aiNameFunc("cloud");
let _aiInternal = _aiNameFunc("internal");

export interface IContextTagKeys {

    /**
     * Application version. Information in the application context fields is always about the application that is sending the telemetry.
     */
    readonly applicationVersion: string;

    /**
     * Application build.
     */
    readonly applicationBuild: string;

    /**
     * Application type id.
     */
    readonly applicationTypeId: string;

    /**
     * Application id.
     */
    readonly applicationId: string;

    /**
     * Application layer.
     */
    readonly applicationLayer: string;

    /**
     * Unique client device id. Computer name in most cases.
     */
    readonly deviceId: string;
    readonly deviceIp: string;
    readonly deviceLanguage: string;

    /**
     * Device locale using <language>-<REGION> pattern, following RFC 5646. Example 'en-US'.
     */
    readonly deviceLocale: string;

    /**
     * Model of the device the end user of the application is using. Used for client scenarios. If this field is empty then it is derived from the user agent.
     */
    readonly deviceModel: string;
    readonly deviceFriendlyName: string;
    readonly deviceNetwork: string;
    readonly deviceNetworkName: string;

    /**
     * Client device OEM name taken from the browser.
     */
    readonly deviceOEMName: string;
    readonly deviceOS: string;

    /**
     * Operating system name and version of the device the end user of the application is using. If this field is empty then it is derived from the user agent. Example 'Windows 10 Pro 10.0.10586.0'
     */
    readonly deviceOSVersion: string;

    /**
     * Name of the instance where application is running. Computer name for on-premisis, instance name for Azure.
     */
    readonly deviceRoleInstance: string;

    /**
     * Name of the role application is part of. Maps directly to the role name in azure.
     */
    readonly deviceRoleName: string;
    readonly deviceScreenResolution: string;

    /**
     * The type of the device the end user of the application is using. Used primarily to distinguish JavaScript telemetry from server side telemetry. Examples: 'PC', 'Phone', 'Browser'. 'PC' is the default value.
     */
    readonly deviceType: string;
    readonly deviceMachineName: string;
    readonly deviceVMName: string;
    readonly deviceBrowser: string;

    /**
     * The browser name and version as reported by the browser.
     */
    readonly deviceBrowserVersion: string;

    /**
     * The IP address of the client device. IPv4 and IPv6 are supported. Information in the location context fields is always about the end user. When telemetry is sent from a service, the location context is about the user that initiated the operation in the service.
     */
    readonly locationIp: string;

    /**
     * The country of the client device. If any of Country, Province, or City is specified, those values will be preferred over geolocation of the IP address field. Information in the location context fields is always about the end user. When telemetry is sent from a service, the location context is about the user that initiated the operation in the service.
     */
    readonly locationCountry: string;

    /**
     * The province/state of the client device. If any of Country, Province, or City is specified, those values will be preferred over geolocation of the IP address field. Information in the location context fields is always about the end user. When telemetry is sent from a service, the location context is about the user that initiated the operation in the service.
     */
    readonly locationProvince: string;

    /**
     * The city of the client device. If any of Country, Province, or City is specified, those values will be preferred over geolocation of the IP address field. Information in the location context fields is always about the end user. When telemetry is sent from a service, the location context is about the user that initiated the operation in the service.
     */
    readonly locationCity: string;

    /**
     * A unique identifier for the operation instance. The operation.id is created by either a request or a page view. All other telemetry sets this to the value for the containing request or page view. Operation.id is used for finding all the telemetry items for a specific operation instance.
     */
    readonly operationId: string;

    /**
     * The name (group) of the operation. The operation.name is created by either a request or a page view. All other telemetry items set this to the value for the containing request or page view. Operation.name is used for finding all the telemetry items for a group of operations (i.e. 'GET Home/Index').
     */
    readonly operationName: string;

    /**
     * The unique identifier of the telemetry item's immediate parent.
     */
    readonly operationParentId: string;
    readonly operationRootId: string;

    /**
     * Name of synthetic source. Some telemetry from the application may represent a synthetic traffic. It may be web crawler indexing the web site, site availability tests or traces from diagnostic libraries like Application Insights SDK itself.
     */
    readonly operationSyntheticSource: string;

    /**
     * The correlation vector is a light weight vector clock which can be used to identify and order related events across clients and services.
     */
    readonly operationCorrelationVector: string;

    /**
     * Session ID - the instance of the user's interaction with the app. Information in the session context fields is always about the end user. When telemetry is sent from a service, the session context is about the user that initiated the operation in the service.
     */
    readonly sessionId: string;

    /**
     * Boolean value indicating whether the session identified by ai.session.id is first for the user or not.
     */
    readonly sessionIsFirst: string;
    readonly sessionIsNew: string;
    readonly userAccountAcquisitionDate: string;

    /**
     * In multi-tenant applications this is the account ID or name which the user is acting with. Examples may be subscription ID for Azure portal or blog name blogging platform.
     */
    readonly userAccountId: string;

    /**
     * The browser's user agent string as reported by the browser. This property will be used to extract informaiton regarding the customer's browser but will not be stored. Use custom properties to store the original user agent.
     */
    readonly userAgent: string;

    /**
     * Anonymous user id. Represents the end user of the application. When telemetry is sent from a service, the user context is about the user that initiated the operation in the service.
     */
    readonly userId: string;

    /**
     * Store region for UWP applications.
     */
    readonly userStoreRegion: string;

    /**
     * Authenticated user id. The opposite of ai.user.id, this represents the user with a friendly name. Since it's PII information it is not collected by default by most SDKs.
     */
    readonly userAuthUserId: string;
    readonly userAnonymousUserAcquisitionDate: string;
    readonly userAuthenticatedUserAcquisitionDate: string;
    readonly cloudName: string;

    /**
     * Name of the role the application is a part of. Maps directly to the role name in azure.
     */
    readonly cloudRole: string;
    readonly cloudRoleVer: string;

    /**
     * Name of the instance where the application is running. Computer name for on-premisis, instance name for Azure.
     */
    readonly cloudRoleInstance: string;
    readonly cloudEnvironment: string;
    readonly cloudLocation: string;
    readonly cloudDeploymentUnit: string;

    /**
     * SDK version. See https://github.com/microsoft/ApplicationInsights-Home/blob/master/SDK-AUTHORING.md#sdk-version-specification for information.
     */
    readonly internalSdkVersion: string;

    /**
     * Agent version. Used to indicate the version of StatusMonitor installed on the computer if it is used for data collection.
     */
    readonly internalAgentVersion: string;

    /**
     * This is the node name used for billing purposes. Use it to override the standard detection of nodes.
     */
    readonly internalNodeName: string;

    /**
     * This identifies the version of the snippet that was used to initialize the SDK
     */
    readonly internalSnippet: string;

    /**
     * This identifies the source of the Sdk script (used to identify whether the SDK was loaded via the CDN)
     */
    readonly internalSdkSrc: string;
}

export class ContextTagKeys extends createClassFromInterface<IContextTagKeys>({
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
}) {
    constructor() {
        super();
    }
}