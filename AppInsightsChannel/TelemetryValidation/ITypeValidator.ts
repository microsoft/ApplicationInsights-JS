import { ITelemetryItem } from 'applicationinsights-core-js';

export interface ITypeValidator {
    Validate(item: ITelemetryItem): boolean;
}