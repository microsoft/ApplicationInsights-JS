/**
 * Pageview telemetry interface
 */
export interface IPageViewTelemetry {
    name: string;
    url: string;
    id: string;
    referrerUri?: string;
    duration?: number;
    customDimensions?: { [key: string]: any };
}