import { CfgSyncHelperTests } from "./cfgsynchelper.tests";
import {CfgSyncPluginTests}  from "./cfgsyncplugin.tests";
import { GlobalTestHooks } from "./GlobalTestHooks.Test";

export function runTests() {
    new GlobalTestHooks().registerTests();
    new CfgSyncPluginTests().registerTests();
    new CfgSyncHelperTests().registerTests();
}
