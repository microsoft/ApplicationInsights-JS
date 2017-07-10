/// <reference path="./ISerializable.ts" />
// import * as ISerializable from './ISerializable';
// import { ISerializable } from './ISerializable';
// import ISerializable = require('./ISerializable');

module Microsoft.ApplicationInsights {

    "use strict";

    export interface IEnvelope extends ISerializable {
        ver: number;
        name: string;
        time: string;
        sampleRate: number;
        seq: string;
        iKey: string;
        flags: number;
        deviceId: string;
        os: string;
        osVer: string;
        appId: string;
        appVer: string;
        userId: string;
        tags: { [name: string]: any };
        data: any;
    }
}
