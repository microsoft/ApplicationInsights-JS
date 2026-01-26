// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { OTelSeverityNumber } from "../../../enums/otel/eOTelSeverityNumber";
import { OTelAnyValue } from "../../../types/OTelAnyValue";
import { IOTelHrTime } from "../../../types/time";
import { IOTelResource } from "../resources/IOTelResource";
import { IOTelInstrumentationScope } from "../trace/IOTelInstrumentationScope";
import { IOTelSpanContext } from "../trace/IOTelSpanContext";
import { LogAttributes, LogBody } from "./IOTelLogRecord";

export interface IOTelSdkLogRecord {
    /**
     * The time when the log record occurred as high-resolution time.
     */
    readonly hrTime: IOTelHrTime;

    /**
     * Time when the event was observed by the collection system as high-resolution time.
     */
    readonly hrTimeObserved: IOTelHrTime;

    /**
     * The SpanContext associated with the LogRecord.
     */
    readonly spanContext?: IOTelSpanContext;

    /**
     * The Resource associated with the LogRecord.
     */
    readonly resource: IOTelResource;
    
    /**
     * The InstrumentationScope associated with the LogRecord.
     */
    readonly instrumentationScope: IOTelInstrumentationScope;

    /**
     * Attributes that define the log record.
     */
    readonly attributes: LogAttributes;

    /**
     * The severity text (log level).
     */
    severityText?: string;

    /**
     * Numerical value of the severity.
     */
    severityNumber?: OTelSeverityNumber;

    /**
     * A value containing the body of the log record.
     */
    body?: LogBody;

    /**
     * The unique identifier for the log record.
     */
    eventName?: string;

    /**
     * The number of attributes that were dropped.
     */
    droppedAttributesCount: number;

    /**
     * Sets a single attribute on the log record.
     * @param key The attribute key.
     * @param value The attribute value.
     * @returns The updated SdkLogRecord.
     */
    setAttribute(key: string, value?: OTelAnyValue): IOTelSdkLogRecord;

    /**
     * Sets multiple attributes on the log record.
     * @param attributes The attributes to set.
     * @returns The updated SdkLogRecord.
     */
    setAttributes(attributes: LogAttributes): IOTelSdkLogRecord;

    /**
     * Sets the body of the log record.
     * @param body The log body.
     * @returns The updated SdkLogRecord.
     */
    setBody(body: LogBody): IOTelSdkLogRecord;

    /**
     * Sets the event name for the log record.
     * @param eventName The event name.
     * @returns The updated SdkLogRecord.
     */
    setEventName(eventName: string): IOTelSdkLogRecord;

    /**
     * Sets the severity number for the log record.
     * @param severityNumber The severity number.
     * @returns The updated SdkLogRecord.
     */
    setSeverityNumber(severityNumber: OTelSeverityNumber): IOTelSdkLogRecord;

    /**
     * Sets the severity text (log level) for the log record.
     * @param severityText The severity text.
     * @returns The updated SdkLogRecord.
     */
    setSeverityText(severityText: string): IOTelSdkLogRecord;
}
