// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export {
    AjaxMonitor as AjaxPlugin, IDependenciesPlugin, XMLHttpRequestData, XMLHttpRequestInstrumented, IInstrumentationRequirements, DfltAjaxCorrelationHeaderExDomains, IAjaxMonitorPlugin, IAjaxRecordData
} from "./ajax";
export { IDependencyHandler, IDependencyListenerHandler, IDependencyListenerDetails, DependencyListenerFunction } from "./DependencyListener";
export { IDependencyInitializerHandler, IDependencyInitializerDetails, DependencyInitializerFunction } from "./DependencyInitializer";
export { ICorrelationConfig, eDistributedTracingModes, DistributedTracingModes } from "@microsoft/applicationinsights-common";
