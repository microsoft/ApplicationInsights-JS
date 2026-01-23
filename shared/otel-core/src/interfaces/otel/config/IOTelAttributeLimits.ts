// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface IOTelAttributeLimits {
    /**
     * maxValueLen is maximum allowed attribute value size
     */
    attributeValueLengthLimit?: number;

    /**
     * maxAttribs is number of attributes per span / trace
     */
    attributeCountLimit?: number;
}
