// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export type OTelHrTimeBase = [number, number];

export interface IOTelHrTime extends OTelHrTimeBase {
    0: number;
    1: number;
    unixNano?: number;
}
