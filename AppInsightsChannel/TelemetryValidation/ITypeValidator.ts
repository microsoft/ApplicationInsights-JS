import { ITelemetryItem } from '../../coreSDK/JavaScriptSDK.Interfaces/ITelemetryItem';

export interface ITypeValidator {
    Validate(event: ITelemetryItem): boolean;
}