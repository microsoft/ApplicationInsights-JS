// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

/**
 * Telemety item supported in Core
 */
export interface ITelemetryItem {
    /**
     * CommonSchema Version of this SDK
     */
    ver?: string;

    /**
     * Unique name of the telemetry item
     */
    name: string;

    /**
     * Timestamp when item was sent
     */
    time?: string;

    /**
     * Identifier of the resource that uniquely identifies which resource data is sent to
     */
    iKey?: string;

    /**
     * System context properties of the telemetry item, example: ip address, city etc
     */
    ext?: {[key: string]: any};

    /**
     * System context property extensions that are not global (not in ctx)
     */
    tags?: Tags & Tags[]; // Tags[] will be deprecated. 

    /**
     * Custom data
     */
    data?:ICustomProperties;

    /**
     * Telemetry type used for part B
     */
    baseType?: string;

    /**
     * Based on schema for part B
     */
    baseData?: { [key: string]: any };

}

export interface Tags {
    [key: string]: any;
}

export interface ICustomProperties {
    [key: string]: any;
}
