import { ITypeValidator } from "./ITypeValidator";
import { CommonValidator } from "./CommonValidator";

export class ExceptionValidator implements ITypeValidator {
    static ExceptionValidator = new ExceptionValidator();

    private static _validateExceptions(exceptions: any[]): boolean {
        // verify exceptions has typeName, message, hasFullStack, stack, parsedStack fields
        if (!("typeName" in exceptions[0]) ||
            !("message" in exceptions[0]) ||
            !("hasFullStack" in exceptions[0]) ||
            !("stack" in exceptions[0]) ||
            !("parsedStack" in exceptions[0])) {
            return false;
        }
        
        return true;
    }

    Validate(item: any, baseType: string): boolean {
        // verify item passes CommonValidator
        if (!CommonValidator.CommonValidator.Validate(item, baseType)) {
            console.log("ExceptionValidator::Validate failed - " + JSON.stringify(item));
            return false;
        }

        // verify item has ver and exceptions fields
        if (!item.data.baseData ||
            !item.data.baseData.ver ||
            !item.data.baseData.exceptions) {
            console.log("ExceptionValidator::Validate missing basedata values - " + JSON.stringify(item.data));
            return false;
        }

        // Exception.ver should be a number for breeze channel, but a string in CS4.0
        if (item.data.baseData.ver !== 2) {
            console.log("ExceptionValidator::Validate not breeze - " + JSON.stringify(item.data.baseData));
            return false; // not a valid breeze exception
        }

        if (!ExceptionValidator._validateExceptions(item.data.baseData.exceptions)) {
            console.log("ExceptionValidator::_validateExceptions failed - " + JSON.stringify(item.data.baseData.exceptions));
            return false;
        }

        return true;
    }
}