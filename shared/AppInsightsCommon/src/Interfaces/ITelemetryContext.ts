// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IApplication } from "./Context/IApplication";
import { IDevice } from "./Context/IDevice";
import { IInternal } from "./Context/IInternal";
import { ILocation } from "./Context/ILocation";
import { IOperatingSystem } from "./Context/IOperatingSystem";
import { ISession } from "./Context/ISession";
import { ITelemetryTrace } from "./Context/ITelemetryTrace";
import { IUserContext } from "./Context/IUser";
import { IWeb } from "./Context/IWeb";

export interface ITelemetryContext {
    /**
     * The object describing a component tracked by this object.
     */
    readonly application: IApplication;

    /**
     * The object describing a device tracked by this object.
     */
    readonly device: IDevice;

    /**
     * The object describing internal settings.
     */
    readonly internal: IInternal;

    /**
     * The object describing a location tracked by this object.
     */
    readonly location: ILocation;

    /**
     * The object describing a operation tracked by this object.
     */
    readonly telemetryTrace: ITelemetryTrace;

    /**
     * The object describing a user tracked by this object.
     */
    readonly user: IUserContext;

    /**
     * The object describing a session tracked by this object.
     */
    readonly session: ISession;

    /**
     * The object describing os details tracked by this object.
     */
    readonly os?: IOperatingSystem;

    /**
     * The object describing we details tracked by this object.
     */
    readonly web?: IWeb;

    /**
     * application id obtained from breeze responses. Is used if appId is not specified by root config
     */
    appId: () => string;

    /**
     * session id obtained from session manager.
     */
    getSessionId: () => string;
}
