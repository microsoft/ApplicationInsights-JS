import { SenderTests } from "./Sender.tests";
import { SampleTests } from "./Sample.tests";
import { StatsbeatTests } from "./Statsbeat.tests";

export function runTests() {
    new SenderTests().registerTests();
    new SampleTests().registerTests();
    new StatsbeatTests().registerTests();
}