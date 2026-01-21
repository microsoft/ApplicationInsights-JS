import { IConfigDefaults, IDynamicConfigHandler } from "@microsoft/applicationinsights-common";
import {
    IOTelApi, IOTelApiCtx, IOTelConfig, IOTelContext, IOTelContextManager, IOTelErrorHandlers, IOTelTraceApi, IOTelTraceCfg,
    IOTelTracerProvider, createContext, createContextManager, createTraceApi, throwOTelInvalidAttributeError, throwOTelNotImplementedError,
    throwOTelSpanError
} from "@microsoft/otel-core-js";
import { ILazyValue, createDeferredCachedValue, fnApply, objDeepFreeze, objDefineProps } from "@nevware21/ts-utils";
import { cfgDfMerge } from "./Config/ConfigDefaultHelpers";
import { createDynamicConfig } from "./Config/DynamicConfig";
import { safeGetLogger } from "./Diagnostics/DiagnosticLogger";

export const traceApiDefaultConfigValues: IConfigDefaults<IOTelConfig> = objDeepFreeze({
    traceCfg: cfgDfMerge<IOTelTraceCfg, IOTelConfig>({
        contextManager: null,
        // textMapPropagator: null,
        sampler: null,
        generalLimits: cfgDfMerge({
            attributeValueLengthLimit: undefined,
            attributeCountLimit: 128
        }),
        spanLimits: cfgDfMerge({
            attributeValueLengthLimit: undefined,
            attributeCountLimit: 128,
            linkCountLimit: 128,
            eventCountLimit: 128,
            attributePerEventCountLimit: 128,
            attributePerLinkCountLimit: 128
        }),
        idGenerator: null,
        serviceName: null
    }),
    errorHandlers: cfgDfMerge<IOTelErrorHandlers, IOTelConfig>({
        attribError: throwOTelInvalidAttributeError,
        spanError: throwOTelSpanError,
        warn: logWarning,
        notImplemented: throwOTelNotImplementedError
    })
});


// TODO(!! IMPORTANT !!): This is a placeholder for the actual implementation of the logWarning function
function logWarning(message: string): void {
    if (console) {
        let fn = console.warn || console.log;
        fnApply(fn, console, [message]);
    }
}

export function createOTelApi(otelApiCtx: IOTelApiCtx): IOTelApi {
    let _logger = otelApiCtx.diagLogger || safeGetLogger(null);
    let _configHandler: IDynamicConfigHandler<IOTelConfig> = createDynamicConfig({} as IOTelConfig, traceApiDefaultConfigValues as any, _logger);
    let _traceApi: ILazyValue<IOTelTraceApi>;
    let _baseContext: ILazyValue<IOTelContext> = createDeferredCachedValue(createContext);
    let _context: ILazyValue<IOTelContextManager> = createDeferredCachedValue(() => createContextManager(_baseContext.v));
    let _traceProvider: IOTelTracerProvider = otelApiCtx.traceProvider;

    function _getTracer(name: string, version?: string) {
        if (!_traceProvider) {
            throwOTelNotImplementedError("No tracer provider configured - a tracer provider must be configured to retrieve tracers");
        }

        return _traceProvider.getTracer(name, version);
    }

    let otelApi = objDefineProps<IOTelApi>({} as IOTelApi, {
        cfg: { g: () => _configHandler.cfg },
        trace: { g: () => _traceApi.v },
        context: { g: () => _context.v },
        getTracer: { g: () => _getTracer }
    });

    _traceApi = createDeferredCachedValue(() => createTraceApi(otelApi));

    return otelApi
}
