import { ITypeValidator } from './ITypeValidator';
import { ITelemetryItem } from '@microsoft/applicationinsights-core-js';

export class ExceptionValidator implements ITypeValidator {
    static ExceptionValidator = new ExceptionValidator();

    Validate(item: ITelemetryItem): boolean {
        /* TODO re-enable once design of iTelemetryItem is finalized. Task used to track this:
         https://mseng.visualstudio.com/AppInsights/_workitems/edit/1310871

        // verify system properties has a ver field
        if (!item.sytemProperties ||
            !item.sytemProperties["ver"]) {
            return false;
        }

        if (!item.domainProperties ||
            !item.domainProperties["exceptions"] ||
            !ExceptionValidator._validateExceptions(item.domainProperties["exceptions"])) {
            return false;
        }
        */
        return true;
    }

    // TODO implement validation of exceptions
    private static _validateExceptions(exceptions: any[]): boolean {
        // typeName
        // message
        // parsedStack
        // stack
        // hasFullStack
        return true;
    }
}