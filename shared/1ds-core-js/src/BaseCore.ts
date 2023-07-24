/**
* BaseCore.ts
* Base Core is a subset of 1DS Web SDK Core. The purpose of Base Core is to generate a smaller bundle size while providing essential features of Core. Features that are not included in Base Core are:
* 1. Internal logging
* 2. Sending notifications on telemetry sent/discarded
* @author Abhilash Panwar (abpanwar) Hector Hernandez (hectorh)
* @copyright Microsoft 2018
*/
import dynamicProto from "@microsoft/dynamicproto-js";
import {
    AppInsightsCore as InternalCore, IConfigDefaults, IDiagnosticLogger, INotificationManager, IPlugin, ITelemetryItem, _throwInternal,
    createDynamicConfig, dumpObj, eLoggingSeverity
} from "@microsoft/applicationinsights-core-js";
import { ITimerHandler, objDeepFreeze } from "@nevware21/ts-utils";
import { IExtendedConfiguration, IExtendedTelemetryItem } from "./DataModels";
import { _eExtendedInternalMessageId } from "./Enums";
import { STR_DEFAULT_ENDPOINT_URL } from "./InternalConstants";
import { FullVersionString } from "./Utils";

/**
 * The default settings for the config.
 * WE MUST include all defaults here to ensure that the config is created with all of the properties
 * defined as dynamic.
 */
const defaultConfig: IConfigDefaults<IExtendedConfiguration> = objDeepFreeze({
    endpointUrl: STR_DEFAULT_ENDPOINT_URL
});

export class BaseCore extends InternalCore {

    constructor() {
        super();

        dynamicProto(BaseCore, this, (_self, _base) => {

            _self.initialize = (config: IExtendedConfiguration, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager) => {
                try {
                    _base.initialize(createDynamicConfig(config, defaultConfig, logger || _self.logger, false).cfg, extensions, logger, notificationManager);
                } catch (e) {
                    _throwInternal(_self.logger,
                        eLoggingSeverity.CRITICAL,
                        _eExtendedInternalMessageId.FailedToInitializeSDK, "Initialization Failed: " + dumpObj(e) + "\n - Note: Channels must be provided through config.channels only"
                    );
                }
            };

            _self.track = (item: IExtendedTelemetryItem|ITelemetryItem) => {
                let telemetryItem: IExtendedTelemetryItem = item as IExtendedTelemetryItem;
                if (telemetryItem) {
                    let ext = telemetryItem.ext = telemetryItem.ext || {};
                    ext.sdk = ext.sdk || {};
                    ext.sdk.ver = FullVersionString;
                }

                _base.track(telemetryItem);
            };

            _self.pollInternalLogs = (eventName?: string): ITimerHandler => {
                return _base.pollInternalLogs(eventName || "InternalLog");
            };
        });
    }

    /**
     * Initialize the sdk.
     * @param config - The configuration to initialize the SDK.
     * @param extensions - An array of extensions that are to be used by the core.
     */
    public initialize(config: IExtendedConfiguration, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public track(item: IExtendedTelemetryItem|ITelemetryItem) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Periodically check logger.queue for
     */
    public pollInternalLogs(eventName?: string): ITimerHandler {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }
}
