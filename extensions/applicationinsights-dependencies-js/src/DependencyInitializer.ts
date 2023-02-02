import { IDependencyTelemetry } from "@microsoft/applicationinsights-common";
import { IDependencyHandler } from "./DependencyListener";

export interface IDependencyInitializerDetails {

    /**
     * The DependencyTelemetry event that will be passed to the `trackDependencyDataInternal` function.
     */
    item: IDependencyTelemetry;
    
    /**
     * Additional properties to be added to the event
     */
    properties?: { [key: string]: any };
    
    /**
     * Additional system properties to be added to the event.
     */
    sysProperties?: { [key: string]: any }


    /**
     * The context that the application can assigned via the dependency listener(s)
     */
    context?: { [key: string]: any };

    /**
     * [Optional] A flag that indicates whether the client request was manually aborted by the `abort()`
     */
    aborted?: boolean;
}

/**
 * The initializer function that will be called, if it returns false the event will be dropped and not reported
 * or counted against the `maxAjaxCallsPerView`.
 */
export declare type DependencyInitializerFunction = (item: IDependencyInitializerDetails) => boolean | void;

export interface IDependencyInitializerHandler extends IDependencyHandler {
}

export interface IDependencyInitializerContainer {
    /**
     * Add a dependency telemetry processor to decorate or drop telemetry events.
     * @param dependencyInitializer - The Telemetry Initializer function
     * @returns - A ITelemetryInitializerHandler to enable the initializer to be removed
     */
    addDependencyInitializer(dependencyInitializer: DependencyInitializerFunction): IDependencyInitializerHandler | void;
}
