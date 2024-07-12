// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import { BreezeChannelIdentifier, IConfig, utlSetStoragePrefix } from "@microsoft/applicationinsights-common";
import {
    IAppInsightsCore, IConfiguration, IDiagnosticLogger, IProcessTelemetryContext, IProcessTelemetryUnloadContext, ITelemetryUnloadState,
    IUnloadHookContainer, IXDomainRequest, IXHROverride, OnCompleteCallback, SendRequestReason, SenderPostManager, TransportType,
    _ISendPostMgrConfig, _ISenderOnComplete, _eInternalMessageId, _throwInternal, createProcessTelemetryContext, eLoggingSeverity,
    formatErrorMessageXdr, getResponseText, onConfigChange, parseResponse, prependTransports
} from "@microsoft/applicationinsights-core-js";
import { IPromise } from "@nevware21/ts-async";
import { isFunction } from "@nevware21/ts-utils";
import { IOfflineChannelConfiguration, IOfflineSenderConfig } from "./Interfaces/IOfflineProvider";

const DefaultOfflineIdentifier = "OfflineChannel";
const PostChannelId = "PostChannel";

function isOverrideFn(httpXHROverride: any) {
    return httpXHROverride && httpXHROverride.sendPOST;
}


export type SenderFunction = (payload: string[], isAsync: boolean) => void | IPromise<boolean>;

export class Sender {

    public _appId: string; //TODO: set id

    constructor() {

        let _consecutiveErrors: number;         // How many times in a row a retryable error condition has occurred.
        let _retryAt: number;                   // The time to retry at in milliseconds from 1970/01/01 (this makes the timer calculation easy).
        let _paused: boolean;                   // Flag indicating that the sending should be paused
        let _enableSendPromise: boolean;
        let _alwaysUseCustomSend: boolean;
        let _isInitialized: boolean;
        let _diagLog: IDiagnosticLogger;
        let _core: IAppInsightsCore;
        let _httpInterface: IXHROverride;
        let _onlineChannelId: string;
        let _isOneDs: boolean;
        let _sendPostMgr: SenderPostManager;
        let _disableCredentials: boolean;
        let _fetchCredentials: RequestCredentials;
       

        dynamicProto(Sender, this, (_self, _base) => {

            //let _sendCredentials = true; // for 1ds
            _initDefaults();

            _self.pause = () => {
                _clearScheduledTimer();
                _paused = true;
            };
        
            _self.resume = () => {
                if (_paused) {
                    _paused = false;
                    _retryAt = null;
                }
            };

            _self.getXhrInst = (sync?: boolean): IXHROverride => {
                // unload events will be saved. so not return unload interface
                return _httpInterface;
            }
        
            _self.initialize = (config: IConfiguration & IConfig, core: IAppInsightsCore, cxt: IProcessTelemetryContext, diagLog: IDiagnosticLogger,  channelId?: string, unloadHookContainer?: IUnloadHookContainer): void => {
                
                _diagLog = diagLog || core.logger;
                if (_isInitialized) {
                    _throwInternal(_diagLog, eLoggingSeverity.CRITICAL, _eInternalMessageId.SenderNotInitialized, "Sender is already initialized");
                }
                _core = core;
                _consecutiveErrors = 0;
                _retryAt = null;

                // This function will be re-called whenever any referenced configuration is changed
                let hook = onConfigChange(config, (details) => {
                    let config = details.cfg;
                    if (config.storagePrefix){
                        utlSetStoragePrefix(config.storagePrefix);
                    }
                    let ctx = createProcessTelemetryContext(null, config, core);

                    let offlineCfg = ctx.getExtCfg(DefaultOfflineIdentifier) as IOfflineChannelConfiguration;
                    _onlineChannelId = channelId || BreezeChannelIdentifier;
                    let senderConfig = ctx.getExtCfg(_onlineChannelId, {}) as any;
                    let offlineSenderCfg = offlineCfg.senderCfg || {} as IOfflineSenderConfig;
                    _fetchCredentials = null;
                    if (_onlineChannelId == PostChannelId) {
                        _isOneDs = true;
                        let channelConfig = ctx.getExtCfg(PostChannelId);
                        if (channelConfig && channelConfig["fetchCredentials"]) {
                            _fetchCredentials = channelConfig["fetchCredentials"];
                        }
                    }

                    _alwaysUseCustomSend = offlineSenderCfg.alwaysUseXhrOverride;

                    // default true
                    _enableSendPromise = !(senderConfig.enableSendPromise === false);
                    let xhrOverride = offlineSenderCfg.httpXHROverride || senderConfig.httpXHROverride;

                    let customInterface = isOverrideFn(xhrOverride)? xhrOverride : null;
                    _disableCredentials = !customInterface && _isOneDs;
                    let sendPostMgrConfig = _getSendPostMgrConfig();
                    if (!_sendPostMgr) {
                        _sendPostMgr = new SenderPostManager();
                        _sendPostMgr.initialize(sendPostMgrConfig, _diagLog);
                    } else {
                        _sendPostMgr.SetConfig(sendPostMgrConfig);
                    }

                    let httpInterface: IXHROverride = null;
                    let customTransPorts = offlineSenderCfg.transports || senderConfig.transports || [];
                    
                    let theTransports: TransportType[] = prependTransports([TransportType.Xhr, TransportType.Fetch, TransportType.Beacon], customTransPorts);
                    httpInterface = _sendPostMgr.getSenderInst(theTransports, false);
                    let xhrInterface = _sendPostMgr.getFallbackInst();
                    httpInterface = _alwaysUseCustomSend? customInterface : (httpInterface || customInterface || xhrInterface);
                    _httpInterface = httpInterface || xhrInterface;

                });
                unloadHookContainer && unloadHookContainer.add(hook);
            };
            

            _self.isCompletelyIdle = (): boolean => {
                let syncPayload = 0;
                try {
                    let senderPlugin = (_core.getPlugin(_onlineChannelId).plugin as any);
                    if (senderPlugin && isFunction(senderPlugin.isCompletelyIdle)) {
                        if(!senderPlugin.isCompletelyIdle()) {
                            return false;
                        }
                    }
                    if (_sendPostMgr) {
                        syncPayload = _sendPostMgr.getSyncFetchPayload();
                    }


                } catch (e) {
                    // if can't get idle status of online sender, then isidle status only depends on offine sender idle status

                }
                
                return !_paused && syncPayload === 0;
            };
            // partial 206, parse payload (not send again)
        
        
            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                _initDefaults();
            };

            /**
             * success handler
             */
            function _onSuccess (res?: string, onComplete?: OnCompleteCallback) {
                _doOnComplete(onComplete, 200, {}, res);
            }

            function _getSendPostMgrConfig(): _ISendPostMgrConfig {
                let config = {
                    enableSendPromise: _enableSendPromise,
                    isOneDs: _isOneDs,
                    disableCredentials: _disableCredentials,
                    fetchCredentials: _fetchCredentials,
                    senderOnCompleteCallBack: _getOnCompleteFuncs()
                } as _ISendPostMgrConfig;

                return config;
            }

            /**
             * error handler
             */
            function _onError(message: string, onComplete?: OnCompleteCallback) {
                _throwInternal(_diagLog,
                    eLoggingSeverity.WARNING,
                    _eInternalMessageId.OnError,
                    "Failed to send telemetry.",
                    { message });
                _doOnComplete(onComplete, 400, {});
            }


            function _getOnCompleteFuncs(): _ISenderOnComplete {
                let funcs = {
                    xdrOnComplete: (response: IXDomainRequest, oncomplete: OnCompleteCallback) => {
                        return _xdrOnLoad(response, oncomplete);
                    },
                    fetchOnComplete: (response: Response, onComplete: OnCompleteCallback, resValue?: string) => {
                        let status = response.status;
                        return _handleResponse(onComplete, status, {}, resValue);
                    },
                    xhrOnComplete: (request, oncomplete) => {
                        let response = getResponseText(request);
                        return _handleResponse(oncomplete, request.status, {}, response);
                    }
                } as _ISenderOnComplete;
                return funcs;
            }



            function _doOnComplete(oncomplete: OnCompleteCallback, status: number, headers: { [headerName: string]: string }, response?: string) {
                try {
                    oncomplete && oncomplete(status, headers, response);
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
            }



            function _handleResponse(oncomplete: OnCompleteCallback, status: number, headers?: {}, response?: string) {
                if (status == 206 && !_isOneDs) {
                    // for breeze, 206 is partially success, currently consider success
                    // TODO: handle partial success
                    _doOnComplete(oncomplete, 200, headers, response);  // TODO: doc (support partial success)-> partial success add known issue (breeze)
                } else if (status == 204 && _isOneDs) {
                    // one collector
                    _doOnComplete(oncomplete, 200, headers, response);

                } else {
                    _doOnComplete(oncomplete, status, headers, response);
                }

            }

            function _clearScheduledTimer() {
                _retryAt = null;
            }
        
            /**
             * xdr state changes
             */
            function _xdrOnLoad(xdr: IXDomainRequest, oncomplete: OnCompleteCallback){
                const responseText = getResponseText(xdr);
                if (xdr && (responseText + "" === "200" || responseText === "")) {
                    _consecutiveErrors = 0;
                    _onSuccess(responseText, oncomplete);
                } else {
                    const results = parseResponse(responseText, _diagLog);
                    if (results && results.itemsAccepted) {
                        // TODO: onPartial success for appInsights
                        _onSuccess(responseText, oncomplete);

                    } else {
                        _onError(formatErrorMessageXdr(xdr), oncomplete);
                    }
                }
            }
        
        
            function _initDefaults() {
                _self._appId = null;
                _consecutiveErrors = 0;
                _retryAt = null;
                _paused = false;
                _isInitialized = false;
                _core = null;
                _onlineChannelId = null;
                _sendPostMgr = null;
            }
        });
    }

    /**
     * Pause the sending (transmission) of events, this will cause all events to be batched only until the maximum limits are
     * hit at which point new events are dropped. Will also cause events to NOT be sent during page unload, so if Session storage
     * is disabled events will be lost.
     */
    public pause(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Resume the sending (transmission) of events, this will restart the timer and any batched events will be sent using the normal
     * send interval.
     */
    public resume(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, cxt: IProcessTelemetryContext, diagLog: IDiagnosticLogger,  channelId?: string, unloadHookContainer?: IUnloadHookContainer): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

   
    /**
     * Trigger the immediate send of buffered data; If executing asynchronously (the default) this may (not required) return
     * an [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html) that will resolve once the
     * send is complete. The actual implementation of the `IPromise` will be a native Promise (if supported) or the default
     * as supplied by [ts-async library](https://github.com/nevware21/ts-async)
     * @param async - Indicates if the events should be sent asynchronously
     * @param forcedSender - {SenderFunction} - Indicates the forcedSender, undefined if not passed
     * @returns - Nothing or optionally, if occurring asynchronously a [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * which will be resolved (or reject) once the send is complete, the [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * should only be returned when async is true.
     */
    public triggerSend(async = true, forcedSender?: SenderFunction, sendReason?: SendRequestReason): void | IPromise<boolean> {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Check if there are no active requests being sent.
     * @returns True if idle, false otherwise.
     */
    public isCompletelyIdle(): boolean {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * Get current xhr instance
     */
    public getXhrInst(sync?: boolean) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    public _doTeardown (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
