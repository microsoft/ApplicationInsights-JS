// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/* #__NO_SIDE_EFFECTS__# */
function _AddPrefix(name: string) {
    return "Microsoft.ApplicationInsights.{0}." + name;
}

export const EventEnvelopeType = (/* __PURE__ */ _AddPrefix("Event"));
export const ExceptionEnvelopeType = (/* __PURE__ */ _AddPrefix("Exception"));
export const MetricEnvelopeType = (/* __PURE__ */ _AddPrefix("Metric"));
export const PageViewEnvelopeType = (/* __PURE__ */ _AddPrefix("Pageview"));
export const PageViewPerformanceEnvelopeType = (/* __PURE__ */ _AddPrefix("PageviewPerformance"));
export const RemoteDependencyEnvelopeType = (/* __PURE__ */ _AddPrefix("RemoteDependency"));
export const RequestEnvelopeType = (/* __PURE__ */ _AddPrefix("Request"));
export const TraceEnvelopeType = (/* __PURE__ */ _AddPrefix("Message"));