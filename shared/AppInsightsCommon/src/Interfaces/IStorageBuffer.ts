import { IDiagnosticLogger } from "@microsoft/applicationinsights-core-js";

/**
 * Identifies a simple interface to allow you to override the storage mechanism used
 * to track unsent and unacknowledged events. When provided it must provide both
 * the get and set item functions.
 * @since 2.8.12
 */
export interface IStorageBuffer {
    /**
     * Retrieves the stored value for a given key
     */
    getItem(logger: IDiagnosticLogger, name: string): string;

    /**
     * Sets the stored value for a given key
     */
    setItem(logger: IDiagnosticLogger, name: string, data: string): boolean;
}