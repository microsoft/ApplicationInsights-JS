// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { BehaviorEnumValidator, BehaviorMapValidator, BehaviorValueValidator, ClickAnalyticsPlugin } from "./ClickAnalyticsPlugin";
import { IClickAnalyticsConfiguration, IValueCallback, ICustomDataTags, ICoreData, IPageTags, IPageActionTelemetry, IContent, IOverrideValues, IPageActionOverrideValues } from "./Interfaces/Datamodel";
import { Behavior } from "./Behaviours";

// Re-export ICustomProperties from core
export { ICustomProperties } from "@microsoft/applicationinsights-core-js";

export { IClickAnalyticsConfiguration, IValueCallback, ICustomDataTags, ICoreData, IPageTags, IPageActionTelemetry, IContent, IOverrideValues, IPageActionOverrideValues, Behavior, ClickAnalyticsPlugin, BehaviorMapValidator, BehaviorValueValidator, BehaviorEnumValidator }
