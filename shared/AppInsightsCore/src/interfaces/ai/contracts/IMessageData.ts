// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDomain } from "./IDomain";
import { SeverityLevel } from "./SeverityLevel";

/**
 * Instances of Message represent printf-like trace statements that are text-searched. Log4Net, NLog and other text-based log file entries are translated into intances of this type. The message does not have measurements.
 */
export interface IMessageData extends IDomain {

    /**
     * Schema version
     */
    ver: number; /* 2 */

    /**
     * Trace message
     */
    message: string;

    /**
     * Trace severity level.
     */
    severityLevel: SeverityLevel;

    /**
     * Collection of custom properties.
     */
    properties: any; /* {} */

    /**
     * Collection of custom measurements.
     */
    measurements: any; /* {} */
}
