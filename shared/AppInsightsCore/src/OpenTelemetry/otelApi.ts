import { ILazyValue, createDeferredCachedValue, fnApply, objCreate, objDeepFreeze, objDefineProps } from "@nevware21/ts-utils";
import { cfgDfMerge } from "../Config/ConfigDefaultHelpers";
import { createDynamicConfig } from "../Config/DynamicConfig";
import { IConfigDefaults } from "../Config/IConfigDefaults";
import { IDynamicConfigHandler } from "../Config/IDynamicConfigHandler";
import { _eInternalMessageId, eLoggingSeverity } from "../JavaScriptSDK.Enums/LoggingEnums";
import { _throwInternal, safeGetLogger } from "../JavaScriptSDK/DiagnosticLogger";
import { setProtoTypeName } from "../JavaScriptSDK/HelperFuncs";
import { createContext } from "./context/context";
import { createContextManager } from "./context/contextManager";
import { throwOTelInvalidAttributeError } from "./errors/OTelInvalidAttributeError";
import { throwOTelNotImplementedError } from "./errors/OTelNotImplementedError";
import { throwOTelSpanError } from "./errors/OTelSpanError";
import { IOTelApi } from "./interfaces/IOTelApi";
import { IOTelApiCtx } from "./interfaces/IOTelApiCtx";
import { IOTelConfig } from "./interfaces/config/IOTelConfig";
import { IOTelErrorHandlers } from "./interfaces/config/IOTelErrorHandlers";
import { IOTelTraceCfg } from "./interfaces/config/IOTelTraceCfg";
import { IOTelContext } from "./interfaces/context/IOTelContext";
import { IOTelContextManager } from "./interfaces/context/IOTelContextManager";
import { IOTelTraceApi } from "./interfaces/trace/IOTelTraceApi";
import { IOTelTracer } from "./interfaces/trace/IOTelTracer";
import { createTraceApi } from "./trace/traceApi";
import { createTracer } from "./trace/tracer";

export const traceApiDefaultConfigValues: IConfigDefaults<IOTelConfig> = objDeepFreeze({
    traceCfg: cfgDfMerge<IOTelTraceCfg, IOTelConfig>({
        // contextManager: null,
        // textMapPropagator: null,
        // sampler: null,
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
        // idGenerator: null,
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

export function createOTelApi(otelApiCtx: IOTelApiCtx, dfTraceName: string): IOTelApi {
    let _logger = otelApiCtx.core.logger || safeGetLogger(null);
    let _configHandler: IDynamicConfigHandler<IOTelConfig> = createDynamicConfig({} as IOTelConfig, traceApiDefaultConfigValues as any, _logger);
    let _traceApi: ILazyValue<IOTelTraceApi>;
    let _baseContext: ILazyValue<IOTelContext> = createDeferredCachedValue(createContext);
    let _context: ILazyValue<IOTelContextManager> = createDeferredCachedValue(() => createContextManager(_baseContext.v));
    let _tracers: { [key: string]: IOTelTracer };

    function _getTracer(name: string) {
        if (!name) {
            _throwInternal(_logger, eLoggingSeverity.WARNING, _eInternalMessageId.TraceError, "You must specify a tracer name");
            return null;
        }

        if (!_tracers) {
            _tracers = objCreate(null) as { [key: string]: IOTelTracer };
        }

        if (!_tracers[name]) {
            _tracers[name] = createTracer(otelApiCtx.core, name);
        }

        return _tracers[name];
    }

    let otelApi = setProtoTypeName(objDefineProps<IOTelApi>({} as IOTelApi, {
        cfg: { g: () => _configHandler.cfg },
        trace: { g: () => _traceApi.v },
        context: { g: () => _context.v },
        getTracer: { g: () => _getTracer }
    }), "OTelApi");

    _traceApi = createDeferredCachedValue(() => createTraceApi(otelApi, dfTraceName));

    return otelApi
}
