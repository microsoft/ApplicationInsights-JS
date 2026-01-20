import { eOTelSpanStatusCode } from "../../enums/trace/OTelSpanStatus";

export interface IOTelSpanStatus {
    /**
     * The status code of this message.
     */
    code: eOTelSpanStatusCode;

    /**
     * A developer-facing error message.
     */
    message?: string;
}
