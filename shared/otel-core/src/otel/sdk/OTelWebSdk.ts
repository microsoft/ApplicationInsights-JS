// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise, createAllPromise, createSyncPromise } from "@nevware21/ts-async";
import { isFunction, objDefine, objForEachKey } from "@nevware21/ts-utils";
import { createDynamicConfig, onConfigChange } from "../../config/DynamicConfig";
import { createDistributedTraceContext } from "../../core/TelemetryHelpers";
import { eW3CTraceFlags } from "../../enums/W3CTraceFlags";
import { eOTelSamplingDecision } from "../../enums/otel/OTelSamplingDecision";
import { OTelSpanKind, eOTelSpanKind } from "../../enums/otel/OTelSpanKind";
import { IDistributedTraceContext } from "../../interfaces/ai/IDistributedTraceContext";
import { IUnloadHook } from "../../interfaces/ai/IUnloadHook";
import { IOTelApi } from "../../interfaces/otel/IOTelApi";
import { IOTelWebSdk } from "../../interfaces/otel/IOTelWebSdk";
import { IOTelConfig } from "../../interfaces/otel/config/IOTelConfig";
import { IOTelErrorHandlers } from "../../interfaces/otel/config/IOTelErrorHandlers";
import { IOTelWebSdkConfig } from "../../interfaces/otel/config/IOTelWebSdkConfig";
import { IOTelContext } from "../../interfaces/otel/context/IOTelContext";
import { IOTelLogRecord } from "../../interfaces/otel/logs/IOTelLogRecord";
import { IOTelLogger } from "../../interfaces/otel/logs/IOTelLogger";
import { IOTelLoggerOptions } from "../../interfaces/otel/logs/IOTelLoggerOptions";
import { IOTelSpanCtx } from "../../interfaces/otel/trace/IOTelSpanCtx";
import { IOTelSpanOptions } from "../../interfaces/otel/trace/IOTelSpanOptions";
import { IOTelTracer } from "../../interfaces/otel/trace/IOTelTracer";
import { IOTelTracerOptions } from "../../interfaces/otel/trace/IOTelTracerOptions";
import { IReadableSpan } from "../../interfaces/otel/trace/IReadableSpan";
import { handleError, handleWarn } from "../../internal/handleErrors";
import { setProtoTypeName } from "../../utils/HelperFuncs";
import { createContext } from "../api/context/context";
import { createSpan } from "../api/trace/span";
import { getContextSpan, setContextSpan } from "../api/trace/utils";
import { createLoggerProvider } from "./OTelLoggerProvider";

/**
 * Creates a no-op logger that silently discards all emitted log records.
 * Used when the SDK has been shut down.
 * @returns A no-op IOTelLogger instance
 */
function _createNoopLogger(): IOTelLogger {
    return {
        emit(_logRecord: IOTelLogRecord): void {
            // noop - SDK is shut down
        }
    };
}

/**
 * Creates an OpenTelemetry Web SDK instance.
 * This is the main entry point factory for the SDK.
 *
 * The SDK coordinates trace and log providers, manages their lifecycle,
 * and ensures complete cleanup on shutdown.
 *
 * @param config - The SDK configuration with all required dependencies injected
 * @returns An initialized IOTelWebSdk instance
 *
 * @remarks
 * - All dependencies must be injected through config — no global state
 * - Multiple SDK instances can coexist without interference
 * - Config is used directly — never copied with spread operator
 * - Local config caching uses `onConfigChange` callbacks
 * - Complete unload support — call `shutdown()` to release all resources
 *
 * @example
 * ```typescript
 * import { createOTelWebSdk } from "@microsoft/applicationinsights-otelwebsdk-js";
 *
 * const sdk = createOTelWebSdk({
 *   resource: myResource,
 *   errorHandlers: { warn: (msg) => console.warn(msg) },
 *   contextManager: myContextManager,
 *   idGenerator: myIdGenerator,
 *   sampler: myAlwaysOnSampler,
 *   performanceNow: () => performance.now(),
 *   logProcessors: [myLogProcessor]
 * });
 *
 * // Use the SDK
 * const tracer = sdk.getTracer("my-service", "1.0.0");
 * const logger = sdk.getLogger("my-service", "1.0.0");
 *
 * // Clean up when done
 * sdk.shutdown();
 * ```
 *
 * @since 3.4.0
 */
export function createOTelWebSdk(config: IOTelWebSdkConfig): IOTelWebSdk {
    // Validate required dependencies upfront
    let _handlers: IOTelErrorHandlers = config.errorHandlers;

    if (!config.resource) {
        handleError(_handlers, "createOTelWebSdk: resource must be provided");
    }
    if (!config.errorHandlers) {
        // Use an empty handlers object as fallback so handleError/handleWarn don't fail
        _handlers = {};
        handleWarn(_handlers, "createOTelWebSdk: errorHandlers should be provided");
    }
    if (!config.contextManager) {
        handleError(_handlers, "createOTelWebSdk: contextManager must be provided");
    }
    if (!config.idGenerator) {
        handleError(_handlers, "createOTelWebSdk: idGenerator must be provided");
    }
    if (!config.sampler) {
        handleError(_handlers, "createOTelWebSdk: sampler must be provided");
    }
    if (!config.performanceNow) {
        handleError(_handlers, "createOTelWebSdk: performanceNow must be provided");
    }

    // Private closure state
    let _isShutdown = false;
    let _tracers: { [key: string]: IOTelTracer } = {};
    let _unloadHooks: IUnloadHook[] = [];

    // Make the config dynamic so we can watch for changes, then cache values
    let _sdkConfig = createDynamicConfig(config).cfg;
    let _resource = _sdkConfig.resource;
    let _contextManager = _sdkConfig.contextManager;
    let _idGenerator = _sdkConfig.idGenerator;
    let _sampler = _sdkConfig.sampler;

    // Create a minimal IOTelApi adapter that bridges the SDK config to what createSpan needs.
    // createSpan() reads api.cfg.errorHandlers and api.cfg.traceCfg — we provide those from
    // the SDK config. The host and trace properties are not used by createSpan.
    let _otelCfg: IOTelConfig = {
        errorHandlers: _handlers
    };
    let _apiAdapter = { cfg: _otelCfg } as IOTelApi;

    // Watch for config changes and update cached values + api adapter
    let _configUnload = onConfigChange(_sdkConfig, function () {
        _resource = _sdkConfig.resource;
        _contextManager = _sdkConfig.contextManager;
        _idGenerator = _sdkConfig.idGenerator;
        _sampler = _sdkConfig.sampler;
        _handlers = _sdkConfig.errorHandlers || _handlers;
        _otelCfg.errorHandlers = _handlers;
    });
    _unloadHooks.push(_configUnload);

    // Create a root context for the SDK so that context operations always have a valid base
    let _rootContext: IOTelContext = createContext(_apiAdapter);

    // Create the logger provider using existing factory
    let _loggerProvider = createLoggerProvider({
        resource: _resource,
        processors: _sdkConfig.logProcessors || []
    });

    /**
     * Returns the current active context from the context manager, falling back
     * to the SDK root context if none is active.
     * @returns The active IOTelContext
     */
    function _getActiveContext(): IOTelContext {
        return _contextManager.active() || _rootContext;
    }

    // Build the SDK instance using closure pattern
    let _self: IOTelWebSdk = {} as IOTelWebSdk;

    _self.getTracer = function (name: string, version?: string, options?: IOTelTracerOptions): IOTelTracer {
        if (_isShutdown) {
            handleWarn(_handlers, "A shutdown OTelWebSdk cannot provide a Tracer");
            // Return a no-op tracer
            return _createNoopTracer();
        }

        let tracerName = name || "unknown";
        let tracerVersion = version || "";
        let schemaUrl = options ? options.schemaUrl || "" : "";
        let key = tracerName + "@" + tracerVersion + ":" + schemaUrl;

        if (!_tracers[key]) {
            _tracers[key] = _createSdkTracer(tracerName, tracerVersion);
        }

        return _tracers[key];
    };

    _self.getLogger = function (name: string, version?: string, options?: IOTelLoggerOptions): IOTelLogger {
        if (_isShutdown) {
            handleWarn(_handlers, "A shutdown OTelWebSdk cannot provide a Logger");
            return _createNoopLogger();
        }

        return _loggerProvider.getLogger(name, version, options);
    };

    _self.forceFlush = function (): IPromise<void> {
        if (_isShutdown) {
            handleWarn(_handlers, "Cannot force flush a shutdown OTelWebSdk");
            return createSyncPromise(function (resolve) {
                resolve();
            });
        }

        let operations: IPromise<void>[] = [];

        // Flush the logger provider
        if (_loggerProvider.forceFlush) {
            let result = _loggerProvider.forceFlush();
            if (result) {
                operations.push(result);
            }
        }

        // TODO: Phase 2 - Flush span processors when available

        if (operations.length > 0) {
            return createAllPromise(operations).then(function (): void {
                // All flushed
            });
        }

        return createSyncPromise(function (resolve) {
            resolve();
        });
    };

    _self.shutdown = function (): IPromise<void> {
        if (_isShutdown) {
            handleWarn(_handlers, "shutdown may only be called once per OTelWebSdk");
            return createSyncPromise(function (resolve) {
                resolve();
            });
        }

        _isShutdown = true;

        let operations: IPromise<void>[] = [];

        // Shutdown the logger provider
        if (_loggerProvider.shutdown) {
            let result = _loggerProvider.shutdown();
            if (result) {
                operations.push(result);
            }
        }

        // TODO: Phase 2 - Shutdown span processors when available

        // Remove all config change listeners
        for (let i = 0; i < _unloadHooks.length; i++) {
            _unloadHooks[i].rm();
        }
        _unloadHooks = [];

        // Clear cached tracers
        _tracers = {};

        if (operations.length > 0) {
            return createAllPromise(operations).then(function (): void {
                // All shut down
            });
        }

        return createSyncPromise(function (resolve) {
            resolve();
        });
    };

    _self.getConfig = function (): Readonly<IOTelWebSdkConfig> {
        return _sdkConfig;
    };

    /**
     * Creates a tracer instance for this SDK.
     * The tracer creates spans using the SDK's context manager, ID generator, and sampler.
     * Follows the OpenTelemetry Tracer specification for span creation and context management.
     *
     * @param tracerName - The name of the tracer (instrumentation library)
     * @param tracerVersion - The version of the tracer (instrumentation library)
     * @returns An IOTelTracer instance that creates functional spans
     */
    function _createSdkTracer(tracerName: string, tracerVersion: string): IOTelTracer {

        /**
         * Starts a new span without setting it on the current context.
         * Handles ID generation, sampling, and parent span propagation.
         *
         * @param spanName - The name of the span
         * @param options - Optional span creation options (kind, attributes, links, startTime, root)
         * @param context - Optional context to extract parent span from; defaults to active context
         * @returns A new IReadableSpan, or null if the SDK is shutdown
         */
        function _startSpan(spanName: string, options?: IOTelSpanOptions, context?: IOTelContext): IReadableSpan | null {
            if (_isShutdown) {
                return null;
            }

            let opts = options || {};
            let kind: OTelSpanKind = opts.kind || eOTelSpanKind.INTERNAL;
            let activeCtx = context || _getActiveContext();
            let parentSpanCtx: IDistributedTraceContext = null;
            let newCtx: IDistributedTraceContext;

            // Determine parent span context unless root span is requested
            if (!opts.root && activeCtx) {
                let parentSpan = getContextSpan(activeCtx);
                if (parentSpan) {
                    parentSpanCtx = parentSpan.spanContext();
                }
            }

            // Create the new span's distributed trace context
            if (parentSpanCtx) {
                // Child span — inherits traceId from parent
                newCtx = createDistributedTraceContext(parentSpanCtx);
            } else {
                // Root span — new trace
                newCtx = createDistributedTraceContext();
                newCtx.traceId = _idGenerator.generateTraceId();
            }

            // Always generate a new spanId for this span
            newCtx.spanId = _idGenerator.generateSpanId();

            // Run the sampler to decide whether to record this span
            let attributes = opts.attributes || {};
            let links = opts.links || [];
            let samplingResult = _sampler.shouldSample(
                activeCtx, newCtx.traceId, spanName, kind, attributes, links
            );

            // Determine recording and sampled flags from the sampling decision
            let isRecording = samplingResult.decision !== eOTelSamplingDecision.NOT_RECORD;
            let isSampled = samplingResult.decision === eOTelSamplingDecision.RECORD_AND_SAMPLED;

            // Set trace flags based on sampling decision
            newCtx.traceFlags = isSampled ? eW3CTraceFlags.Sampled : eW3CTraceFlags.None;

            // Apply trace state from sampler if provided
            if (samplingResult.traceState) {
                // The sampler may have provided an updated trace state
                // Note: createDistributedTraceContext handles trace state internally
                // For now we rely on the context's built-in trace state management
            }

            // Merge sampler-provided attributes with user-provided attributes
            let spanAttributes = attributes;
            if (isRecording && samplingResult.attributes) {
                // Merge: user attributes take precedence, sampler attributes fill gaps
                spanAttributes = {};
                let samplerAttrs = samplingResult.attributes;
                objForEachKey(samplerAttrs, function (key, value) {
                    spanAttributes[key] = value;
                });
                objForEachKey(attributes, function (key, value) {
                    spanAttributes[key] = value;
                });
            }

            // Build the span context for createSpan
            let spanCtx: IOTelSpanCtx = {
                api: _apiAdapter,
                resource: _resource,
                instrumentationScope: { name: tracerName, version: tracerVersion },
                spanContext: newCtx,
                attributes: spanAttributes,
                startTime: opts.startTime,
                isRecording: isRecording
                // TODO: Phase 2 - Add onEnd callback for span processor notification
            };

            // Set parent span context as a non-writable property if parent exists
            if (parentSpanCtx) {
                objDefine(spanCtx, "parentSpanContext", {
                    v: parentSpanCtx,
                    w: false
                });
            }

            return createSpan(spanCtx, spanName, kind);
        }

        let tracer: IOTelTracer = setProtoTypeName({
            startSpan: function (spanName: string, options?: IOTelSpanOptions, context?: IOTelContext): IReadableSpan | null {
                return _startSpan(spanName, options, context);
            },
            startActiveSpan: function <F extends (span: IReadableSpan) => unknown>(
                spanNameArg: string,
                optionsOrFn?: IOTelSpanOptions | F,
                fnOrContext?: F | IOTelContext,
                maybeFn?: F
            ): ReturnType<F> {
                // Resolve overloaded parameters:
                // Overload 1: startActiveSpan(name, fn)
                // Overload 2: startActiveSpan(name, options, fn)
                // Overload 3: startActiveSpan(name, options, context, fn)
                let opts: IOTelSpanOptions = null;
                let fn: F = null;
                let ctx: IOTelContext = null;

                if (isFunction(optionsOrFn)) {
                    // Overload 1: (name, fn)
                    fn = optionsOrFn as F;
                } else if (isFunction(fnOrContext)) {
                    // Overload 2: (name, options, fn)
                    opts = optionsOrFn as IOTelSpanOptions;
                    fn = fnOrContext as F;
                } else {
                    // Overload 3: (name, options, context, fn)
                    opts = optionsOrFn as IOTelSpanOptions;
                    ctx = fnOrContext as IOTelContext;
                    fn = maybeFn;
                }

                // Create the span using the resolved parameters
                let span = _startSpan(spanNameArg, opts, ctx);

                // Set the span as active in a new context and execute the callback
                let activeCtx = ctx || _getActiveContext();
                let contextWithSpan = setContextSpan(activeCtx, span);

                return _contextManager.with(contextWithSpan, function () {
                    return fn(span);
                }) as ReturnType<F>;
            }
        }, "OTelTracer (" + tracerName + "@" + tracerVersion + ")");

        return tracer;
    }

    /**
     * Creates a no-op tracer that does not create any spans.
     * Used when the SDK has been shut down.
     *
     * @returns A no-op IOTelTracer instance
     */
    function _createNoopTracer(): IOTelTracer {
        return setProtoTypeName({
            startSpan: function (): IReadableSpan | null {
                return null;
            },
            startActiveSpan: function (): undefined {
                return undefined;
            }
        }, "OTelNoopTracer");
    }

    return setProtoTypeName(_self, "OTelWebSdk");
}
