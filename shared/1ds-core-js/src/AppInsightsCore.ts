/**
* AppInsightsCore.ts
* @author Abhilash Panwar (abpanwar) Hector Hernandez (hectorh)
* @copyright Microsoft 2018
*/
import dynamicProto from "@microsoft/dynamicproto-js";
import {
    AppInsightsCore as InternalCore, IConfigDefaults, IDiagnosticLogger, INotificationManager, IPlugin, ITelemetryItem, _throwInternal,
    createDynamicConfig, doPerf, dumpObj, eLoggingSeverity, throwError
} from "@microsoft/applicationinsights-core-js";
import { ITimerHandler, objDeepFreeze } from "@nevware21/ts-utils";
import { IExtendedConfiguration, IExtendedTelemetryItem, IPropertyStorageOverride } from "./DataModels";
import { EventLatencyValue, _eExtendedInternalMessageId } from "./Enums";
import { STR_DEFAULT_ENDPOINT_URL, STR_EMPTY, STR_VERSION } from "./InternalConstants";
import { FullVersionString, getTime, isLatency } from "./Utils";

/**
 * The default settings for the config.
 * WE MUST include all defaults here to ensure that the config is created with all of the properties
 * defined as dynamic.
 */
const defaultConfig: IConfigDefaults<IExtendedConfiguration> = (/*#__PURE__*/ objDeepFreeze({
    endpointUrl: STR_DEFAULT_ENDPOINT_URL,
    propertyStorageOverride: { isVal: _chkPropOverride }
}));

/*#__NO_SIDE_EFFECTS__*/
function _chkPropOverride(propertyStorageOverride: IPropertyStorageOverride) {
    // Validate property storage override
    if (propertyStorageOverride && (!propertyStorageOverride.getProperty || !propertyStorageOverride.setProperty)) {
        throwError("Invalid property storage override passed.");
    }

    return true;
}

/**
 * @group Classes
 * @group Entrypoint
 */
export class AppInsightsCore<C extends IExtendedConfiguration = IExtendedConfiguration> extends InternalCore<C> {
    constructor() {
        super();

        dynamicProto(AppInsightsCore, this, (_self, _base) => {

            _self.initialize = (config: C, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager) => {
                doPerf(_self, () => "AppInsightsCore.initialize", () => {
                    try {
                        _base.initialize(createDynamicConfig<C>(config, defaultConfig as C, logger || _self.logger, false).cfg, extensions, logger, notificationManager);
                    } catch (e) {
                        let logger = _self.logger;
                        let message = dumpObj(e);
                        if (message.indexOf("channels") !== -1) {
                            // Add some additional context to the underlying reported error
                            message += "\n - Channels must be provided through config.channels only!";
                        }
                        _throwInternal(logger,
                            eLoggingSeverity.CRITICAL,
                            _eExtendedInternalMessageId.FailedToInitializeSDK, "SDK Initialization Failed - no telemetry will be sent: " + message
                        );
                    }
                }, () => ({ config, extensions, logger, notificationManager }));
            };

            _self.track = (item: IExtendedTelemetryItem|ITelemetryItem) => {
                doPerf(_self, () => "AppInsightsCore.track", () => {
                    let telemetryItem: IExtendedTelemetryItem = item as IExtendedTelemetryItem;
                    if (telemetryItem) {
                        telemetryItem.timings = telemetryItem.timings || {};
                        telemetryItem.timings.trackStart = getTime();
                        if (!isLatency(telemetryItem.latency)) {
                            telemetryItem.latency = EventLatencyValue.Normal;
                        }

                        let itemExt = telemetryItem.ext = telemetryItem.ext || {};
                        itemExt.sdk = itemExt.sdk || {};
                        itemExt.sdk.ver = FullVersionString;
                        let baseData = telemetryItem.baseData = telemetryItem.baseData || {};
                        baseData.properties = baseData.properties || {};
                        
                        let itemProperties = baseData.properties;
                        itemProperties[STR_VERSION] = itemProperties[STR_VERSION] || _self.pluginVersionString || STR_EMPTY;
                    }

                    _base.track(telemetryItem);
                }, () => ({ item: item }), !((item as any).sync));
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
    public initialize(config: C, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager) {
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
