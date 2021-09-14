import { ITypeValidator } from './ITypeValidator';

export class CommonValidator implements ITypeValidator {

    static CommonValidator = new CommonValidator();

    public Validate(item: any, baseType: string): boolean {
        // verify item has data, iKey, name, tags, and time fields
        if (!item.data || !item.iKey || !item.name || !item.tags || !item.time) {
            return false;
        }

        if (item.data.baseData.ver !== 2) {
            return false;
        }

        // verify item.data has baseType field
        if (!item.data.baseType) {
            return false;
        }

        return true;
    }
}