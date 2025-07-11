// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Behavior } from "./Behaviours";
import { BehaviorEnumValidator, BehaviorMapValidator, BehaviorValueValidator, ClickAnalyticsPlugin } from "./ClickAnalyticsPlugin";
import {
    IClickAnalyticsConfiguration, IContent, ICoreData, ICustomDataTags, IOverrideValues, IPageActionOverrideValues, IPageActionTelemetry,
    IPageTags, IValueCallback
} from "./Interfaces/Datamodel";

// Re-export ICustomProperties from core
export { ICustomProperties } from "@microsoft/applicationinsights-core-js";

export { IClickAnalyticsConfiguration, IValueCallback, ICustomDataTags, ICoreData, IPageTags, IPageActionTelemetry, IContent, IOverrideValues, IPageActionOverrideValues, Behavior, ClickAnalyticsPlugin, BehaviorMapValidator, BehaviorValueValidator, BehaviorEnumValidator }
