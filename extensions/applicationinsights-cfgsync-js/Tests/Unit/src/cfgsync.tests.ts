import { CfgSyncHelperTests } from "./cfgsynchelper.tests";
import {CfgSyncPluginTests}  from "./cfgsyncplugin.tests";

export function runTests() {
    new CfgSyncPluginTests().registerTests();
    new CfgSyncHelperTests().registerTests();
}