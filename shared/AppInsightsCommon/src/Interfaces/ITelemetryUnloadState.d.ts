import { TelemetryUnloadReason } from "../Enums/TelemetryUnloadReason";

export interface ITelemetryUnloadState {
    reason: TelemetryUnloadReason;
    isAsync: boolean;
    flushComplete?: boolean;
}
