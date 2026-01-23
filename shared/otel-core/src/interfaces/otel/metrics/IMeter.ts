// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelAttributes } from "../IOTelAttributes";
import { IBatchObservableCallback } from "./IBatchObservableCallback";
import { ICounter } from "./ICounter";
import { IGauge } from "./IGauge";
import { IHistogram } from "./IHistogram";
import { IMetricOptions } from "./IMetricOptions";
import { IObservable } from "./IObservable";
import { IObservableCounter } from "./IObservableCounter";
import { IObservableGauge } from "./IObservableGauge";
import { IObservableUpDownCounter } from "./IObservableUpDownCounter";
import { IUpDownCounter } from "./IUpDownCounter";

/**
 * An interface to allow the recording metrics.
 *
 * Metrics are used for recording pre-defined aggregation (`Counter`),
 * or raw values (`Histogram`) in which the aggregation and attributes
 * for the exported metric are deferred.
 */
export interface IMeter {
    /**
     * Creates and returns a new `Gauge`.
     * @param name the name of the metric.
     * @param [options] the metric options.
     */
    createGauge<AttributesTypes extends IOTelAttributes = IOTelAttributes>(
        name: string,
        options?: IMetricOptions
    ): IGauge<AttributesTypes>;

    /**
     * Creates and returns a new `Histogram`.
     * @param name the name of the metric.
     * @param [options] the metric options.
     */
    createHistogram<AttributesTypes extends IOTelAttributes = IOTelAttributes>(
        name: string,
        options?: IMetricOptions
    ): IHistogram<AttributesTypes>;

    /**
     * Creates a new `Counter` metric. Generally, this kind of metric when the
     * value is a quantity, the sum is of primary interest, and the event count
     * and value distribution are not of primary interest.
     * @param name the name of the metric.
     * @param [options] the metric options.
     */
    createCounter<AttributesTypes extends IOTelAttributes = IOTelAttributes>(
        name: string,
        options?: IMetricOptions
    ): ICounter<AttributesTypes>;

    /**
     * Creates a new `UpDownCounter` metric. UpDownCounter is a synchronous
     * instrument and very similar to Counter except that Add(increment)
     * supports negative increments. It is generally useful for capturing changes
     * in an amount of resources used, or any quantity that rises and falls
     * during a request.
     * @param name the name of the metric.
     * @param [options] the metric options.
     */
    createUpDownCounter<AttributesTypes extends IOTelAttributes = IOTelAttributes>(
        name: string,
        options?: IMetricOptions
    ): IUpDownCounter<AttributesTypes>;

    /**
     * Creates a new `ObservableGauge` metric.
     *
     * The callback SHOULD be safe to be invoked concurrently.
     *
     * @param name the name of the metric.
     * @param [options] the metric options.
     */
    createObservableGauge<AttributesTypes extends IOTelAttributes = IOTelAttributes>(
        name: string,
        options?: IMetricOptions
    ): IObservableGauge<AttributesTypes>;

    /**
     * Creates a new `ObservableCounter` metric.
     *
     * The callback SHOULD be safe to be invoked concurrently.
     *
     * @param name the name of the metric.
     * @param [options] the metric options.
     */
    createObservableCounter<AttributesTypes extends IOTelAttributes = IOTelAttributes>(
        name: string,
        options?: IMetricOptions
    ): IObservableCounter<AttributesTypes>;

    /**
     * Creates a new `ObservableUpDownCounter` metric.
     *
     * The callback SHOULD be safe to be invoked concurrently.
     *
     * @param name the name of the metric.
     * @param [options] the metric options.
     */
    createObservableUpDownCounter<AttributesTypes extends IOTelAttributes = IOTelAttributes>(
        name: string,
        options?: IMetricOptions
    ): IObservableUpDownCounter<AttributesTypes>;

    /**
     * Sets up a function that will be called whenever a metric collection is
     * initiated.
     *
     * If the function is already in the list of callbacks for this Observable,
     * the function is not added a second time.
     *
     * Only the associated observables can be observed in the callback.
     * Measurements of observables that are not associated observed in the
     * callback are dropped.
     *
     * @param callback the batch observable callback
     * @param observables the observables associated with this batch observable callback
     */
    addBatchObservableCallback<AttributesTypes extends IOTelAttributes = IOTelAttributes>(
        callback: IBatchObservableCallback<AttributesTypes>,
        observables: IObservable<AttributesTypes>[]
    ): void;

    /**
     * Removes a callback previously registered with {@link IMeter.addBatchObservableCallback}.
     *
     * @param callback the batch observable callback to be removed
     */
    removeBatchObservableCallback<AttributesTypes extends IOTelAttributes = IOTelAttributes>(
        callback: IBatchObservableCallback<AttributesTypes>
    ): void;
}
