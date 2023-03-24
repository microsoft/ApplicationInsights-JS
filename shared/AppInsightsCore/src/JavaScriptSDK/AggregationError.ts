// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { CustomErrorConstructor, arrForEach, createCustomError, dumpObj } from "@nevware21/ts-utils";

let aggregationErrorType: AggregationError;

interface AggregationError extends CustomErrorConstructor {
    new(message: string, sourceErrors: Error[]): Error;
    (message: string, sourceErrors: Error[]): Error;
    readonly errors: any[];        // Holds the aggregation of errors that caused this error
}

/**
 * Throws an Aggregation Error which includes all of the errors that led to this error occurring
 * @param message - The message describing the aggregation error (the sourceError details are added to this)
 * @param sourceErrors - An array of the errors that caused this situation
 */
export function throwAggregationError(message: string, sourceErrors: any[]): never {
    if (!aggregationErrorType) {
        aggregationErrorType = createCustomError<AggregationError>("AggregationError", (self, args) => {
            if (args.length > 1) {
                // Save the provided errors
                self.errors = args[1];
            }
        });
    }

    let theMessage = message || "One or more errors occurred.";

    arrForEach(sourceErrors, (srcError, idx) => {
        theMessage += `\n${idx} > ${dumpObj(srcError)}`;
    });

    throw new aggregationErrorType(theMessage, sourceErrors || []);
}
