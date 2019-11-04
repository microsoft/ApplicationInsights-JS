// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// @duplicate of https://github.com/microsoft/ApplicationInsights-node.js/blob/develop/Library/ConnectionStringParser.ts

import { ConnectionString, ConnectionStringKey } from "./Interfaces/ConnectionString";
import { DEFAULT_BREEZE_ENDPOINT } from "./Constants";
import { CoreUtils } from "@microsoft/applicationinsights-core-js";

export class ConnectionStringParser {
    private static _FIELDS_SEPARATOR = ";";
    private static _FIELD_KEY_VALUE_SEPARATOR = "=";

    public static parse(connectionString?: string): ConnectionString {
        if (!connectionString) {
            return {};
        }

        const kvPairs = connectionString.split(ConnectionStringParser._FIELDS_SEPARATOR);

        const result: ConnectionString = CoreUtils.arrReduce(kvPairs, (fields: ConnectionString, kv: string) => {
            const kvParts = kv.split(ConnectionStringParser._FIELD_KEY_VALUE_SEPARATOR);

            if (kvParts.length === 2) { // only save fields with valid formats
                const key = kvParts[0].toLowerCase() as ConnectionStringKey;
                const value = kvParts[1];
                fields[key] = value as string;
            }
            return fields;
        }, {});

        if (CoreUtils.objKeys(result).length > 0) {
            // this is a valid connection string, so parse the results

            if (result.endpointsuffix) {
                // use endpoint suffix where overrides are not provided
                const locationPrefix = result.location ? result.location + "." : "";
                result.ingestionendpoint = result.ingestionendpoint || ("https://" + locationPrefix + "dc." + result.endpointsuffix);
            }

            // apply the default endpoints
            result.ingestionendpoint = result.ingestionendpoint || DEFAULT_BREEZE_ENDPOINT;
        }

        return result;
    }
}
