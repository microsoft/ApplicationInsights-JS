// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Controls how the user can configure which parts of the URL should be redacted. Example, certain query parameters, username and password, etc.
 * @since <next_release_version>
 */
export const enum UrlRedactionOptions {
    /**
     * The default value, will redact the username and password as well as the default set of query parameters
     */
    redactAll = 1,

    /**
     * Does not redact username and password or any query parameters, the URL will be left as is. Note: this is not recommended as it may lead 
     * to sensitive data being sent in clear text.
     */
    redactNone = 2,

    /**
     * This will append any additional queryParams that the user has provided through redactQueryParams config to the default set i.e to
     * @defaultValue ["sig", "Signature", "AWSAccessKeyId", "X-Goog-Signature"]. 
     */
    append = 3,

    /**
     * This will replace the default set of query parameters to redact with the query parameters defined in redactQueryParams config, if provided by the user.
     */
    replace = 4,

    /**
     * This will redact username and password in the URL but will not redact any query parameters, even those in the default set.
     */
    usernamePasswordOnly = 5,

    /**
     * This will only redact the query parameter in the default set of query parameters to redact. It will not redact username and password.
     */
    queryParamsOnly = 6,

}