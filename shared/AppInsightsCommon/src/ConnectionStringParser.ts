// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrReduce, objKeys, strEndsWith } from "@microsoft/applicationinsights-core-js";
import { DEFAULT_BREEZE_ENDPOINT } from "./Constants";
import { ConnectionString, ConnectionStringKey } from "./Interfaces/ConnectionString";

const _FIELDS_SEPARATOR = ";";
const _FIELD_KEY_VALUE_SEPARATOR = "=";

export function parseConnectionString(connectionString?: string): ConnectionString {
    if (!connectionString) {
        return {};
    }

    const kvPairs = connectionString.split(_FIELDS_SEPARATOR);

    const result: ConnectionString = arrReduce(kvPairs, (fields: ConnectionString, kv: string) => {
        const kvParts = kv.split(_FIELD_KEY_VALUE_SEPARATOR);

        if (kvParts.length === 2) { // only save fields with valid formats
            const key = kvParts[0].toLowerCase() as ConnectionStringKey;
            const value = kvParts[1];
            fields[key] = value as string;
        }
        return fields;
    }, {});

    if (objKeys(result).length > 0) {
        // this is a valid connection string, so parse the results

        if (result.endpointsuffix) {
            // use endpoint suffix where overrides are not provided
            const locationPrefix = result.location ? result.location + "." : "";
            result.ingestionendpoint = result.ingestionendpoint || ("https://" + locationPrefix + "dc." + result.endpointsuffix);

            if (strEndsWith(result.ingestionendpoint, "/")) {
                result.ingestionendpoint = result.ingestionendpoint.slice(0, -1);
            }
        }

        // apply the default endpoints
        result.ingestionendpoint = result.ingestionendpoint || DEFAULT_BREEZE_ENDPOINT;
    }

    return result;
}

export const ConnectionStringParser = {
    parse: parseConnectionString
};
