import { ITypeValidator } from './ITypeValidator';
import { IEnvelope } from '@microsoft/applicationinsights-common';
import { CommonValidator } from './CommonValidator';

export class MetricValidator implements ITypeValidator {
    static MetricValidator = new MetricValidator();

    Validate(item: IEnvelope, baseType: string): boolean {
        // verify item passes CommonValidator
        if (!CommonValidator.CommonValidator.Validate(item, baseType)) {
            return false;
        }

        // verify item has ver, metrics, and properties fields
        if (!item.data.baseData || 
            !item.data.baseData.ver || 
            !item.data.baseData.metrics || 
            !item.data.baseData.properties) {
            return false;
        }

        return true;
    }
}