// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IConfiguration } from "@microsoft/applicationinsights-core-js";
import { IConfig } from "@microsoft/applicationinsights-common";

/**
 * Configuration interface specifically for AnalyticsPlugin
 * This interface combines the capabilities of IConfig and IConfiguration for the Analytics plugin.
 */
export type IAnalyticsConfig = IConfig & IConfiguration;
