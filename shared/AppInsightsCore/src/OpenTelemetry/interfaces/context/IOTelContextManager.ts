// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelContext } from "./IOTelContext";

/**
 * Provides an OpenTelemetry compatible Interface for the Open Telemetry Api (1.9.0) ContextManager type.
 * @since 3.4.0
 */
export interface IOTelContextManager {
    /**
     * Get the current active context
     */
    active(): IOTelContext;
  
    /**
     * Run the fn callback with object set as the current active context
     * @param context - Any object to set as the current active context
     * @param fn - A callback to be immediately run within a specific context
     * @param thisArg - optional receiver to be used for calling fn
     * @param args - optional arguments forwarded to fn
     */
    with<A extends unknown[], F extends (...args: A) => ReturnType<F>>(context: IOTelContext, fn: F, thisArg?: ThisParameterType<F>, ...args: A): ReturnType<F>;
  
    /**
     * Bind an object as the current context (or a specific one)
     * @param context - Optionally specify the context which you want to assign
     * @param target - Any object to which a context need to be set
     */
    bind<T>(context: IOTelContext, target: T): T;
  
    /**
     * Enable context management
     */
    enable(): this;
  
    /**
     * Disable context management
     */
    disable(): this;
}
