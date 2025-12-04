import { AISKUSizeCheck } from "./AISKUSize.Tests";
import { ApplicationInsightsTests } from "./applicationinsights.e2e.tests";
import { ApplicationInsightsFetchTests } from "./applicationinsights.e2e.fetch.tests";
import { CdnPackagingChecks } from "./CdnPackaging.tests";
import { GlobalTestHooks } from "./GlobalTestHooks.Test";
import { SanitizerE2ETests } from "./sanitizer.e2e.tests";
import { ValidateE2ETests } from "./validate.e2e.tests";
import { SenderE2ETests } from "./sender.e2e.tests";
import { SnippetInitializationTests } from "./SnippetInitialization.Tests";
import { CdnThrottle} from "./CdnThrottle.tests";
import { ThrottleSentMessage } from "./ThrottleSentMessage.tests";
import { IAnalyticsConfigTests } from "./IAnalyticsConfig.Tests";
import { StartSpanTests } from "./StartSpan.Tests";
import { UseSpanTests } from "./UseSpan.Tests";
import { WithSpanTests } from "./WithSpan.Tests";
import { SpanContextPropagationTests } from "./SpanContextPropagation.Tests";
import { SpanLifeCycleTests } from "./SpanLifeCycle.Tests"
import { TelemetryItemGenerationTests } from "./TelemetryItemGeneration.Tests";
import { SpanErrorHandlingTests } from "./SpanErrorHandling.Tests";
import { SpanUtilsTests } from "./SpanUtils.Tests";
import { SpanE2ETests } from "./SpanE2E.Tests";
import { NonRecordingSpanTests } from "./NonRecordingSpan.Tests";

export function runTests() {
    new GlobalTestHooks().registerTests();
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
    new IAnalyticsConfigTests().registerTests();
    new StartSpanTests().registerTests();
    new WithSpanTests().registerTests();
    new UseSpanTests().registerTests();
    new SpanContextPropagationTests().registerTests();
    new SpanLifeCycleTests().registerTests();
    new TelemetryItemGenerationTests().registerTests();
    new SpanErrorHandlingTests().registerTests();
    new SpanUtilsTests().registerTests();
    new SpanE2ETests().registerTests();
    new NonRecordingSpanTests().registerTests();
}