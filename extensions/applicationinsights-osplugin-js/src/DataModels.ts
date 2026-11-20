/**
* DataModels.ts
* @author Siyu Niu (siyuniu)
* @copyright Microsoft 2024
* File containing the interfaces for OS Plugin SDK.
*/

/**
 * Interface for OS Plugin SDK config
 * \@maxTimeout: Maximum time to wait for the OS plugin to return the OS information
 * \@mergeOsNameVersion: Whether to merge the OS name and version into one field
 */
export interface IOSPluginConfiguration {
    /**
     * Set to true to register the bundled OS plugin in the full web SDK. Unset leaves automatic registration disabled.
     * Manually registered plugins collect by default for backward compatibility. Set to false to stop collection,
     * release queued telemetry without enrichment, and ignore pending lookup results. Existing cached data is not deleted.
     */
    enabled?: boolean;
    /**
     * Maximum time to wait for the OS plugin to return the OS information
     * Default: 200
     */
    maxTimeout?: number;
    /**
     * Whether to merge the OS name and version into one field
     * Default: undefined
     */
    mergeOsNameVersion?: boolean;
}
