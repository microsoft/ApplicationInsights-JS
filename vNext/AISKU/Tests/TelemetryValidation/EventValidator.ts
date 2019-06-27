import { ITypeValidator } from './ITypeValidator';
import { IEnvelope } from '@microsoft/applicationinsights-common';
import { CommonValidator } from './CommonValidator';

export class EventValidator implements ITypeValidator {

    static EventValidator = new EventValidator();

    public Validate(item: IEnvelope, baseType: string): boolean {
        // verify item passes CommonValidator
        if (!CommonValidator.CommonValidator.Validate(item, baseType)) {
            return false;
        }

        // verify item has ver, name, properties, and measurement fields
        if (!item.data.baseData || 
            !item.data.baseData.ver || 
            !item.data.baseData.name || 
            !item.data.baseData.properties || 
            !item.data.baseData.measurements) {
            return false;
        }

        return true;
    }
}