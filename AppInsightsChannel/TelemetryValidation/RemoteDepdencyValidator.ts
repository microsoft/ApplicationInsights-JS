import { ITelemetryItem } from '../../coreSDK/JavaScriptSDK.Interfaces/ITelemetryItem';
import { ITypeValidator } from './ITypeValidator';

export class RemoteDepdencyValidator implements ITypeValidator {
    static RemoteDepdencyValidator = new RemoteDepdencyValidator();

    Validate(event: ITelemetryItem): boolean {
        return false;
    }
}