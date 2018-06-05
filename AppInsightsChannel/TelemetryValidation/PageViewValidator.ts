import { ITelemetryItem } from '../../coreSDK/JavaScriptSDK.Interfaces/ITelemetryItem';
import { ITypeValidator } from './ITypeValidator';

export class PageViewValidator implements ITypeValidator {
    static PageViewValidator = new PageViewValidator();

    Validate(event: ITelemetryItem): boolean {
        return false;
    }
}