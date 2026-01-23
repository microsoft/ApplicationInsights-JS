// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelAttributes } from "../IOTelAttributes";
import { IObservable } from "./IObservable";

/**
 * ObservableGauge is an asynchronous Instrument which reports non-additive value(s) (e.g.
 * temperature, CPU usage) when the instrument is being observed.
 */
export interface IObservableGauge<AttributesTypes extends IOTelAttributes = IOTelAttributes> extends IObservable<AttributesTypes> {
    /**
     * Observes the current value for the given attributes
     * @param value The measurement value
     * @param attributes A set of attributes to associate with the value
     */
    observe(value: number, attributes?: AttributesTypes): void;
}
