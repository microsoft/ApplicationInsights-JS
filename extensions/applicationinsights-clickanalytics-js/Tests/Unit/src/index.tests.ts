import { ClickEventTest } from './ClickEventTest';
import { GlobalTestHooks } from './GlobalTestHooks.Test';

export function runTests() {
    new GlobalTestHooks().registerTests();
    new ClickEventTest().registerTests();
}
