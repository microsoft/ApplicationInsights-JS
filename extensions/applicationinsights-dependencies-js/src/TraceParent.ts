import { generateW3CId } from "@microsoft/applicationinsights-core-js";

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
    public traceFlag: string;
    public traceId: string;
    public version: string;

    constructor(traceId?: string, spanId?: string) {
        let self = this;
        self.traceFlag = Traceparent.DEFAULT_TRACE_FLAG;
        self.version = Traceparent.DEFAULT_VERSION;
    
        if (traceId && Traceparent.isValidTraceId(traceId)) {
            self.traceId = traceId;
        } else {
            self.traceId = generateW3CId();
        }
        if (spanId && Traceparent.isValidSpanId(spanId)) {
            self.spanId = spanId;
        } else {
            self.spanId = generateW3CId().substr(0, 16);
        }
    }

    public toString(): string {
        let self = this;
        return `${self.version}-${self.traceId}-${self.spanId}-${self.traceFlag}`;
    }
}