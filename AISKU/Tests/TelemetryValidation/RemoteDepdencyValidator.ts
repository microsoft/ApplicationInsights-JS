import { ITypeValidator } from './ITypeValidator';
import { IEnvelope } from '@microsoft/applicationinsights-common';
import { CommonValidator } from './CommonValidator';

export class RemoteDepdencyValidator implements ITypeValidator {
    static RemoteDepdencyValidator = new RemoteDepdencyValidator();

    public Validate(item: IEnvelope, baseType: string): boolean {
        // verify item passes CommonValidator
        if (!CommonValidator.CommonValidator.Validate(item, baseType)) {
            return false;
        }

        // verify item has ver, name, id, resultCode, duration, data, target, type, properties, and measurement fields
        if (!item.data.baseData || 
            !item.data.baseData.ver || 
            !item.data.baseData.name || 
            !item.data.baseData.id || 
            !item.data.baseData.resultCode || 
            !item.data.baseData.duration ||
            !item.data.baseData.data || 
            !item.data.baseData.target || 
            !item.data.baseData.type || 
            !item.data.baseData.properties || 
            !item.data.baseData.measurements) {
            return false;
        }
        
        return true;
    }
}