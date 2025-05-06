import { AjaxTests, AjaxPerfTrackTests, AjaxFrozenTests } from "./ajax.tests";
import { GlobalTestHooks } from "./GlobalTestHooks.Test";

export function runTests() {
    new GlobalTestHooks().registerTests();
    new AjaxTests().registerTests();
    new AjaxPerfTrackTests().registerTests();
    new AjaxFrozenTests().registerTests();
}