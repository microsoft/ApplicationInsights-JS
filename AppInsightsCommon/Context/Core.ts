import { IAppInsightsCore, AppInsightsCore, CoreUtils, DiagnosticLogger } from "applicationinsights-core-js";
import { ICoreContext } from '../Interfaces/Context/ICoreContext';
import IDiagnosticLogger from "applicationinsights-core-js/bundle/JavaScriptSDK.Interfaces/IDiagnosticLogger";

"use strict"

export class CoreContext implements ICoreContext {
    private loggers = {};
    private dataSanitizers = {};

    public get logger(id: string): IDiagnosticLogger {
        if(this.loggers[id] === undefined) {
            this.loggers[id] = new DiagnosticLogger();
        }
        return this.loggers[id];
    }

    public set logger(id: string) {
        if(this.loggers[id] === undefined) {
            this.loggers[id] = new DiagnosticLogger();
        }
    }

    public set logger(id: string, logger: IDiagnosticLogger) {
        this.loggers[id] = logger;
    }
}