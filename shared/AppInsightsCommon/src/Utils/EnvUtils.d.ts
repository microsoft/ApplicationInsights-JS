import { IConfiguration } from "../Interfaces/IConfiguration";

/**
 * Enable the lookup of test mock objects if requested
 * @param enabled - A flag to enable or disable the mock
 */
export declare function setEnableEnvMocks(enabled: boolean): void;
/**
 * Returns the global location object if it is present otherwise null.
 * This helper is used to access the location object without causing an exception
 * "Uncaught ReferenceError: location is not defined"
 */
export declare function getLocation(checkForMock?: boolean): Location | null;
/**
 * Returns the global console object
 */
export declare function getConsole(): Console | null;
/**
 * Checks if JSON object is available, this is required as we support the API running without a
 * window /document (eg. Node server, electron webworkers) and if we attempt to assign a history
 * object to a local variable or pass as an argument an "Uncaught ReferenceError: JSON is not defined"
 * exception will be thrown.
 * Defined as a function to support lazy / late binding environments.
 */
export declare function hasJSON(): boolean;
/**
 * Returns the global JSON object if it is present otherwise null.
 * This helper is used to access the JSON object without causing an exception
 * "Uncaught ReferenceError: JSON is not defined"
 */
export declare function getJSON(): JSON | null;
/**
 * Returns the crypto object if it is present otherwise null.
 * This helper is used to access the crypto object from the current
 * global instance which could be window or globalThis for a web worker
 */
export declare function getCrypto(): Crypto | null;
/**
 * Returns the crypto object if it is present otherwise null.
 * This helper is used to access the crypto object from the current
 * global instance which could be window or globalThis for a web worker
 */
export declare function getMsCrypto(): Crypto | null;
/**
 * Returns whether the environment is reporting that we are running in a React Native Environment
 */
export declare function isReactNative(): boolean;
/**
 * Identifies whether the current environment appears to be IE
 */
export declare function isIE(): boolean;
/**
 * Gets IE version returning the document emulation mode if we are running on IE, or null otherwise
 */
export declare function getIEVersion(userAgentStr?: string): number;
export declare function isSafari(userAgentStr?: string): boolean;
/**
 * Checks if HTML5 Beacons are supported in the current environment.
 * @param useCached - [Optional] used for testing to bypass the cached lookup, when `true` this will
 * cause the cached global to be reset.
 * @returns True if supported, false otherwise.
 */
export declare function isBeaconsSupported(useCached?: boolean): boolean;
/**
 * Checks if the Fetch API is supported in the current environment.
 * @param withKeepAlive - [Optional] If True, check if fetch is available and it supports the keepalive feature, otherwise only check if fetch is supported
 * @returns True if supported, otherwise false
 */
export declare function isFetchSupported(withKeepAlive?: boolean): boolean;
export declare function useXDomainRequest(): boolean | undefined;
/**
 * Checks if XMLHttpRequest is supported
 * @returns True if supported, otherwise false
 */
export declare function isXhrSupported(): boolean;
/**
 * Helper function to fetch the named meta-tag from the page.
 * @param name - The name of the meta-tag to find.
 */
export declare function findMetaTag(name: string): any;
/**
 * Helper function to fetch all named meta-tag from the page.
 * @since 3.4.0
 * @param name - The name of the meta-tag to find.
 * @returns - An array of meta-tag values.
 */
export declare function findMetaTags(name: string): string[];
/**
 * Helper function to fetch the named server timing value from the page response (first navigation event).
 * @param name - The name of the server timing value to find.
 */
export declare function findNamedServerTiming(name: string): any;
/**
 * Helper function to fetch the named server timing value from the page response (first navigation event).
 * @since 3.4.0
 * @param name - The name of the server timing value to find.
 * @returns - An array of server timing values.
 */
export declare function findNamedServerTimings(name: string): string[];
export declare function dispatchEvent(target: EventTarget, evnt: Event | CustomEvent): boolean;
export declare function createCustomDomEvent(eventName: string, details?: any): CustomEvent;
export declare function sendCustomEvent(evtName: string, cfg?: any, customDetails?: any): boolean;
/**
 * Redacts sensitive information from a URL string, including credentials and specific query parameters.
 * @param input - The URL string to be redacted.
 * @param config - Configuration object that contain redactUrls setting.
 * @returns The redacted URL string or the original string if no redaction was needed or possible.
 */
export declare function fieldRedaction(input: string, config: IConfiguration): string;
