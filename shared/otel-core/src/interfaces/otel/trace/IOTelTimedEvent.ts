// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelHrTime } from "../../../types/time";
import { IOTelAttributes } from "../IOTelAttributes";

export interface IOTelTimedEvent {

    /**
     * The time at which the event occurred.
     */
    time: IOTelHrTime;

    /**
     * The name of the event.
     */
    name: string;

    /**
     * The attributes associated with the event.
     */
    attributes?: IOTelAttributes;
    
    /**
     * The number of dropped attributes associated with the event.
     */
    droppedAttributesCount?: number;
}
