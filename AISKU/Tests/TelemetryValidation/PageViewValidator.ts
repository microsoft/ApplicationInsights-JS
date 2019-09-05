import { ITypeValidator } from './ITypeValidator';
import { IEnvelope } from '@microsoft/applicationinsights-common';
import { CommonValidator } from './CommonValidator';

export class PageViewValidator implements ITypeValidator {
    static PageViewValidator = new PageViewValidator();

    public Validate(item: IEnvelope, baseType: string): boolean {
        // verify item passes CommonValidator
        if (!CommonValidator.CommonValidator.Validate(item, baseType)) {
            return false;
        }

        // verify item has ver, url, name, duration, id, properties, and measurements fields
        if (!item.data.baseData || 
            !item.data.baseData.ver ||  
            !item.data.baseData.url || 
            !item.data.baseData.name ||
            !item.data.baseData.duration || 
            !item.data.baseData.id ||  
            !item.data.baseData.properties || 
            !item.data.baseData.measurements) {
            return false;
        }
        return true;
    }
}