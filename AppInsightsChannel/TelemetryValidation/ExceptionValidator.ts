import { ITypeValidator } from './ITypeValidator';
import { ITelemetryItem } from '../../coreSDK/JavaScriptSDK.Interfaces/ITelemetryItem';

export class ExceptionValidator implements ITypeValidator {
    static ExceptionValidator = new ExceptionValidator();

    Validate(event: ITelemetryItem): boolean {
        return false;
    }
}