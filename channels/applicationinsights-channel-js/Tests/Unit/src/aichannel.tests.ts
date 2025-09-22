import { SenderTests } from "./Sender.tests";
import { SampleTests } from "./Sample.tests";
import { GlobalTestHooks } from "./GlobalTestHooks.Test";
import { SdkStatsTests } from "./SdkStats.tests";

export function runTests() {
    new GlobalTestHooks().registerTests();
    new SenderTests().registerTests();
    new SampleTests().registerTests();
    new SdkStatsTests().registerTests();
}