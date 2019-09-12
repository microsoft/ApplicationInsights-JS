import { ITypeValidator } from './ITypeValidator';
import { IEnvelope } from '@microsoft/applicationinsights-common';
import { CommonValidator } from './CommonValidator';

export class PageViewPerformanceValidator implements ITypeValidator {
    static PageViewPerformanceValidator = new PageViewPerformanceValidator();

    public Validate(item: IEnvelope, baseType: string): boolean {
        // verify item passes CommonValidator
        if (!CommonValidator.CommonValidator.Validate(item, baseType)) {
            return false;
        }

        // verify item has ver, url, perfTotal, name, duration, networkConnect, sentRequest, receivedResponse, and domProcessing fields
        if (!item.data.baseData || 
            !item.data.baseData.ver ||  
            !item.data.baseData.url || 
            !item.data.baseData.perfTotal ||
            !item.data.baseData.name ||
            !item.data.baseData.duration || 
            !item.data.baseData.networkConnect ||  
            !item.data.baseData.sentRequest ||  
            !item.data.baseData.receivedResponse ||  
            !item.data.baseData.domProcessing) {
            return false;
        }

        return true;
    }
}