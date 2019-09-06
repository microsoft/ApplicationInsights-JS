// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface IInternal {
    /**
     * The SDK version used to create this telemetry item.
     */
    sdkVersion: string;

    /**
     * The SDK agent version.
     */
    agentVersion: string;
}