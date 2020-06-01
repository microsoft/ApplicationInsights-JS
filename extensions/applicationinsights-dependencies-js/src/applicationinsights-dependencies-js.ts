// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import '@microsoft/applicationinsights-shims';
export { AjaxMonitor as AjaxPlugin, IDependenciesPlugin, XMLHttpRequestInstrumented, IInstrumentationRequirements } from "./ajax";
export { ajaxRecord } from "./ajaxRecord";
