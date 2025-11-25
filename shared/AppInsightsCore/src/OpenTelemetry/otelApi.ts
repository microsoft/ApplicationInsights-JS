import { ILazyValue, createDeferredCachedValue, objDefineProps } from "@nevware21/ts-utils";
import { setProtoTypeName } from "../JavaScriptSDK/HelperFuncs";
import { IOTelApi } from "./interfaces/IOTelApi";
import { IOTelApiCtx } from "./interfaces/IOTelApiCtx";
import { ITraceApi } from "./interfaces/trace/ITraceApi";
import { createTraceApi } from "./trace/traceApi";
import { createTracerProvider } from "./trace/tracerProvider";

export function createOTelApi(otelApiCtx: IOTelApiCtx, dfTraceName: string): IOTelApi {
    let _traceApi: ILazyValue<ITraceApi>;

    let otelApi = setProtoTypeName(objDefineProps<IOTelApi>(createTracerProvider(otelApiCtx.core) as IOTelApi, {
        cfg: { g: () => otelApiCtx.core.config },
        trace: { g: () => _traceApi.v },
        core: { g: () => otelApiCtx.core }
    }), "OTelApi");

    _traceApi = createDeferredCachedValue(() => createTraceApi(otelApi, dfTraceName));

    return otelApi
}
