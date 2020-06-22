// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

type trackers = 'trackEvent'
  | 'trackPageView'
  | 'trackPageViewPerformance'
  | 'trackException'
  | 'trackTrace'
  | 'trackMetric'
  | 'trackDependencyData'
  | 'throwInternal'
  | 'logInternalMessage'
  | 'triggerSend'
  | '_sender';

export interface ITelemetryConfig {
  trackers: string[]
}