import { ITypeValidator } from './ITypeValidator';
import { ITelemetryItem } from '@microsoft/applicationinsights-core-js';

export class PageViewPerformanceValidator implements ITypeValidator {
    static PageViewPerformanceValidator = new PageViewPerformanceValidator();

    public Validate(item: ITelemetryItem): boolean {
        /* TODO re-enable once design of iTelemetryItem is finalized. Task used to track this:
         https://mseng.visualstudio.com/AppInsights/_workitems/edit/1310871
        
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
        */
        return true;
    }
}