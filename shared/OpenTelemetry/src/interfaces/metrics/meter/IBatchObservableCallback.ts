import { IOTelAttributes } from "@microsoft/applicationinsights-core-js";
import { IObservableResult } from "./IObservableResult";

/**
 * Callback function for batch observations
 */
export type IBatchObservableCallback<AttributesTypes extends IOTelAttributes = IOTelAttributes> =
    (observableResult: IObservableResult<AttributesTypes>) => void;
