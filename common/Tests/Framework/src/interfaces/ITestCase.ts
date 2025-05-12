import { IPromise } from "@nevware21/ts-async";
import { IAsyncQueue } from "./IASyncQueue";

/** Defines a test case */
export interface ITestCase {
    /** Name to use for the test case */
    name: string;

    fakeServerAutoRespond?: boolean;

    useFakeServer?: boolean;

    useFakeFetch?: boolean;
    fakeFetchAutoRespond?: boolean;

    useFakeTimers?: boolean;

    /** Test case method */
    test: () => void | PromiseLike<any> | IAsyncQueue;

    /**
     * Timeout in milliseconds for the test case to complete (defaults to 30000 milliseconds),
     * this is the time that the test case is expected to complete in.
     * If the test case does not complete within this time, then the test case will be failed.
     * This value is ignored if the test case returns a promise and the skipTimeout flag is set to true.
     * @default 30000
     * @see skipTimeout
     * @see ITestCaseAsync.timeout
     * @see ITestCaseAsync.skipTimeout
     * */
    timeout?: number;

    /** The polling asserts should use this as the real ms between attempts */
    pollDelay?: number;

    /** Used for debugging, set this value to ignore the automatic timeout for tests that return a promise */
    skipTimeout? : boolean;

    /**
     * Automatically assert that all registered events have been removed
     */
    assertNoEvents?: boolean;

    /**
     * Automatically assert that all hooks have been removed
     */
    assertNoHooks?: boolean;
    
    orgSetTimeout?: (callback: (...args: any[]) => void, ms: number, ...args: any[]) => NodeJS.Timeout;
    orgClearTimeout?: (timeoutId: NodeJS.Timeout) => void;
}
