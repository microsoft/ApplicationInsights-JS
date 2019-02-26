// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IApplication } from '@microsoft/applicationinsights-common';

export class Application implements IApplication {
    /**
     * The application version.
     */
    public ver: string;

    /**
     * The application build version.
     */
    public build: string;
}