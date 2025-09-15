import { IOTelAttributeLimits } from "./IOTelAttributeLimits";

export interface IOtelSpanLimits extends IOTelAttributeLimits {
  
    /**
     * maxLinks is number of links per span
     */
    linkCountLimit?: number;
    
    /**
     * maxEvents is number of message events per span
     */
    eventCountLimit?: number;
    
    /**
     * maxEventAttribs is the maximum number of attributes allowed per span event
     */
    attributePerEventCountLimit?: number;
  
    /**
     * maxLinkAttribs is the maximum number of attributes allowed per span link
     */
    attributePerLinkCountLimit?: number;
  }
