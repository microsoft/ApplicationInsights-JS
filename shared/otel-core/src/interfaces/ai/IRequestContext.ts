// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface IRequestContext {
    status?: number;
    xhr?: XMLHttpRequest;
    request?: Request; // fetch request
    response?: Response | string; // fetch response
}
