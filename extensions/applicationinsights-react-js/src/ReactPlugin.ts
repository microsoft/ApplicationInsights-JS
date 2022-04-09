/**
* ReactPlugin.ts
* @copyright Microsoft 2019
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    IAppInsights, IConfig, IEventTelemetry, IExceptionTelemetry, IMetricTelemetry, IPageViewTelemetry, ITraceTelemetry
} from "@microsoft/applicationinsights-common";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IConfiguration, ICookieMgr, ICustomProperties, IPlugin, IProcessTelemetryContext,
    IProcessTelemetryUnloadContext, ITelemetryItem, ITelemetryPlugin, ITelemetryPluginChain, ITelemetryUnloadState, _eInternalMessageId,
    _throwInternal, arrForEach, eLoggingSeverity, isFunction, objDefineAccessors, proxyFunctions, safeGetCookieMgr
} from "@microsoft/applicationinsights-core-js";
import { History, Location, Update } from "history";

import { IReactExtensionConfig } from './Interfaces/IReactExtensionConfig';
export default class ReactPlugin extends BaseTelemetryPlugin {
    public priority = 185;
    public identifier = 'ReactPlugin';

    constructor() {
        super();
        let _analyticsPlugin: IAppInsights;
        let _extensionConfig: IReactExtensionConfig;
        let _unlisten: any;
        let _pageViewTimer: any;

        dynamicProto(ReactPlugin, this, (_self, _base) => {
            _initDefaults();

            _self.initialize = (config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) => {
                super.initialize(config, core, extensions, pluginChain);
                _extensionConfig =
                    config.extensionConfig && config.extensionConfig[_self.identifier]
                        ? (config.extensionConfig[_self.identifier] as IReactExtensionConfig)
                        : { history: null };
        
                arrForEach(extensions, ext => {
                    const identifier = (ext as ITelemetryPlugin).identifier;
                    if (identifier === 'ApplicationInsightsAnalytics') {
                        _analyticsPlugin = (ext as any) as IAppInsights;
                    }
                });
                if (_extensionConfig.history) {
                    _addHistoryListener(_extensionConfig.history);
                    const pageViewTelemetry: IPageViewTelemetry = {
                        uri: _extensionConfig.history.location.pathname
                    };
                    _self.trackPageView(pageViewTelemetry);
                }
            };

            _self.getCookieMgr = (): ICookieMgr => {
                return safeGetCookieMgr(_self.core);
            };
        
            _self.getAppInsights = _getAnalytics;
        
            _self.processTelemetry = (event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                _self.processNext(event, itemCtx);
            };
        
            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState, asyncCallback?: () => void): void | boolean => {
                if (isFunction(_unlisten)) {
                    _unlisten();
                }

                if (_pageViewTimer) {
                    clearTimeout(_pageViewTimer);
                }

                _initDefaults();
            };

            // Proxy the analytics functions
            proxyFunctions(_self, _getAnalytics, [
                "trackMetric",
                "trackPageView",
                "trackEvent",
                "trackException",
                "trackTrace",
            ]);
        
            function _initDefaults() {
                _analyticsPlugin = null;
                _extensionConfig = null;
                _unlisten = null;
                _pageViewTimer = null;
            }

            function _getAnalytics() {
                if (!_analyticsPlugin) {
                    _throwInternal(_self.diagLog(),
                        eLoggingSeverity.CRITICAL, _eInternalMessageId.TelemetryInitializerFailed, "Analytics plugin is not available, React plugin telemetry will not be sent: ");
                }

                return _analyticsPlugin;
            }

            function _addHistoryListener(history: History): void {
                const locationListener = (arg: Location | Update): void => {
                    // v4 of the history API passes "location" as the first argument, while v5 passes an object that contains location and action 
                    let locn: Location = null;
                    if ("location" in arg) {
                        // Looks like v5
                        locn = arg["location"];
                    } else {
                        locn = arg as Location;
                    }
        
                    // Timeout to ensure any changes to the DOM made by route changes get included in pageView telemetry
                    _pageViewTimer = setTimeout(() => {
                        _pageViewTimer = null;
                        const pageViewTelemetry: IPageViewTelemetry = { uri: locn.pathname };
                        _self.trackPageView(pageViewTelemetry);
                    }, 500);
                };

                _unlisten = history.listen(locationListener);
            }
            
            objDefineAccessors(_self, "_extensionConfig", () => _extensionConfig);
        });
    }

    initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Get the current cookie manager for this instance
     */
    getCookieMgr(): ICookieMgr {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Get application insights instance.
     */
    getAppInsights(): IAppInsights {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Add Part A fields to the event
     * @param event The event that needs to be processed
     */
    processTelemetry(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    trackMetric(metric: IMetricTelemetry, customProperties: ICustomProperties) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    trackPageView(pageView: IPageViewTelemetry) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    trackEvent(event: IEventTelemetry, customProperties?: ICustomProperties) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    trackException(exception: IExceptionTelemetry, customProperties?: ICustomProperties) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    trackTrace(trace: ITraceTelemetry, customProperties?: ICustomProperties) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
