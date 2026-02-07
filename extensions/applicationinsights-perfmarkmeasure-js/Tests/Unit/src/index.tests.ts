import { MarkMeasureTests } from "./MarkMeasureTests";
import { GlobalTestHooks } from "./GlobalTestHooks.Test";

export function runTests() {
    new GlobalTestHooks().registerTests();
    new MarkMeasureTests().registerTests();
}
