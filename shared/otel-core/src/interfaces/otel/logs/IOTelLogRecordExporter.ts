// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ExportResult } from "../../IExportResult";
import { ReadableLogRecord } from "./IOTelReadableLogRecord";

export interface IOTelLogRecordExporter {
  /**
   * Called to export {@link ReadableLogRecord}s.
   * @param logs the list of sampled LogRecords to be exported.
   */
  export(
    logs: ReadableLogRecord[],
    resultCallback: (result: ExportResult) => void
  ): void;

  /** Stops the exporter. */
  shutdown(): Promise<void>;
}
