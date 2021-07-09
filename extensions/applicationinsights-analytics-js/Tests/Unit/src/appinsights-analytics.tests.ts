import { ApplicationInsightsTests } from './ApplicationInsights.tests';
import { TelemetryItemCreatorTests } from './TelemetryItemCreator.tests';
import { AnalyticsExtensionSizeCheck } from "./AnalyticsExtensionSize.tests";

export function runTests() {
    new ApplicationInsightsTests().registerTests();
    new TelemetryItemCreatorTests().registerTests();
    new AnalyticsExtensionSizeCheck().registerTests();
}
