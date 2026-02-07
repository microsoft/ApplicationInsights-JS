// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ILazyValue, objDefineProps } from "@nevware21/ts-utils";
import { IOTelApi } from "../../interfaces/otel/IOTelApi";
import { IOTelApiCtx } from "../../interfaces/otel/IOTelApiCtx";
import { ITraceApi } from "../../interfaces/otel/trace/IOTelTraceApi";
import { setProtoTypeName } from "../../utils/HelperFuncs";
import { _createTraceApi } from "./trace/traceApi";
import { _createTracerProvider } from "./trace/tracerProvider";

/*#__NO_SIDE_EFFECTS__*/
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
