import { AnalyticsPluginTests } from './AnalyticsPlugin.tests';
import { TelemetryItemCreatorTests } from './TelemetryItemCreator.tests';
import { AnalyticsExtensionSizeCheck } from "./AnalyticsExtensionSize.tests";

export function runTests() {
    new AnalyticsPluginTests().registerTests();
    new TelemetryItemCreatorTests().registerTests();
    new AnalyticsExtensionSizeCheck().registerTests();
}
