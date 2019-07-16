import { ITypeValidator } from './ITypeValidator';
import { IEnvelope } from '@microsoft/applicationinsights-common';
import { CommonValidator } from './CommonValidator';

export class ExceptionValidator implements ITypeValidator {
    static ExceptionValidator = new ExceptionValidator();

    Validate(item: IEnvelope, baseType: string): boolean {
        // verify item passes CommonValidator
        if (!CommonValidator.CommonValidator.Validate(item, baseType)) {
            return false;
        }

        // verify item has ver and exceptions fields
        if (!item.data.baseData || 
            !item.data.baseData.ver || 
            !item.data.baseData.exceptions) {
            return false;
        }

        if (!ExceptionValidator._validateExceptions(item.data.baseData.exceptions)) {
            return false;
        }

        return true;
    }

    private static _validateExceptions(exceptions: any[]): boolean {
        // verify exceptions has typeName, message, hasFullStack, stack, parsedStack fields
        if (!exceptions[0].typeName || 
            !exceptions[0].message || 
            !exceptions[0].hasFullStack || 
            !exceptions[0].stack || 
            !exceptions[0].parsedStack) {
            return false;
        }

        return true;
    }
}