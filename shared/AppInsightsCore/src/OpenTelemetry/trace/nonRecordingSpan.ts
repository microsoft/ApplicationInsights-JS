import { eW3CTraceFlags } from "@microsoft/applicationinsights-common";
import { createDeferredCachedValue, objDefineProps, objFreeze } from "@nevware21/ts-utils";
import { UNDEFINED_VALUE } from "../../InternalConstants";
import { INVALID_SPAN_ID, INVALID_TRACE_ID } from "../../JavaScriptSDK/W3cTraceParent";
import { eOTelSpanKind } from "../enums/trace/OTelSpanKind";
import { eOTelSpanStatusCode } from "../enums/trace/OTelSpanStatus";
import { IOTelSpan } from "../interfaces/trace/IOTelSpan";
import { IOTelSpanContext } from "../interfaces/trace/IOTelSpanContext";
import { IOTelSpanStatus } from "../interfaces/trace/IOTelSpanStatus";
import { IReadableSpan } from "../interfaces/trace/IReadableSpan";
import { _noopThis, _noopVoid } from "../noop/noopHelpers";
import { createNoopProxy } from "../noop/noopProxy";

function _createNoopSpanContext() {
    return createNoopProxy<IOTelSpanContext>({
        props: {
            traceId: { v: INVALID_TRACE_ID },
            spanId: { v: INVALID_SPAN_ID },
            traceFlags: { v: eW3CTraceFlags.None },
            traceState: { v: UNDEFINED_VALUE },
            isRemote: { v: UNDEFINED_VALUE }
        }
    });
}

export function createNonRecordingSpan(spanContext?: IOTelSpanContext, name?: string): IOTelSpan {
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
