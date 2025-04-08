// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { objForEachKey } from "@microsoft/applicationinsights-core-js";
import { IPopupSettings } from "./IPopupSettings";
import { doAwait } from "@nevware21/ts-async";

const popupWindowSettingsCacheKey = "popupWindowSettings";

export function getPopupSettings() : IPopupSettings {
    let settings = {
        width: 680,
        height: 860
    };

    doAwait(chrome.storage.local.get([popupWindowSettingsCacheKey]), (popupSettings: any) => {
        if (popupSettings && popupSettings[popupWindowSettingsCacheKey]) {
            try {
                settings = JSON.parse(popupSettings[popupWindowSettingsCacheKey]);
            } catch (e) {
                // Just ignore failures and we fallback to the defaults
            }
        }
        if (!settings.width) {
            settings.width = 750;
        }
        return settings;
    });
    return settings;
}

function _setPopupSettings(newSettings: IPopupSettings) {
    let settings = getPopupSettings();

    // Merge the new settings, only support "expected" keys as defined by the default
    objForEachKey(newSettings, (name, value) => {
        if (value && name in settings) {
            settings[name] = value;
        }
    });
    chrome.storage.local.set({ [popupWindowSettingsCacheKey]: JSON.stringify(settings) });
}

export function setPopupSize(width?: number, height?: number) {
    _setPopupSettings({ width, height });
}
