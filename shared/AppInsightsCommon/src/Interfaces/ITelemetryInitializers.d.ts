import { ITelemetryItem } from "./ITelemetryItem";
import { ILegacyUnloadHook } from "./IUnloadHook";

export declare type TelemetryInitializerFunction = <T extends ITelemetryItem>(item: T) => boolean | void;
export interface ITelemetryInitializerHandler extends ILegacyUnloadHook {
    remove(): void;
}
export interface ITelemetryInitializerContainer {
    /**
     * Add a telemetry processor to decorate or drop telemetry events.
     * @param telemetryInitializer - The Telemetry Initializer function
     * @returns - A ITelemetryInitializerHandler to enable the initializer to be removed
     */
    addTelemetryInitializer(telemetryInitializer: TelemetryInitializerFunction): ITelemetryInitializerHandler | void;
}
