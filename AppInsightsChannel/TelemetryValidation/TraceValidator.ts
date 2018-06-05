import { ITypeValidator } from './ITypeValidator';
import { ITelemetryItem } from 'applicationinsights-core-js';

export class TraceValidator implements ITypeValidator {
    static TraceValidator = new TraceValidator();

    public Validate(item: ITelemetryItem): boolean {
        // verify system properties has a ver field
        if (!item.sytemProperties || 
            !item.sytemProperties["ver"]) {
            return false;
        }
        
        if (!item.domainProperties || 
            !item.domainProperties["message"] || 
            !item.domainProperties["severityLevel"]) {
            return false;
        }

        return true;
    }
}