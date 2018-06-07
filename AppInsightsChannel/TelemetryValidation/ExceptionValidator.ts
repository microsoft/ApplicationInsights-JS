import { ITypeValidator } from './ITypeValidator';
import { ITelemetryItem } from 'applicationinsights-core-js';

export class ExceptionValidator implements ITypeValidator {
    static ExceptionValidator = new ExceptionValidator();

    Validate(item: ITelemetryItem): boolean {
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