// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    ILazyValue, createDeferredCachedValue, dumpObj, isNullOrUndefined, isString, objDefineProps, objFreeze, objIs, objKeys, perfNow
} from "@nevware21/ts-utils";
import { setProtoTypeName, updateProtoTypeName } from "../../JavaScriptSDK/HelperFuncs";
import { STR_EMPTY, UNDEFINED_VALUE } from "../../JavaScriptSDK/InternalConstants";
import { IAttributeContainer } from "../attribute/IAttributeContainer";
import { addAttributes, createAttributeContainer } from "../attribute/attributeContainer";
import { eOTelSpanStatusCode } from "../enums/trace/OTelSpanStatus";
import { IOTelAttributes } from "../interfaces/IOTelAttributes";
import { OTelException } from "../interfaces/IOTelException";
import { IOTelHrTime, OTelTimeInput } from "../interfaces/IOTelHrTime";
import { IOTelSpanCtx } from "../interfaces/trace/IOTelSpanCtx";
import { OTelSpanKind, eOTelSpanKind } from "../interfaces/trace/IOTelSpanOptions";
import { IOTelSpanStatus } from "../interfaces/trace/IOTelSpanStatus";
import { IReadableSpan } from "../interfaces/trace/IReadableSpan";
import { isAttributeValue } from "../internal/attributeHelpers";
import { handleAttribError, handleNotImplemented, handleSpanError, handleWarn } from "../internal/commonUtils";
import { hrTime, hrTimeDuration, hrTimeToMilliseconds, millisToHrTime, timeInputToHrTime, zeroHrTime } from "../internal/timeHelpers";

export function createSpan(spanCtx: IOTelSpanCtx, orgName: string, kind: OTelSpanKind): IReadableSpan {
    let otelCfg = spanCtx.api.cfg;
    let perfStartTime: number = perfNow();
    let spanContext = spanCtx.spanContext;
    let attributes: ILazyValue<IAttributeContainer>;
    let isEnded = false;
    let errorHandlers = otelCfg.errorHandlers || {};
    let spanStartTime: ILazyValue<IOTelHrTime> = createDeferredCachedValue(() => {
        if (isNullOrUndefined(spanCtx.startTime)) {
            return hrTime(perfStartTime);
        }

        return timeInputToHrTime(spanCtx.startTime);
    });
    let spanEndTime: IOTelHrTime | undefined;
    let spanDuration: IOTelHrTime;
    let spanStatus: IOTelSpanStatus | undefined;
    // let links: IOTelLink[] = [];
    // let events: IOTelTimedEvent[] = [];
    let localDroppedAttributes = 0;
    // let droppedEvents = 0;
    // let droppedLinks = 0;
    let isRecording = spanCtx.isRecording !== false;
    if (otelCfg.traceCfg && otelCfg.traceCfg.suppressTracing) {
        // Automatically disable the span from recording
        isRecording = false;
    }

    let spanName = orgName || STR_EMPTY;
    if (isRecording) {
        attributes = createDeferredCachedValue(() => createAttributeContainer(otelCfg, spanName, spanCtx.attributes));
    }

    function _handleIsEnded(operation: string, extraMsg?: string): boolean {
        if (isEnded) {
            handleSpanError(errorHandlers, "Span {traceID: " + spanContext.traceId + ", spanId: " + spanContext.spanId + "} has ended - operation [" + operation + "] unsuccessful" + (extraMsg ? (" - " + extraMsg) : STR_EMPTY) + ".", spanName);
        }
    
        return isEnded;
    }
    function _toString() {
        return "ReadableSpan (\"" + spanName + "\")"
    }
  
    let theSpan: IReadableSpan = setProtoTypeName({
        spanContext: () => spanContext,
        setAttribute: (key: string, value: any) => {
            let message: string;

            if (value !== null && !_handleIsEnded("setAttribute")) {
                if (!key || key.length === 0) {
                    message = "Invalid attribute key: " + dumpObj(key);
                } else if (!isAttributeValue(value)) {
                    message = "Invalid attribute value: " + dumpObj(value);
                }

                if (message) {
                    handleAttribError(errorHandlers, message, key, value);
                    localDroppedAttributes++;
                } else if (isRecording){
                    attributes.v.set(key, value);
                } else {
                    localDroppedAttributes++;
                }
            }

            return theSpan;
        },
        setAttributes: (attrs: IOTelAttributes) => {
            if (!_handleIsEnded("setAttributes") && isRecording) {
                addAttributes(attributes.v, attrs);
            } else {
                localDroppedAttributes += (objKeys(attrs).length || 0);
            }

            return theSpan;
        },
        // addEvent: (name: string, attributesOrStartTime?: IOTelAttributes | OTelTimeInput, startTime?: OTelTimeInput) => {
        //     droppedEvents++;
        //     if(!_handleIsEnded("addEvent") && isRecording) {
        //         handleWarn(errorHandlers, "Span.addEvent: " + name + " not added - No events allowed");
        //     }

        //     return theSpan;
        // },
        // addLink: (link: any) => {
        //     droppedLinks++;
        //     if(!_handleIsEnded("addEvent") && isRecording) {
        //         handleWarn(errorHandlers, "Span.addLink: " + link + " not added - No links allowed");
        //     }

        //     return theSpan;
        // },
        // addLinks: (links: any[]) => {
        //     droppedLinks += links.length;
        //     if (!_handleIsEnded("addLinks") && isRecording) {
        //         handleWarn(errorHandlers, "Span.addLinks: " + links + " not added - No links allowed");
        //     }

        //     return theSpan;
        // },
        setStatus: (newStatus: IOTelSpanStatus) => {
            if (!_handleIsEnded("setStatus")) {
                spanStatus = newStatus;
                if (!isNullOrUndefined(spanStatus.message) && !isString(spanStatus.message)) {
                    spanStatus.message = dumpObj(spanStatus.message);
                }
            }

            return theSpan;
        },
        updateName: (name: string) => {
            if (!_handleIsEnded("updateName") && !objIs(spanName, name)) {
                spanName = name;
                updateProtoTypeName(theSpan, _toString());
            }

            return theSpan;
        },
        end: (endTime?: OTelTimeInput) => {
            let calcDuration: number;
            if (!_handleIsEnded("end", "You can only call end once")) {
                try {
                    if (!isNullOrUndefined(endTime)) {
                        // User provided an end time
                        spanEndTime = timeInputToHrTime(endTime);
                        spanDuration = hrTimeDuration(spanStartTime.v, spanEndTime);
                        calcDuration = hrTimeToMilliseconds(spanDuration);
                    } else {
                        let perfEndTime = perfNow();
                        calcDuration = perfEndTime - perfStartTime;
                        spanDuration = millisToHrTime(calcDuration);
                        spanEndTime = hrTime(perfEndTime);
                    }

                    if (calcDuration < 0) {
                        handleWarn(errorHandlers, "Span.end: duration is negative - startTime > endTime. Setting duration to 0 ms");
                        spanDuration = zeroHrTime();
                        spanEndTime = spanStartTime.v;
                    }

                    // if (droppedEvents > 0) {
                    //     handleWarn(errorHandlers, "Droped " + droppedEvents + " events");
                    // }
                    
                    // We don't mark as ended until after the onEnd callback to ensure that it can
                    // still read / change the span if required as well as ensuring that the returned
                    // value for isRecording is correct.
                    spanCtx.onEnd && spanCtx.onEnd(theSpan);
                } finally {
                    // Ensure we mark as ended even if the onEnd throws
                    isEnded = true;
                }
            }
        },
        isRecording: () => isRecording && !isEnded,
        recordException: (exception: OTelException, time?: OTelTimeInput) => {
            if (!_handleIsEnded("recordException")) {
                handleNotImplemented(errorHandlers, "Span.recordException: " + dumpObj(exception) + " not added");
            }
        }
    } as IReadableSpan, _toString());

    // Make the relevant properties dynamic (and read-only)
    objDefineProps(theSpan, {
        name: {
            g: () => spanName
        },
        kind: {
            v: kind || eOTelSpanKind.INTERNAL
        },
        startTime: {
            g: () => {
                return spanStartTime.v;
            }
        },
        endTime: {
            g: () => {
                return spanEndTime;
            }
        },
        status: {
            g: () => {
                return spanStatus || {
                    code: eOTelSpanStatusCode.UNSET
                };
            }
        },
        attributes: {
            g: () => {
                return attributes ? attributes.v.attributes : objFreeze({});
            }
        },
        links: {
            g: () => {
                return [];
            }
        },
        events: {
            g: () => {
                return [];
            }
        },
        duration: {
            g: () => {
                return spanDuration || zeroHrTime();
            }
        },
        ended: {
            g: () => {
                return isEnded;
            }
        },
        droppedAttributesCount: {
            g: () => {
                return attributes ? attributes.v.droppedAttributes : localDroppedAttributes;
            }
        },
        // droppedEventsCount: {
        //     g: () => {
        //         return droppedEvents;
        //     }
        // },
        // droppedLinksCount: {
        //     g: () => {
        //         return droppedLinks;
        //     }
        // },
        parentSpanContext: {
            l: createDeferredCachedValue(() => {
                return spanCtx ? spanCtx.parentSpanContext : UNDEFINED_VALUE;
            })
        },
        parentSpanId: {
            l: createDeferredCachedValue(() => {
                let parentSpanId = UNDEFINED_VALUE;
                if (spanCtx) {
                    let parentSpanCtx = spanCtx.parentSpanContext;
                    parentSpanId = parentSpanCtx ? parentSpanCtx.spanId : UNDEFINED_VALUE;
                }

                return parentSpanId;
            })
        }
    });
    
    return theSpan;
}
