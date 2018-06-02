import { ITelemetryItem } from '../../coreSDK/JavaScriptSDK.Interfaces/ITelemetryItem';
import { ITypeValidator } from './ITypeValidator';

export class TraceValidator implements ITypeValidator {
    static TraceValidator = new TraceValidator();

    Validate(event: ITelemetryItem): boolean {
        return false;
    }
}