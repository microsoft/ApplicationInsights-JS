import { IMetricAttributes } from "./IMetricAttributes";
import { IObservableResult } from "./IObservableResult";

export type IObservableCallback<
  AttributesTypes extends IMetricAttributes =  IMetricAttributes,
> = (
  observableResult: IObservableResult<AttributesTypes>
) => void | Promise<void>;