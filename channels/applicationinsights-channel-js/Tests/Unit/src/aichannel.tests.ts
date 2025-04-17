import { SenderTests } from "./Sender.tests";
import { SampleTests } from "./Sample.tests";
import { GlobalTestHooks } from "./GlobalTestHooks.Test";
import { StatsbeatTests } from "./StatsBeat.tests";

export function runTests() {
    new GlobalTestHooks().registerTests();
    new SenderTests().registerTests();
    new SampleTests().registerTests();
    // new StatsbeatTests().registerTests();
}