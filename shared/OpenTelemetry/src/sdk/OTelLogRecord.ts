// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { isArray, isObject, isString } from "@nevware21/ts-utils";
import { OTelAnyValue } from "../OTelTypes/OTelAnyValue";
import { getContextActiveSpanContext, isSpanContextValid } from "../api/trace/utils";
import { createAttributeContainer, isAttributeContainer } from "../attribute/attributeContainer";
import { OTelSeverityNumber } from "../enums/logs/eOTelSeverityNumber";
import { OTelAttributeValue } from "../interfaces/IOTelAttributes";
import { IOTelLogRecord, LogAttributes, LogBody } from "../interfaces/logs/IOTelLogRecord";
import { IOTelLogRecordInstance } from "../interfaces/logs/IOTelLogRecordInstance";
import { IOTelLogRecordLimits } from "../interfaces/logs/IOTelLogRecordLimits";
import { IOTelLoggerProviderSharedState } from "../interfaces/logs/IOTelLoggerProviderSharedState";
import { IOTelResource } from "../interfaces/resources/IOTelResource";
import { IOTelHrTime } from "../interfaces/time";
import { IOTelInstrumentationScope } from "../interfaces/trace/IOTelInstrumentationScope";
import { isAttributeValue } from "../internal/attributeHelpers";
import { handleWarn } from "../internal/commonUtils";
import { timeInputToHrTime } from "../internal/timeHelpers";
import { IOTelErrorHandlers, IOTelSpanContext } from "../otel-core-js";

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

    const hasAttributeContainer = isAttributeContainer(attributes as any);
    const logAttributes = (!hasAttributeContainer && attributes) ? attributes : {};
    const now = Date.now();
    const hrTime = timeInputToHrTime(timestamp || now);
    const hrTimeObserved = timeInputToHrTime(observedTimestamp || now);
    const resource = sharedState.resource;
    const logRecordLimits: Required<IOTelLogRecordLimits> = sharedState.logRecordLimits;
    const handlers: IOTelErrorHandlers = {};
    const attributeContainer = createAttributeContainer<any>(
        {
            traceCfg: {
                generalLimits: {
                    attributeCountLimit: logRecordLimits.attributeCountLimit,
                    attributeValueLengthLimit: logRecordLimits.attributeValueLengthLimit
                }
            },
            errorHandlers: handlers
        },
        instrumentationScope.name,
        hasAttributeContainer ? (attributes as any) : undefined,
        logRecordLimits
    );

    let spanContext: IOTelSpanContext | undefined;
    if (context) {
        const activeSpanContext = getContextActiveSpanContext(context);
        if (activeSpanContext && isSpanContextValid(activeSpanContext)) {
            spanContext = activeSpanContext;
        }
    }

    let storedSeverityText: string | undefined = severityText;
    let storedSeverityNumber: OTelSeverityNumber | undefined = severityNumber;
    let storedBody: LogBody | undefined = body;
    let storedEventName: string | undefined = eventName;
    let isReadonly = false;

    let logRecordInstance: IOTelLogRecordInstance;

    function getDroppedAttributesCount(): number {
        return attributeContainer.droppedAttributes;
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

        if (isString(value)) {
            return truncateToLimit(value, limit);
        }

        if (isArray(value)) {
            return (value as []).map(function (val) {
                return isString(val) ? truncateToLimit(val, limit) : val;
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
                isObject(value) &&
                !isArray(value) &&
                Object.keys(value).length > 0
            )
        ) {
            handleWarn(handlers, "Invalid attribute value set for key: " + key);
            return logRecordInstance;
        }

        if (isAttributeValue(value)) {
            value = truncateToSize(value);
        }

        attributeContainer.set(key, value as any);

        return logRecordInstance;
    }

    function setAttributesInternal(attributesToSet: LogAttributes): IOTelLogRecordInstance {
        if (!attributesToSet) {
            return logRecordInstance;
        }
        const entries = Object.entries(attributesToSet);
        for (let idx = 0; idx < entries.length; idx++) {
            const attribute = entries[idx];
            const attributeKey = attribute[0];
            const attributeValue = attribute.length > 1 ? attribute[1] : undefined;
            setAttributeInternal(attributeKey, attributeValue);
        }
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
        get spanContext(): IOTelSpanContext | undefined {
            return spanContext;
        },
        get resource(): IOTelResource {
            return resource;
        },
        get instrumentationScope(): IOTelInstrumentationScope {
            return instrumentationScope;
        },
        get attributes(): LogAttributes {
            return attributeContainer.attributes as unknown as LogAttributes;
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

    if (!hasAttributeContainer) {
        setAttributesInternal(logAttributes);
    }

    return logRecordInstance;
}
