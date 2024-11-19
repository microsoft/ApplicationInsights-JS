import { IPartC } from "./IPartC";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface IMetricTelemetry extends IPartC {
    /**
     * @description (required) - name of this metric
     * @type {string}
     */
    name: string;

    /**
     * @description (required) - Recorded value/average for this metric
     * @type {number}
     */
    average: number;

    /**
     * @description (optional) Number of samples represented by the average.
     * @type {number=}
     * @default sampleCount=1
     */
    sampleCount?: number;

    /**
     * @description (optional) The smallest measurement in the sample. Defaults to the average
     * @type {number}
     * @default min=average
     */
    min?: number;

    /**
     * @description (optional) The largest measurement in the sample. Defaults to the average.
     * @type {number}
     * @default max=average
     */
    max?: number;

    /**
     * (optional) The standard deviation measurement in the sample, Defaults to undefined which results in zero.
     */
    stdDev?: number;

     /**
     * @description custom defined iKey
     * @type {string}
     */
    iKey?: string;
}
