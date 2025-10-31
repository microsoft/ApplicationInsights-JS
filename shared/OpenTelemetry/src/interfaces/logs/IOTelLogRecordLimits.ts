// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * LogRecord limits configuration.
 */
export interface IOTelLogRecordLimits {
  /** attributeValueLengthLimit is maximum allowed attribute value size */
  attributeValueLengthLimit?: number;

  /** attributeCountLimit is number of attributes per LogRecord */
  attributeCountLimit?: number;
}
