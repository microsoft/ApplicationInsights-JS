// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="./Contracts/Generated/Envelope.ts" />
/// <reference path="./Context/IApplication.ts"/>
/// <reference path="./Context/IDevice.ts"/>
/// <reference path="./Context/IInternal.ts"/>
/// <reference path="./Context/ILocation.ts"/>
/// <reference path="./Context/IOperation.ts"/>
/// <reference path="./Context/ISample.ts"/>
/// <reference path="./Context/IUser.ts"/>
/// <reference path="./Context/ISession.ts"/>
/// <reference path="./Telemetry/IEnvelope.ts"/>

module Microsoft.ApplicationInsights {

    "use strict";

    export interface ITelemetryContext {
         /**
         * The object describing a component tracked by this object.
         */
        application: Context.IApplication;

        /**
         * The object describing a device tracked by this object.
         */
        device: Context.IDevice;

        /**
        * The object describing internal settings.
        */
        internal: Context.IInternal;

        /**
         * The object describing a location tracked by this object.
         */
        location: Context.ILocation;

        /**
         * The object describing a operation tracked by this object.
         */
        operation: Context.IOperation;

        /**
        * The object describing sampling settings.
        */
        sample: Context.ISample;

        /**
         * The object describing a user tracked by this object.
         */
        user: Context.IUser;

        /**
         * The object describing a session tracked by this object.
         */
        session: Context.ISession;

        /**
        * Adds a telemetry initializer to the collection. Telemetry initializers will be called one by one, 
        * in the order they were added, before the telemetry item is pushed for sending. 
        * If one of the telemetry initializers returns false or throws an error then the telemetry item will not be sent. 
        * If it returns true or doesn't return any value the event will be passed to the next telemetry initializer and
        * send to the cloud (if not rejected by other initializers). 
        */
        addTelemetryInitializer(telemetryInitializer: (envelope: Microsoft.ApplicationInsights.IEnvelope) => boolean | void);

         /**
         * Tracks telemetry object.
         */
        track(envelope: Microsoft.ApplicationInsights.IEnvelope);
    }
}