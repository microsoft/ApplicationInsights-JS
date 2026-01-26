// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise, createPromise, doAwait } from "@nevware21/ts-async";
import { arrAppend, arrForEach, isPromiseLike, objDefineProps } from "@nevware21/ts-utils";
import { UNDEFINED_VALUE } from "../../constants/InternalConstants";
import { IOTelAttributes, OTelAttributeValue } from "../../interfaces/otel/IOTelAttributes";
import { IAttributeContainer } from "../../interfaces/otel/attribute/IAttributeContainer";
import { IOTelResource, OTelRawResourceAttribute } from "../../interfaces/otel/resources/IOTelResource";
import { IOTelResourceCtx } from "../../interfaces/otel/resources/IOTelResourceCtx";
import { handleDebug, handleError } from "../../internal/commonUtils";
import { createAttributeContainer } from "../attribute/attributeContainer";

type ResourceKeyValue = [key: string, value: OTelAttributeValue | undefined];

export function createResource(resourceCtx: IOTelResourceCtx): IOTelResource {

    let attribContainer: IAttributeContainer<OTelAttributeValue> | null = null;
    let rawResources: ResourceKeyValue[] = [];
    let waitingPromiseCnt = 0;                  // Avoid creating a promise if no async attributes are present
    let awaitingPromise: IPromise<void> | null = UNDEFINED_VALUE; // Promise to be resolved when all async attributes are resolved
    let resolveAwaitingPromise: () => void;   // Resolve function for the awaiting promise

    if (resourceCtx && resourceCtx.attribs) {
        // Setup listening for async resource attributes
        arrForEach(resourceCtx.attribs, (rawValue: OTelRawResourceAttribute, idx) => {
            if (rawValue.length > 0) {
                let key = rawValue[0];
                let value = rawValue.length > 1 ? rawValue[1] : UNDEFINED_VALUE;
                if (value && isPromiseLike(value)) {
                    waitingPromiseCnt++;
                    doAwait(value, (resolvedValue: OTelAttributeValue) => {
                        rawResources[idx] = [key, resolvedValue];
                        waitingPromiseCnt--;
                        if (waitingPromiseCnt == 0 && awaitingPromise) {
                            /// resolve any awaiting promise
                            resolveAwaitingPromise();
                            resolveAwaitingPromise = null;
                            awaitingPromise = null;
                        }
                    });
                } else {
                    rawResources[idx] = [key, value];
                }
            }
        });
    }

    function _waitForAsyncAttributes(): Promise<void> | undefined {
        if (waitingPromiseCnt > 0 && !awaitingPromise) {
            awaitingPromise = createPromise<void>((resolve) => {
                resolveAwaitingPromise = resolve;
            });
        }

        return awaitingPromise;
    }

    function _keyExists(key: string, resources: OTelRawResourceAttribute[]): boolean {
        let result = false;
        if (resources) {
            // There are outstanding resources so just check the original resource attributes
            arrForEach(resources, (value: OTelRawResourceAttribute) => {
                if (value && value.length > 0) {
                    let k = value[0];
                    if (k === key) {
                        result = true;
                        return -1;
                    }
                }
            });
        }

        return result;
    }

    function _merge(other: IOTelResource | null): IOTelResource {
        // Spec states that incoming attributes override existing attributes, so don't "add" any named
        // attributes, that already exist
        let mergedResources: OTelRawResourceAttribute[] = arrAppend([], other.getRawAttributes());
        arrForEach(_getRawAttributes(), (rawValue: OTelRawResourceAttribute) => {
            if (rawValue) {
                let key = rawValue[0];
                if (!_keyExists(key, mergedResources)) {
                    mergedResources.push(rawValue);
                }
            }
        });

        return createResource({
            cfg: resourceCtx.cfg,
            attribs: mergedResources
        });
    }

    function _getRawAttributes(): OTelRawResourceAttribute[] {
        return resourceCtx.attribs || [];
    }

    function _resolveAttributes() {
        let theAttributes: IAttributeContainer<OTelAttributeValue> | null = attribContainer;
        if (!theAttributes) {
            let hasOutstandingAsync = false;
            if (waitingPromiseCnt > 0 || awaitingPromise) {
                handleError(resourceCtx.cfg.errorHandlers, "Accessing resources before asynchronous attributes have resolved");
                hasOutstandingAsync = true;
            }

            theAttributes = createAttributeContainer(resourceCtx.cfg);
            if (rawResources && rawResources.length > 0) {
                arrForEach(rawResources, (rawValue: ResourceKeyValue) => {
                    if (rawValue) {
                        let key = rawValue[0];
                        let value = rawValue[1];
                        if (value !== UNDEFINED_VALUE) {
                            if (isPromiseLike(value)) {
                                handleDebug(resourceCtx.cfg.errorHandlers, "Resource " + key + " is still pending -- skipped");
                            } else {
                                theAttributes.set(key, value);
                            }
                        }
                    }
                });
            }

            if (!hasOutstandingAsync) {
                attribContainer = theAttributes;
                rawResources = null;
            }
        }

        return theAttributes;
    }

    function _getAttributes(): IOTelAttributes {
        return _resolveAttributes().attributes;
    }

    let resource: IOTelResource = {
        asyncAttributesPending: false,
        attributes: null,
        waitForAsyncAttributes: _waitForAsyncAttributes,
        merge: _merge,
        getRawAttributes: _getRawAttributes
    };

    objDefineProps(resource, {
        asyncAttributesPending: {
            g: () => {
                return waitingPromiseCnt > 0 || awaitingPromise;
            }
        },
        attributes: {
            g: _getAttributes
        }
    });
    
    return resource;
}
