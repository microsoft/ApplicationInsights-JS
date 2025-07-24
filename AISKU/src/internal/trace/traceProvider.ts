// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IAppInsightsCore, IConfiguration, IDistributedTraceContext, IOTelApi, IOTelSpan, IOTelSpanContext, IOTelSpanCtx, IOTelSpanOptions,
    IReadableSpan, ITraceProvider, createDistributedTraceContext, createSpan, eOTelSpanKind, generateW3CId, setProtoTypeName
} from "@microsoft/applicationinsights-core-js";
import { ILazyValue, objDefine, strSubstr } from "@nevware21/ts-utils";
import { UNDEFINED_VALUE } from "../../InternalConstants";

/**
 * @internal
 * Creates a new trace provider adapter
 * @param core The core application insights instance.
 * @param name The name of the trace provider.
 * @param api The OpenTelemetry API instance.
 * @param context The OpenTelemetry context instance.
 * @param onEnd The callback to be invoked when the span ends.
 * @returns The created trace provider.
 */
export function _createTraceProvider<CfgType extends IConfiguration = IConfiguration>(core: IAppInsightsCore<CfgType>, traceName: string, api: ILazyValue<IOTelApi>, onEnd?: (span: IReadableSpan) => void): ITraceProvider {
    return setProtoTypeName({
        createSpan: (name: string, options?: IOTelSpanOptions, parent?: IDistributedTraceContext): IOTelSpan => {
            let newCtx: IDistributedTraceContext;
            let parentCtx: IDistributedTraceContext | IOTelSpanContext | undefined;

            if (options && options.root) {
                newCtx = createDistributedTraceContext();
            } else {
                newCtx = createDistributedTraceContext(parent || core.getTraceCtx());
                if (newCtx.parentCtx) {
                    parentCtx = newCtx.parentCtx;
                }
            }

            // Always generate a new spanId
            newCtx.spanId = strSubstr(generateW3CId(), 0, 16);

            let spanCtx: IOTelSpanCtx = {
                api: api.v,
                context: api.v.context.active(),
                spanContext: newCtx,
                attributes: options ? options.attributes : UNDEFINED_VALUE,
                startTime: options ? options.startTime : UNDEFINED_VALUE,
                isRecording: options ? options.recording !== false : true,
                onEnd: onEnd
            };

            if (parentCtx) {
                objDefine(spanCtx, "parentSpanContext", {
                    v: parentCtx,
                    w: false
                });
            }

            return createSpan(spanCtx, name, options?.kind || eOTelSpanKind.INTERNAL);
        },
        getProviderId: () => traceName,
        isAvailable: () => !!onEnd
    }, "TraceProvider");
}
