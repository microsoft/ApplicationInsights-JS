// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IReactExtensionConfig } from "./Interfaces/IReactExtensionConfig";
import ReactPlugin from "./ReactPlugin";
import withAITracking, { AITrackedComponentBase } from "./withAITracking";
import AppInsightsErrorBoundary from "./AppInsightsErrorBoundary"
import {
  AppInsightsContext,
  useAppInsightsContext
} from "./AppInsightsContext";
import useTrackEvent from "./useTrackEvent";
import useTrackMetric from "./useTrackMetric";

export {
  ReactPlugin,
  IReactExtensionConfig,
  withAITracking,
  AppInsightsErrorBoundary,
  AppInsightsContext,
  useAppInsightsContext,
  useTrackEvent,
  useTrackMetric,
  AITrackedComponentBase
};
