import { AjaxTests, AjaxPerfTrackTests, AjaxFrozenTests } from "./ajax.tests";
import { GlobalTestHooks } from "./GlobalTestHooks.Test";
import { W3CTraceStateDependencyTests } from "./W3CTraceStateDependency.tests";

export function runTests() {
    new GlobalTestHooks().registerTests();
    new AjaxTests().registerTests();
    new AjaxPerfTrackTests().registerTests();
    new AjaxFrozenTests().registerTests();
    new W3CTraceStateDependencyTests().registerTests();
}