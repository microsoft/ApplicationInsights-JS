import { IApplication } from './Context/IApplication';
import { IDevice } from './Context/IDevice';
import { IInternal } from './Context/IInternal';
import { ILocation } from './Context/ILocation';
import { IOperation } from './Context/IOperation';
import { ISample } from './Context/ISample';
import { IUser } from './Context/IUser';
import { ISession } from './Context/ISession';
import { IEnvelope } from './Telemetry/IEnvelope';
import { Envelope } from './Contracts/Generated/Envelope';

export interface ITelemetryContext {
    /**
    * The object describing a component tracked by this object.
    */
    application: IApplication;

    /**
     * The object describing a device tracked by this object.
     */
    device: IDevice;

    /**
    * The object describing internal settings.
    */
    internal: IInternal;

    /**
     * The object describing a location tracked by this object.
     */
    location: ILocation;

    /**
     * The object describing a operation tracked by this object.
     */
    operation: IOperation;

    /**
    * The object describing sampling settings.
    */
    sample: ISample;

    /**
     * The object describing a user tracked by this object.
     */
    user: IUser;

    /**
     * The object describing a session tracked by this object.
     */
    session: ISession;

    /**
    * Adds a telemetry initializer to the collection. Telemetry initializers will be called one by one, 
    * in the order they were added, before the telemetry item is pushed for sending. 
    * If one of the telemetry initializers returns false or throws an error then the telemetry item will not be sent. 
    * If it returns true or doesn't return any value the event will be passed to the next telemetry initializer and
    * send to the cloud (if not rejected by other initializers). 
    */
    addTelemetryInitializer(telemetryInitializer: (envelope: IEnvelope) => boolean | void);

    /**
    * Tracks telemetry object.
    */
    track(envelope: IEnvelope);
}