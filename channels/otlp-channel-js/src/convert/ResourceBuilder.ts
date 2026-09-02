// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { CtxTagKeys, ITelemetryItem } from "@microsoft/applicationinsights-core-js";
import { objForEachKey } from "@nevware21/ts-utils";
import { IOtlpChannelConfig } from "../Interfaces/IOtlpChannelConfig";
import { IOtlpInstrumentationScope, IOtlpResource } from "../Interfaces/IOtlpTypes";
import {
    ATTR_BROWSER_LANGUAGE, ATTR_DEVICE_ID, ATTR_DEVICE_MODEL_NAME, ATTR_OS_TYPE, ATTR_OS_VERSION, ATTR_SERVICE_INSTANCE_ID,
    ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION, ATTR_TELEMETRY_SDK_LANGUAGE, ATTR_TELEMETRY_SDK_NAME, ATTR_TELEMETRY_SDK_VERSION,
    DEFAULT_SCOPE_NAME, MS_PREFIX
} from "../InternalConstants";
import { addAttribute, createAttributeWriter } from "./AttributeBuilder";

const SDK_NAME = "applicationinsights-web";
const SDK_LANGUAGE = "webjs";
const DEFAULT_SERVICE_NAME = "browser";

/**
 * The set of tag keys that are promoted to resource attributes, and therefore should not also be
 * emitted as record level attributes.
 */
export interface IResourceTagMap {
    [tagKey: string]: number;
}

/**
 * A resource together with the pre-computed values needed to build an export payload for it.
 */
export interface IOtlpResourceInfo {
    /**
     * The key that identifies this resource, telemetry that resolves to the same key shares a batch.
     */
    key: string;

    resource: IOtlpResource;

    scope: IOtlpInstrumentationScope;

    /**
     * The serialized `"resource":{...}` fragment, pre-computed so that building an export payload
     * requires no serialization of the resource.
     */
    resourceJson: string;

    /**
     * The serialized `"scope":{...}` fragment.
     */
    scopeJson: string;
}

/**
 * The tags that are promoted onto the resource. Anything listed here is excluded from the per record
 * attributes to avoid duplicating the value on every single record.
 */
export function getResourceTagKeys(): IResourceTagMap {
    let keys: IResourceTagMap = {};
    keys[CtxTagKeys.cloudRole] = 1;
    keys[CtxTagKeys.cloudRoleInstance] = 1;
    keys[CtxTagKeys.applicationVersion] = 1;
    keys[CtxTagKeys.deviceId] = 1;
    keys[CtxTagKeys.deviceModel] = 1;
    keys[CtxTagKeys.deviceOSVersion] = 1;
    keys[CtxTagKeys.deviceLanguage] = 1;
    keys[CtxTagKeys.internalSdkVersion] = 1;

    return keys;
}

function _tag(item: ITelemetryItem, key: string): any {
    let tags = item.tags;
    return tags ? tags[key] : undefined;
}

/**
 * Computes the key that identifies the resource for the supplied telemetry item. Items that produce
 * the same key are exported within the same `resourceSpans` / `resourceLogs` entry.
 *
 * @remarks
 * In a browser the values that make up this key are effectively constant for the lifetime of the
 * page, so this normally resolves to a single key and the associated resource is built exactly once.
 *
 * @param item - The telemetry item to compute the resource key for.
 * @returns The resource key.
 */
export function getResourceKey(item: ITelemetryItem): string {
    if (!item) {
        return "";
    }

    let ext = item.ext || {};
    let osExt = ext["os"] || {};
    let webExt = ext["web"] || {};

    // Every value that buildResourceInfo derives the resource from must appear here. Omitting one
    // would let a later item inherit a cached resource built from a different context, while its own
    // (promoted, and therefore suppressed from the record) tags are silently lost.
    return [
        item.iKey || "",
        _tag(item, CtxTagKeys.cloudRole) || "",
        _tag(item, CtxTagKeys.cloudRoleInstance) || "",
        _tag(item, CtxTagKeys.applicationVersion) || "",
        _tag(item, CtxTagKeys.deviceId) || "",
        _tag(item, CtxTagKeys.deviceModel) || "",
        _tag(item, CtxTagKeys.deviceOS) || "",
        _tag(item, CtxTagKeys.deviceOSVersion) || "",
        _tag(item, CtxTagKeys.deviceLanguage) || "",
        _tag(item, CtxTagKeys.internalSdkVersion) || "",
        osExt["name"] || "",
        osExt["osVer"] || "",
        webExt["browserLang"] || ""
    ].join("\u0001");
}

/**
 * Builds the resource and instrumentation scope for the supplied telemetry item.
 *
 * @remarks
 * This is comparatively expensive and is expected to be memoized by the caller against the value
 * returned from {@link getResourceKey}.
 *
 * @param item - A representative telemetry item for the resource.
 * @param config - The channel configuration.
 * @param key - The resource key as returned by {@link getResourceKey}.
 * @param sdkVersion - The version of this package, reported as the scope and sdk version.
 * @returns The resource information including the pre-serialized fragments.
 */
export function buildResourceInfo(item: ITelemetryItem, config: IOtlpChannelConfig, key: string, sdkVersion: string): IOtlpResourceInfo {
    let writer = createAttributeWriter();

    let cloudRole = _tag(item, CtxTagKeys.cloudRole);
    addAttribute(writer, ATTR_SERVICE_NAME, cloudRole || DEFAULT_SERVICE_NAME);
    addAttribute(writer, ATTR_SERVICE_INSTANCE_ID, _tag(item, CtxTagKeys.cloudRoleInstance));
    addAttribute(writer, ATTR_SERVICE_VERSION, _tag(item, CtxTagKeys.applicationVersion));

    addAttribute(writer, ATTR_TELEMETRY_SDK_NAME, SDK_NAME);
    addAttribute(writer, ATTR_TELEMETRY_SDK_LANGUAGE, SDK_LANGUAGE);
    addAttribute(writer, ATTR_TELEMETRY_SDK_VERSION, _tag(item, CtxTagKeys.internalSdkVersion) || sdkVersion);

    addAttribute(writer, ATTR_DEVICE_ID, _tag(item, CtxTagKeys.deviceId));
    addAttribute(writer, ATTR_DEVICE_MODEL_NAME, _tag(item, CtxTagKeys.deviceModel));

    let ext = item.ext || {};
    let osExt = ext["os"] || {};
    addAttribute(writer, ATTR_OS_TYPE, osExt["name"] || _tag(item, CtxTagKeys.deviceOS));
    addAttribute(writer, ATTR_OS_VERSION, osExt["osVer"] || _tag(item, CtxTagKeys.deviceOSVersion));

    let webExt = ext["web"] || {};
    addAttribute(writer, ATTR_BROWSER_LANGUAGE, webExt["browserLang"] || _tag(item, CtxTagKeys.deviceLanguage));

    if (config.includeIKeyInResource) {
        addAttribute(writer, MS_PREFIX + "instrumentation_key", item.iKey);
    }

    // User supplied attributes are applied last so that they can override anything derived above.
    // The writer replaces rather than repeats an existing key, because a duplicate key in an OTLP
    // attribute list has undefined behaviour.
    let overrides = config.resourceAttributes;
    if (overrides) {
        objForEachKey(overrides, (attrKey, value) => {
            addAttribute(writer, attrKey, value);
        });
    }

    let resource: IOtlpResource = { attributes: writer.attrs };
    let scope: IOtlpInstrumentationScope = {
        name: config.scopeName || DEFAULT_SCOPE_NAME,
        version: config.scopeVersion || sdkVersion
    };

    return {
        key: key,
        resource: resource,
        scope: scope,
        resourceJson: JSON.stringify(resource),
        scopeJson: JSON.stringify(scope)
    };
}
