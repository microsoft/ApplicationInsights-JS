import { AISKUSizeCheck } from "./AISKUSize.Tests";
import { ApplicationInsightsTests } from './applicationinsights.e2e.tests';
import { ApplicationInsightsFetchTests } from './applicationinsights.e2e.fetch.tests';
import { CdnPackagingChecks } from './CdnPackaging.tests';
import { SanitizerE2ETests } from './sanitizer.e2e.tests';
import { ValidateE2ETests } from './validate.e2e.tests';
import { SenderE2ETests } from './sender.e2e.tests';
import { SnippetInitializationTests } from './SnippetInitialization.Tests';
import { CdnThrottle} from "./CdnThrottle.tests";
import { ThrottleSentMessage } from "./ThrottleSentMessage.tests";

export function runTests() {
    new AISKUSizeCheck().registerTests();
    new ApplicationInsightsTests().registerTests();
    new ApplicationInsightsFetchTests().registerTests();
    new CdnPackagingChecks().registerTests();
    new SanitizerE2ETests().registerTests();
    new ValidateE2ETests().registerTests();
    new SenderE2ETests().registerTests();
    new SnippetInitializationTests(false).registerTests();
    new SnippetInitializationTests(true).registerTests();
    new ThrottleSentMessage().registerTests();
    new CdnThrottle().registerTests();
}