// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

module Microsoft.ApplicationInsights {
    "use strict"

    export class UtilHelpers {

        /**
         * generate random id string
         */
        public static newId() {
            var base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

            var result = "";
            // tslint:disable-next-line:insecure-random
            var random = Math.random() * 1073741824; //5 symbols in base64, almost maxint

            while (random > 0) {
                var char = base64chars.charAt(random % 64);
                result += char;
                random = Math.floor(random / 64);
            }
            return result;
        }
    }
}
