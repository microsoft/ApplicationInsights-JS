import { IOTelConfig } from "../config/IOTelConfig";
import { OTelRawResourceAttribute } from "../resources/IOTelResource";

export interface IOTelResourceCtx {
    cfg: IOTelConfig;
    
    /**
     * @returns the Resource's attributes.
     */
    attribs: OTelRawResourceAttribute[];
}
