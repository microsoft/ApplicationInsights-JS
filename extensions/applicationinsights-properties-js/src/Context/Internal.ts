// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IInternal } from "@microsoft/applicationinsights-common";
import { IUnloadHookContainer, onConfigChange } from "@microsoft/applicationinsights-core-js";
import { IPropertiesConfig } from "../Interfaces/IPropertiesConfig";

const Version = "#version#";

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
    constructor(config: IPropertiesConfig, unloadHookContainer?: IUnloadHookContainer) {
        
        let unloadHook = onConfigChange((config), () => {
            let prefix =  config.sdkExtension;
            this.sdkVersion = (prefix ? prefix + "_" : "") + "javascript:" + Version;
        });

        unloadHookContainer && unloadHookContainer.add(unloadHook);
    }
}
