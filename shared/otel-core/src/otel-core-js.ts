// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Trace Support
// export { createOTelApi } from "./api/OTelApi";
// export { OTelSdk } from "./sdk/OTelSdk";



// ==========================================================================
// OpenTelemetry exports
// ==========================================================================

// Context
export { createContextManager } from "./api/context/contextManager";
export { createContext } from "./api/context/context";

// Enums
export { eOTelSamplingDecision, OTelSamplingDecision } from "./enums/trace/OTelSamplingDecision";
export { eOTelSpanKind, OTelSpanKind } from "./enums/trace/OTelSpanKind";
export { eOTelSpanStatusCode, OTelSpanStatusCode } from "./enums/trace/OTelSpanStatus";

// OpenTelemetry Attribute Support
export { eAttributeChangeOp, AttributeChangeOp } from "./enums/eAttributeChangeOp";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

// Config
export { IOTelAttributeLimits } from "./interfaces/config/IOTelAttributeLimits";
export { IOTelConfig } from "./interfaces/config/IOTelConfig";
export { IOTelErrorHandlers } from "./interfaces/config/IOTelErrorHandlers";
export { IOTelTraceCfg } from "./interfaces/config/IOTelTraceCfg";

// Context
export { IOTelContextManager } from "./interfaces/context/IOTelContextManager";
export { IOTelContext } from "./interfaces/context/IOTelContext";

// Resources
export { IOTelResource, OTelMaybePromise, OTelRawResourceAttribute } from "./interfaces/resources/IOTelResource";

// Baggage
export { IOTelBaggage } from "./interfaces/baggage/IOTelBaggage";
export { IOTelBaggageEntry } from "./interfaces/baggage/IOTelBaggageEntry";
export { OTelBaggageEntryMetadata, otelBaggageEntryMetadataSymbol } from "./interfaces/baggage/OTelBaggageEntryMetadata";

// Trace
export { IOTelIdGenerator } from "./interfaces/trace/IOTelIdGenerator";
export { IOTelInstrumentationScope } from "./interfaces/trace/IOTelInstrumentationScope";
export { IOTelLink } from "./interfaces/trace/IOTelLink";
export { IOTelTracerCtx } from "./interfaces/trace/IOTelTracerCtx";
export { IOTelTraceState } from "./interfaces/trace/IOTelTraceState";
export { IReadableSpan } from "./interfaces/trace/IReadableSpan";
export { IOTelSampler } from "./interfaces/trace/IOTelSampler";
export { IOTelSamplingResult } from "./interfaces/trace/IOTelSamplingResult";
export { IOTelSpan } from "./interfaces/trace/IOTelSpan";
export { IOTelSpanContext } from "./interfaces/trace/IOTelSpanContext";
export { IOTelSpanOptions } from "./interfaces/trace/IOTelSpanOptions";
export { IOTelSpanStatus } from "./interfaces/trace/IOTelSpanStatus";
export { IOTelTimedEvent } from "./interfaces/trace/IOTelTimedEvent";
export { IOTelTracerProvider } from "./interfaces/trace/IOTelTracerProvider";
export { IOTelTracer } from "./interfaces/trace/IOTelTracer";
export { IOTelTracerOptions } from "./interfaces/trace/IOTelTracerOptions";

export { IOTelApi } from "./interfaces/IOTelApi";
export { IOTelApiCtx } from "./interfaces/IOTelApiCtx";
export { IOTelSdk } from "./interfaces/IOTelSdk";
export { IOTelSdkCtx } from "./interfaces/IOTelSdkCtx";

export {IOTelTraceApi} from "./interfaces/trace/IOTelTraceApi";
export {IOTelSpanCtx} from "./interfaces/trace/IOTelSpanCtx";

export {createTraceApi} from "./api/trace/traceApi";

// Trace
export { createNonRecordingSpan } from "./api/trace/nonRecordingSpan";
export { isSpanContext, wrapDistributedTrace, createOTelSpanContext } from "./api/trace/spanContext";
export { createTracer } from "./api/trace/tracer";
export { createOTelTraceState, isOTelTraceState } from "./api/trace/traceState";
export {
    deleteContextSpan, getContextSpan, setContextSpan, setContextSpanContext, getContextActiveSpanContext, isSpanContextValid, wrapSpanContext,
    isReadableSpan, isTracingSuppressed, suppressTracing, unsuppressTracing
} from "./api/trace/utils";

// OpenTelemetry Error Classes
export { OpenTelemetryError, OpenTelemetryErrorConstructor, getOpenTelemetryError, throwOTelError } from "./api/errors/OTelError";
export { OTelInvalidAttributeError, throwOTelInvalidAttributeError } from "./api/errors/OTelInvalidAttributeError";
export { OTelNotImplementedError, throwOTelNotImplementedError } from "./api/errors/OTelNotImplementedError";
export { OTelSpanError, throwOTelSpanError } from "./api/errors/OTelSpanError";

export { IOTelAttributes, OTelAttributeValue, ExtendedOTelAttributeValue } from "./interfaces/IOTelAttributes";
export { OTelException, IOTelExceptionWithCode, IOTelExceptionWithMessage, IOTelExceptionWithName } from "./interfaces/IException";
export { IOTelHrTime, OTelTimeInput } from "./interfaces/time";

// Logs
export { IOTelLogger } from "./interfaces/logs/IOTelLogger";
export { IOTelLogRecord, LogBody, LogAttributes } from "./interfaces/logs/IOTelLogRecord";
export { IOTelLogRecordProcessor } from "./interfaces/logs/IOTelLogRecordProcessor";
export { ReadableLogRecord } from "./interfaces/logs/IOTelReadableLogRecord";
export { IOTelSdkLogRecord } from "./interfaces/logs/IOTelSdkLogRecord";
export { IOTelLoggerProvider } from "./interfaces/logs/IOTelLoggerProvider";
export { IOTelLoggerOptions } from "./interfaces/logs/IOTelLoggerOptions";
export { IOTelLoggerProviderSharedState } from "./interfaces/logs/IOTelLoggerProviderSharedState";
export { IOTelLogRecordLimits } from "./interfaces/logs/IOTelLogRecordLimits";

// SDK Logs
export { createLoggerProvider, DEFAULT_LOGGER_NAME } from "./sdk/OTelLoggerProvider";
export { createLogger } from "./sdk/OTelLogger";
export { createMultiLogRecordProcessor } from "./sdk/OTelMultiLogRecordProcessor";
export { loadDefaultConfig, reconfigureLimits } from "./sdk/config";
