import { ITelemetryItem } from '../../coreSDK/JavaScriptSDK.Interfaces/ITelemetryItem';

export interface ITypeValidator {
    Validate(item: ITelemetryItem): boolean;
}