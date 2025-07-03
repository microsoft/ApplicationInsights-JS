// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createEnumStyle } from "@microsoft/applicationinsights-core-js";

/**
 * Defines the level of severity for the event.
 */
export const enum eSeverityLevel {
    Verbose = 0,
    Information = 1,
    Warning = 2,
    Error = 3,
    Critical = 4,
}

/**
 * Defines the level of severity for the event.
 */
export const SeverityLevel = createEnumStyle<typeof eSeverityLevel>({
    Verbose: eSeverityLevel.Verbose,
    Information: eSeverityLevel.Information,
    Warning: eSeverityLevel.Warning,
    Error: eSeverityLevel.Error,
    Critical: eSeverityLevel.Critical
});

export type SeverityLevel = number | eSeverityLevel;