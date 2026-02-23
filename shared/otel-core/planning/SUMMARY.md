# OTel Web SDK - Summary

Concise summary of implementation requirements. Full details in [CONTEXT.md](../CONTEXT.md).

---

## Architectural Principles

**Interface-First Design** — Define all public APIs as TypeScript interfaces before implementation. Factory functions return interface types only, never expose implementation details.

**Inversion of Control (IoC)** — All dependencies explicitly injected through factory config. No hidden globals, no singletons, no static state. Components never reach out to get dependencies — they receive everything they need.

**Multi-Instance Architecture** — Multiple SDK instances coexist without interference. No shared global state between instances.

**No OpenTelemetry Package Imports** — Never import `@opentelemetry/*` packages directly (they have side effects that register globals). Define compatible `IOTel` interfaces instead.

**Complete Unload Support** — Every SDK instance must fully clean up on unload: remove hooks, clear timers, flush pending telemetry, release all resources.

---

## Core Rules

**No Global State** — Never use window properties, static state, or singletons.

**No OpenTelemetry Imports** — Define compatible interfaces with `IOTel` prefix instead.

**Factory Functions Only** — Use `create*` naming, return interface types, inject all dependencies through config.

**Closure Pattern** — Private state in closure variables, public methods on `_self` object, no classes.

**Config Used Directly** — Never copy config with spread operator. Use `onConfigChange` for local caching, save the `IUnloadHook`, call `.rm()` on shutdown.

**Error Handling** — Get handlers from `config.errorHandlers`, use helpers from `handleErrors.ts`.

**No No-Op Code in SDK** — The main SDK must not contain no-op/fallback implementations. A separate standalone no-op package provides API-compatible stubs for unsupported browsers. The SDK Loader decides whether to load the full SDK or the no-op package based on browser capability detection.

---

## Naming

| Type | Convention | Example |
|------|------------|---------|
| Public interfaces | `I` prefix | `IUnloadResult` |
| OTel interfaces | `IOTel` prefix | `IOTelTraceProvider` |
| Internal interfaces | `_I` prefix + `@internal` | `_ISpanProcessor` |
| Const enums | `e` prefix | `eSpanKind` |
| Public enums | use `createEnumStyle` | `SpanKind` |
| Factory functions | `create*` | `createTraceProvider` |

---

## Anti-Patterns

```typescript
window.__OTEL_SDK__;              // ❌ Global access
let _config = { ...config };      // ❌ Spread operator
import { trace } from '@opentelemetry/api';  // ❌ OTel imports
export function create(config = {}) { }      // ❌ Default deps
onConfigChange(config, () => {});            // ❌ Not saving hook
```

---

## Testing

- Call `core.unload(false)` in cleanup
- Test dynamic config changes
- Use framework helpers (`this.hookFetch()`, `this.useFakeTimers()`)
- Return `IPromise` for async tests

---

## Performance Targets (p95)

| Operation | Target |
|-----------|--------|
| SDK Init | < 5ms |
| Span Creation | < 0.1ms |
| Attribute Addition | < 0.05ms |
| Span Completion | < 0.2ms |

No continuous timers — start only when work exists, stop when complete.
