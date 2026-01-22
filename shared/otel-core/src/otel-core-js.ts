// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Trace Support
// export { createOTelApi } from "./otel/api/OTelApi";
// export { OTelSdk } from "./otel/sdk/OTelSdk";



// ==========================================================================
// OpenTelemetry exports
// ==========================================================================

// Context
export { createContextManager } from "./otel/api/context/contextManager";
export { createContext } from "./otel/api/context/context";

// Enums
export { eOTelSamplingDecision, OTelSamplingDecision } from "./enums/OTel/trace/OTelSamplingDecision";
export { eOTelSpanKind, OTelSpanKind } from "./enums/OTel/trace/OTelSpanKind";
export { eOTelSpanStatusCode, OTelSpanStatusCode } from "./enums/OTel/trace/OTelSpanStatus";

// OpenTelemetry Attribute Support
export { eAttributeChangeOp, AttributeChangeOp } from "./enums/OTel/eAttributeChangeOp";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

// Config
export { IOTelAttributeLimits } from "./interfaces/OTel/config/IOTelAttributeLimits";
export { IOTelConfig } from "./interfaces/OTel/config/IOTelConfig";
export { IOTelErrorHandlers } from "./interfaces/OTel/config/IOTelErrorHandlers";
export { IOTelTraceCfg } from "./interfaces/OTel/config/IOTelTraceCfg";

// Context
export { IOTelContextManager } from "./interfaces/OTel/context/IOTelContextManager";
export { IOTelContext } from "./interfaces/OTel/context/IOTelContext";

// Resources
export { IOTelResource, OTelMaybePromise, OTelRawResourceAttribute } from "./interfaces/OTel/resources/IOTelResource";

// Baggage
export { IOTelBaggage } from "./interfaces/OTel/baggage/IOTelBaggage";
export { IOTelBaggageEntry } from "./interfaces/OTel/baggage/IOTelBaggageEntry";
export { OTelBaggageEntryMetadata, otelBaggageEntryMetadataSymbol } from "./interfaces/OTel/baggage/OTelBaggageEntryMetadata";

// Trace
export { IOTelIdGenerator } from "./interfaces/OTel/trace/IOTelIdGenerator";
export { IOTelInstrumentationScope } from "./interfaces/OTel/trace/IOTelInstrumentationScope";
export { IOTelLink } from "./interfaces/OTel/trace/IOTelLink";
export { IOTelTracerCtx } from "./interfaces/OTel/trace/IOTelTracerCtx";
export { IOTelTraceState } from "./interfaces/OTel/trace/IOTelTraceState";
export { IReadableSpan } from "./interfaces/OTel/trace/IReadableSpan";
export { IOTelSampler } from "./interfaces/OTel/trace/IOTelSampler";
export { IOTelSamplingResult } from "./interfaces/OTel/trace/IOTelSamplingResult";
export { IOTelSpan } from "./interfaces/OTel/trace/IOTelSpan";
export { IOTelSpanContext } from "./interfaces/OTel/trace/IOTelSpanContext";
export { IOTelSpanOptions } from "./interfaces/OTel/trace/IOTelSpanOptions";
export { IOTelSpanStatus } from "./interfaces/OTel/trace/IOTelSpanStatus";
export { IOTelTimedEvent } from "./interfaces/OTel/trace/IOTelTimedEvent";
export { IOTelTracerProvider } from "./interfaces/OTel/trace/IOTelTracerProvider";
export { IOTelTracer } from "./interfaces/OTel/trace/IOTelTracer";
export { IOTelTracerOptions } from "./interfaces/OTel/trace/IOTelTracerOptions";

export { IOTelApi } from "./interfaces/OTel/IOTelApi";
export { IOTelApiCtx } from "./interfaces/OTel/IOTelApiCtx";
export { IOTelSdk } from "./interfaces/OTel/IOTelSdk";
export { IOTelSdkCtx } from "./interfaces/OTel/IOTelSdkCtx";

export { IOTelTraceApi } from "./interfaces/OTel/trace/IOTelTraceApi";
export { IOTelSpanCtx } from "./interfaces/OTel/trace/IOTelSpanCtx";

export { createTraceApi } from "./otel/api/trace/traceApi";

// Trace
export { createNonRecordingSpan } from "./otel/api/trace/nonRecordingSpan";
export { isSpanContext, wrapDistributedTrace, createOTelSpanContext } from "./otel/api/trace/spanContext";
export { createTracer } from "./otel/api/trace/tracer";
export { createOTelTraceState, isOTelTraceState } from "./otel/api/trace/traceState";
export {
    deleteContextSpan, getContextSpan, setContextSpan, setContextSpanContext, getContextActiveSpanContext, isSpanContextValid, wrapSpanContext,
    isReadableSpan, isTracingSuppressed, suppressTracing, unsuppressTracing
} from "./otel/api/trace/utils";

// OpenTelemetry Error Classes
export { OpenTelemetryError, OpenTelemetryErrorConstructor, getOpenTelemetryError, throwOTelError } from "./otel/api/errors/OTelError";
export { OTelInvalidAttributeError, throwOTelInvalidAttributeError } from "./otel/api/errors/OTelInvalidAttributeError";
export { OTelNotImplementedError, throwOTelNotImplementedError } from "./otel/api/errors/OTelNotImplementedError";
export { OTelSpanError, throwOTelSpanError } from "./otel/api/errors/OTelSpanError";

export { IOTelAttributes, OTelAttributeValue, ExtendedOTelAttributeValue } from "./interfaces/OTel/IOTelAttributes";
export { OTelException, IOTelExceptionWithCode, IOTelExceptionWithMessage, IOTelExceptionWithName } from "./interfaces/OTel/IException";
export { IOTelHrTime, OTelTimeInput } from "./interfaces/OTel/time";

// Logs
export { IOTelLogger } from "./interfaces/OTel/logs/IOTelLogger";
export { IOTelLogRecord, LogBody, LogAttributes } from "./interfaces/OTel/logs/IOTelLogRecord";
export { IOTelLogRecordProcessor } from "./interfaces/OTel/logs/IOTelLogRecordProcessor";
export { ReadableLogRecord } from "./interfaces/OTel/logs/IOTelReadableLogRecord";
export { IOTelSdkLogRecord } from "./interfaces/OTel/logs/IOTelSdkLogRecord";
export { IOTelLoggerProvider } from "./interfaces/OTel/logs/IOTelLoggerProvider";
export { IOTelLoggerOptions } from "./interfaces/OTel/logs/IOTelLoggerOptions";
export { IOTelLoggerProviderSharedState } from "./interfaces/OTel/logs/IOTelLoggerProviderSharedState";
export { IOTelLogRecordLimits } from "./interfaces/OTel/logs/IOTelLogRecordLimits";

// SDK Logs
export { createLoggerProvider, DEFAULT_LOGGER_NAME } from "./otel/sdk/OTelLoggerProvider";
export { createLogger } from "./otel/sdk/OTelLogger";
export { createMultiLogRecordProcessor } from "./otel/sdk/OTelMultiLogRecordProcessor";
export { loadDefaultConfig, reconfigureLimits } from "./otel/sdk/config";
