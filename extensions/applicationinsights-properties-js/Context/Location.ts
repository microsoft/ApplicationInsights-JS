import { ILocation } from '../Interfaces/Context/ILocation';

export class Location implements ILocation {

    /**
     * Client IP address for reverse lookup
     */
    public ip: string;
}