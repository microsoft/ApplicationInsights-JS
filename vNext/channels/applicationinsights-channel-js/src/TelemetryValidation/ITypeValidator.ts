import { ITelemetryItem } from '@microsoft/applicationinsights-core-js';

export interface ITypeValidator {
    Validate(item: ITelemetryItem): boolean;
}