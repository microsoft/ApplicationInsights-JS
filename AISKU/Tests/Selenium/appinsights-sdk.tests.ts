import { ApplicationInsightsTests } from '../applicationinsights.e2e.tests';
import { SanitizerE2ETests } from '../sanitizer.e2e.tests';

new ApplicationInsightsTests().registerTests();
new SanitizerE2ETests().registerTests();
