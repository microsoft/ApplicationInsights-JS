import { SenderTests } from "./Sender.tests";
import { SampleTests } from "./Sample.tests";
import { GlobalTestHooks } from "./GlobalTestHooks.Test";

export function runTests() {
    new GlobalTestHooks().registerTests();
    new SenderTests().registerTests();
    new SampleTests().registerTests();
}