import { ITelemetryItem } from '../../coreSDK/JavaScriptSDK.Interfaces/ITelemetryItem';
import { ITypeValidator } from './ITypeValidator';

export class PageViewPerformanceValidator implements ITypeValidator {
    static PageViewPerformanceValidator = new PageViewPerformanceValidator();

    Validate(event: ITelemetryItem): boolean {
        return false;
    }
}