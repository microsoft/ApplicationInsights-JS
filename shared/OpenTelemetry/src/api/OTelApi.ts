import {
    IConfigDefaults, IDynamicConfigHandler, IOTelConfig, IOTelContext, IOTelContextManager, IOTelErrorHandlers, IOTelTraceCfg,
    IOTelTracerProvider, cfgDfMerge, createContext, createContextManager, createDynamicConfig, createNoopTracerProvider, safeGetLogger,
    throwOTelInvalidAttributeError, throwOTelNotImplementedError, throwOTelSpanError
} from "@microsoft/applicationinsights-core-js";
import { ILazyValue, createDeferredCachedValue, fnApply, objDeepFreeze, objDefineProps } from "@nevware21/ts-utils";
import { IOTelApi } from "../interfaces/IOTelApi";
import { IOTelApiCtx } from "../interfaces/IOTelApiCtx";
import { IOTelTraceApi } from "../interfaces/trace/IOTelTraceApi";
import { createTraceApi } from "../trace/traceApi";

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
            _traceProvider = createNoopTracerProvider();
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
