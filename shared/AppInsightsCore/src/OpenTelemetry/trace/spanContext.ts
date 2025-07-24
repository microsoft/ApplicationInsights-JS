// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { isNullOrUndefined, isNumber, isObject, isString, objDefineProps } from "@nevware21/ts-utils";
import { eW3CTraceFlags } from "../../JavaScriptSDK.Enums/W3CTraceFlags";
import { IDistributedTraceContext } from "../../JavaScriptSDK.Interfaces/IDistributedTraceContext";
import { INVALID_SPAN_ID, INVALID_TRACE_ID, isValidSpanId, isValidTraceId } from "../../JavaScriptSDK/W3cTraceParent";
import { IOTelSpanContext, IWrappedOTelSpanContext } from "../interfaces/trace/IOTelSpanContext";
import { IOTelTraceState } from "../interfaces/trace/IOTelTraceState";
import { createOTelTraceState } from "./traceState";

export function createOTelSpanContext(traceContext: IDistributedTraceContext | IOTelSpanContext): IOTelSpanContext {

    let traceId = isValidTraceId(traceContext.traceId) ? traceContext.traceId : INVALID_TRACE_ID;
    let spanId = isValidSpanId(traceContext.spanId) ? traceContext.spanId : INVALID_SPAN_ID;
    let isRemote = traceContext.isRemote;
    let traceFlags = (!isNullOrUndefined(traceContext.traceFlags) ? traceContext.traceFlags : eW3CTraceFlags.Sampled);
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

/**
 * Returns a IOTelSpanContext that is backed by the provided traceContext.
 * When you get/set the {@link IOTelSpanContext.traceId}, {@link IOTelSpanContext.spanId}, {@link IOTelSpanContext.traceFlags}
 * this will also update the related settings of the wrapped traceContext. However, when you access the {@link IOTelSpanContext.traceState}
 * it will return a new instance that is not linked to the original traceContext, so updating / changing the traceState
 * will NOT be refelected with the {@link IDistributedTraceContext.traceState}, if you need changes to be reflected
 * against the main traceState use the `w3cTraceState` property that is provided by this wrapper
 * @param traceContext 
 * @returns 
 */
export function wrapDistributedTrace(traceContext: IDistributedTraceContext): IWrappedOTelSpanContext {
    let wrappedContext: IWrappedOTelSpanContext = {} as IWrappedOTelSpanContext;
    let otTraceState: IOTelTraceState | null = null;

    objDefineProps(wrappedContext, {
        traceId: {
            g: () => traceContext.traceId,
            s: (value: string) => traceContext.traceId = isValidTraceId(value) ? value : INVALID_TRACE_ID
        },
        spanId: {
            g: () => traceContext.spanId,
            s: (value: string) => traceContext.spanId = isValidSpanId(value) ? value : INVALID_SPAN_ID
        },
        isRemote: {
            g: () => traceContext.isRemote
        },
        traceFlags: {
            g: () => traceContext.traceFlags,
            s: (value: number) => traceContext.traceFlags = value
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
        },
        w3cTraceState: {
            g: () => traceContext.traceState
        }
    });

    return wrappedContext;
}
