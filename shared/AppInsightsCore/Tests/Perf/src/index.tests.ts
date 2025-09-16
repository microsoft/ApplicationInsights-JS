import '@microsoft/applicationinsights-shims';
import { CorePerfCheckTests } from './CorePerfCheck.Tests';

export function runTests() {
    new CorePerfCheckTests().registerTests();
}