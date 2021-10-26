import { ITypeValidator } from "./ITypeValidator";
import { CommonValidator } from "./CommonValidator";

export class TraceValidator implements ITypeValidator {
    static TraceValidator = new TraceValidator();

    public Validate(item: any, baseType: string): boolean {
        // verify item passes CommonValidator
        if (!CommonValidator.CommonValidator.Validate(item, baseType)) {
            return false;
        }

        // verify item has ver, message, and properties fields
        if (!item.data.baseData ||
            !item.data.baseData.ver ||
            !item.data.baseData.message ||
            !item.data.baseData.properties) {
            return false;
        }
        return true;
    }
}