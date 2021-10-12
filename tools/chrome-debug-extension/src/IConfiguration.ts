// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import { EventType } from './dataHelpers';

export interface IConfiguration {
  filterText: string;
  filterByType: EventType | undefined;
  showCondensedDetails: boolean;
}
