// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { PageViewPerformance } from "./Telemetry/PageViewPerformance";
import { Util } from "./Util";
import { DataSanitizer } from "./Telemetry/Common/DataSanitizer";
import { ITelemetryItem, CoreUtils, IDiagnosticLogger } from "@microsoft/applicationinsights-core-js";
import { IEnvelope } from './Interfaces/Telemetry/IEnvelope';
import { RemoteDependencyData } from './Telemetry/RemoteDependencyData';
import { IDependencyTelemetry } from './applicationinsights-common';
import { UnmappedKeys, DeviceExtensionKeys, CtxTagKeys, AppExtensionKeys, IngestExtKeys, WebExtensionKeys, OSExtKeys } from "./Interfaces/PartAExtensions";

export class TelemetryItemCreator {

    /**
     * Create a telemetry item that the 1DS channel understands
     * @param item domain specific properties; part B
     * @param baseType telemetry item type. ie PageViewData
     * @param envelopeName name of the envelope. ie Microsoft.ApplicationInsights.<instrumentation key>.PageView
     * @param customProperties user defined custom properties; part C
     * @param systemProperties system properties that are added to the context; part A
     * @returns ITelemetryItem that is sent to channel
     */

    public static create<T>(item: T,
        baseType: string,
        envelopeName: string,
        logger: IDiagnosticLogger,
        customProperties?: { [key: string]: any },
        systemProperties?: { [key: string]: any }): ITelemetryItem {

        envelopeName = DataSanitizer.sanitizeString(logger, envelopeName) || Util.NotSpecified;

        if (CoreUtils.isNullOrUndefined(item) ||
            CoreUtils.isNullOrUndefined(baseType) ||
            CoreUtils.isNullOrUndefined(envelopeName)) {
                throw Error("Input doesn't contain all required fields");
        }

        let telemetryItem: ITelemetryItem = {
            name: envelopeName,
            time: new Date().toISOString(),
            iKey: "", // this will be set in TelemetryContext
            ctx: systemProperties ? systemProperties : {}, // part A
            tags: [],
            data: {
            },
            baseType: baseType,
            baseData: item // Part B
        };

        // Part C
        if (!CoreUtils.isNullOrUndefined(customProperties)) {
            for (var prop in customProperties) {
                if (customProperties.hasOwnProperty(prop)) {
                    telemetryItem.data[prop] = customProperties[prop];
                }
            }
        }

        return telemetryItem;
    }

    /*
     * Converts legacy type to ITelemetryItem
     */
    public static convertoFrom(env: IEnvelope, logger: IDiagnosticLogger) : ITelemetryItem {
        let customProperties = {};
        for (var property in env.data) { // part B
            if (property !== "baseData" && property !== "baseType") {
              customProperties[property] = env.data[property];
            }
        }

        let telemetryItem;

        switch(env.data.baseType) {
            case RemoteDependencyData.dataType:

                let dependencyTelemetry = <IDependencyTelemetry>(env.data.baseType);
                telemetryItem = TelemetryItemCreator.create<IDependencyTelemetry>(
                    dependencyTelemetry,
                    RemoteDependencyData.dataType,
                    RemoteDependencyData.envelopeType,
                    logger,
                    customProperties);
        }

        TelemetryItemCreator._extractPartA(env, telemetryItem);

        return telemetryItem;
    }

    /*
     * Maps Part A data to CS 4.0
     */
    private static _extractPartA(env: IEnvelope, item: ITelemetryItem) {

        let keysFound = [];

        if (!item || !env.tags) {
            return;
        }

        if (!item.tags) {
            item.tags = [];
        }

        if (!item.ctx) {
            item.ctx = {};
        }

        if (env.tags[CtxTagKeys.applicationVersion]) {
            item.tags[UnmappedKeys.applicationVersion] = env.tags[CtxTagKeys.applicationVersion];
            keysFound.push(CtxTagKeys.applicationVersion);
        }

        if (env.tags[CtxTagKeys.applicationBuild]) {
            item.tags[UnmappedKeys.applicationBuild]  = env.tags[CtxTagKeys.applicationBuild];
            keysFound.push(CtxTagKeys.applicationBuild);
        }

        if (env.tags[CtxTagKeys.sessionId]) {
            item.ctx[AppExtensionKeys.sessionId] = env.tags[CtxTagKeys.sessionId];
            keysFound.push(CtxTagKeys.sessionId);
        }

        if (env.tags[CtxTagKeys.sessionIsFirst]) {
            item.tags[CtxTagKeys.sessionIsFirst] = env.tags[CtxTagKeys.sessionIsFirst];
            keysFound.push(CtxTagKeys.sessionIsFirst);
        }

        if (env.tags[CtxTagKeys.deviceId]) {
            item.ctx[DeviceExtensionKeys.localId] = env.tags[CtxTagKeys.deviceId];
            keysFound.push(CtxTagKeys.deviceId);
        }

        if (env.tags[CtxTagKeys.deviceIp]) {
            item.ctx[IngestExtKeys.clientIp] = env.tags[CtxTagKeys.deviceIp];
            keysFound.push(CtxTagKeys.deviceIp);
        }

        if (env.tags[CtxTagKeys.deviceLanguage]) {
            item.ctx[WebExtensionKeys.browserLang] = env.tags[CtxTagKeys.deviceLanguage];
            keysFound.push(CtxTagKeys.deviceLanguage);
        }

        if (env.tags[CtxTagKeys.deviceLocale]) {
            item.tags[UnmappedKeys.deviceLocale] = env.tags[CtxTagKeys.deviceLocale];
            keysFound.push(CtxTagKeys.deviceLocale);
        }

        if (env.tags[CtxTagKeys.deviceModel]) {
            item.ctx[DeviceExtensionKeys.model] = env.tags[CtxTagKeys.deviceModel];
            keysFound.push(CtxTagKeys.deviceModel);
        }

        if (env.tags[CtxTagKeys.deviceNetwork]) {
            item.ctx[UnmappedKeys.deviceNetwork] = env.tags[CtxTagKeys.deviceNetwork];
            keysFound.push(CtxTagKeys.deviceNetwork);
        }

        if (env.tags[CtxTagKeys.deviceOEMName]) {
            item.ctx[UnmappedKeys.deviceOEMName] = env.tags[CtxTagKeys.deviceOEMName];
            keysFound.push(CtxTagKeys.deviceOEMName);
        }

        if (env.tags[CtxTagKeys.deviceOSVersion]) {
            item.tags[UnmappedKeys.deviceOSVersion] = env.tags[CtxTagKeys.deviceOSVersion];
            keysFound.push(CtxTagKeys.deviceOSVersion);
        }

        if (env.tags[CtxTagKeys.deviceOS]) {
            item.ctx[OSExtKeys.deviceOS] = env.tags[CtxTagKeys.deviceOS];
            keysFound.push(CtxTagKeys.deviceModel);
        }

        if (env.tags[CtxTagKeys.deviceNetwork]) {
            item.ctx[UnmappedKeys.deviceNetwork] = env.tags[CtxTagKeys.deviceNetwork];
            keysFound.push(CtxTagKeys.deviceNetwork);
        }

        if (env.tags[CtxTagKeys.deviceType]) {
            item.ctx[DeviceExtensionKeys.deviceType] = env.tags[CtxTagKeys.deviceType];
            keysFound.push(CtxTagKeys.deviceType);
        }

        if (env.tags[CtxTagKeys.deviceOSVersion]) {
            item.tags[UnmappedKeys.deviceOSVersion] = env.tags[CtxTagKeys.deviceOSVersion];
            keysFound.push(CtxTagKeys.deviceOSVersion);
        }

        if (env.tags[CtxTagKeys.deviceScreenResolution]) {
            item.tags[WebExtensionKeys.screenRes] = env.tags[CtxTagKeys.deviceScreenResolution];
            keysFound.push(CtxTagKeys.deviceScreenResolution);
        }

        if (env.tags.sampleRate) {
            item.tags["sampleRate"] = env.tags.sampleRate;
            keysFound.push(CtxTagKeys.deviceScreenResolution);
        }

        if (env.tags[CtxTagKeys.locationIp]) {
            item.tags[CtxTagKeys.locationIp] = env.tags[CtxTagKeys.locationIp];
            keysFound.push(CtxTagKeys.locationIp);
        }

        if (env.tags[CtxTagKeys.internalSdkVersion]) {
            item.tags[CtxTagKeys.internalSdkVersion] = env.tags[CtxTagKeys.internalSdkVersion];
            keysFound.push(CtxTagKeys.internalSdkVersion);
        }

        if (env.tags[CtxTagKeys.internalAgentVersion]) {
            item.tags[CtxTagKeys.internalAgentVersion] = env.tags[CtxTagKeys.internalAgentVersion];
            keysFound.push(CtxTagKeys.internalAgentVersion);
        }



        if (env.tags[CtxTagKeys.operationRootId]) {
            item.tags[CtxTagKeys.operationRootId] = env.tags[CtxTagKeys.operationRootId];
            keysFound.push(CtxTagKeys.operationRootId);
        }


        if (env.tags[CtxTagKeys.operationSyntheticSource]) {
            item.tags[CtxTagKeys.operationSyntheticSource] = env.tags[CtxTagKeys.operationSyntheticSource];
            keysFound.push(CtxTagKeys.operationSyntheticSource);
        }

        if (env.tags[CtxTagKeys.operationParentId]) {
            item.tags[CtxTagKeys.operationParentId] = env.tags[CtxTagKeys.operationParentId];
            keysFound.push(CtxTagKeys.operationParentId);
        }

        if (env.tags[CtxTagKeys.operationName]) {
            item.tags[CtxTagKeys.operationName] = env.tags[CtxTagKeys.operationName];
            keysFound.push(CtxTagKeys.operationName);
        }

        if (env.tags[CtxTagKeys.operationId]) {
            item.tags[CtxTagKeys.operationId] = env.tags[CtxTagKeys.operationId];
            keysFound.push(CtxTagKeys.operationId);
        }

        Object.keys(env.tags).forEach(key => {
            if (keysFound.indexOf(key) < 0) {
                item.tags[key] = env.tags[key]; // copy over remaining tags
            }
        })
    }
}
