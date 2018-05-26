import { IOperation } from '../../JavaScriptSDK.Interfaces/Context/IOperation';
import { Util } from 'applicationinsights-common';

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