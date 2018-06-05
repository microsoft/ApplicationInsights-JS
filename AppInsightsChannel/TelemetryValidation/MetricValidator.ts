import { ITelemetryItem } from '../../coreSDK/JavaScriptSDK.Interfaces/ITelemetryItem';
import { ITypeValidator } from './ITypeValidator';

export class MetricValidator implements ITypeValidator {
    static MetricValidator = new MetricValidator();

    Validate(event: ITelemetryItem): boolean {
        return false;
    }
}