import { ApplicationInsightsTests } from '../ApplicationInsights.tests';
import { TelemetryItemCreatorTests } from '../TelemetryItemCreator.tests';

export function runTests() {
    new ApplicationInsightsTests().registerTests();
    new TelemetryItemCreatorTests().registerTests();
}
