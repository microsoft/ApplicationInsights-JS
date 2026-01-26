// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelAttributes } from "../IOTelAttributes";
import { IObservable } from "./IObservable";

/**
 * ObservableCounter is an asynchronous Instrument which reports monotonically increasing
 * value(s) when the instrument is being observed.
 */
export interface IObservableCounter<AttributesTypes extends IOTelAttributes = IOTelAttributes> extends IObservable<AttributesTypes> {
    /**
     * Observes the current value for the given attributes
     * @param value The measurement value
     * @param attributes A set of attributes to associate with the value
     */
    observe(value: number, attributes?: AttributesTypes): void;
}
