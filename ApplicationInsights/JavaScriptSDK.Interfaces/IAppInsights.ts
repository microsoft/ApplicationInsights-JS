import { IPageViewTelemetry } from './IPageViewTelemetry';
import { IExceptionTelemetry } from './IExceptionTelemetry';
import { IAutoExceptionTelemetry } from './IExceptionTelemetry'

export interface IAppInsights {
    trackPageView(pageView: IPageViewTelemetry, customProperties?: { [key: string]: any });
    trackException(exception: IExceptionTelemetry, customProperties?: {[key: string]: any}): void;
    _onerror(exception: IAutoExceptionTelemetry): void;
    startTrackEvent(name: string): void;
    stopTrackEvent(name: string, customProperties?: {[key: string]: any}): void;
}