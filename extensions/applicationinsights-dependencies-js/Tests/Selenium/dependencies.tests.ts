import { AjaxTests, AjaxPerfTests, AjaxFrozenTests } from "./ajax.tests";

export function runTests() {
    new AjaxTests().registerTests();
    new AjaxPerfTests().registerTests();
    // The frozen tests are browser only as Phantom JS doesn't support enought of the spec to fail correctly
    //new AjaxFrozenTests().registerTests();
}