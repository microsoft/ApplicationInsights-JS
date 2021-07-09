import { AjaxTests, AjaxPerfTrackTests, AjaxFrozenTests } from "./ajax.tests";

export function runTests() {
    new AjaxTests().registerTests();
    new AjaxPerfTrackTests().registerTests();
    new AjaxFrozenTests().registerTests();
}