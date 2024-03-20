import { TeeChannelCoreTests } from "./TeeChannelCore.Tests";
import { GlobalTestHooks } from "./GlobalTestHooks.Test";

export function runTests() {
    new GlobalTestHooks().registerTests();
    new TeeChannelCoreTests().registerTests();
}