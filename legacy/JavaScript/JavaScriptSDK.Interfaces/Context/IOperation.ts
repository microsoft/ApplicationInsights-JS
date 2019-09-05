// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

module Microsoft.ApplicationInsights.Context {

    "use strict";

    export interface IOperation {
        /**
         * Operation id
         */
        id: string;

        /**
         * Operation name
         */
        name: string;

        /**
         * Parent operation id
         */
        parentId: string;

        /**
         * Root operation id
         */
        rootId: string;

        /**
         * Synthetic source of the operation
         */
        syntheticSource: string;
    }
}