// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDomain } from "./IDomain";

/**
 * Instances of Event represent structured event records that can be grouped and searched by their properties. Event data item also creates a metric of event count by name.
 */
export interface IEventData extends IDomain {

    /**
     * Schema version
     */
    ver: number; /* 2 */

    /**
     * Event name. Keep it low cardinality to allow proper grouping and useful metrics.
     */
    name: string;

    /**
     * Collection of custom properties.
     */
    properties: any; /* {} */

    /**
     * Collection of custom measurements.
     */
    measurements: any; /* {} */
}
