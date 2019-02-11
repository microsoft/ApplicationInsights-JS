(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (factory());
}(this, (function () { 'use strict';

    (function (factory) {
        if (typeof module === "object" && typeof module.exports === "object") {
            var v = factory(require, exports);
            if (v !== undefined) module.exports = v;
        }
        else if (typeof define === "function" && define.amd) {
            define(["require", "exports", "applicationinsights-core-js", "applicationinsights-channel-js"], factory);
        }
    })(function (require, exports) {
        Object.defineProperty(exports, "__esModule", { value: true });
        var applicationinsights_core_js_1 = require("applicationinsights-core-js");
        var applicationinsights_channel_js_1 = require("applicationinsights-channel-js");
        var ApplicationInsights = /** @class */ (function () {
            function ApplicationInsights(config) {
                // initialize the queue and config in case they are undefined
                if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(config) || applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(config.instrumentationKey)) {
                    throw new Error("Invalid input configuration");
                }
                this.initialize();
            }
            ApplicationInsights.prototype.initialize = function () {
                this.core = new applicationinsights_core_js_1.AppInsightsCore();
                var extensions = [];
                var appInsightsChannel = new applicationinsights_channel_js_1.Sender();
                extensions.push(appInsightsChannel);
                // initialize core
                this.core.initialize(this.config, extensions);
                // initialize extensions
                appInsightsChannel.initialize(this.config, this.core, extensions);
            };
            ApplicationInsights.prototype.track = function (item) {
                this.core.track(item);
            };
            return ApplicationInsights;
        }());
        exports.ApplicationInsights = ApplicationInsights;
    });

})));
//# sourceMappingURL=aisdklight.js.map
