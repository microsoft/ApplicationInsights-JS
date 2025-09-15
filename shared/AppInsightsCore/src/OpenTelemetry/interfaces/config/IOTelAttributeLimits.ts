

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