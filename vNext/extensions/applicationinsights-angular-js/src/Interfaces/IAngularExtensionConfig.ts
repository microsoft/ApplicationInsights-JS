// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Router } from '@angular/router';

/**
 * Settings to initialize a AngularAI instance.
 */
export interface IAngularExtensionConfig {
  /**
   * Angular router for enabling Application Insights PageView tracking.
   *
   * @type {Router}
   * @memberof IAngularAISettings
   */
  router?: Router
}
