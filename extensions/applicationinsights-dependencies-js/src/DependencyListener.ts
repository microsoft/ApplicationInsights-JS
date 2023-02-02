// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IAppInsightsCore } from "@microsoft/applicationinsights-core-js";

export interface IDependencyListenerDetails {
    /**
     * The current core instance
     */
    core: IAppInsightsCore;

    /**
     * Provided only if the dependency request is an XHR call
     */
    xhr?: XMLHttpRequest;

    /**
     * Provided only if the dependency request is a fetch call, this is the input argument being used,
     * re-assigning this value has not affect on the value used for the request, however, when this is a Request
     * object changing the value of the Request will be used for the outbound request.
     */
    input?: Request | string;

    /**
     * Provided only if the dependency request is a fetch call, this is the init argument being used,
     * re-assigning this value does not change the value used for the request, however, changing properties
     * of this object will be used.
     */
    init?: RequestInit;

    /**
     * Returns the unique identifier for a trace. All requests / spans from the same trace share the same traceId.
     * Must be read from incoming headers or generated according to the W3C TraceContext specification,
     * in a hex representation of 16-byte array. A.k.a. trace-id, TraceID or Distributed TraceID
     */
    traceId?: string;

    /**
     * Self-generated 8-bytes identifier of the incoming request. Must be a hex representation of 8-byte array.
     * Also know as the parentId, used to link requests together
     */
    spanId?: string;

    /**
     * An integer representation of the W3C TraceContext trace-flags.
     * https://www.w3.org/TR/trace-context/#trace-flags
     */
    traceFlags?: number;

    /**
     * [Optional] Context that the application can assign that will also be passed to any dependency initializer
     */
    context?: { [key: string]: any };

    /**
     * [Optional] A flag that indicates whether the client request was manually aborted by the `abort()`,
     * as listeners are called just before the request is sent it is unlikely that an application would have
     * called `abort` before `send` this is also available in the dependency initializer.
     */
    aborted?: boolean;
}

/**
 * The function that will get called when the ajax request is about to occur.
 */
export declare type DependencyListenerFunction = (dependencyDetails: IDependencyListenerDetails) => void;

export interface IDependencyHandler {
    remove(): void;
}
export interface IDependencyListenerHandler extends IDependencyHandler {
}

export interface IDependencyListenerContainer {
    /**
     * Add an ajax listener which is called just prior to the request being sent and before the correlation headers are added, to allow you
     * to access the headers and modify the values used to generate the distributed tracing correlation headers. (added in v2.8.4)
     * @param dependencyListener - The Telemetry Initializer function
     * @returns - A IDependencyListenerHandler to enable the initializer to be removed
     */
    addDependencyListener(dependencyListener: DependencyListenerFunction): IDependencyListenerHandler;
}
