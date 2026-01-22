// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { OTelSeverityNumber } from "../../../enums/OTel/logs/eOTelSeverityNumber";
import { OTelAnyValue } from "../../../types/OTel/OTelAnyValue";
import { LogAttributes, LogBody } from "./IOTelLogRecord";
import { ReadableLogRecord } from "./IOTelReadableLogRecord";

export interface IOTelLogRecordInstance extends ReadableLogRecord {
    setAttribute(key: string, value?: OTelAnyValue): IOTelLogRecordInstance;
    setAttributes(attributes: LogAttributes): IOTelLogRecordInstance;
    setBody(body: LogBody): IOTelLogRecordInstance;
    setEventName(eventName: string): IOTelLogRecordInstance;
    setSeverityNumber(severityNumber: OTelSeverityNumber): IOTelLogRecordInstance;
    setSeverityText(severityText: string): IOTelLogRecordInstance;
    _makeReadonly(): void;
}
