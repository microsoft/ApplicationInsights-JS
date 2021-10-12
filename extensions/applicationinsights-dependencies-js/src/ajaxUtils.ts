// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { isNullOrUndefined } from "@microsoft/applicationinsights-core-js";

export class stringUtils {
    public static GetLength(strObject: any) {
        let res = 0;
        if (!isNullOrUndefined(strObject)) {
            let stringified = "";
            try {
                stringified = strObject.toString();
            } catch (ex) {
                // some troubles with complex object
            }

            res = stringified.length;
            res = isNaN(res) ? 0 : res;
        }

        return res;
    }
}
