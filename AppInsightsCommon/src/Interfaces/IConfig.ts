// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IConfiguration, CoreUtils } from '@microsoft/applicationinsights-core-js';

export interface IConfig {    
    emitLineDelimitedJson?: boolean;
    accountId?: string;
    sessionRenewalMs?: number;
    sessionExpirationMs?: number;
    maxBatchSizeInBytes?: number;
    maxBatchInterval?: number;
    enableDebug?: boolean;
    disableExceptionTracking?: boolean;
    disableTelemetry?: boolean;
    consoleLoggingLevel?: number;
    telemetryLoggingLevel?: number;
    diagnosticLogInterval?: number;
    samplingPercentage?: number;
    autoTrackPageVisitTime?: boolean;
    disableAjaxTracking?: boolean;
    disableFetchTracking?: boolean;
    overridePageViewDuration?: boolean;
    maxAjaxCallsPerView?: number;
    disableDataLossAnalysis?: boolean;
    disableCorrelationHeaders?: boolean;
    correlationHeaderExcludedDomains?: string[];
    disableFlushOnBeforeUnload?: boolean;
    enableSessionStorageBuffer?: boolean;
    isCookieUseDisabled?: boolean;
    cookieDomain?: string;
    isRetryDisabled?: boolean;
    url?: string;
    isStorageUseDisabled?: boolean;
    isBeaconApiDisabled?: boolean;
    sdkExtension?: string;
    isBrowserLinkTrackingEnabled?: boolean;
    appId?: string;
    enableCorsCorrelation?: boolean;
    enableOldTags?: boolean;
    // Internal
    autoExceptionInstrumented?: boolean;
}

export class ConfigurationManager {
    public static getConfig(config: IConfiguration & IConfig, field: string, identifier?: string, defaultValue: number | string | boolean = false): number | string | boolean {
        let configValue;
        if (!identifier || !config.extensionConfig || !config.extensionConfig[identifier]) {
            configValue = config[field];
        } else {
            configValue = config.extensionConfig[identifier][field] || config[field];
        }

        return !CoreUtils.isNullOrUndefined(configValue) ? configValue : defaultValue;
    }
}
