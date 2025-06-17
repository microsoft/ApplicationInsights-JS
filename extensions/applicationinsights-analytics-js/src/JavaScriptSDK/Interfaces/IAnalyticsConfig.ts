// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IConfiguration } from "@microsoft/applicationinsights-core-js";
import { IConfig } from "@microsoft/applicationinsights-common";

/**
 * Configuration interface specifically for AnalyticsPlugin
 * This interface combines the capabilities of IConfig and IConfiguration for the Analytics plugin.
 * Uses intersection type to ensure type safety and proper configuration handling.
 */
export type IAnalyticsConfig = IConfig & IConfiguration;
