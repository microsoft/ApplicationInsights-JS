import { AISKUPerf } from "./AISKUPerf.Tests";
//Do not remove this import, it will be used in browser.
import { Snippet } from "../../../src/Initialization";

export function runTests() {
    new AISKUPerf().registerTests();
}