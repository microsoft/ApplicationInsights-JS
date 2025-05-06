import '@microsoft/applicationinsights-shims';
import { PropertiesTests } from "./properties.tests";
import { SessionManagerTests } from "./SessionManager.Tests";
import { PropertiesExtensionSizeCheck } from "./propertiesSize.tests";
import { TelemetryContextTests } from "./TelemetryContext.Tests";
import { GlobalTestHooks } from './GlobalTestHooks.Test';

export function runTests() {
    new GlobalTestHooks().registerTests();
    new PropertiesTests().registerTests();
    new SessionManagerTests(false).registerTests();
    new SessionManagerTests(true).registerTests();
    new PropertiesExtensionSizeCheck().registerTests();
    new TelemetryContextTests().registerTests();
}