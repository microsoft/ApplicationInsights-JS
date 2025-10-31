// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// TODO: Import actual exporter config interfaces when available
export interface IOTelLogRecordExporter {
    /**
     * Configure exporter to be OTLP with HTTP transport.
     */
    // otlp_http?: OtlpHttpExporter;

    /**
     * Configure exporter to be OTLP with gRPC transport.
     */
    // otlp_grpc?: OtlpGrpcExporter;

    /**
     * Configure exporter to be OTLP with file transport.
     * This type is in development and subject to breaking changes in minor versions.
     */
    // 'otlp_file/development'?: OtlpFileExporter;

    /**
     * Configure exporter to be console.
     */
    console?: object;
}
