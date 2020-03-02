import { AjaxTests, AjaxPerfTests } from "./ajax.tests";

export function runTests() {
    new AjaxTests().registerTests();
    new AjaxPerfTests().registerTests();
}