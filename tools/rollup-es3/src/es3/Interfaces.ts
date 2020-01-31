// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Because of the test infrastructure (PhamtonJS) the RegEx can't use the "s" flag (gis vs gi) or named groups
 */
export interface INamedGroups {
    name: string,
    idx: number
};

/**
 * Identifies the checks to apply as part of the es3Check() rollup plugin
 */
export interface IEs3CheckKeyword {
    /**
     * These RegEx's are used to identify the presence of keywords (code) that should not exist (for es3Check()) or
     * should be attempted to be replaced (es3Poly()).
     */
    funcNames: RegExp[],

    /**
     * When the RegEx identifies a positive match, this is the error message that will be included in the failure.
     * If you specify "%funcName%" within the error message, this will be replaced with the result of the matching RegEx value
     */
    errorMsg:string,

    /**
     * An optional array of strings to match with the id/filename to ignore this check (Used for both check and Poly),
     * internally this uses indexOf() to provide a partial existence check
     */
    ignoreIds?:string[],

    /**
     *  A Set of strings to use for matching funcNames to ignore, this is required because of infra (build) issues
     * with negative lookbehind, internally this uses indexOf() to provide a partial existence check.
     */
    ignoreFuncMatch?:string[],

    /**
     * The prefix added to any reported error, defaults to "Invalid ES3 function"
     */
    errorTitle?:string
};
 
/**
 * Identifies the checks and replacement values to apply as part of the es3Poly() rollup plugin
 */
export interface IEs3Keyword extends IEs3CheckKeyword {
    /**
     * The RegEx used to match and extract the function details, don't use named groups (?&lt;name&gt;....); the "s" flag or 
     * positive or negative lookbehind (?&lt;=....); (?<!....) unless you build environment supports them. The application insights
     * infrastructure (PhantomJS) does not.
     */
    extract: RegExp,

    /**
     * Optional array of regex group numbers that will be validated for the existence of a value before this keyword will be
     * applied and the extracted values replaced.
     */
    checkGroups?: number[],

    /** 
     * We need to simulate named regex groups due to infrastructure issues, so this provides a mapping from the RegEx group
     * number to a name, where any matching name in the replace string %name% will be replaced with the matching RegEx group value
     */
    namedGroups?: INamedGroups[],

    /**
     * The replacement pattern to apply to the extracted regex, this becomes the polyFill implementation in the final
     * packaged code.
     */
    replace: string,

    /**
     * The prefix added to any reported error, defaults to "Invalid ES3 function"
     */
    errorTitle?:string
};

/**
 * Identifies the optional options to be passed to the es3Poly() rollup plugin
 */
export interface IEs3RollupOptions {
    /**
     * Only perform check pass, do not replace.
     * Default: false
     */
    checkOnly?: boolean,

    /**
     * Identifies whether to generate the source map as part of the output (also inherited from the rollup options)
     */
    sourcemap?: boolean,

    /**
     * Identifies whether the default keyword definitions should be ignored or included
     * Default: false -- Include the default values
     */
    ignoreDefault?:boolean,

    /**
     * Provides additional keyword replacement definitions that will be process as part of the plugin, when ignoreDefault is
     * false these are appended after the default values, and when true these are the only values used
     */
    keywords?:IEs3Keyword[]        // Optional extra keywords
};

/**
 * Identifies the optional options to be passed to the es3Check() rollup plugin
 */
export interface IEs3CheckRollupOptions {
    /**
     * Identifies whether the default keyword definitions should be ignored or included
     * Default: false -- Include the default values
     */
    ignoreDefault?:boolean,

    /**
     * Provides additional keyword check definitions that will be process as part of the plugin, when ignoreDefault is
     * false these are appended after the default values, and when true these are the only values used
     */
    keywords?:IEs3CheckKeyword[]
};

/**
 * Identifies the optional options to be passed to the es3Check() rollup plugin
 */
export interface IImportCheckRollupOptions {
    /**
     * Identify the module names that you want to ban importing from
     */
    exclude?:string[]
};
