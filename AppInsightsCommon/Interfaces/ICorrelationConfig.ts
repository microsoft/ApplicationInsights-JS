export interface ICorrelationConfig {
    enableCorsCorrelation: boolean;
    correlationHeaderExcludedDomains:  string[];
    disableCorrelationHeaders: boolean;
    maxAjaxCallsPerView: number;
    disableAjaxTracking: boolean;
    appId?: string;
}