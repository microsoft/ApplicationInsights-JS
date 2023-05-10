// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ICookieMgr, ITelemetryItem } from "@microsoft/applicationinsights-core-js";
import { IEventTelemetry } from "./IEventTelemetry";
import { IAutoExceptionTelemetry, IExceptionTelemetry } from "./IExceptionTelemetry";
import { IMetricTelemetry } from "./IMetricTelemetry";
import { IPageViewPerformanceTelemetry } from "./IPageViewPerformanceTelemetry";
import { IPageViewTelemetry } from "./IPageViewTelemetry";
import { ITraceTelemetry } from "./ITraceTelemetry";

export interface IAppInsights {

    /**
     * Get the current cookie manager for this instance
     */
    getCookieMgr(): ICookieMgr;

    trackEvent(event: IEventTelemetry, customProperties?: {[key: string]: any}): void;
    trackPageView(pageView: IPageViewTelemetry, customProperties?: { [key: string]: any }): void;
    trackException(exception: IExceptionTelemetry, customProperties?: {[key: string]: any}): void;
    _onerror(exception: IAutoExceptionTelemetry): void;
    trackTrace(trace: ITraceTelemetry, customProperties?: {[key: string]: any}): void;
    trackMetric(metric: IMetricTelemetry, customProperties?: {[key: string]: any}): void;
    startTrackPage(name?: string): void;
    stopTrackPage(name?: string, url?: string, customProperties?: Object): void;
    startTrackEvent(name: string): void;
    stopTrackEvent(name: string, properties?: Object, measurements?: Object): void;
    addTelemetryInitializer(telemetryInitializer: (item: ITelemetryItem) => boolean | void): void;
    trackPageViewPerformance(pageViewPerformance: IPageViewPerformanceTelemetry, customProperties?: { [key: string]: any }): void;
}
