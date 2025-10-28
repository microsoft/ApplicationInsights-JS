import { IProcessTelemetryUnloadContext } from "./Interfaces/IProcessTelemetryContext";
import { ITelemetryUnloadState } from "./Interfaces/ITelemetryUnloadState";

export type UnloadHandler = (itemCtx: IProcessTelemetryUnloadContext, unloadState: ITelemetryUnloadState) => void;
export interface IUnloadHandlerContainer {
    add: (handler: UnloadHandler) => void;
    run: (itemCtx: IProcessTelemetryUnloadContext, unloadState: ITelemetryUnloadState) => void;
}
export declare function createUnloadHandlerContainer(): IUnloadHandlerContainer;
