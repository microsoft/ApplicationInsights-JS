// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IMetricOptions } from "../../interfaces/metrics/meter/IMetricOptions";
import { IMeter } from "../../interfaces/metrics/meter/IMeter";
import { IGauge } from "../../interfaces/metrics/meter/IGauge";
import { IHistogram } from "../../interfaces/metrics/meter/IHistogram";
import { ICounter } from "../../interfaces/metrics/meter/ICounter";
import { IUpDownCounter } from "../../interfaces/metrics/meter/IUpDownCounter";
import { IObservableGauge } from "../../interfaces/metrics/meter/IObservableGauge";
import { IObservableCounter } from "../../interfaces/metrics/meter/IObservableCounter";
import { IObservableUpDownCounter } from "../../interfaces/metrics/meter/IObservableUpDownCounter";
import { IObservable } from "../../interfaces/metrics/meter/IObservable";
import { IMetricAttributes } from "../../interfaces/metrics/meter/IMetricAttributes";
import { IObservableCallback } from "../../interfaces/metrics/meter/IObservableCallback";
import { IBatchObservableCallback } from "../../interfaces/metrics/meter/IBatchObservableCallback";

/**
 * Creates a noop Counter metric
 * @returns - A new Noop Counter Metric
 */
export function createNoopCounterMetric(): ICounter {
    return {
        add: (_value: number, _attributes: IMetricAttributes) => {}
    };
}

/**
 * Creates a noop UpDownCounter metric
 * @returns - A new Noop UpDownCounter Metric
 */
export function createNoopUpDownCounterMetric(): IUpDownCounter {
    return {
        add: (_value: number, _attributes: IMetricAttributes) => {}
    };
}

/**
 * Creates a noop Gauge metric
 * @returns - A new Noop Gauge Metric
 */
export function createNoopGaugeMetric(): IGauge {
    return {
        record: (_value: number, _attributes: IMetricAttributes) => {}
    };
}

/**
 * Creates a noop Histogram metric
 * @returns - A new Noop Histogram Metric
 */
export function createNoopHistogramMetric(): IHistogram {
    return {
        record: (_value: number, _attributes: IMetricAttributes) => {}
    };
}

/**
 * Creates a noop Observable metric base
 * @returns - A new Noop Observable Metric
 */
function createNoopObservableMetric<T extends IObservable>(): T {
    return {
        addCallback: (_callback: IObservableCallback) => {},
        removeCallback: (_callback: IObservableCallback) => {},
        observe: (_value: number, _attributes: IMetricAttributes) => {}
    } as unknown as T;
}

/**
 * Creates a noop ObservableCounter metric
 * @returns - A new Noop ObservableCounter Metric
 */
export function createNoopObservableCounterMetric(): IObservableCounter {
    return createNoopObservableMetric<IObservableCounter>();
}

/**
 * Creates a noop ObservableGauge metric
 * @returns - A new Noop ObservableGauge Metric
 */
export function createNoopObservableGaugeMetric(): IObservableGauge {
    return createNoopObservableMetric<IObservableGauge>();
}

/**
 * Creates a noop ObservableUpDownCounter metric
 * @returns - A new Noop ObservableUpDownCounter Metric
 */
export function createNoopObservableUpDownCounterMetric(): IObservableUpDownCounter {
    return createNoopObservableMetric<IObservableUpDownCounter>();
}

/**
 * Creates a noop implementation of the {@link IMeter} interface.
 * @returns - A Noop Meter
 */
export function createNoopMeter(): IMeter {
    return {
        createGauge: (_name: string, _options?: IMetricOptions) => createNoopGaugeMetric(),
        createHistogram: (_name: string, _options?: IMetricOptions) => createNoopHistogramMetric(),
        createCounter: (_name: string, _options?: IMetricOptions) => createNoopCounterMetric(),
        createUpDownCounter: (_name: string, _options?: IMetricOptions) => createNoopUpDownCounterMetric(),
        createObservableGauge: (_name: string, _options?: IMetricOptions) => createNoopObservableGaugeMetric(),
        createObservableCounter: (_name: string, _options?: IMetricOptions) => createNoopObservableCounterMetric(),
        createObservableUpDownCounter: (_name: string, _options?: IMetricOptions) => createNoopObservableUpDownCounterMetric(),
        addBatchObservableCallback: (_callback: IBatchObservableCallback, _observables: IObservable[]) => {},
        removeBatchObservableCallback: (_callback: IBatchObservableCallback) => {}
    };
}
