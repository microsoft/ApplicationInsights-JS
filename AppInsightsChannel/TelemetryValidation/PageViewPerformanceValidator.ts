import { ITelemetryItem } from '../../coreSDK/JavaScriptSDK.Interfaces/ITelemetryItem';
import { ITypeValidator } from './ITypeValidator';

export class PageViewPerformanceValidator implements ITypeValidator {
    static PageViewPerformanceValidator = new PageViewPerformanceValidator();

    public Validate(item: ITelemetryItem): boolean {
        // verify system properties has a ver field
        if (!item.sytemProperties ||
            !item.sytemProperties["ver"]) {
            return false;
        }

        if (!item.domainProperties ||
            !item.domainProperties["domProcessing"] ||
            !item.domainProperties["duration"] ||
            !item.domainProperties["name"] ||
            !item.domainProperties["networkConnect"] ||
            !item.domainProperties["perfTotal"] ||
            !item.domainProperties["receivedResponse"] ||
            !item.domainProperties["sentRequest"] ||
            !item.domainProperties["url"]) {
            return false;
        }

        return true;
    }
}