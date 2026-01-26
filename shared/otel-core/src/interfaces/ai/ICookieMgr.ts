// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise } from "@nevware21/ts-async";
import { ITelemetryUpdateState } from "./ITelemetryUpdateState";

export interface ICookieMgr {

    /**
     * Enable or Disable the usage of cookies
     */
    setEnabled(value: boolean): void;

    /**
     * Can the system use cookies, if this returns false then all cookie setting and access functions will return nothing
     */
    isEnabled(): boolean;

    /**
     * Set the named cookie with the value and optional domain and optional
     * @param name - The name of the cookie
     * @param value - The value of the cookie (Must already be encoded)
     * @param maxAgeSec - [optional] The maximum number of SECONDS that this cookie should survive
     * @param domain - [optional] The domain to set for the cookie
     * @param path - [optional] Path to set for the cookie, if not supplied will default to "/"
     * @returns - True if the cookie was set otherwise false (Because cookie usage is not enabled or available)
     */
    set(name: string, value: string, maxAgeSec?: number, domain?: string, path?: string): boolean;

    /**
     * Get the value of the named cookie
     * @param name - The name of the cookie
     */
    get(name: string): string;

    /**
     * Delete/Remove the named cookie if cookie support is available and enabled.
     * Note: Not using "delete" as the name because it's a reserved word which would cause issues on older browsers
     * @param name - The name of the cookie
     * @param path - [optional] Path to set for the cookie, if not supplied will default to "/"
     * @returns - True if the cookie was marked for deletion otherwise false (Because cookie usage is not enabled or available)
     */
    del(name: string, path?: string): boolean;

    /**
     * Purge the cookie from the system if cookie support is available, this function ignores the enabled setting of the manager
     * so any cookie will be removed.
     * Note: Not using "delete" as the name because it's a reserved word which would cause issues on older browsers
     * @param name - The name of the cookie
     * @param path - [optional] Path to set for the cookie, if not supplied will default to "/"
     * @returns - True if the cookie was marked for deletion otherwise false (Because cookie usage is not available)
     */
    purge(name: string, path?: string): boolean;

    /**
     * Optional Callback hook to allow the cookie manager to update it's configuration, not generally implemented now that
     * dynamic configuration is supported
     * @param updateState - The new configuration state to apply to the cookie manager
     */
    update?(updateState: ITelemetryUpdateState): void;

    /**
     * Unload and remove any state that this ICookieMgr may be holding, this is generally called when the
     * owning SDK is being unloaded.
     * @param isAsync - Can the unload be performed asynchronously (default)
     * @returns If the unload occurs synchronously then nothing should be returned, if happening asynchronously then
     * the function should return an [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * / Promise to allow any listeners to wait for the operation to complete.
     */
    unload?(isAsync?: boolean): void | IPromise<void>;
}

/**
 * Configuration definition for instance based cookie management configuration
 */
export interface ICookieMgrConfig {
    /**
     * Defaults to true, A boolean that indicates whether the use of cookies by the SDK is enabled by the current instance.
     * If false, the instance of the SDK initialized by this configuration will not store or read any data from cookies
     */
    enabled?: boolean;

    /**
     * Custom cookie domain. This is helpful if you want to share Application Insights cookies across subdomains.
     */
    domain?: string;

    /**
     * Specifies the path to use for the cookie, defaults to '/'
     */
    path?: string;

    /**
     * Specify the cookie name(s) to be ignored, this will cause any matching cookie name to never be read or written.
     * They may still be explicitly purged or deleted. You do not need to repeat the name in the `blockedCookies`
     * configuration.(Since v2.8.8)
     */
    ignoreCookies?: string[];

    /**
     * Specify the cookie name(s) to never be written, this will cause any cookie name to never be created or updated,
     * they will still be read unless also included in the ignoreCookies and may still be explicitly purged or deleted.
     * If not provided defaults to the same list provided in ignoreCookies. (Since v2.8.8)
     */
    blockedCookies?: string[];

    /**
     * Hook function to fetch the named cookie value.
     * @param name - The name of the cookie
     */
    getCookie?: (name: string) => string;

    /**
     * Hook function to set the named cookie with the specified value.
     * @param name - The name of the cookie
     * @param value - The value to set for the cookie
     */
    setCookie?: (name: string, value: string) => void;

    /**
     * Hook function to delete the named cookie with the specified value, separated from
     * setCookie to avoid the need to parse the value to determine whether the cookie is being
     * added or removed.
     * @param name - The name of the cookie
     * @param cookieValue - The value to set to expire the cookie
     */
    delCookie?: (name: string, cookieValue: string) => void;

    /**
     * Defaults to false, when true this will disable the deferral behavior that occurs when cookies are disabled,
     * reverting to the previous behavior where cookie operations would simply return false when cookies are disabled.
     * This is provided to maintain backward compatibility if applications depend on the previous behavior.
     * When false (default), cookie operations are deferred until cookies are enabled, supporting consent scenarios.
     * @since v3.3.10
     */
    disableCookieDefer?: boolean;
}
