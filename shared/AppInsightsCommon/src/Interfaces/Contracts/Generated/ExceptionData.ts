// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ExceptionDetails } from "./ExceptionDetails";
import { Domain } from "./Domain";
import { SeverityLevel } from "./SeverityLevel";

/**
 * An instance of Exception represents a handled or unhandled exception that occurred during execution of the monitored application.
 */
export class ExceptionData implements Domain {

    /**
     * Schema version
     */
    public ver: number = 2;

    /**
     * Exception chain - list of inner exceptions.
     */
    public exceptions: ExceptionDetails[] = [];

    /**
     * Severity level. Mostly used to indicate exception severity level when it is reported by logging library.
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
