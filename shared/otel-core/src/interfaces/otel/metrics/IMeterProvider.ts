// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IMeter } from "./IMeter";
import { IMeterOptions } from "./IMeterOptions";

/**
 * A registry for creating named {@link IMeter}s.
 */
export interface IMeterProvider {
    /**
     * Returns a Meter, creating one if one with the given name, version, and
     * schemaUrl pair is not already created.
     *
     * @param name The name of the meter or instrumentation library.
     * @param version The version of the meter or instrumentation library.
     * @param options The options of the meter or instrumentation library.
     * @returns Meter A Meter with the given name and version
     */
    getMeter(name: string, version?: string, options?: IMeterOptions): IMeter;
}
