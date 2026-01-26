// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { dumpObj } from "@microsoft/otel-core-js";

export declare type VersionCheckCallback = (newVersion: string, details: string) => void;

export function checkForUpdate(callback: VersionCheckCallback, currentVer?: string) {
    if (!currentVer && chrome && chrome.runtime) {
        let manifest = chrome.runtime.getManifest();
        currentVer = manifest.version_name || manifest.version || "";
    }

    let newVersionLink = "https://js.monitor.azure.com/";
    let versionCheck = newVersionLink;

    if (currentVer && currentVer.indexOf("-nightly") !== -1) {
        newVersionLink += "nightly/tools/ai.chrome-ext.nightly.zip";
        versionCheck += "nightly/tools/ai.chrome-ext.nightly.integrity.json";
    } else {
        newVersionLink += "release/tools/ai.chrome-ext.zip";
        versionCheck += "release/tools/ai.chrome-ext.integrity.json";
    }

    function _updateCheckFailed(reason: any) {
        console && console.log("Version check failed -- " + reason);
    }
    
    function _checkVersion(value: string) {
        if (value) {
            try {
                let integrity = JSON.parse(value);
                if (currentVer !== integrity.version) {
                    callback && callback(integrity.version, newVersionLink)
                }
            } catch (e) {
                // CDN can return an error which will be HTML
                _updateCheckFailed(dumpObj(e));
            }
        }
    }

    fetch(versionCheck).then((resp) => {
        resp.text().then(_checkVersion, _updateCheckFailed);
    }, _updateCheckFailed);
}
