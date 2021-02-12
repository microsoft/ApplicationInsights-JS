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

    /**
     * The Snippet version used to initialize the sdk instance, this will contain either
     * undefined/null - Snippet not used
     * '-' - Version and legacy mode not determined
     * # - Version # of the snippet
     * #.l - Version # in legacy mode
     * .l - No defined version, but used legacy mode initialization
     */
    snippetVer: string;

    /**
     * Identifies the source of the sdk script
     */
    sdkSrc: string;
}