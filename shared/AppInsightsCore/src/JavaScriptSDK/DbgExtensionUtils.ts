// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IDbgExtension } from "../JavaScriptSDK.Interfaces/IDbgExtension";
import { INotificationListener } from "../JavaScriptSDK.Interfaces/INotificationListener";
import { getGlobalInst } from "./EnvUtils";

const listenerFuncs = [ "eventsSent", "eventsDiscarded", "eventsSendRequest", "perfEvent" ];

let _aiNamespace: any = null;
let _debugListener: INotificationListener;

function _listenerProxyFunc(name: string, config: IConfiguration) {
    return function() {
        let args = arguments;
        let dbgExt = getDebugExt(config);
        if (dbgExt) {
            let listener = dbgExt.listener;
            if (listener && listener[name]) {
                listener[name].apply(listener, args);
            }
        }
    }
}

function _getExtensionNamespace() {
    // Cache the lookup of the global namespace object
    let target = getGlobalInst("Microsoft");
    if (target) {
        _aiNamespace = target["ApplicationInsights"];
    }

    return _aiNamespace;
}

export function getDebugExt(config: IConfiguration): IDbgExtension {
    let ns = _aiNamespace;
    if (!ns && config.disableDbgExt !== true) {
        ns = _aiNamespace || _getExtensionNamespace();
    }

    return ns ? ns["ChromeDbgExt"] : null;
}

export function getDebugListener(config: IConfiguration): INotificationListener {
    if (!_debugListener) {
        _debugListener = {};
        for (let lp = 0; lp < listenerFuncs.length; lp++) {
            _debugListener[listenerFuncs[lp]] = _listenerProxyFunc(listenerFuncs[lp], config);
        }
    }

    return _debugListener;
}