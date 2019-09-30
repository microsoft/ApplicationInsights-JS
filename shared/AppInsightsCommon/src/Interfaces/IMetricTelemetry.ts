import { IPartC } from './IPartC';

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface IMetricTelemetry extends IPartC {
    /**
     * @description (required) - name of this metric
     * @type {string}
     * @memberof IMetricTelemetry
     */
    name: string;

    /**
     * @description (required) - Recorded value/average for this metric
     * @type {number}
     * @memberof IMetricTelemetry
     */
    average: number;

    /**
     * @description (optional) Number of samples represented by the average.
     * @type {number=}
     * @memberof IMetricTelemetry
     * @default sampleCount=1
     */
    sampleCount?: number;

    /**
     * @description (optional) The smallest measurement in the sample. Defaults to the average
     * @type {number}
     * @memberof IMetricTelemetry
     * @default min=average
     */
    min?: number;

    /**
     * @description (optional) The largest measurement in the sample. Defaults to the average.
     * @type {number}
     * @memberof IMetricTelemetry
     * @default max=average
     */
    max?: number;
}
