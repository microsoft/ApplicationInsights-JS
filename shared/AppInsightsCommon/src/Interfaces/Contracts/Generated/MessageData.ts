// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Domain } from "./Domain";
import { SeverityLevel } from "./SeverityLevel";

/**
 * Instances of Message represent printf-like trace statements that are text-searched. Log4Net, NLog and other text-based log file entries are translated into intances of this type. The message does not have measurements.
 */
export class MessageData implements Domain {

    /**
     * Schema version
     */
    public ver: number = 2;

    /**
     * Trace message
     */
    public message: string;

    /**
     * Trace severity level.
     */
    public severityLevel: SeverityLevel;

    /**
     * Collection of custom properties.
     */
    public properties: any = {};

    /**
     * Collection of custom measurements.
     */
    public measurements: any = {};

    constructor() {
    }
}
