import { IOTelErrorHandlers } from "./IOTelErrorHandlers";
import { IOTelTraceCfg } from "./IOTelTraceCfg";

export interface IOTelConfig {
    traceCfg?: IOTelTraceCfg;
    errorHandlers?: IOTelErrorHandlers;
}
