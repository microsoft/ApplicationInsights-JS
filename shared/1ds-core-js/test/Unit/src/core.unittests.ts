import { FileSizeCheckTest } from './FileSizeCheckTest';

export function registerTests() {
    new FileSizeCheckTest('FileSizeCheckTest').registerTests();
}

registerTests();
