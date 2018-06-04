import { ITypeValidator } from './ITypeValidator';
import { ITelemetryItem } from '../../coreSDK/JavaScriptSDK.Interfaces/ITelemetryItem';

export class EventValidator implements ITypeValidator {
    static EventValidator = new EventValidator();

    public Validate(item: ITelemetryItem): boolean {
        // verify system properties has a ver field
        if (!item.sytemProperties || !item.sytemProperties["ver"]) {
            return false;
        }
        
        if (!item.domainProperties || !item.domainProperties["name"]) {
            return false;
        }

        return true;
    }
}