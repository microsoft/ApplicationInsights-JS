import { ITelemetryItem } from '../../coreSDK/JavaScriptSDK.Interfaces/ITelemetryItem';
import { ITypeValidator } from './ITypeValidator';

export class PageViewValidator implements ITypeValidator {
    static PageViewValidator = new PageViewValidator();

    public Validate(item: ITelemetryItem): boolean {
        // verify system properties has a ver field
        if (!item.sytemProperties ||
            !item.sytemProperties["ver"]) {
            return false;
        }

        if (!item.domainProperties ||
            !item.domainProperties["id"] ||
            !item.domainProperties["name"] ||
            !item.domainProperties["duration"] ||
            !item.domainProperties["url"]) {
            return false;
        }

        return true;
    }
}