// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IWatcherHandler, WatcherFunction, _IDynamicConfigHandlerState, _IDynamicDetail, _IInternalDynamicConfigHandler
} from "@microsoft/applicationinsights-common";
import { ITimerHandler, arrForEach, arrIndexOf, dumpObj, newSymbol, scheduleTimeout } from "@nevware21/ts-utils";
import { _eInternalMessageId, eLoggingSeverity } from "../JavaScriptSDK.Enums/LoggingEnums";
import { throwAggregationError } from "../JavaScriptSDK/AggregationError";

const symPrefix = "[[ai_";
const symPostfix = "]]";

export function _createState<T>(cfgHandler: _IInternalDynamicConfigHandler<T>): _IDynamicConfigHandlerState<T> {
    let dynamicPropertySymbol = newSymbol(symPrefix + "get" + cfgHandler.uid + symPostfix);
    let dynamicPropertyReadOnly = newSymbol(symPrefix + "ro" + cfgHandler.uid + symPostfix);
    let dynamicPropertyReferenced = newSymbol(symPrefix + "rf" + cfgHandler.uid + symPostfix);
    let dynamicPropertyBlockValue = newSymbol(symPrefix + "blkVal" + cfgHandler.uid + symPostfix);
    let dynamicPropertyDetail = newSymbol(symPrefix + "dtl" + cfgHandler.uid + symPostfix);
    let _waitingHandlers: IWatcherHandler<T>[] = null;
    let _watcherTimer: ITimerHandler = null;
    let theState: _IDynamicConfigHandlerState<T>;

    function _useHandler(activeHandler: IWatcherHandler<T>, callback: WatcherFunction<T>) {
        let prevWatcher = theState.act;
        try {
            theState.act = activeHandler;
            if (activeHandler && activeHandler[dynamicPropertyDetail]) {
                // Clear out the previously tracked details for this handler, so that access are re-evaluated
                arrForEach(activeHandler[dynamicPropertyDetail], (detail) => {
                    detail.clr(activeHandler);
                });

                activeHandler[dynamicPropertyDetail] = [];
            }

            callback({
                cfg: cfgHandler.cfg,
                set: cfgHandler.set.bind(cfgHandler),
                setDf: cfgHandler.setDf.bind(cfgHandler),
                ref: cfgHandler.ref.bind(cfgHandler),
                rdOnly: cfgHandler.rdOnly.bind(cfgHandler)
            });
        } catch(e) {
            let logger = cfgHandler.logger;
            if (logger) {
                // Don't let one individual failure break everyone
                logger.throwInternal(eLoggingSeverity.CRITICAL, _eInternalMessageId.ConfigWatcherException, dumpObj(e));
            }

            // Re-throw the exception so that any true "error" is reported back to the called
            throw e;
        } finally {
            theState.act = prevWatcher || null;
        }
    }

    function _notifyWatchers() {
        if (_waitingHandlers) {
            let notifyHandlers = _waitingHandlers;
            _waitingHandlers = null;

            // Stop any timer as we are running them now anyway
            _watcherTimer && _watcherTimer.cancel();
            _watcherTimer = null;

            let watcherFailures: any[] = [];

            // Now run the handlers
            arrForEach(notifyHandlers, (handler) => {
                if (handler) {
                    if (handler[dynamicPropertyDetail]) {
                        arrForEach(handler[dynamicPropertyDetail], (detail) => {
                            // Clear out this handler from  previously tracked details, so that access are re-evaluated
                            detail.clr(handler);
                        });

                        handler[dynamicPropertyDetail] = null;
                    }

                    // The handler may have self removed as part of another handler so re-check
                    if (handler.fn) {
                        try {
                            _useHandler(handler, handler.fn);
                        } catch (e) {
                            // Don't let a single failing watcher cause other watches to fail
                            watcherFailures.push(e);
                        }
                    }
                }
            });

            // During notification we may have had additional updates -- so notify those updates as well
            if (_waitingHandlers) {
                try {
                    _notifyWatchers();
                } catch (e) {
                    watcherFailures.push(e);
                }
            }

            if (watcherFailures.length > 0) {
                throwAggregationError("Watcher error(s): ", watcherFailures);
            }
        }
    }

    function _addWatcher(detail: _IDynamicDetail<T>) {
        if (detail && detail.h.length > 0) {
            if (!_waitingHandlers) {
                _waitingHandlers = [];
            }
    
            if (!_watcherTimer) {
                _watcherTimer = scheduleTimeout(() => {
                    _watcherTimer = null;
                    _notifyWatchers();
                }, 0);
            }
    
            // Add all of the handlers for this detail (if not already present) - using normal for-loop for performance
            for (let idx = 0; idx < detail.h.length; idx++) {
                let handler = detail.h[idx];

                // Add this handler to the collection of handlers to re-execute
                if (handler && arrIndexOf(_waitingHandlers, handler) === -1) {
                    _waitingHandlers.push(handler);
                }
            }
        }
    }

    function _trackHandler(handler: IWatcherHandler<T>, detail: _IDynamicDetail<T>) {
        if (handler) {
            let details = handler[dynamicPropertyDetail] = handler[dynamicPropertyDetail] || [];
            if (arrIndexOf(details, detail) === -1) {
                // If this detail is not already listed as tracked then add it so that we re-evaluate it's usage
                details.push(detail);
            }
        }
    }

    theState = {
        prop: dynamicPropertySymbol,
        ro: dynamicPropertyReadOnly,
        rf: dynamicPropertyReferenced,
        blkVal: dynamicPropertyBlockValue,
        hdlr: cfgHandler,
        add: _addWatcher,
        notify: _notifyWatchers,
        use: _useHandler,
        trk: _trackHandler
    };

    return theState;
}
