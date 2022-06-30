// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { objForEachKey } from "@microsoft/applicationinsights-core-js";
import { IPopupSettings } from "./IPopupSettings";

const popupWindowSettingsCacheKey = "popupWindowSettings";


export function getPopupSettings() : IPopupSettings {
    let settings = {
        width: 680,
        height: 860
    };

    let popupSettings = localStorage.getItem(popupWindowSettingsCacheKey);
    if (popupSettings) {
        try {
            settings = JSON.parse(popupSettings);
        } catch (e) {
            // Just ignore failures and we fallback to the defaults
        }
    }

    if (!settings.width) {
        settings.width = 750;
    }

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

    localStorage.setItem(popupWindowSettingsCacheKey, JSON.stringify(settings));
}

export function setPopupSize(width?: number, height?: number) {
    _setPopupSettings({ width, height });
}
