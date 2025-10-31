// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelLogger } from "./IOTelLogger";
import { IOTelLoggerOptions } from "./IOTelLoggerOptions";

/**
 * A registry for creating named {@link Logger}s.
 */
export interface IOTelLoggerProvider {
  /**
   * Returns a Logger, creating one if one with the given name, version, and
   * schemaUrl pair is not already created.
   *
   * @param name The name of the logger or instrumentation library.
   * @param version The version of the logger or instrumentation library.
   * @param options The options of the logger or instrumentation library.
   * @returns Logger A Logger with the given name and version
   */
  getLogger(name: string, version?: string, options?: IOTelLoggerOptions): IOTelLogger;
}
