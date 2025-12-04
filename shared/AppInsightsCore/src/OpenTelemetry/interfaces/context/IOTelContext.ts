// // Copyright (c) Microsoft Corporation. All rights reserved.
// // Licensed under the MIT License.

// /**
//  * Provides an OpenTelemetry compatible interface for context management conforming to the OpenTelemetry API specification (v1.9.0).
//  * 
//  * The context is an immutable key-value store that carries execution-scoped values across API boundaries.
//  * It serves as the foundation for propagating trace context, baggage, and other cross-cutting concerns
//  * throughout the execution of distributed operations. Context objects are immutable - operations that
//  * modify context return new context instances rather than modifying the existing one.
//  * 
//  * Context is hierarchical, allowing child contexts to inherit values from parent contexts while
//  * providing their own overrides. This enables nested operations to maintain their own context
//  * while still accessing values from parent scopes.
//  * 
//  * @since 3.4.0
//  * 
//  * @remarks
//  * - Context instances are immutable - modifications return new instances
//  * - Context forms a hierarchical chain where child contexts inherit from parents
//  * - Uses Symbol keys to avoid naming conflicts between different libraries
//  * - Essential for maintaining trace context across asynchronous operations
//  * - Enables context propagation across service boundaries
//  * 
//  * @example
//  * ```typescript
//  * // Create root context with initial values
//  * const rootContext = api.context.active();
//  * 
//  * // Set values to create new context
//  * const SPAN_KEY = api.context.createKey('span');
//  * const BAGGAGE_KEY = api.context.createKey('baggage');
//  * 
//  * const contextWithSpan = rootContext.setValue(SPAN_KEY, currentSpan);
//  * const contextWithBoth = contextWithSpan.setValue(BAGGAGE_KEY, currentBaggage);
//  * 
//  * // Retrieve values
//  * const span = contextWithBoth.getValue(SPAN_KEY);
//  * const baggage = contextWithBoth.getValue(BAGGAGE_KEY);
//  * 
//  * // Remove values (returns new context)
//  * const contextWithoutBaggage = contextWithBoth.deleteValue(BAGGAGE_KEY);
//  * 
//  * // Use context to execute operations
//  * api.context.with(contextWithBoth, () => {
//  *   // Operations here have access to span and baggage
//  *   const currentSpan = api.trace.getActiveSpan();
//  * });
//  * ```
//  */
// export interface IOTelContext {
//     /**
//      * Retrieves a value from the context using the specified symbol key.
//      * 
//      * Context values are stored using Symbol keys to prevent naming conflicts between
//      * different libraries and modules. If the key is not found in this context,
//      * the lookup traverses the context hierarchy to check parent contexts.
//      * 
//      * @param key - The symbol key that identifies the context value to retrieve
//      * 
//      * @returns The value associated with the key, or undefined if not found
//      * 
//      * @remarks
//      * - Returns undefined for keys that don't exist in the context hierarchy
//      * - Symbol keys ensure type safety and prevent accidental key collisions
//      * - Lookup traverses parent contexts if key not found in current context
//      * - Values can be of any type - use appropriate type assertions when needed
//      * 
//      * @example
//      * ```typescript
//      * // Define typed context keys
//      * const SPAN_KEY = Symbol('span');
//      * const USER_KEY = Symbol('user');
//      * 
//      * // Retrieve values with type safety
//      * const span = context.getValue(SPAN_KEY) as IReadableSpan | undefined;
//      * const userId = context.getValue(USER_KEY) as string | undefined;
//      * 
//      * // Safe access pattern
//      * const currentSpan = context.getValue(SPAN_KEY);
//      * if (currentSpan) {
//      *   // Use span safely
//      *   currentSpan.setAttribute('operation', 'data-fetch');
//      * }
//      * ```
//      */
//     getValue(key: symbol): unknown;
  
//     /**
//      * Creates a new context that inherits from this context with the specified key-value pair added.
//      * 
//      * Since contexts are immutable, this method returns a new context instance rather than
//      * modifying the existing one. The new context inherits all values from the current context
//      * and adds or overrides the value for the specified key. This enables building context
//      * hierarchies where child contexts can override parent values while maintaining inheritance.
//      * 
//      * @param key - The symbol key to associate with the value
//      * @param value - The value to store; can be of any type
//      * 
//      * @returns A new context instance with the key-value pair set
//      * 
//      * @remarks
//      * - Does not modify the original context - returns a new instance
//      * - New context inherits all existing values from the parent
//      * - If key already exists, the new value overwrites the existing one
//      * - Symbol keys provide type safety and prevent naming conflicts
//      * 
//      * @example
//      * ```typescript
//      * const SPAN_KEY = Symbol('current-span');
//      * const USER_KEY = Symbol('user-id');
//      * 
//      * // Start with active context
//      * const baseContext = api.context.active();
//      * 
//      * // Build context chain
//      * const contextWithSpan = baseContext.setValue(SPAN_KEY, currentSpan);
//      * const contextWithUser = contextWithSpan.setValue(USER_KEY, 'user-123');
//      * 
//      * // Original context unchanged
//      * console.log(baseContext.getValue(SPAN_KEY)); // undefined
//      * console.log(contextWithUser.getValue(SPAN_KEY)); // currentSpan
//      * console.log(contextWithUser.getValue(USER_KEY)); // 'user-123'
//      * 
//      * // Override existing values
//      * const newSpan = tracer.startSpan('new-operation');
//      * const updatedContext = contextWithUser.setValue(SPAN_KEY, newSpan);
//      * ```
//      */
//     setValue(key: symbol, value: unknown): IOTelContext;
  
//     /**
//      * Creates a new context that inherits from this context but excludes the specified key.
//      * 
//      * This method returns a new context instance that contains all values from the current
//      * context except for the specified key. The key-value pair is effectively removed from
//      * the context hierarchy. If the key doesn't exist in the current context, the returned
//      * context is functionally equivalent to the original.
//      * 
//      * @param key - The symbol key to remove from the context
//      * 
//      * @returns A new context instance without the specified key-value pair
//      * 
//      * @remarks
//      * - Does not modify the original context - returns a new instance
//      * - Removes the key from the current context level only
//      * - Parent context values remain accessible unless explicitly removed
//      * - If key doesn't exist, returns equivalent context without the key
//      * 
//      * @example
//      * ```typescript
//      * const SPAN_KEY = Symbol('current-span');
//      * const USER_KEY = Symbol('user-id');
//      * const REQUEST_KEY = Symbol('request-id');
//      * 
//      * // Context with multiple values
//      * const fullContext = api.context.active()
//      *   .setValue(SPAN_KEY, currentSpan)
//      *   .setValue(USER_KEY, 'user-123')
//      *   .setValue(REQUEST_KEY, 'req-456');
//      * 
//      * // Remove specific values
//      * const contextWithoutUser = fullContext.deleteValue(USER_KEY);
//      * const contextWithoutSpan = contextWithoutUser.deleteValue(SPAN_KEY);
//      * 
//      * // Verify removal
//      * console.log(fullContext.getValue(USER_KEY)); // 'user-123'
//      * console.log(contextWithoutUser.getValue(USER_KEY)); // undefined
//      * console.log(contextWithoutUser.getValue(REQUEST_KEY)); // 'req-456' (still present)
//      * 
//      * // Original context unchanged
//      * console.log(fullContext.getValue(USER_KEY)); // 'user-123' (still present)
//      * ```
//      */
//     deleteValue(key: symbol): IOTelContext;
// }
  