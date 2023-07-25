import { CoreTest } from './CoreTest';
import { ESPromiseTests } from './ESPromiseTests';
import { ESPromiseSchedulerTests } from './ESPromiseSchedulerTests';
import { DynamicProtoTests } from './DynamicProtoTests';
import { UtilsTest } from './UtilsTest';
import { ValueSanitizerTests } from './ValueSanitizerTests';
import {FileSizeCheckTest} from './FileSizeCheckTest'



export function registerTests() {
    new CoreTest('CoreTest').registerTests();
    new ESPromiseTests('ESPromiseTests').registerTests();
    new ESPromiseSchedulerTests('ESPromiseSchedulerTests').registerTests();
    new DynamicProtoTests('DynamicProtoTests').registerTests();
    new UtilsTest('UtilsTest').registerTests();
    new ValueSanitizerTests('ValueSanitizerTests').registerTests();
    new FileSizeCheckTest('FileSizeCheckTest').registerTests();
}

registerTests();
