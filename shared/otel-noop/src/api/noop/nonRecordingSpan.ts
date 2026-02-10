// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    INVALID_SPAN_ID, INVALID_TRACE_ID, IOTelSpanContext, IOTelSpanStatus, IReadableSpan, eOTelSpanKind, eOTelSpanStatusCode, eW3CTraceFlags
} from "@microsoft/otel-core-js";
import { createDeferredCachedValue, objDefineProps, objFreeze } from "@nevware21/ts-utils";
import { UNDEFINED_VALUE } from "../../internal/InternalConstants";

// Inline noop helpers - these don't need the full noop package
function _noopThis<T>(this: T): T {
    return this;
}

function _noopVoid<T>(this: T): void {
    // noop
}

function _createNoopSpanContext(): IOTelSpanContext {
    // Inline noop span context creation without using createNoopProxy
    return objFreeze<IOTelSpanContext>({
        traceId: INVALID_TRACE_ID,
        spanId: INVALID_SPAN_ID,
        traceFlags: eW3CTraceFlags.None,
        traceState: UNDEFINED_VALUE,
        isRemote: UNDEFINED_VALUE
    });
}

export function createNonRecordingSpan(spanContext?: IOTelSpanContext, name?: string): IReadableSpan {
    function _spanSontext() {
        return spanContext || _createNoopSpanContext();
    }

    let theSpan: IReadableSpan = { } as IReadableSpan;
    let status = objFreeze<IOTelSpanStatus>({
        code: eOTelSpanStatusCode.UNSET,
        message: UNDEFINED_VALUE
    });
    let ended = false;

    function _frozenArray<T>(): T[] {
        return objFreeze([]);
    }

    function _end() {
        ended = true;
    }

    objDefineProps<IReadableSpan>(theSpan, {
        name: { v: name || "Unknown" },
        kind: { v: eOTelSpanKind.INTERNAL },
        spanContext: { g: () => _spanSontext },
        parentSpanId:  { v: UNDEFINED_VALUE },
        parentSpanContext: { v: UNDEFINED_VALUE },
        startTime:  { v: UNDEFINED_VALUE },
        endTime:  { v: UNDEFINED_VALUE },
        status:  { v: status },
        attributes:  { l: createDeferredCachedValue(() => objFreeze({})) },
        links:  { l: createDeferredCachedValue(_frozenArray) },
        events:  { l: createDeferredCachedValue(_frozenArray) },
        duration:  { v: UNDEFINED_VALUE },
        ended:  { g: () => ended },
        resource:  { v: UNDEFINED_VALUE },
        instrumentationScope:  { v: UNDEFINED_VALUE },
        droppedAttributesCount:  { v: UNDEFINED_VALUE },
        droppedEventsCount:  { v: UNDEFINED_VALUE },
        droppedLinksCount:  { v: UNDEFINED_VALUE },
        setAttribute: { v: _noopThis<IReadableSpan> as IReadableSpan["setAttribute"] },
        setAttributes: { v: _noopThis<IReadableSpan> as IReadableSpan["setAttributes"] },
        addEvent: { v: _noopThis<IReadableSpan> as IReadableSpan["addEvent"] },
        addLink: { v: _noopThis<IReadableSpan> as IReadableSpan["addLink"] },
        addLinks: { v: _noopThis<IReadableSpan> as IReadableSpan["addLinks"] },
        setStatus: { v: _noopThis<IReadableSpan> as IReadableSpan["setStatus"] },
        updateName: { v: _noopThis<IReadableSpan> as IReadableSpan["updateName"] },
        end: { v: _end },
        isRecording: { v: () => false },
        recordException: { v: _noopVoid<IReadableSpan> as IReadableSpan["recordException"] }
    });

    return theSpan;
}
