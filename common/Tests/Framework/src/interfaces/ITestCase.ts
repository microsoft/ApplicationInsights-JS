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
    test: () => void|any|PromiseLike<any>;

    /** We expect the test to complete within this interval (defaults to 5 seconds) */
    timeout?: number;

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
