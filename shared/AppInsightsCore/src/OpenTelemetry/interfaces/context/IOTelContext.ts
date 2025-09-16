// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Provides an OpenTelemetry compatible Interface for the Open Telemetry Api (1.9.0) Context type.
 * @since 3.4.0
 */
export interface IOTelContext {
    /**
     * Get a value from the context.
     *
     * @param key - key which identifies a context value
     */
    getValue(key: symbol): unknown;
  
    /**
     * Create a new context which inherits from this context and has
     * the given key set to the given value.
     *
     * @param key - context key for which to set the value
     * @param value - value to set for the given key
     */
    setValue(key: symbol, value: unknown): IOTelContext;
  
    /**
     * Return a new context which inherits from this context but does
     * not contain a value for the given key.
     *
     * @param key - context key for which to clear a value
     */
    deleteValue(key: symbol): IOTelContext;
  }
  