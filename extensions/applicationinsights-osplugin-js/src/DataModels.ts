/**
* DataModels.ts
* @author Siyu Niu (siyuniu)
* @copyright Microsoft 2024
* File containing the interfaces for OS Plugin SDK.
*/

/**
 * Interface for OS Plugin SDK config
 * @maxTimeout: Maximum time to wait for the OS plugin to return the OS information
 * @mergeOsNameVersion: Whether to merge the OS name and version into one field
 */
export interface IOSPluginConfiguration {
    /**
     * Maximum time to wait for the OS plugin to return the OS information
     * Default: 200
     * @type {number}
     */
    maxTimeout?: number;
    /**
     * Whether to merge the OS name and version into one field
     * Default: undefined
     * @type {boolean}
     */
    mergeOsNameVersion?: boolean;
}
