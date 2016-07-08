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
        * Adds telemetry initializer to the collection. Telemetry initializers will be called one by one
        * before telemetry item is pushed for sending and in the order they were added.
        */
        addTelemetryInitializer(telemetryInitializer: (envelope: Microsoft.ApplicationInsights.IEnvelope) => boolean);

         /**
         * Tracks telemetry object.
         */
        track(envelope: Microsoft.ApplicationInsights.IEnvelope);
    }
}