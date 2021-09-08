import { AISKUSizeCheck } from "../AISKUSize.Tests";
import { ApplicationInsightsTests } from '../applicationinsights.e2e.tests';
import { ApplicationInsightsFetchTests } from '../applicationinsights.e2e.fetch.tests';
import { SanitizerE2ETests } from '../sanitizer.e2e.tests';
import { ValidateE2ETests } from '../validate.e2e.tests';
import { SenderE2ETests } from '../sender.e2e.tests';
import { ApplicationInsightsDeprecatedTests } from '../ApplicationInsightsDeprecatedTests';
import { SnippetLegacyInitializationTests } from '../SnippetLegacyInitialization.Tests';
import { SnippetInitializationTests } from '../SnippetInitialization.Tests';


new AISKUSizeCheck().registerTests();
new ApplicationInsightsTests().registerTests();
new ApplicationInsightsFetchTests().registerTests();
new ApplicationInsightsDeprecatedTests().registerTests();
new SanitizerE2ETests().registerTests();
new ValidateE2ETests().registerTests();
new SenderE2ETests().registerTests();
new SnippetLegacyInitializationTests(false).registerTests();
new SnippetInitializationTests(false).registerTests();
new SnippetLegacyInitializationTests(true).registerTests();
new SnippetInitializationTests(true).registerTests();
