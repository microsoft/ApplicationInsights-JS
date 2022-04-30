// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore"
import { BaseCore } from "./BaseCore";
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { eEventsDiscardedReason } from "../JavaScriptSDK.Enums/EventsDiscardedReason";
import { NotificationManager } from "./NotificationManager";
import { doPerf } from "./PerfManager";
import { INotificationManager } from "../JavaScriptSDK.Interfaces/INotificationManager";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { DiagnosticLogger } from "./DiagnosticLogger";
import dynamicProto from "@microsoft/dynamicproto-js";
import { isNullOrUndefined, throwError } from "./HelperFuncs";

export class AppInsightsCore extends BaseCore implements IAppInsightsCore {
    constructor() {
        super();

        dynamicProto(AppInsightsCore, this, (_self, _base) => {

            _self.initialize = (config: IConfiguration, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager): void => {
                _base.initialize(config, extensions, logger || new DiagnosticLogger(config), notificationManager || new NotificationManager(config));
            };
        
            _self.track = (telemetryItem: ITelemetryItem) => {
                doPerf(_self.getPerfMgr(), () => "AppInsightsCore:track", () => {
                    if (telemetryItem === null) {
                        _notifyInvalidEvent(telemetryItem);
                        // throw error
                        throwError("Invalid telemetry item");
                    }
                    
                    // do basic validation before sending it through the pipeline
                    _validateTelemetryItem(telemetryItem);
            
                    _base.track(telemetryItem);
                }, () => ({ item: telemetryItem }), !((telemetryItem as any).sync));
            };
        
            function _validateTelemetryItem(telemetryItem: ITelemetryItem) {
                if (isNullOrUndefined(telemetryItem.name)) {
                    _notifyInvalidEvent(telemetryItem);
                    throwError("telemetry name required");
                }
            }
        
            function _notifyInvalidEvent(telemetryItem: ITelemetryItem): void {
                let manager = _self.getNotifyMgr();
                if (manager) {
                    manager.eventsDiscarded([telemetryItem], eEventsDiscardedReason.InvalidEvent);
                }
            }
        });
    }

    public initialize(config: IConfiguration, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public track(telemetryItem: ITelemetryItem) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
