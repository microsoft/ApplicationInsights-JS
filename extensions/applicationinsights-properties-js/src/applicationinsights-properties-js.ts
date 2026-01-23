// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import PropertiesPlugin from "./PropertiesPlugin";
import { ITelemetryTrace } from "@microsoft/otel-core-js";
import { ISessionConfig, Session, _SessionManager } from "./Context/Session";
import { IPropTelemetryContext } from "./Interfaces/IPropTelemetryContext";

export { PropertiesPlugin, ITelemetryTrace, Session, ISessionConfig, IPropTelemetryContext, _SessionManager as SessionManager };
