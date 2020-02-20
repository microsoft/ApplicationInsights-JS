/**
 * ReactNativeExceptionPlugin.ts
 * @copyright Microsoft 2019
 */

import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler';
import {
    ITelemetryPlugin,
    ITelemetryItem,
    IPlugin,
    IAppInsightsCore, 
    CoreUtils,
    IDiagnosticLogger,
    DiagnosticLogger,
    LoggingSeverity,
    _InternalMessageId
} from '@microsoft/applicationinsights-core-js';
import { ConfigurationManager, IAppInsights, IExceptionTelemetry } from '@microsoft/applicationinsights-common';
import { IReactNativeExceptionPluginConfig } from '../Interfaces';

export class ReactNativeExceptionPlugin implements ITelemetryPlugin {

    identifier: string = 'AppInsightsReactNativeExceptionPlugin';
    priority: number = 141;
    _nextPlugin?: ITelemetryPlugin;
    private _initialized: boolean = false;
    private _config: IReactNativeExceptionPluginConfig;
    private _analyticsPlugin: IAppInsights;
    private _logger: IDiagnosticLogger;

    constructor(config?: IReactNativeExceptionPluginConfig) {
        this._config = config || this._getDefaultConfig();
        this._logger = new DiagnosticLogger();

    }

    public initialize(
        config?: IReactNativeExceptionPluginConfig | object, // need `| object` to coerce to interface
        core?: IAppInsightsCore,
        extensions?: IPlugin[]
    ) {
        if (!this._initialized) {
            const inConfig = config || {};
            const defaultConfig = this._getDefaultConfig();
            for (const option in defaultConfig) {
                this._config[option] = ConfigurationManager.getConfig(
                    inConfig as any,
                    option,
                    this.identifier,
                    this._config[option]
                );
            }
            
            if (extensions) {
                CoreUtils.arrForEach(extensions, ext => {
                    const identifier = (ext as ITelemetryPlugin).identifier;
                    if (identifier === 'ApplicationInsightsAnalytics') {
                        this._analyticsPlugin = (ext as any) as IAppInsights;
                    }
                });
            }

            if (!this._config.disableExceptionCollection) {
                this._setExceptionHandlers();
            }
        }
        
        this._initialized = true;
    }

    public processTelemetry(item: ITelemetryItem) {
        if (this._nextPlugin) {
            this._nextPlugin.processTelemetry(item);
        }
    }

    public setNextPlugin(next: ITelemetryPlugin) {
        this._nextPlugin = next;
    }

    private _trackException(exception: IExceptionTelemetry) {
        if (this._analyticsPlugin) {
            this._analyticsPlugin.trackException(exception);
        } else {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "Analytics plugin is not available, ReactNative plugin telemetry will not be sent: ");
        }
    }

    /**
     * Automatically collects unhandled JS exceptions and native exceptions
     */
    private _setExceptionHandlers() {
        setJSExceptionHandler((error) => {
            this._trackException({ exception: error });
        }, true);
        setNativeExceptionHandler(exceptionString => {
            this._trackException({ exception: new Error(exceptionString) });
        }, true);
    }

    private _getDefaultConfig(): IReactNativeExceptionPluginConfig {
        return {
            // enable autocollection by default
            disableExceptionCollection: false
        };
    }
}
