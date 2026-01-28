// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDomain } from "./IDomain";

/**
 * An instance of Remote Dependency represents an interaction of the monitored component with a remote component/service like SQL or an HTTP endpoint.
 */
export interface IRemoteDependencyData extends IDomain {

    /**
     * Schema version
     */
    ver: number; /* 2 */

    /**
     * Name of the command initiated with this dependency call. Low cardinality value. Examples are stored procedure name and URL path template.
     */
    name: string;

    /**
     * Identifier of a dependency call instance. Used for correlation with the request telemetry item corresponding to this dependency call.
     */
    id: string;

    /**
     * Result code of a dependency call. Examples are SQL error code and HTTP status code.
     */
    resultCode: string;

    /**
     * Request duration in format: DD.HH:MM:SS.MMMMMM. Must be less than 1000 days.
     */
    duration: string;

    /**
     * Indication of successful or unsuccessful call.
     */
    success: boolean; /* true */

    /**
     * Command initiated by this dependency call. Examples are SQL statement and HTTP URL's with all query parameters.
     */
    data: string;

    /**
     * Target site of a dependency call. Examples are server name, host address.
     */
    target: string;

    /**
     * Dependency type name. Very low cardinality value for logical grouping of dependencies and interpretation of other fields like commandName and resultCode. Examples are SQL, Azure table, and HTTP.
     */
    type: string;

    /**
     * Collection of custom properties.
     */
    properties: any; /* {} */

    /**
     * Collection of custom measurements.
     */
    measurements: any; /* {} */
}
