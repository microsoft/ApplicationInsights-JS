import { OsPluginTest } from './OsPluginTest';

export function runTests() {
    new OsPluginTest().registerTests();
}

runTests();