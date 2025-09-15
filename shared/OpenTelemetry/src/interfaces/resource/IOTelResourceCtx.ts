import { IOTelConfig, OTelRawResourceAttribute } from "@microsoft/applicationinsights-core-js";

export interface IOTelResourceCtx {
    cfg: IOTelConfig;
    
    /**
     * @returns the Resource's attributes.
     */
    attribs: OTelRawResourceAttribute[];
}
