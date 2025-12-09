// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IMetricAttributes } from "./IMetricAttributes";
import { IObservableResult } from "./IObservableResult";

export type IObservableCallback<
  AttributesTypes extends IMetricAttributes =  IMetricAttributes,
> = (
  observableResult: IObservableResult<AttributesTypes>
) => void | Promise<void>;