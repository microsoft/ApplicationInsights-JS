// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { objDefine, strSubstr } from "@nevware21/ts-utils";
import { createDistributedTraceContext } from "../../../core/TelemetryHelpers";
import { eOTelSpanKind } from "../../../enums/otel/OTelSpanKind";
import { OTelTimeInput } from "../../../interfaces/IOTelHrTime";
import { IDistributedTraceContext } from "../../../interfaces/ai/IDistributedTraceContext";
import { ITraceHost, ITraceProvider } from "../../../interfaces/ai/ITraceProvider";
import { IOTelApi } from "../../../interfaces/otel/IOTelApi";
import { IOTelSpanCtx } from "../../../interfaces/otel/trace/IOTelSpanCtx";
import { IOTelSpanOptions } from "../../../interfaces/otel/trace/IOTelSpanOptions";
import { IReadableSpan } from "../../../interfaces/otel/trace/IReadableSpan";
import { generateW3CId } from "../../../utils/CoreUtils";
import { createSpan } from "./span";

/**
 * @internal
 * Creates a new trace provider adapter
 * @param host - The trace host instance (typically IAppInsightsCore).
 * @param traceName - The name of the trace provider.
 * @param api - The OpenTelemetry API instance (as a lazy value).
 * @param onEnd - Optional callback to be invoked when a span ends.
 * @param onException - Optional callback to be invoked when an exception is recorded on a span.
 * @returns The created trace provider.
 */
/*#__NO_SIDE_EFFECTS__*/
export function createTraceProvider(host: ITraceHost, traceName: string, api: IOTelApi, onEnd?: (span: IReadableSpan) => void, onException?: (span: IReadableSpan, exception: any, time?: OTelTimeInput) => void): ITraceProvider {
    let provider: ITraceProvider = {
        api: null,
        createSpan: (name: string, options?: IOTelSpanOptions, parent?: IDistributedTraceContext): IReadableSpan => {
            let newCtx: IDistributedTraceContext;
            let parentCtx: IDistributedTraceContext | undefined;

            if (options && options.root) {
                newCtx = createDistributedTraceContext();
            } else {
                newCtx = createDistributedTraceContext(parent || host.getTraceCtx());
                if (newCtx.parentCtx) {
                    parentCtx = newCtx.parentCtx;
                }
            }

            // Always generate a new spanId
            newCtx.spanId = strSubstr(generateW3CId(), 0, 16);

            let spanCtx: IOTelSpanCtx = {
                api: api,
                spanContext: newCtx,
                attributes: options ? options.attributes : undefined,
                startTime: options ? options.startTime : undefined,
                isRecording: options ? options.recording !== false : true,
                onEnd: onEnd,
                onException: onException
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
    };

    objDefine(provider, "api", {
        v: api,
        w: false
    });

    return provider;
}
