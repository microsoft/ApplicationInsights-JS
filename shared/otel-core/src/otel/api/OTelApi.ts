import { ILazyValue, createDeferredCachedValue, fnApply, objDeepFreeze, objDefineProps } from "@nevware21/ts-utils";
import { cfgDfMerge } from "../../config/AppInsights/ConfigDefaultHelpers";
import { createDynamicConfig } from "../../config/AppInsights/DynamicConfig";
import { safeGetLogger } from "../../diagnostics/AppInsights/DiagnosticLogger";
import { IConfigDefaults } from "../../interfaces/AppInsights/config/IConfigDefaults";
import { IDynamicConfigHandler } from "../../interfaces/AppInsights/config/IDynamicConfigHandler";
import { IOTelApi } from "../../interfaces/OTel/IOTelApi";
import { IOTelApiCtx } from "../../interfaces/OTel/IOTelApiCtx";
import { IOTelConfig } from "../../interfaces/OTel/config/IOTelConfig";
import { IOTelErrorHandlers } from "../../interfaces/OTel/config/IOTelErrorHandlers";
import { IOTelTraceCfg } from "../../interfaces/OTel/config/IOTelTraceCfg";
import { IOTelContext } from "../../interfaces/OTel/context/IOTelContext";
import { IOTelContextManager } from "../../interfaces/OTel/context/IOTelContextManager";
import { IOTelTraceApi } from "../../interfaces/OTel/trace/IOTelTraceApi";
import { IOTelTracerProvider } from "../../interfaces/OTel/trace/IOTelTracerProvider";
import { createContext } from "./context/context";
import { createContextManager } from "./context/contextManager";
import { throwOTelInvalidAttributeError } from "./errors/OTelInvalidAttributeError";
import { throwOTelNotImplementedError } from "./errors/OTelNotImplementedError";
import { throwOTelSpanError } from "./errors/OTelSpanError";
import { createTraceApi } from "./trace/traceApi";

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
