// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { OTelAnyValue } from "../OTelTypes/OTelAnyValue";
import { getContextActiveSpanContext, isSpanContextValid } from "../api/trace/utils";
import { OTelSeverityNumber } from "../enums/logs/eOTelSeverityNumber";
import { OTelAttributeValue } from "../interfaces/IOTelAttributes";
import { IOTelLogRecord, LogAttributes, LogBody } from "../interfaces/logs/IOTelLogRecord";
import { IOTelLogRecordLimits } from "../interfaces/logs/IOTelLogRecordLimits";
import { ReadableLogRecord } from "../interfaces/logs/IOTelReadableLogRecord";
import { IOTelResource } from "../interfaces/resources/IOTelResource";
import { IOTelHrTime } from "../interfaces/time";
import { IOTelInstrumentationScope } from "../interfaces/trace/IOTelInstrumentationScope";
import { LoggerProviderSharedState } from "../internal/LoggerProviderSharedState";
import { isAttributeValue } from "../internal/attributeHelpers";
import { timeInputToHrTime } from "../internal/timeHelpers";
import { IOTelSpanContext } from "../otel-core-js";

export class IOTelLogRecordImpl implements ReadableLogRecord {
    readonly hrTime: IOTelHrTime;
    readonly hrTimeObserved: IOTelHrTime;
    readonly spanContext?: IOTelSpanContext;
    readonly resource: IOTelResource;
    readonly instrumentationScope: IOTelInstrumentationScope;
    readonly attributes: LogAttributes = {};
    private _severityText?: string;
    private _severityNumber?: OTelSeverityNumber;
    private _body?: LogBody;
    private _eventName?: string;
    private totalAttributesCount: number = 0;

    private _isReadonly: boolean = false;
    private readonly _logRecordLimits: Required<IOTelLogRecordLimits>;

    set severityText(severityText: string | undefined) {
        if (this._isLogRecordReadonly()) {
            return;
        }
        this._severityText = severityText;
    }
    get severityText(): string | undefined {
        return this._severityText;
    }

    set severityNumber(severityNumber: OTelSeverityNumber | undefined) {
        if (this._isLogRecordReadonly()) {
            return;
        }
        this._severityNumber = severityNumber;
    }
    get severityNumber(): OTelSeverityNumber | undefined {
        return this._severityNumber;
    }

    set body(body: LogBody | undefined) {
        if (this._isLogRecordReadonly()) {
            return;
        }
        this._body = body;
    }
    get body(): LogBody | undefined {
        return this._body;
    }

    get eventName(): string | undefined {
        return this._eventName;
    }
    set eventName(eventName: string | undefined) {
        if (this._isLogRecordReadonly()) {
            return;
        }
        this._eventName = eventName;
    }

    get droppedAttributesCount(): number {
        return this.totalAttributesCount - Object.keys(this.attributes).length;
    }

    constructor(
        _sharedState: LoggerProviderSharedState,
        instrumentationScope: IOTelInstrumentationScope,
        logRecord: IOTelLogRecord
    ) {
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

        const now = Date.now();
        this.hrTime = timeInputToHrTime(timestamp || now);
        this.hrTimeObserved = timeInputToHrTime(observedTimestamp || now);

        if (context) {
            const spanContext = getContextActiveSpanContext(context);
            if (spanContext && isSpanContextValid(spanContext)) {
                this.spanContext = spanContext;
            }
        }
        this.severityNumber = severityNumber;
        this.severityText = severityText;
        this.body = body;
        this.resource = _sharedState.resource;
        this.instrumentationScope = instrumentationScope;
        this._logRecordLimits = _sharedState.logRecordLimits;
        this._eventName = eventName;
        this.setAttributes(logAttributes);
    }

    public setAttribute(key: string, value?: OTelAnyValue) {
        if (this._isLogRecordReadonly()) {
            return this;
        }
        if (value === null) {
            return this;
        }
        if (key.length === 0) {
            console.warn(`Invalid attribute key: ${key}`);
            return this;
        }
        if (
            !isAttributeValue(value) &&
            !(
                typeof value === "object" &&
                !Array.isArray(value) &&
                Object.keys(value).length > 0
            )
        ) {
            console.warn(`Invalid attribute value set for key: ${key}`);
            return this;
        }
        this.totalAttributesCount += 1;
        if (
            Object.keys(this.attributes).length >=
                this._logRecordLimits.attributeCountLimit &&
            !Object.prototype.hasOwnProperty.call(this.attributes, key)
        ) {
            // This logic is to create drop message at most once per LogRecord to prevent excessive logging.
            if (this.droppedAttributesCount === 1) {
                console.warn("Dropping extra attributes.");
            }
            return this;
        }
        if (isAttributeValue(value)) {
            this.attributes[key] = this._truncateToSize(value);
        } else {
            this.attributes[key] = value;
        }
        return this;
    }

    public setAttributes(attributes: LogAttributes) {
        for (const [k, v] of Object.entries(attributes)) {
            this.setAttribute(k, v);
        }
        return this;
    }

    public setBody(body: LogBody) {
        this.body = body;
        return this;
    }

    public setEventName(eventName: string) {
        this.eventName = eventName;
        return this;
    }

    public setSeverityNumber(severityNumber: OTelSeverityNumber) {
        this.severityNumber = severityNumber;
        return this;
    }

    public setSeverityText(severityText: string) {
        this.severityText = severityText;
        return this;
    }

    /**
     * @internal
     * A LogRecordProcessor may freely modify logRecord for the duration of the OnEmit call.
     * If logRecord is needed after OnEmit returns (i.e. for asynchronous processing) only reads are permitted.
     */
    _makeReadonly() {
        this._isReadonly = true;
    }

    private _truncateToSize(value: OTelAttributeValue): OTelAttributeValue {
        const limit = this._logRecordLimits.attributeValueLengthLimit;
        // Check limit
        if (limit <= 0) {
        // Negative values are invalid, so do not truncate
            console.warn(`Attribute value limit must be positive, got ${limit}`);
            return value;
        }

        // String
        if (typeof value === "string") {
            return this._truncateToLimitUtil(value, limit);
        }

        // Array of strings
        if (Array.isArray(value)) {
            return (value as []).map(val =>
                typeof val === "string" ? this._truncateToLimitUtil(val, limit) : val
            );
        }

        // Other types, no need to apply value length limit
        return value;
    }

    private _truncateToLimitUtil(value: string, limit: number): string {
        if (value.length <= limit) {
            return value;
        }
        return value.substring(0, limit);
    }

    private _isLogRecordReadonly(): boolean {
        if (this._isReadonly) {
            console.warn("Can not execute the operation on emitted log record");
        }
        return this._isReadonly;
    }
}
