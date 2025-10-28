/**
* The TelemetryUpdateReason enumeration contains a set of bit-wise values that specify the reason for update request.
*/
export declare const enum TelemetryUpdateReason {
    /**
     * Unknown.
     */
    Unknown = 0,
    /**
     * The configuration has ben updated or changed
     */
    ConfigurationChanged = 1,
    /**
     * One or more plugins have been added
     */
    PluginAdded = 16,
    /**
     * One or more plugins have been removed
     */
    PluginRemoved = 32
}
