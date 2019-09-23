// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IInternal } from '@microsoft/applicationinsights-common';
import { ITelemetryConfig } from '../Interfaces/ITelemetryConfig';

const Version = "2.2.4";

export class Internal implements IInternal {

    /**
     * The SDK version used to create this telemetry item.
     */
    public sdkVersion: string;

    /**
     * The SDK agent version.
     */
    public agentVersion: string;

    /**
     * Constructs a new instance of the internal telemetry data class.
     */
    constructor(config: ITelemetryConfig) {
        this.sdkVersion = (config.sdkExtension && config.sdkExtension() ? config.sdkExtension() + "_" : "") + "javascript:" + Version;
    }
}