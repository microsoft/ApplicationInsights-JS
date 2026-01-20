// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createEnumStyle } from "@microsoft/applicationinsights-common";

/**
 * Numerical values of severity levels.
 */
export const enum eOTelSeverityNumber {
  UNSPECIFIED = 0,
  TRACE = 1,
  TRACE2 = 2,
  TRACE3 = 3,
  TRACE4 = 4,
  DEBUG = 5,
  DEBUG2 = 6,
  DEBUG3 = 7,
  DEBUG4 = 8,
  INFO = 9,
  INFO2 = 10,
  INFO3 = 11,
  INFO4 = 12,
  WARN = 13,
  WARN2 = 14,
  WARN3 = 15,
  WARN4 = 16,
  ERROR = 17,
  ERROR2 = 18,
  ERROR3 = 19,
  ERROR4 = 20,
  FATAL = 21,
  FATAL2 = 22,
  FATAL3 = 23,
  FATAL4 = 24,
}

/**
 * Runtime enum style object for severity levels.
 */
export const OTelSeverityNumber = createEnumStyle({
    UNSPECIFIED: eOTelSeverityNumber.UNSPECIFIED,
    TRACE: eOTelSeverityNumber.TRACE,
    TRACE2: eOTelSeverityNumber.TRACE2,
    TRACE3: eOTelSeverityNumber.TRACE3,
    TRACE4: eOTelSeverityNumber.TRACE4,
    DEBUG: eOTelSeverityNumber.DEBUG,
    DEBUG2: eOTelSeverityNumber.DEBUG2,
    DEBUG3: eOTelSeverityNumber.DEBUG3,
    DEBUG4: eOTelSeverityNumber.DEBUG4,
    INFO: eOTelSeverityNumber.INFO,
    INFO2: eOTelSeverityNumber.INFO2,
    INFO3: eOTelSeverityNumber.INFO3,
    INFO4: eOTelSeverityNumber.INFO4,
    WARN: eOTelSeverityNumber.WARN,
    WARN2: eOTelSeverityNumber.WARN2,
    WARN3: eOTelSeverityNumber.WARN3,
    WARN4: eOTelSeverityNumber.WARN4,
    ERROR: eOTelSeverityNumber.ERROR,
    ERROR2: eOTelSeverityNumber.ERROR2,
    ERROR3: eOTelSeverityNumber.ERROR3,
    ERROR4: eOTelSeverityNumber.ERROR4,
    FATAL: eOTelSeverityNumber.FATAL,
    FATAL2: eOTelSeverityNumber.FATAL2,
    FATAL3: eOTelSeverityNumber.FATAL3,
    FATAL4: eOTelSeverityNumber.FATAL4
});

export type OTelSeverityNumber = number | eOTelSeverityNumber;
