// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise } from "@nevware21/ts-async";
import { IOTelAttributes, OTelAttributeValue } from "../IOTelAttributes";

export type OTelMaybePromise<T> = T | IPromise<T>;

export type OTelRawResourceAttribute = [
  string,
  OTelMaybePromise<OTelAttributeValue | undefined>,
];

/**
 * Provides an OpenTelemetry compatible Interface for the Open Telemetry Api (1.9.0) Resource type.
 * @since 3.4.0
 */
export interface IOTelResource {
    /**
     * Check if async attributes have resolved. This is useful to avoid awaiting
     * waitForAsyncAttributes (which will introduce asynchronous behavior) when not necessary.
     *
     * @returns true if the resource "attributes" property is not yet settled to its final value
     */
    readonly asyncAttributesPending?: boolean;
  
    /**
     * @returns the Resource's attributes.
     */
    readonly attributes: IOTelAttributes;
  
    /**
     * Returns a promise that will never be rejected. Resolves when all async attributes have finished being added to
     * this Resource's attributes. This is useful in exporters to block until resource detection
     * has finished.
     */
    waitForAsyncAttributes?(): IPromise<void>;
  
    /**
     * Returns a new, merged {@link IOTelResource} by merging the current Resource
     * with the other Resource. In case of a collision, other Resource takes
     * precedence.
     *
     * @param other - the Resource that will be merged with this.
     * @returns the newly merged Resource.
     */
    merge(other: IOTelResource | null): IOTelResource;
  
    getRawAttributes(): OTelRawResourceAttribute[];
  }
