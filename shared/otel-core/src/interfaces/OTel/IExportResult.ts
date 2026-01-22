// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * The result of an export operation.
 */
export interface ExportResult {
  code: ExportResultCode;
  error?: Error;
}

/**
 * The code of the export result.
 */
export enum ExportResultCode {
  SUCCESS,
  FAILED,
}
