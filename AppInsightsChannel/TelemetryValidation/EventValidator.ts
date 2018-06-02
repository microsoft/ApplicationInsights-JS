import { ITypeValidator } from './ITypeValidator';
import { ITelemetryItem } from '../../coreSDK/JavaScriptSDK.Interfaces/ITelemetryItem';

export class EventValidator implements ITypeValidator {
    static EventValidator = new EventValidator();

    public Validate(event: ITelemetryItem): boolean {
        return false;// todo barustum
    }
}