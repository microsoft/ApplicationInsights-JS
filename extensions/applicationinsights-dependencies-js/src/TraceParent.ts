import { Util } from '@microsoft/applicationinsights-common';

export class Traceparent {

    public static isValidTraceId(id: string): boolean {
        return id.match(/^[0-9a-f]{32}$/) && id !== "00000000000000000000000000000000";
    }

    public static isValidSpanId(id: string): boolean {
        return id.match(/^[0-9a-f]{16}$/) && id !== "0000000000000000";
    }
    private static DEFAULT_TRACE_FLAG = "01";
    private static DEFAULT_VERSION = "00";
    public spanId: string;
    public traceFlag: string = Traceparent.DEFAULT_TRACE_FLAG;
    public traceId: string;
    public version: string = Traceparent.DEFAULT_VERSION;

    constructor(traceId?: string, spanId?: string) {
        if (traceId && Traceparent.isValidTraceId(traceId)) {
            this.traceId = traceId;
        } else {
            this.traceId = Util.generateW3CId();
        }
        if (spanId && Traceparent.isValidSpanId(spanId)) {
            this.spanId = spanId;
        } else {
            this.spanId = Util.generateW3CId().substr(0, 16);
        }
    }

    public toString(): string {
        return `${this.version}-${this.traceId}-${this.spanId}-${this.traceFlag}`;
    }
}