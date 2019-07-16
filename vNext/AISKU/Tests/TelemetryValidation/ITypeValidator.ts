import { IEnvelope } from '@microsoft/applicationinsights-common';

export interface ITypeValidator {
    Validate(item: IEnvelope, baseType?: string): boolean;
}