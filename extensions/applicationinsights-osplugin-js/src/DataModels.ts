/**
* DataModels.ts
* @author Siyu Niu (siyuniu)
* @copyright Microsoft 2024
* File containing the interfaces for OS Plugin SDK.
*/

export interface IOSPluginConfiguration {
    getOSTimeoutMs?: number;
    mergeOsNameVersion?: boolean;
}
