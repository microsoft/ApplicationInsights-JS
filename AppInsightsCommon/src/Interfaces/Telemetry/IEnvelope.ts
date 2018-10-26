// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ISerializable } from './ISerializable';

export interface IEnvelope extends ISerializable {
    ver: number;
    name: string;
    time: string;
    sampleRate: number;
    seq: string;
    iKey: string;
    tags: { [name: string]: any };
    data: any;
}