// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// Note: DON'T Export these const from the package as we are still targeting ES3 this will export a mutable variables that someone could change!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// Generally you should only put values that are used more than 2 times and then only if not already exposed as a constant (such as SdkCoreNames)
// as when using "short" named values from here they will be will be minified smaller than the SdkCoreNames[eSdkCoreNames.xxxx] value.

export const STR_DURATION = "duration";
export const STR_PROPERTIES = "properties";

