// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    BaseTelemetryPlugin, IConfiguration, arrForEach,
    IAppInsightsCore, IPlugin, ITelemetryItem, IProcessTelemetryContext, _InternalLogMessage, _InternalMessageId,
    ITelemetryPluginChain, InstrumentFunc, IInstrumentCallDetails, InstrumentorHooksCallback, IPerfEvent, IChannelControls, objForEachKey, isFunction, dateNow, isArray, isUndefined
} from '@microsoft/applicationinsights-core-js';
import { Dashboard } from './components/Dashboard';
import { getTargetName } from './components/helpers';
import { permStyle } from './components/styleNodeSrc';
import { DebugBin, DebugBinParent } from './components/debugBins';
import dynamicProto from "@microsoft/dynamicproto-js";
import { IDebugPluginConfig } from './interfaces/IDebugPluginConfig';

interface IDebugConfig {

    trackers?: () => string[];

    excludeKeys?: () => string[];

    cssPrefix?: () => string;

    disableNotifications?: () => boolean;

    dumpToConsole?: () => boolean;

    maxMessages?: () => number;

    showFunctions?: () => boolean;
}

const getDefaultConfig = (): IDebugConfig => {
    const config = {
        trackers: () => [
            'flush',
            'track',
            'trackEvent',
            'trackPageView',
            'trackPageViewPerformance',
            'trackException',
            'trackTrace',
            'trackMetric',
            'trackDependencyData',
            'processTelemetry',
            'throwInternal',
            'logInternalMessage',
            'triggerSend',
            '_sender',
            'perfEvent',
            'initialize'
        ],
        excludeKeys: () => [
            "_dynInstFuncs",
            "_getTelCtx",
            "_baseTelInit",
            "diagLog",
            "isInitialized",
            "setInitialized",
            "setNextPlugin",
            "processNext"
        ],
        cssPrefix: () => 'ai',
        disableNotifications: () => false,
        dumpToConsole: () => false,
        maxMessages: () => 5000,
        showFunctions: () => false
    };

    return config;
}

export default class DebugPlugin extends BaseTelemetryPlugin {

    public static identifier: string = "DebugPlugin";

    public identifier: string = DebugPlugin.identifier;

    constructor() {
        super();
        let dashboard: Dashboard;

        /**
         * the style that will be permanently embedded in the webpage
         * TODO: manage style conflicts (prepend unique ID to relevant class names?)
         */
        let permStyleEl: HTMLStyleElement;

        /**
         * an object containing the individual debug bin items
         */
        let debugBins: {
            [key: string]: DebugBin;
        };

        /**
         * the parent containing all the individual debugBins
         */
        let debugBinParent: DebugBinParent;

        /**
         * the different telemetry functions that will be tracked
         */
        let trackers: string[];

        /**
         * timestamp used to track number of seconds since webpage was loaded
         */
        let startTime: number = +new Date();

        /**
         * the config for this plugin
         */
        let _theConfig: IDebugConfig = {};

        dynamicProto(DebugPlugin, this, (_self, base) => {
            _self.initialize = (config: IConfiguration | IDebugPluginConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) => {
                if (!_self.isInitialized()) {
                    base.initialize(config, core, extensions, pluginChain);

                    const defaultConfig = getDefaultConfig();
                    const ctx = _self._getTelCtx();
                    const identifier = _self.identifier;
                    objForEachKey(defaultConfig, (field, value) => {
                        _theConfig[field] = () => ctx.getConfig(identifier, field, value());
                    });

                    let foundTrackers: string[] = [];
                    trackers = _theConfig.trackers();
                    let prefix = _theConfig.cssPrefix();

                    // 1. Listen to Notifications
                    if (!_theConfig.disableNotifications()) {
                        let notifyMgr = (isFunction(core.getNotifyMgr) && core.getNotifyMgr()) || core["_notificationManager"];
                        if (notifyMgr) {
                            notifyMgr.addNotificationListener({
                                eventsSent: (events: ITelemetryItem[]) => {
                                    dashboard.newLogEntry(events, dateNow() - startTime, 'Notification:eventsSent', 0, 'eventsSent');
                                },
                                eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                                    dashboard.newLogEntry({
                                        events,
                                        reason
                                    }, dateNow() - startTime, 'Notification:eventsDiscarded', 0, 'eventsDiscarded');
    
                                },
                                eventsSendRequest: (sendReason: number, isAsync: boolean): void => {
                                    dashboard.newLogEntry({
                                        sendReason,
                                        isAsync
                                    }, dateNow() - startTime, 'Notification:eventsSendRequest', 0, 'eventsSendRequest');
                                },
                                perfEvent: (perfEvent: IPerfEvent): void => {
                                    let evtName = `Notification:perfEvent[${perfEvent.name}]`;
                                    dashboard.newLogEntry(
                                        perfEvent,
                                        dateNow() - startTime, evtName, 0, 'perfEvent');
                                }
                            });

                            if (trackers.indexOf("eventsSent") !== -1) {
                                foundTrackers.push("eventsSent");
                            }
                            if (trackers.indexOf("eventsSendRequest") !== -1) {
                                foundTrackers.push("eventsSendRequest");
                            }
                            if (trackers.indexOf("eventsDiscarded") !== -1) {
                                foundTrackers.push("eventsDiscarded");
                            }
                            if (trackers.indexOf("perfEvent") !== -1) {
                                foundTrackers.push("perfEvent");
                            }
                        }
                    }

                    // 2. Get all of the extensions and channels
                    debugBins = {};
                    let targetObjects: any[] = [core, _self.diagLog()];

                    // Get all of the config extensions
                    if (config.extensions) {
                        arrForEach(config.extensions, (ext) => {
                            _addTargets(targetObjects, ext);
                        });
                    }

                    // Get all of the passed extensions
                    if (extensions) {
                        arrForEach(extensions, (ext) => {
                            _addTargets(targetObjects, ext);
                        });
                    }

                    if (isFunction(core.getTransmissionControls)) {
                        let channelControls: IChannelControls[][] = core.getTransmissionControls();
                        if (channelControls) {
                            arrForEach(channelControls, (channel) => {
                                if (isArray(channel)) {
                                    arrForEach(channel, (theChannel) => {
                                        _addTargets(targetObjects, theChannel);
                                    });
                                }
                            });
                        }
                    }

                    // 3. Instrument the functions
                    arrForEach(trackers, (tracker: string) => {
                        arrForEach(targetObjects, (target, idx) => {
                            let val = InstrumentFunc(target, tracker, {
                                req: _handleInstPreHook() as any as () => InstrumentorHooksCallback,
                                rsp: _handleInstPostHook() as any as () => InstrumentorHooksCallback
                            }, true);

                            if (val) {
                                if (foundTrackers.indexOf(tracker) === -1) {
                                    foundTrackers.push(tracker);
                                }
                            }
                        });
                    });

                    // Sort the items
                    foundTrackers = foundTrackers.sort();

                    // 4. Create the Dashboard
                    dashboard = new Dashboard({
                        prefix, 
                        trackers: foundTrackers,
                        excludeKeys: _theConfig.excludeKeys(),
                        maxMessages: _theConfig.maxMessages(),
                        includeFunctions: _theConfig.showFunctions()
                    });

                    // 5. setup debugBin
                    const debugBinContainer = document.createElement("div");
                    debugBinContainer.className = `${prefix}-debug-bin-container`;
                    debugBinParent = new DebugBinParent(debugBinContainer, [], 0, prefix);

                    arrForEach(foundTrackers, (tracker, idx) => {
                        debugBins[tracker] = new DebugBin(tracker, 0, debugBinParent, (idx + 1) * 50);
                    });

                    // 6. append permanent style
                    permStyleEl = document.createElement("style");
                    permStyleEl.innerHTML = permStyle(prefix);
                    document.head.appendChild(permStyleEl);

                    // 7. add button to debugBinParent
                    debugBinParent.addButton((evt: MouseEvent) => {
                        evt.stopPropagation();

                        if (dashboard.isDisplayed()) {
                            dashboard.hide();
                        } else {
                            dashboard.show();
                        }
                    }, 'show dashboard');

                    document.body.appendChild(
                        debugBinContainer
                    );

                    // 8. Log the config as "keep" so it won't be dropped or cleared
                    dashboard.newLogEntry(config, 0, 'config', 0, 'config', true);
                }
            }

            function _addTarget(targetObjects: any[], ext:any) {
                if (ext && targetObjects.indexOf(ext) === -1) {
                    targetObjects.push(ext);
                    return true;
                }

                return false;
            }

            function _addTargets(targetObjects: any[], ext:any) {
                if (_addTarget(targetObjects, ext)) {
                    if (isFunction(ext["_getDbgPlgTargets"])) {
                        let extra = ext["_getDbgPlgTargets"]();
                        if (isArray(extra)) {
                            arrForEach(extra, (tgt) => {
                                _addTargets(targetObjects, tgt);
                            });
                        }
                    }
                }
            }

            function _createInstrumentObject(funcArgs: IInstrumentCallDetails, orgArgs: any[]) {
                let result: any = {
                    funcName: funcArgs.name,
                    inst: funcArgs.inst, 
                };
                if (orgArgs && orgArgs.length) {
                    result.args = orgArgs;
                }
                if (!isUndefined(funcArgs.err)) {
                    result.err = funcArgs.err;
                }
                if (!isUndefined(funcArgs.rslt)) {
                    result.rslt = funcArgs.rslt;
                }

                return result;
            }

            function _getEvtPrefix(funcArgs: IInstrumentCallDetails) {
                let identifier = getTargetName(funcArgs.inst);
                let evtPrefix = funcArgs.name;
                if (identifier) {
                    evtPrefix += ':' + identifier;
                }

                return evtPrefix;
            }

            function _handleInstPreHook() {
                return (funcArgs: IInstrumentCallDetails, ...orgArgs: any[]) => {
                    (debugBins[funcArgs.name] || debugBins.default).increment();
                    if (funcArgs.name === 'trackException' && !debugBinParent.showChildren) {
                        debugBinParent.addClassToEl('notify');
                    }

                    let evtPrefix = _getEvtPrefix(funcArgs);
                    dashboard.newLogEntry(_createInstrumentObject(funcArgs, orgArgs), dateNow() - startTime, `${evtPrefix}`, 0, funcArgs.name);
                    if (_theConfig.dumpToConsole() && console && console.log) {
                        console.log(`[${evtPrefix}] preProcess - funcArgs: `, funcArgs);
                        console.log(`[${evtPrefix}] preProcess - orgArgs: `, orgArgs);
                    }
                }
            }

            function _handleInstPostHook() {
                return (funcArgs: IInstrumentCallDetails, ...orgArgs: any[]) => {
                    if (!isUndefined(funcArgs.err)) {
                        let evtPrefix = _getEvtPrefix(funcArgs);

                        if (!debugBinParent.showChildren) {
                            debugBinParent.addClassToEl('notify');
                        }
    
                        // The called function threw an exception
                        dashboard.newLogEntry(_createInstrumentObject(funcArgs, orgArgs), dateNow() - startTime, `${evtPrefix}`, 0, funcArgs.name)
                        if (_theConfig.dumpToConsole() && console && console.log) {
                            console.log(`[${evtPrefix}] complete`);
                        }
                    }
                }
            }

            _self.processTelemetry = (event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                if (_theConfig.dumpToConsole() && console && console.log) {
                    console.log(`[${_self.identifier}:processTelemetry] complete`);
                }

                if (!debugBins['processTelemetry']) {
                    dashboard.newLogEntry(event, dateNow() - startTime, `[${_self.identifier}:processTelemetry[${event.baseType}]`, 0, 'processTelemetry');
                }
                _self.processNext(event, itemCtx);
            }
        });
    }

    public initialize(config: IConfiguration | IDebugPluginConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    processTelemetry(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}