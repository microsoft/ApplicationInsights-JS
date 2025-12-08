// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IMeterProvider } from "../../interfaces/metrics/meter/IMeterProvider";
import { IMeterOptions } from "../../interfaces/metrics/meter/IMeterOptions";
import { IMeter } from "../../interfaces/metrics/meter/IMeter";
import { createNoopMeter } from "./noopMeter";

/**
 * Creates a noop implementation of the {@link IMeterProvider} interface.
 * @returns - A Noop MeterProvider instance
 */
export function createNoopMeterProvider(): IMeterProvider {
    return {
        getMeter: (_name: string, _version?: string, _options?: IMeterOptions): IMeter => {
            return createNoopMeter();
        }
    };
}
