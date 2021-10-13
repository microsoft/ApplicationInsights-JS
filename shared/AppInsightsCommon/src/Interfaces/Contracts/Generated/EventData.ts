// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Domain } from "./Domain";

/**
 * Instances of Event represent structured event records that can be grouped and searched by their properties. Event data item also creates a metric of event count by name.
 */
export class EventData implements Domain {

    /**
     * Schema version
     */
    public ver: number = 2;

    /**
     * Event name. Keep it low cardinality to allow proper grouping and useful metrics.
     */
    public name: string;

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