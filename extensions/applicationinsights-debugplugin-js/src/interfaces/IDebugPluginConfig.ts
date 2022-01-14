// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IConfiguration } from "@microsoft/applicationinsights-core-js";

export interface IDebugPluginConfig extends IConfiguration{
  
  trackers?: string[];

  /**
   * The prefix to use for the css styles, defaults to 'ai'
   */
  cssPrefix?: string;

  /**
   * Disable listening to notifications from the notification manager. Defaults to false
   */
  disableNotifications?: boolean;

  /**
   * [Optional] Dump extra debug information to the console as well as the dashboard
   */
  dumpToConsole?: boolean;

  /**
   * [Optional] The maximum number of messages to retain, older messages will be dropped - defaults to 5,000.
   */
  maxMessages?: number;

  /**
   * [Optional] Flag for whether to include functions in the DebugPlugin dashboard. Defaults to false
   */
  showFunctions?: boolean;

  /**
   * [Optional] If processTelemetry is not included in the trackers should the DebugPlugin log the arguments - defaults to false
   */
  logProcessTelemetry?: boolean;
}