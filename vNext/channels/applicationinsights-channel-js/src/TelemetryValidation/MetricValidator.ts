import { ITypeValidator } from './ITypeValidator';
import { ITelemetryItem } from '@microsoft/applicationinsights-core-js';

export class MetricValidator implements ITypeValidator {
    static MetricValidator = new MetricValidator();

    Validate(event: ITelemetryItem): boolean {
        return true;
    }
}