// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { isNumber, isObject, isString, objDefineProps } from "@nevware21/ts-utils";
import { eW3CTraceFlags } from "../../JavaScriptSDK.Enums/W3CTraceFlags";
import { IDistributedTraceContext } from "../../JavaScriptSDK.Interfaces/IDistributedTraceContext";
import { INVALID_SPAN_ID, INVALID_TRACE_ID, isValidSpanId, isValidTraceId } from "../../JavaScriptSDK/W3cTraceParent";
import { IOTelSpanContext } from "../interfaces/trace/IOTelSpanContext";
import { IOTelTraceState } from "../interfaces/trace/IOTelTraceState";
import { createOTelTraceState } from "./traceState";

export function createOTelSpanContext(traceContext: IDistributedTraceContext | IOTelSpanContext): IOTelSpanContext {

    let traceId = isValidTraceId(traceContext.traceId) ? traceContext.traceId : INVALID_TRACE_ID;
    let spanId = isValidSpanId(traceContext.spanId) ? traceContext.spanId : INVALID_SPAN_ID;
    let isRemote = traceContext.isRemote;
    let traceFlags = traceContext.traceFlags || eW3CTraceFlags.None;
    let otTraceState: IOTelTraceState | null = null;

    let traceContextObj: IOTelSpanContext = {
        traceId,
        spanId,
        traceFlags
    };
    
    return objDefineProps<IOTelSpanContext>(traceContextObj, {
        traceId: {
            g: () => traceId,
            s: (value: string) => traceId = isValidTraceId(value) ? value : INVALID_TRACE_ID
        },
        spanId: {
            g: () => spanId,
            s: (value: string) => spanId = isValidSpanId(value) ? value : INVALID_SPAN_ID
        },
        isRemote: {
            g: () => isRemote
        },
        traceFlags: {
            g: () => traceFlags,
            s: (value: number) => traceFlags = value
        },
        traceState: {
            g: () => {
                if (!otTraceState) {
                    // The Trace State has changed, update the local copy
                    otTraceState = createOTelTraceState(traceContext.traceState);
                }

                return otTraceState;
            },
            s: (value: IOTelTraceState) => {
                // The Trace State has changed, update the local copy
                otTraceState = value;
            }
        }
    });
}

export function isSpanContext(spanContext: any): spanContext is IOTelSpanContext {
    return spanContext && isObject(spanContext) && isString(spanContext.traceId) && isString(spanContext.spanId) && isNumber(spanContext.traceFlags);
}

export function wrapDistributedTrace(traceContext: IDistributedTraceContext): IOTelSpanContext {
    return createOTelSpanContext(traceContext);
}
