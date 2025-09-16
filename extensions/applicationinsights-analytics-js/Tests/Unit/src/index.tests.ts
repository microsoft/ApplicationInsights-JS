import { AnalyticsPluginTests } from './AnalyticsPlugin.tests';
import { TelemetryItemCreatorTests } from './TelemetryItemCreator.tests';
import { AnalyticsExtensionSizeCheck } from "./AnalyticsExtensionSize.tests";
import { GlobalTestHooks } from "./GlobalTestHooks.Test";

export function runTests() {
    new GlobalTestHooks().registerTests();
    new AnalyticsPluginTests().registerTests();
    new TelemetryItemCreatorTests().registerTests();
    new AnalyticsExtensionSizeCheck().registerTests();
}
