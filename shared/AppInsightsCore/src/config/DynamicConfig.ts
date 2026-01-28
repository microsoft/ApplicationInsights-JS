// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { dumpObj, isUndefined, objDefine, objForEachKey } from "@nevware21/ts-utils";
import { _eInternalMessageId, eLoggingSeverity } from "../JavaScriptSDK.Enums/LoggingEnums";
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { createUniqueNamespace } from "../JavaScriptSDK/DataCacheHelper";
import { STR_NOT_DYNAMIC_ERROR } from "../JavaScriptSDK/InternalConstants";
import { _applyDefaultValue } from "./ConfigDefaults";
import {
    _eSetDynamicPropertyFlags, _makeDynamicObject, _setDynamicProperty, _setDynamicPropertyState, _throwDynamicError
} from "./DynamicProperty";
import { _createState } from "./DynamicState";
import { CFG_HANDLER_LINK, _cfgDeepCopy, getDynamicConfigHandler, throwInvalidAccess } from "./DynamicSupport";
import { IConfigDefaults } from "./IConfigDefaults";
import { IDynamicConfigHandler, _IInternalDynamicConfigHandler } from "./IDynamicConfigHandler";
import { IWatcherHandler, WatcherFunction } from "./IDynamicWatcher";
import { _IDynamicConfigHandlerState } from "./_IDynamicConfigHandlerState";

/**
 * Identifies a function which will be re-called whenever any of it's accessed configuration values
 * change.
 * @param configHandler - The callback that will be called for the initial request and then whenever any
 * accessed configuration changes are identified.
 */
function _createAndUseHandler<T>(state: _IDynamicConfigHandlerState<T>, configHandler: WatcherFunction<T>): IWatcherHandler<T> {
    let handler: IWatcherHandler<T> = {
        fn: configHandler,
        rm: function () {
            // Clear all references to the handler so it can be garbage collected
            // This will also cause this handler to never get called and eventually removed
            handler.fn = null;
            state = null;
            configHandler = null;
        }
    };

    objDefine<any>(handler, "toJSON", { v: () => "WatcherHandler" + (handler.fn ? "" : "[X]") });

    state.use(handler, configHandler);

    return handler;
}

/**
 * Creates the dynamic config handler and associates with the target config as the root object
 * @param target - The config that you want to be root of the dynamic config
 * @param inPlace - Should the passed config be converted in-place or a new proxy returned
 * @returns The existing dynamic handler or a new instance with the provided config values
 */
function _createDynamicHandler<T = IConfiguration>(logger: IDiagnosticLogger, target: T, inPlace: boolean) : IDynamicConfigHandler<T> {
    let dynamicHandler = getDynamicConfigHandler<T, T>(target);
    if (dynamicHandler) {
        // The passed config is already dynamic so return it's tracker
        return dynamicHandler;
    }

    let uid = createUniqueNamespace("dyncfg", true);

    let newTarget = (target && inPlace !== false) ? target : _cfgDeepCopy(target);
    let theState: _IDynamicConfigHandlerState<T>;

    function _notifyWatchers() {
        theState.notify();
    }

    function _setValue<C, V>(target: C, name: string, value: V) {
        try {
            target = _setDynamicProperty(theState, target, name, value);
        } catch (e) {
            // Unable to convert to dynamic property so just leave as non-dynamic
            _throwDynamicError(logger, name, "Setting value", e);
        }

        return target[name];
    }

    function _watch(configHandler: WatcherFunction<T>) {
        return _createAndUseHandler(theState, configHandler);
    }

    function _block(configHandler: WatcherFunction<T>, allowUpdate?: boolean) {
        theState.use(null, (details) => {
            let prevUpd = theState.upd;
            try {
                if (!isUndefined(allowUpdate)) {
                    theState.upd = allowUpdate;
                }

                configHandler(details);
            } finally {
                theState.upd = prevUpd;
            }
        });
    }

    function _ref<C>(target: C, name: string) {
        // Make sure it's dynamic and mark as referenced with it's current value
        return _setDynamicPropertyState(theState, target, name, { [_eSetDynamicPropertyFlags.inPlace]: true })[name];
    }

    function _rdOnly<C>(target: C, name: string) {
        // Make sure it's dynamic and mark as readonly with it's current value
        return _setDynamicPropertyState(theState, target, name, { [_eSetDynamicPropertyFlags.readOnly]: true })[name];
    }

    function _blkPropValue<C>(target: C, name: string) {
        // Make sure it's dynamic and mark as readonly with it's current value
        return _setDynamicPropertyState(theState, target, name, { [_eSetDynamicPropertyFlags.blockDynamicProperty]: true })[name];
    }

    function _applyDefaults<C>(theConfig: C, defaultValues: IConfigDefaults<C, T>): C {
        if (defaultValues) {
            // Resolve/apply the defaults
            objForEachKey(defaultValues, (name: string, value: any) => {
                // Sets the value and makes it dynamic (if it doesn't already exist)
                _applyDefaultValue(cfgHandler, theConfig, name, value);
            });
        }
    
        return theConfig;
    }

    let cfgHandler: _IInternalDynamicConfigHandler<T> = {
        uid: null,      // Will get replaced with a get property to ensure it's readonly nature
        cfg: newTarget,
        logger: logger,
        notify: _notifyWatchers,
        set: _setValue,
        setDf: _applyDefaults,
        watch: _watch,
        ref: _ref,
        rdOnly: _rdOnly,
        blkVal: _blkPropValue,
        _block: _block
    };

    objDefine(cfgHandler, "uid", {
        c: false,
        e: false,
        w: false,
        v: uid
    });

    theState = _createState(cfgHandler);

    // Setup tracking for all defined default keys
    _makeDynamicObject(theState, newTarget, "config", "Creating");

    return cfgHandler;
}

/**
 * Log an invalid access message to the console
 */
function _logInvalidAccess(logger: IDiagnosticLogger, message: string) {
    if (logger) {
        logger.warnToConsole(message);
        logger.throwInternal(eLoggingSeverity.WARNING, _eInternalMessageId.DynamicConfigException, message);
    } else {
        // We don't have a logger so just throw an exception
        throwInvalidAccess(message);
    }
}

/**
 * Create or return a dynamic version of the passed config, if it is not already dynamic
 * @param config - The config to be converted into a dynamic config
 * @param defaultConfig - The default values to apply on the config if the properties don't already exist
 * @param inPlace - Should the config be converted in-place into a dynamic config or a new instance returned, defaults to true
 * @returns The dynamic config handler for the config (whether new or existing)
 */
export function createDynamicConfig<T = IConfiguration>(config: T, defaultConfig?: IConfigDefaults<T>, logger?: IDiagnosticLogger, inPlace?: boolean): IDynamicConfigHandler<T> {
    let dynamicHandler = _createDynamicHandler<T>(logger, config || {} as T, inPlace);

    if (defaultConfig) {
        dynamicHandler.setDf(dynamicHandler.cfg, defaultConfig);
    }

    return dynamicHandler;
}

/**
 * Watch and track changes for accesses to the current config, the provided config MUST already be
 * a dynamic config or a child accessed via the dynamic config
 * @param logger - The logger instance to use if there is no existing handler
 * @returns A watcher handler instance that can be used to remove itself when being unloaded
 * @throws TypeError if the provided config is not a dynamic config instance
 */
export function onConfigChange<T = IConfiguration>(config: T, configHandler: WatcherFunction<T>, logger?: IDiagnosticLogger): IWatcherHandler<T> {
    let handler: IDynamicConfigHandler<T> = config[CFG_HANDLER_LINK] || config;
    if (handler.cfg && (handler.cfg === (config as any) || handler.cfg[CFG_HANDLER_LINK] === handler)) {
        return handler.watch(configHandler);
    }

    _logInvalidAccess(logger, STR_NOT_DYNAMIC_ERROR + dumpObj(config));

    return createDynamicConfig(config, null, logger).watch(configHandler);
}
