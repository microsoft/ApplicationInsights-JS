module Microsoft.ApplicationInsights {
    "use strict";

    export class DataLossAnalyzer {
        static enabled = false;
        static appInsights: Microsoft.ApplicationInsights.AppInsights;

        static reset() {
            sessionStorage.setItem("itemsQueued", "0");
        }

        private static isEnabled(): boolean {
            return DataLossAnalyzer.enabled && (DataLossAnalyzer.appInsights != null);
        }

        static itemQueued() {
            try {
                if (DataLossAnalyzer.isEnabled() && sessionStorage && sessionStorage.getItem && sessionStorage.setItem) {
                    var itemsQueued = sessionStorage.getItem("itemsQueued");
                    itemsQueued = itemsQueued || 0;
                    ++itemsQueued;
                    sessionStorage.setItem("itemsQueued", itemsQueued);
                }
            } catch (e) { }
        }

        static itemsSentSuccessfully(countOfItemsSentSuccessfully: number) {
            try {
                if (DataLossAnalyzer.isEnabled() && sessionStorage && sessionStorage.getItem && sessionStorage.setItem) {
                    var itemsQueued = sessionStorage.getItem("itemsQueued");
                    itemsQueued = itemsQueued
                        ? (itemsQueued - countOfItemsSentSuccessfully)
                        : 0;
                    sessionStorage.setItem("itemsQueued", itemsQueued);
                }
            } catch (e) { }
        }

        static getNumberOfLostItems(): number {
            var result = 0;
            try {
                if (DataLossAnalyzer.isEnabled() && sessionStorage && sessionStorage.getItem && sessionStorage.setItem) {
                    var itemsQueued = sessionStorage.getItem("itemsQueued");
                    itemsQueued = itemsQueued || 0;
                    result = itemsQueued;
                }
            } catch (e) {
                result = 0;
            }

            return result;
        }

        static reportLostItems() {
            try {
                if (DataLossAnalyzer.isEnabled() && DataLossAnalyzer.getNumberOfLostItems() > 0) {
                    DataLossAnalyzer.appInsights.trackTrace(
                        "AI (Internal): Internal error DATALOSS: "
                        + DataLossAnalyzer.getNumberOfLostItems()
                        , null);
                    DataLossAnalyzer.appInsights.flush();
                }
            } catch (e) {
                _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.CRITICAL, "Failed to report data loss: " + Util.dump(e));
            }
            finally {
                try {
                    DataLossAnalyzer.reset();
                } catch (e) { }
            }
        }
    }
}
