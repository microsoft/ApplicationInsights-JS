import { IDiagnosticLogger } from "@microsoft/applicationinsights-core-js";

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