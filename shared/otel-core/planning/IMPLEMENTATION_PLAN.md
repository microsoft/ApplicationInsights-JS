# OTel Web SDK Implementation Plan

**Last Updated**: February 2026  
**Reference**: [CONTEXT.md](../CONTEXT.md)

---

## Current Status

| Category | Status | Notes |
|----------|--------|-------|
| Tracing Core (TracerProvider, Tracer, Span) | ⚠️ Needs Updates | Closure pattern used but missing CONTEXT.md compliance |
| Logging Core (LoggerProvider, Logger, LogRecord) | ⚠️ Needs Updates | Closure pattern used but missing CONTEXT.md compliance |
| Context Management (ContextManager, Context) | ⚠️ Needs Updates | Closure pattern used but missing config pattern |
| Resource/Attributes | ⚠️ Needs Updates | Closure pattern used but missing shutdown cleanup |
| Error Handling (`handleErrors.ts`) | ✅ Complete | Helper functions |
| SDK Entry Point | ❌ Not Started | `OTelSdk` class has commented-out code |
| Samplers | ❌ Interface only | No implementations |
| SpanProcessor | ❌ Interface commented out | No implementations |
| Metrics | ❌ Interfaces only | No implementations |
| Propagation | ❌ Interface commented out | No implementations |

---

## CONTEXT.md Compliance Issues in "Complete" Components

### TracerProvider (`_createTracerProvider`)

| Issue | CONTEXT.md Requirement | Current State |
|-------|------------------------|---------------|
| Naming | Public factories use `create*` | Uses `_create*` (internal naming) |
| Config | Takes config object with deps | Takes `host: ITraceHost` |
| Error handlers | Get from `config.errorHandlers` | No error handling |
| Dynamic config | Use `onConfigChange`, save `IUnloadHook` | Not implemented |
| TypeDoc | Required on all public APIs | Missing |

### LoggerProvider (`createLoggerProvider`)

| Issue | CONTEXT.md Requirement | Current State |
|-------|------------------------|---------------|
| Required deps | Validate upfront, no defaults | Uses `config = {}` default |
| Error handlers | Get from `config.errorHandlers` | Creates empty `handlers = {}` |
| Dynamic config | Use `onConfigChange`, save `IUnloadHook` | Reads config at creation only |
| Shutdown | Call `_configUnload.rm()` | No config listener cleanup |

### ContextManager (`createContextManager`)

| Issue | CONTEXT.md Requirement | Current State |
|-------|------------------------|---------------|
| Config | Takes config object with deps | Takes `parentContext?` only |
| Error handlers | Get from `config.errorHandlers` | No error handling |
| TypeDoc | Required on factory functions | Minimal documentation |

### Resource (`createResource`)

| Issue | CONTEXT.md Requirement | Current State |
|-------|------------------------|---------------|
| Error handlers | Uses config handlers | ✅ Uses `resourceCtx.cfg.errorHandlers` |
| Shutdown | Cleanup method | No explicit shutdown/cleanup |

### Span (`createSpan`)

| Issue | CONTEXT.md Requirement | Current State |
|-------|------------------------|---------------|
| Error handlers | Uses config handlers | ✅ Uses handlers from config |
| Closure pattern | Private state in closures | ✅ Correct |
| Dynamic config | Use `onConfigChange` if caching config | Reads `otelCfg` at creation |

### Common Missing Patterns

1. **No `onConfigChange` usage** - None of the implementations use `onConfigChange` for dynamic config
2. **No `IUnloadHook` management** - No saving of hooks or calling `.rm()` during shutdown
3. **Inconsistent factory signatures** - Some take config objects, some take host/context directly
4. **Missing dependency validation** - Required deps not validated upfront per CONTEXT.md

---

## Implementation Phases

### Phase 0: CONTEXT.md Compliance Fixes (Prerequisite)

Fix existing implementations to comply with CONTEXT.md before building new features.

| Component | Changes Required |
|-----------|-----------------|
| `_createTracerProvider` | Rename to `createTracerProvider`, add config object, add error handlers, add `onConfigChange` |
| `createLoggerProvider` | Remove default config, validate required deps, get handlers from config, add `onConfigChange` |
| `createContextManager` | Add config object with error handlers |
| `createSpan` | Add `onConfigChange` if caching config values |
| `createResource` | Add shutdown/cleanup method |
| All | Add `IUnloadHook` management with `.rm()` calls during shutdown |
| All | Add comprehensive TypeDoc documentation |

**Deliverable**: All existing implementations pass CONTEXT.md validation checklist.

### Phase 1: SDK Foundation (Critical)

| Component | Location | Description |
|-----------|----------|-------------|
| `createOTelWebSdk()` | `src/otel/sdk/` | Main SDK entry point factory |
| `IOTelWebSdkConfig` | `src/interfaces/otel/config/` | SDK configuration interface |
| Deprecate `OTelSdk` class | `src/otel/sdk/OTelSdk.ts` | Remove DynamicProto usage |

**Deliverable**: Functional SDK that can be instantiated with trace+log providers.

### Phase 2: Trace Processing Pipeline

| Component | Location | Description |
|-----------|----------|-------------|
| `IOTelSpanProcessor` | `src/interfaces/otel/trace/` | Uncomment/finalize interface |
| `ISpanExporter` | `src/interfaces/otel/trace/` | Export contract |
| `createSimpleSpanProcessor()` | `src/otel/sdk/` | Immediate export on span end |
| `createBatchSpanProcessor()` | `src/otel/sdk/` | Batched export with configurable delays |

**Deliverable**: Spans can be processed and exported.

### Phase 3: Samplers

| Component | Location | Description |
|-----------|----------|-------------|
| `createAlwaysOnSampler()` | `src/otel/sdk/` | Sample all spans |
| `createAlwaysOffSampler()` | `src/otel/sdk/` | Sample no spans |
| `createTraceIdRatioBasedSampler()` | `src/otel/sdk/` | Ratio-based sampling |
| `createParentBasedSampler()` | `src/otel/sdk/` | Inherit parent decision |

**Deliverable**: Configurable sampling strategies.

### Phase 4: Propagation

| Component | Location | Description |
|-----------|----------|-------------|
| `IOTelPropagationApi` | `src/interfaces/otel/propagation/` | Uncomment/finalize interface |
| `createW3CTraceContextPropagator()` | `src/otel/api/propagation/` | W3C TraceContext |
| `createW3CBaggagePropagator()` | `src/otel/api/propagation/` | W3C Baggage |
| `createCompositePropagator()` | `src/otel/api/propagation/` | Combine propagators |

**Deliverable**: Distributed tracing context propagation.

### Phase 5: Basic Metrics

| Component | Location | Description |
|-----------|----------|-------------|
| `createMeterProvider()` | `src/otel/sdk/` | MeterProvider factory |
| `createMeter()` | `src/otel/sdk/` | Meter factory |
| `createCounter()` | `src/otel/sdk/` | Monotonic counter |
| `createHistogram()` | `src/otel/sdk/` | Value distribution |
| `createGauge()` | `src/otel/sdk/` | Current value |

**Deliverable**: Basic metrics (counter, histogram, gauge).

### Phase 6: Cleanup & Polish

| Component | Location | Description |
|-----------|----------|-------------|
| `createIdGenerator()` | `src/otel/api/trace/` | Factory wrapper for ID utilities |
| `createBaggage()` | `src/otel/api/baggage/` | Baggage creation |
| Config isolation | `src/otel/sdk/config.ts` | Fix `process.env` access |
| Pattern migration | Various | Remove remaining DynamicProto usages |

---

## Pattern Compliance Issues

### Files Requiring Migration (DynamicProto → Closure)

| File | Priority | Action |
|------|----------|--------|
| `OTelSdk.ts` | High | Replace with `createOTelWebSdk()` factory |
| `DiagnosticLogger.ts` | Medium | Assess if migration needed for OTel use |
| `AppInsightsCore.ts` | Low | AI core - may not need migration |

### Files Using Closure Pattern (Need CONTEXT.md Compliance Updates)

| File | Factory | Compliance Issues |
|------|---------|-------------------|
| `tracerProvider.ts` | `_createTracerProvider` | Internal naming, no config object, no `onConfigChange` |
| `tracer.ts` | `_createTracer` | Internal naming, takes host not config |
| `span.ts` | `createSpan` | No `onConfigChange` for cached config |
| `contextManager.ts` | `createContextManager` | No config object, no error handlers |
| `OTelLoggerProvider.ts` | `createLoggerProvider` | Default config, no `onConfigChange`, creates own handlers |
| `OTelLogger.ts` | `createLogger` | Needs review for config compliance |
| `OTelLogRecord.ts` | `createLogRecord` | Needs review for config compliance |
| `resource.ts` | `createResource` | No shutdown method |
| `attributeContainer.ts` | `createAttributeContainer` | Needs review for config compliance |

---

## Test Coverage Gaps

| Area | Status |
|------|--------|
| Trace (Span, Tracer, TraceState) | ✅ Extensive |
| Logging (Logger, LogRecord, Processor) | ✅ Good |
| Attributes | ✅ Yes |
| Error Handling | ✅ Yes |
| SDK Entry Point | ❌ None |
| Samplers | ❌ None |
| SpanProcessor | ❌ None |
| Metrics | ❌ None |
| Propagation | ❌ None |

---

## Priority Order

0. **Phase 0** - CONTEXT.md Compliance Fixes (prerequisite for all other work)
1. **Phase 1** - SDK Entry Point (unblocks SDK usage)
2. **Phase 2** - SpanProcessor (enables trace export)
3. **Phase 3** - Samplers (enables sampling control)
4. **Phase 4** - Propagation (enables distributed tracing)
5. **Phase 5** - Metrics (completes OTel API coverage)
6. **Phase 6** - Polish and cleanup

---

## Validation Criteria

Per [CONTEXT.md](../CONTEXT.md), all implementations must:

- [ ] Use closure/factory pattern (`create*` functions)
- [ ] Return interface types only
- [ ] Inject all dependencies through config
- [ ] Use `IOTelErrorHandlers` for error handling
- [ ] Use config directly (NO spread operator)
- [ ] Use `onConfigChange` for dynamic config (save `IUnloadHook`, call `.rm()` on shutdown)
- [ ] Have comprehensive TypeDoc documentation
- [ ] Have unit tests with cleanup validation
