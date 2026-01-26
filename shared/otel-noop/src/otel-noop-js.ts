// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * @microsoft/otel-noop-js
 * No-operation implementations for lightweight scenarios
 */

// Re-export the interface from this package
export { INoopProxyConfig, INoopProxyProp, NoopProxyProps } from "./interfaces/noop/INoopProxyConfig";

// Export noop implementations
export { createNoopProxy } from "./api/noop/noopProxy";
export { _noopThis, _noopVoid } from "./api/noop/noopHelpers";
export { createNoopContextMgr } from "./api/noop/noopContextMgr";
export { createNoopLogger } from "./api/noop/noopLogger";
export { createNoopLogRecordProcessor } from "./api/noop/noopLogRecordProcessor";
export { createNoopTracerProvider } from "./api/noop/noopTracerProvider";
