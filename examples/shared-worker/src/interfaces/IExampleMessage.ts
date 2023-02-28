// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Enum to identify the examples support messages
 */
export const enum ExampleMessageType {
    Invalid = 0,
    Load = 1,
    Unload = 2,
    Fetch = 3,
    TrackPageView = 4
}

/**
 * The format of a request to the example workers
 */
export interface IExampleRequest {
    type: ExampleMessageType;
    connectionString?: string;
    url?: string;
}

/**
 * The format of the response returned from the workers
 */
export interface IExampleResponse {
    success: boolean;
    message?: string;
    resp?: string;
}