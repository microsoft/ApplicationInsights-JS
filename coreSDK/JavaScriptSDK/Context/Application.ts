import { IApplication } from '../../JavaScriptSDK.Interfaces/Context/IApplication';

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