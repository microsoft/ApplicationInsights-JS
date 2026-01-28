// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createEnumStyle } from "../../JavaScriptSDK.Enums/EnumHelperFuncs";

/**
 * Const enum for attribute change operation types
 */
export const enum eAttributeChangeOp {
    /**
     * Clear operation - clearing all attributes
     */
    Clear = 0,
    
    /**
     * Set operation - setting an attribute value (generic)
     */
    Set = 1,
    
    /**
     * Add operation - adding a new attribute that didn't exist before
     */
    Add = 2,
    
    /**
     * Delete operation - deleting an attribute
     */
    Delete = 3,

    /**
     * Dropped attributes - attributes that were dropped due to size limits
     */
    DroppedAttributes = 4
}

/**
 * Runtime enum style object for attribute change operation types
 */
export const AttributeChangeOp = createEnumStyle({
    Clear: eAttributeChangeOp.Clear,
    Set: eAttributeChangeOp.Set,
    Add: eAttributeChangeOp.Add,
    Delete: eAttributeChangeOp.Delete
});

export type AttributeChangeOp = number | eAttributeChangeOp;