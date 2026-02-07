// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { OTelSeverityNumber } from "../../../enums/otel/eOTelSeverityNumber";
import { OTelTimeInput } from "../../../interfaces/IOTelHrTime";
import { OTelAnyValue, OTelAnyValueMap } from "../../../types/OTelAnyValue";
import { IOTelContext } from "../context/IOTelContext";

export type LogBody = OTelAnyValue;
export type LogAttributes = OTelAnyValueMap;

export interface IOTelLogRecord {
  /**
   * The unique identifier for the log record.
   */
  eventName?: string;

  /**
   * The time when the log record occurred as UNIX Epoch time in nanoseconds.
   */
  timestamp?: OTelTimeInput;

  /**
   * Time when the event was observed by the collection system.
   */
  observedTimestamp?: OTelTimeInput;

  /**
   * Numerical value of the severity.
   */
  severityNumber?: OTelSeverityNumber;

  /**
   * The severity text.
   */
  severityText?: string;

  /**
   * A value containing the body of the log record.
   */
  body?: LogBody;

  /**
   * Attributes that define the log record.
   */
  attributes?: LogAttributes;

  /**
   * The Context associated with the LogRecord.
   */
  context?: IOTelContext;
}
