// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IInternal } from "@microsoft/applicationinsights-common";
import { ITelemetryConfig } from "../Interfaces/ITelemetryConfig";

const Version = "2.7.2";

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
     * The Snippet version used to initialize the sdk instance, this will contain either
     * undefined/null - Snippet not used
     * '-' - Version and legacy mode not determined
     * # - Version # of the snippet
     * #.l - Version # in legacy mode
     * .l - No defined version, but used legacy mode initialization
     */
    public snippetVer: string;

    /**
     * Identifies the source of the sdk script
     */
    public sdkSrc: string;

    /**
     * Constructs a new instance of the internal telemetry data class.
     */
    constructor(config: ITelemetryConfig) {
        this.sdkVersion = (config.sdkExtension && config.sdkExtension() ? config.sdkExtension() + "_" : "") + "javascript:" + Version;
    }
}