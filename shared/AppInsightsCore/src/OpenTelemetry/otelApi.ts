import { ILazyValue, objDefineProps } from "@nevware21/ts-utils";
import { setProtoTypeName } from "../JavaScriptSDK/HelperFuncs";
import { IOTelApi } from "./interfaces/IOTelApi";
import { IOTelApiCtx } from "./interfaces/IOTelApiCtx";
import { ITraceApi } from "./interfaces/trace/ITraceApi";
import { _createTraceApi } from "./trace/traceApi";
import { _createTracerProvider } from "./trace/tracerProvider";

export function createOTelApi(otelApiCtx: IOTelApiCtx): IOTelApi {
    let _traceApi: ILazyValue<ITraceApi>;

    let otelApi = setProtoTypeName(objDefineProps<IOTelApi>(_createTracerProvider(otelApiCtx.host) as IOTelApi, {
        cfg: { g: () => otelApiCtx.host.config },
        trace: { g: () => _traceApi.v },
        host: { g: () => otelApiCtx.host }
    }), "OTelApi");

    _traceApi = _createTraceApi(otelApi);

    return otelApi
}
