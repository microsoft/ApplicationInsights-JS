export interface ITypeValidator {
    Validate(item: any, baseType?: string): boolean;
}