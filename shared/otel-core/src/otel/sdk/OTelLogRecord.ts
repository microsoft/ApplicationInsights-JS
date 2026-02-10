// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { objForEachKey, objKeys, utcNow } from "@nevware21/ts-utils";
import { OTelSeverityNumber } from "../../enums/otel/eOTelSeverityNumber";
import { IOTelHrTime } from "../../interfaces/IOTelHrTime";
import { IDistributedTraceContext } from "../../interfaces/ai/IDistributedTraceContext";
import { OTelAttributeValue } from "../../interfaces/otel/IOTelAttributes";
import { IOTelErrorHandlers } from "../../interfaces/otel/config/IOTelErrorHandlers";
import { IOTelLogRecord, LogAttributes, LogBody } from "../../interfaces/otel/logs/IOTelLogRecord";
import { IOTelLogRecordInstance } from "../../interfaces/otel/logs/IOTelLogRecordInstance";
import { IOTelLogRecordLimits } from "../../interfaces/otel/logs/IOTelLogRecordLimits";
import { IOTelLoggerProviderSharedState } from "../../interfaces/otel/logs/IOTelLoggerProviderSharedState";
import { IOTelResource } from "../../interfaces/otel/resources/IOTelResource";
import { IOTelInstrumentationScope } from "../../interfaces/otel/trace/IOTelInstrumentationScope";
import { isAttributeValue } from "../../internal/attributeHelpers";
import { handleWarn } from "../../internal/handleErrors";
import { timeInputToHrTime } from "../../internal/timeHelpers";
import { OTelAnyValue } from "../../types/OTelAnyValue";
import { getContextActiveSpanContext, isSpanContextValid } from "../api/trace/utils";

export function createLogRecord(
    sharedState: IOTelLoggerProviderSharedState,
    instrumentationScope: IOTelInstrumentationScope,
    logRecord: IOTelLogRecord
): IOTelLogRecordInstance {
    const {
        timestamp,
        observedTimestamp,
        eventName,
        severityNumber,
        severityText,
        body,
        attributes,
        context
    } = logRecord;

    const logAttributes = attributes || {};
    const now = utcNow();
    const hrTime = timeInputToHrTime(timestamp || now);
    const hrTimeObserved = timeInputToHrTime(observedTimestamp || now);
    const resource = sharedState.resource;
    const logRecordLimits: Required<IOTelLogRecordLimits> = sharedState.logRecordLimits;
    const handlers: IOTelErrorHandlers = {};

    let spanContext: IDistributedTraceContext | undefined;
    if (context) {
        const activeSpanContext = getContextActiveSpanContext(context);
        if (activeSpanContext && isSpanContextValid(activeSpanContext)) {
            spanContext = activeSpanContext;
        }
    }

    const recordAttributes: LogAttributes = {};
    let storedSeverityText: string | undefined = severityText;
    let storedSeverityNumber: OTelSeverityNumber | undefined = severityNumber;
    let storedBody: LogBody | undefined = body;
    let storedEventName: string | undefined = eventName;
    let totalAttributesCount = 0;
    let isReadonly = false;

    let logRecordInstance: IOTelLogRecordInstance;

    function getDroppedAttributesCount(): number {
        return totalAttributesCount - objKeys(recordAttributes).length;
    }

    function truncateToLimit(value: string, limit: number): string {
        if (value.length <= limit) {
            return value;
        }
        return value.substring(0, limit);
    }

    function truncateToSize(value: OTelAttributeValue): OTelAttributeValue {
        const limit = logRecordLimits.attributeValueLengthLimit;
        if (limit <= 0) {
            handleWarn(handlers, "Attribute value limit must be positive, got " + limit);
            return value;
        }

        if (typeof value === "string") {
            return truncateToLimit(value, limit);
        }

        if (Array.isArray(value)) {
            return (value as []).map(function (val) {
                return typeof val === "string" ? truncateToLimit(val, limit) : val;
            });
        }

        return value;
    }

    function isLogRecordReadonly(): boolean {
        if (isReadonly) {
            handleWarn(handlers, "Can not execute the operation on emitted log record");
        }
        return isReadonly;
    }

    function setAttributeInternal(key: string, value?: OTelAnyValue): IOTelLogRecordInstance {
        if (isLogRecordReadonly()) {
            return logRecordInstance;
        }
        if (value === null) {
            return logRecordInstance;
        }
        if (key.length === 0) {
            handleWarn(handlers, "Invalid attribute key: " + key);
            return logRecordInstance;
        }
        if (
            !isAttributeValue(value) &&
            !(
                typeof value === "object" &&
                !Array.isArray(value) &&
                objKeys(value).length > 0
            )
        ) {
            handleWarn(handlers, "Invalid attribute value set for key: " + key);
            return logRecordInstance;
        }

        totalAttributesCount += 1;
        if (
            objKeys(recordAttributes).length >= logRecordLimits.attributeCountLimit &&
            !Object.prototype.hasOwnProperty.call(recordAttributes, key)
        ) {
            if (getDroppedAttributesCount() === 1) {
                handleWarn(handlers, "Dropping extra attributes.");
            }
            return logRecordInstance;
        }

        if (isAttributeValue(value)) {
            recordAttributes[key] = truncateToSize(value);
        } else {
            recordAttributes[key] = value;
        }

        return logRecordInstance;
    }

    function setAttributesInternal(attributesToSet: LogAttributes): IOTelLogRecordInstance {
        objForEachKey(attributesToSet, function (attributeKey, attributeValue) {
            setAttributeInternal(attributeKey, attributeValue);
        });
        return logRecordInstance;
    }

    function setBodyInternal(value: LogBody): IOTelLogRecordInstance {
        if (isLogRecordReadonly()) {
            return logRecordInstance;
        }
        storedBody = value;
        return logRecordInstance;
    }

    function setEventNameInternal(value: string): IOTelLogRecordInstance {
        if (isLogRecordReadonly()) {
            return logRecordInstance;
        }
        storedEventName = value;
        return logRecordInstance;
    }

    function setSeverityNumberInternal(value: OTelSeverityNumber): IOTelLogRecordInstance {
        if (isLogRecordReadonly()) {
            return logRecordInstance;
        }
        storedSeverityNumber = value;
        return logRecordInstance;
    }

    function setSeverityTextInternal(value: string): IOTelLogRecordInstance {
        if (isLogRecordReadonly()) {
            return logRecordInstance;
        }
        storedSeverityText = value;
        return logRecordInstance;
    }

    function makeReadonly(): void {
        isReadonly = true;
    }

    logRecordInstance = {
        get hrTime(): IOTelHrTime {
            return hrTime;
        },
        get hrTimeObserved(): IOTelHrTime {
            return hrTimeObserved;
        },
        get spanContext(): IDistributedTraceContext | undefined {
            return spanContext;
        },
        get resource(): IOTelResource {
            return resource;
        },
        get instrumentationScope(): IOTelInstrumentationScope {
            return instrumentationScope;
        },
        get attributes(): LogAttributes {
            return recordAttributes;
        },
        get severityText(): string | undefined {
            return storedSeverityText;
        },
        set severityText(value: string | undefined) {
            if (value === undefined) {
                if (!isLogRecordReadonly()) {
                    storedSeverityText = undefined;
                }
            } else {
                setSeverityTextInternal(value);
            }
        },
        get severityNumber(): OTelSeverityNumber | undefined {
            return storedSeverityNumber;
        },
        set severityNumber(value: OTelSeverityNumber | undefined) {
            if (value === undefined) {
                if (!isLogRecordReadonly()) {
                    storedSeverityNumber = undefined;
                }
            } else {
                setSeverityNumberInternal(value);
            }
        },
        get body(): LogBody | undefined {
            return storedBody;
        },
        set body(value: LogBody | undefined) {
            if (value === undefined) {
                if (!isLogRecordReadonly()) {
                    storedBody = undefined;
                }
            } else {
                setBodyInternal(value);
            }
        },
        get eventName(): string | undefined {
            return storedEventName;
        },
        set eventName(value: string | undefined) {
            if (value === undefined) {
                if (!isLogRecordReadonly()) {
                    storedEventName = undefined;
                }
            } else {
                setEventNameInternal(value);
            }
        },
        get droppedAttributesCount(): number {
            return getDroppedAttributesCount();
        },
        setAttribute: setAttributeInternal,
        setAttributes: setAttributesInternal,
        setBody: setBodyInternal,
        setEventName: setEventNameInternal,
        setSeverityNumber: setSeverityNumberInternal,
        setSeverityText: setSeverityTextInternal,
        _makeReadonly: makeReadonly
    };

    setAttributesInternal(logAttributes);

    return logRecordInstance;
}
