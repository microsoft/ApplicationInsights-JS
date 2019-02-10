// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ILocation } from '../Interfaces/Context/ILocation';

export class Location implements ILocation {

    /**
     * Client IP address for reverse lookup
     */
    public ip: string;
}