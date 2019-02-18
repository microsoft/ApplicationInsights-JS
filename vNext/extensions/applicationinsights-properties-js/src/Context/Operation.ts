// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOperation } from '../Interfaces/Context/IOperation';
import { Util } from '@microsoft/applicationinsights-common';

export class Operation implements IOperation {

    public id: string;
    public name: string;
    public parentId: string;
    public rootId: string;
    public syntheticSource: string;

    constructor() {
        this.id = Util.newId();
        if (window && window.location && window.location.pathname) {
            this.name = window.location.pathname;
        }
    }
}