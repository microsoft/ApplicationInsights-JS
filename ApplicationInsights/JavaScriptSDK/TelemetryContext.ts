import {
    Metric, IEnvelope, RemoteDependencyData, 
    _InternalLogging, _InternalMessageId, LoggingSeverity, 
    Util, Data
} from "applicationinsights-common";
import { IAppInsightsCore, ITelemetryItem } from "applicationinsights-core-js";
import { ITelemetryConfig } from "../JavaScriptSDK.Interfaces/ITelemetryConfig";

export class TelemetryContext {
    /**
     * The configuration for this telemetry context
     */
    public _config: ITelemetryConfig;

    /**
     * AppId of this component if returned by the backend.
     */
    public appId: () => string;

    /**
    * Internal telemetry initializers.
    */
    private _telemetryInitializers: { (envelope: IEnvelope): boolean | void; }[];

    private _core: IAppInsightsCore;

    constructor(config: ITelemetryConfig, core: IAppInsightsCore) {
        this._config = config;
        this._core = core;

        this._telemetryInitializers = [];
        this._addDefaultTelemetryInitializers();
    }

    /**
    * Adds internal telemetry initializer to the collection.
    */
    private addTelemetryInitializer(telemetryInitializer: (envelope: IEnvelope) => boolean | void) {
        this._telemetryInitializers.push(telemetryInitializer);
    }

    /**
     * Uses channel to send telemetry object to the endpoint
     */
    public track(telemetryItem: ITelemetryItem) {
        this._track(telemetryItem);
    }

    // Todo: move to separate extension
    private _addDefaultTelemetryInitializers() {
        if (!this._config.isBrowserLinkTrackingEnabled()) {
            const browserLinkPaths = ['/browserLinkSignalR/', '/__browserLink/'];
            let dropBrowserLinkRequests = (envelope: IEnvelope) => {
                if (envelope.name === RemoteDependencyData.envelopeType) {
                    let remoteData = envelope.data as Data<RemoteDependencyData>;
                    if (remoteData && remoteData.baseData) {
                        for (let i = 0; i < browserLinkPaths.length; i++) {
                            if (remoteData.baseData.name.indexOf(browserLinkPaths[i]) >= 0) {
                                return false;
                            }
                        }
                    }
                }

                return true;
            }

            this.addTelemetryInitializer(dropBrowserLinkRequests)
        }
    }

    private _track(telemetryItem: ITelemetryItem) {
        // set instrumentation key
        telemetryItem.instrumentationKey = this._config.instrumentationKey();

        var doNotSendItem = false;
        try {
            var telemetryInitializersCount = this._telemetryInitializers.length;
            for (var i = 0; i < telemetryInitializersCount; ++i) {
                var telemetryInitializer = this._telemetryInitializers[i];
                if (telemetryInitializer) {
                    if (telemetryInitializer.apply(null, [telemetryItem]) === false) {
                        doNotSendItem = true;
                        break;
                    }
                }
            }
        } catch (e) {
            doNotSendItem = true;
            _InternalLogging.throwInternal(
                LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "One of telemetry initializers failed, telemetry item will not be sent: " + Util.getExceptionName(e),
                { exception: Util.dump(e) }, true);
        }

        if (!doNotSendItem) {
            // TODO(barustum): Removed a sampling check here. Re-add once we have sampling plugin ready
            if (telemetryItem.name === Metric.envelopeType) {
                var iKeyNoDashes = this._config.instrumentationKey().replace(/-/g, "");
                telemetryItem.name = telemetryItem.name.replace("{0}", iKeyNoDashes);

                // map and send data
                this._core.track(telemetryItem);
            } 
        }

        return telemetryItem;
    }
}