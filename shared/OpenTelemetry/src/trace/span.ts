import {
    IOTelAttributes, IOTelHrTime, IOTelLink, IOTelSpanStatus, IOTelTimedEvent, IReadableSpan, OTelException, OTelSpanKind, OTelTimeInput,
    eOTelSpanKind, eOTelSpanStatusCode
} from "@microsoft/applicationinsights-core-js";
import {
    ILazyValue, createDeferredCachedValue, dumpObj, isNullOrUndefined, isString, objDefineProps, objFreeze, objKeys, perfNow
} from "@nevware21/ts-utils";
import { IAttributeContainer } from "../attribute/IAttributeContainer";
import { addAttributes, createAttributeContainer } from "../attribute/attributeContainer";
import { IOTelSpanCtx } from "../interfaces/trace/IOTelSpanCtx";
import { STR_EMPTY, UNDEFINED_VALUE } from "../internal/InternalConstants";
import { isAttributeValue, sanitizeAttributes } from "../internal/attributeHelpers";
import { handleAttribError, handleNotImplemented, handleSpanError, handleWarn } from "../internal/commonUtils";
import {
    hrTime, hrTimeDuration, hrTimeToMilliseconds, isTimeInput, millisToHrTime, timeInputToHrTime, zeroHrTime
} from "../internal/timeHelpers";

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
    let links: IOTelLink[] = [];
    let events: IOTelTimedEvent[] = [];
    let droppedAttributesCount = 0;
    let droppedEvents = 0;
    let droppedLinks = 0;
    let zeroDuration = zeroHrTime();
    let isRecording = spanCtx.isRecording !== false;
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
  
    let theSpan: IReadableSpan = {
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
                    droppedAttributesCount++;
                } else if (isRecording){
                    attributes.v.set(key, value);
                } else {
                    droppedAttributesCount++;
                }
            }

            return theSpan;
        },
        setAttributes: (attrs: IOTelAttributes) => {
            if (!_handleIsEnded("setAttributes") && isRecording) {
                addAttributes(attributes.v, attrs);
            } else {
                droppedAttributesCount += (objKeys(attrs).length || 0);
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
                        droppedEvents++;
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
                    droppedEvents++;
                    handleWarn(errorHandlers, "Span.addEvent: " + name + " not added - No events allowed");
                }

                handleNotImplemented(errorHandlers, "Span.addEvent: " + name + " not added");
            } else {
                droppedEvents++;
            }

            return theSpan;
        },
        addLink: (link: IOTelLink) => {
            if(!_handleIsEnded("addEvent") && isRecording) {
                handleNotImplemented(errorHandlers, "Span.addLink: " + link + " not added");
            } else {
                droppedLinks++;
                handleWarn(errorHandlers, "Span.addLink: " + link + " not added - No links allowed");
            }

            return theSpan;
        },
        addLinks: (links: IOTelLink[]) => {
            if (!_handleIsEnded("addLinks") && isRecording) {
                handleNotImplemented(errorHandlers, "Span.addLinks: " + links + " not added");
            } else {
                droppedLinks += links.length;
                handleWarn(errorHandlers, "Span.addLinks: " + links + " not added - No links allowed");
            }

            return theSpan;
        },
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
            if (!_handleIsEnded("updateName")) {
                spanName = name;
            }

            return theSpan;
        },
        end: (endTime?: OTelTimeInput) => {
            let calcDuration: number;
            if (!_handleIsEnded("end", "You can only call end once")) {
                isEnded = true;

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

                if (droppedEvents > 0) {
                    handleWarn(errorHandlers, "Droped " + droppedEvents + " events");
                }
                
                spanCtx.onEnd && spanCtx.onEnd(theSpan);
            }
        },
        isRecording: () => isRecording && !isEnded,
        recordException: (exception: OTelException, time?: OTelTimeInput) => {
            if (!_handleIsEnded("recordException")) {
                handleNotImplemented(errorHandlers, "Span.recordException: " + dumpObj(exception) + " not added");
            }
        },
        name: spanName,
        kind: kind,
        startTime: zeroDuration,
        endTime: zeroDuration,
        status: UNDEFINED_VALUE,
        attributes: UNDEFINED_VALUE,
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

    // Make the relevant proerties dynamic (and read-only)
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
                return links;
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
                return attributes ? attributes.v.droppedAttributes : droppedAttributesCount;
            }
        },
        droppedEventsCount: {
            g: () => {
                return droppedEvents;
            }
        },
        droppedLinksCount: {
            g: () => {
                return droppedLinks;
            }
        },
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
