import { SenderTests } from "./Sender.tests";
import { SampleTests } from "./Sample.tests";
import { GlobalTestHooks } from "./GlobalTestHooks.Test";
import { InternalSdkStatsTests } from "./InternalSdkStats.tests";

export function runTests() {
    new GlobalTestHooks().registerTests();
    new SenderTests().registerTests();
    new SampleTests().registerTests();
    new InternalSdkStatsTests().registerTests();
}