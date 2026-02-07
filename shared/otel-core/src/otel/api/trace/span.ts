// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    ILazyValue, dumpObj, getDeferred, isNullOrUndefined, isString, objDefineProps, objFreeze, objIs, objKeys, perfNow
} from "@nevware21/ts-utils";
import { STR_EMPTY, UNDEFINED_VALUE } from "../../../constants/InternalConstants";
import { OTelSpanKind, eOTelSpanKind } from "../../../enums/otel/OTelSpanKind";
import { eOTelSpanStatusCode } from "../../../enums/otel/OTelSpanStatus";
import { OTelException } from "../../../interfaces/IException";
import { IOTelHrTime, OTelTimeInput } from "../../../interfaces/IOTelHrTime";
import { IOTelAttributes } from "../../../interfaces/otel/IOTelAttributes";
import { IAttributeContainer } from "../../../interfaces/otel/attribute/IAttributeContainer";
import { IOTelLink } from "../../../interfaces/otel/trace/IOTelLink";
import { IOTelSpanCtx } from "../../../interfaces/otel/trace/IOTelSpanCtx";
import { IOTelSpanStatus } from "../../../interfaces/otel/trace/IOTelSpanStatus";
import { IOTelTimedEvent } from "../../../interfaces/otel/trace/IOTelTimedEvent";
import { IReadableSpan } from "../../../interfaces/otel/trace/IReadableSpan";
import { isAttributeValue, sanitizeAttributes } from "../../../internal/attributeHelpers";
import { handleAttribError, handleNotImplemented, handleSpanError, handleWarn } from "../../../internal/handleErrors";
import {
    hrTime, hrTimeDuration, hrTimeToMilliseconds, isTimeInput, millisToHrTime, timeInputToHrTime, zeroHrTime
} from "../../../internal/timeHelpers";
import { setProtoTypeName, updateProtoTypeName } from "../../../utils/HelperFuncs";
import { addAttributes, createAttributeContainer } from "../../attribute/attributeContainer";

export function createSpan(spanCtx: IOTelSpanCtx, orgName: string, kind: OTelSpanKind): IReadableSpan {
    let otelCfg = spanCtx.api.cfg;
    let perfStartTime: number = perfNow();
    let spanContext = spanCtx.spanContext;
    let attributes: ILazyValue<IAttributeContainer>;
    let isEnded = false;
    let errorHandlers = otelCfg.errorHandlers || {};
    let spanStartTime: ILazyValue<IOTelHrTime> = getDeferred(() => {
        if (isNullOrUndefined(spanCtx.startTime)) {
            return hrTime(perfStartTime);
        }

        return timeInputToHrTime(spanCtx.startTime);
    });
    let spanEndTime: IOTelHrTime | undefined;
    let spanDuration: IOTelHrTime;
    let spanStatus: IOTelSpanStatus | undefined;
    let links: IOTelLink[] = [];
    let events: IOTelTimedEvent[] = [];
    let localDroppedAttributes = 0;
    let localContainer: IAttributeContainer = null;
    let localDroppedEvents = 0;
    let localDroppedLinks = 0;
    let isRecording = spanCtx.isRecording !== false;

    if (otelCfg.traceCfg && otelCfg.traceCfg.suppressTracing) {
        // Automatically disable the span from recording
        isRecording = false;
    }

    let spanName = orgName || STR_EMPTY;
    if (isRecording) {
        attributes = getDeferred(() => createAttributeContainer(otelCfg, spanName, spanCtx.attributes));
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
  
    const zeroDuration = hrTime(0);
    let theSpan: IReadableSpan = {
        spanContext: () => spanContext,
        setAttribute: (key: string, value: any) => {
            let message: string;

            if (value !== null && !_handleIsEnded("setAttribute") && isRecording) {
                if (!key || key.length === 0) {
                    message = "Invalid attribute key: " + dumpObj(key);
                } else if (!isAttributeValue(value)) {
                    message = "Invalid attribute value: " + dumpObj(value);
                }

                if (message) {
                    handleAttribError(errorHandlers, message, key, value);
                    localDroppedAttributes++;
                } else if (attributes){
                    attributes.v.set(key, value);
                } else {
                    localDroppedAttributes++;
                }
            } else {
                localDroppedAttributes++;
            }

            return theSpan;
        },
        setAttributes: (attrs: IOTelAttributes) => {
            if (!_handleIsEnded("setAttributes") && isRecording && attributes) {
                addAttributes(attributes.v, attrs);
            } else {
                localDroppedAttributes += (objKeys(attrs).length || 0);
            }

            return theSpan;
        },
        addEvent: (name: string, attributesOrStartTime?: IOTelAttributes | OTelTimeInput, startTime?: OTelTimeInput) => {
            if(!_handleIsEnded("addEvent") && isRecording) {
                let maxEvents = spanCtx.api.cfg.traceCfg?.spanLimits?.eventCountLimit;
                if (maxEvents > 0) {
                    if (maxEvents > 0 && events.length >= maxEvents) {
                        let droppedEvent = events.shift();
                        handleWarn(errorHandlers, "maxEvents reached (" + maxEvents + ") - dropping event: " + droppedEvent.name);
                        localDroppedEvents++;
                    }

                    if (isTimeInput(attributesOrStartTime)) {
                        if (!isTimeInput(startTime)) {
                            startTime = attributesOrStartTime;
                        }

                        attributesOrStartTime = undefined;
                    }

                    events.push({
                        name: name,
                        attributes: sanitizeAttributes(spanCtx.api, attributesOrStartTime as IOTelAttributes),
                        time: startTime ? timeInputToHrTime(startTime) : undefined,
                        droppedAttributesCount: 0
                    })
                } else {
                    localDroppedEvents++;
                    handleWarn(errorHandlers, "Span.addEvent: " + name + " not added - No events allowed");
                }

                handleNotImplemented(errorHandlers, "Span.addEvent: " + name + " not added");
            } else {
                localDroppedEvents++;
            }

            return theSpan;
        },
        addLink: (link: IOTelLink) => {
            if(!_handleIsEnded("addEvent") && isRecording) {
                handleNotImplemented(errorHandlers, "Span.addLink: " + link + " not added");
            } else {
                localDroppedLinks++;
                handleWarn(errorHandlers, "Span.addLink: " + link + " not added - No links allowed");
            }

            return theSpan;
        },
        addLinks: (links: IOTelLink[]) => {
            if (!_handleIsEnded("addLinks") && isRecording) {
                handleNotImplemented(errorHandlers, "Span.addLinks: " + links + " not added");
            } else {
                localDroppedLinks += links.length;
                handleWarn(errorHandlers, "Span.addLinks: " + links + " not added - No links allowed");
            }

            return theSpan;
        },
        setStatus: (newStatus: IOTelSpanStatus) => {
            if (!_handleIsEnded("setStatus")) {
                spanStatus = newStatus;
                if (!isNullOrUndefined(spanStatus) && !isNullOrUndefined(spanStatus.message) && !isString(spanStatus.message)) {
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

                    if (localDroppedEvents > 0) {
                        handleWarn(errorHandlers, "Droped " + localDroppedEvents + " events");
                    }
                
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
                if (spanCtx.onException) {
                    spanCtx.onException(theSpan, exception, time);
                } else {
                    handleNotImplemented(errorHandlers, "Span.recordException: " + dumpObj(exception) + " not handled");
                }
            }
        },
        name: spanName,
        kind: kind,
        startTime: zeroDuration,
        endTime: zeroDuration,
        status: UNDEFINED_VALUE,
        attributes: UNDEFINED_VALUE,
        attribContainer: UNDEFINED_VALUE,
        links: links,
        events: events,
        duration:  zeroDuration,
        ended: false,
        resource: null,
        instrumentationScope: null,
        droppedAttributesCount: 0,
        droppedEventsCount: 0,
        droppedLinksCount: 0,
        parentSpanId: UNDEFINED_VALUE,
        parentSpanContext: UNDEFINED_VALUE
    };
    
    theSpan = setProtoTypeName(theSpan, _toString()) as IReadableSpan;

    // Make the relevant properties dynamic (and read-only)
    objDefineProps(theSpan, {
        name: {
            g: () => spanName
        },
        kind: {
            v: kind || eOTelSpanKind.INTERNAL
        },
        traceContext: {
            g: () => spanContext
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
        attribContainer: {
            g: () => {
                if (!attributes && !localContainer) {
                    // Create an empty container and cache it for future use (for performance only)
                    localContainer = createAttributeContainer(otelCfg, spanName);
                }

                return attributes ? attributes.v : localContainer;
            }
        },
        links: {
            g: () => {
                return links;
            }
        },
        events: {
            g: () => {
                return events;
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
        droppedEventsCount: {
            g: () => {
                return localDroppedEvents;
            }
        },
        droppedLinksCount: {
            g: () => {
                return localDroppedLinks;
            }
        },
        parentSpanContext: {
            l: getDeferred(() => {
                return spanCtx ? spanCtx.parentSpanContext : UNDEFINED_VALUE;
            })
        },
        parentSpanId: {
            l: getDeferred(() => {
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
