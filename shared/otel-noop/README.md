# @microsoft/otel-noop-js

Microsoft Application Insights OpenTelemetry Noop Implementations

This package provides lightweight no-operation (noop) implementations for OpenTelemetry components. These are useful for:

- Testing scenarios where you need mock implementations
- Lightweight builds that don't require full telemetry
- Default implementations before proper providers are configured

## Installation

```sh
npm install @microsoft/otel-noop-js
```

## Usage

```typescript
import { createNoopLogger, createNoopContextMgr, createNoopTracerProvider, createNoopProxy } from '@microsoft/otel-noop-js';

// Create noop implementations
const logger = createNoopLogger();
const contextMgr = createNoopContextMgr();
const tracerProvider = createNoopTracerProvider();
```

## API

### createNoopLogger()
Creates a noop logger that implements `IOTelLogger` interface.

### createNoopContextMgr()
Creates a noop context manager that implements `IOTelContextManager` interface.

### createNoopTracerProvider()
Creates a noop tracer provider that implements `IOTelTracerProvider` interface.

### createNoopLogRecordProcessor()
Creates a noop log record processor that implements `IOTelLogRecordProcessor` interface.

### createNoopProxy()
Creates a generic noop proxy object with customizable properties.

## License

MIT

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for details on how to contribute.
