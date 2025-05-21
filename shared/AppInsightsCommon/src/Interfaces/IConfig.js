"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationManager = void 0;
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var applicationinsights_core_js_1 = require("@microsoft/applicationinsights-core-js");
var ConfigurationManager = /** @class */ (function () {
    function ConfigurationManager() {
    }
    ConfigurationManager.getConfig = function (config, field, identifier, defaultValue) {
        if (defaultValue === void 0) { defaultValue = false; }
        var configValue;
        if (identifier && config.extensionConfig && config.extensionConfig[identifier] && !(0, applicationinsights_core_js_1.isNullOrUndefined)(config.extensionConfig[identifier][field])) {
            configValue = config.extensionConfig[identifier][field];
        }
        else {
            configValue = config[field];
        }
        return !(0, applicationinsights_core_js_1.isNullOrUndefined)(configValue) ? configValue : defaultValue;
    };
    return ConfigurationManager;
}());
exports.ConfigurationManager = ConfigurationManager;
