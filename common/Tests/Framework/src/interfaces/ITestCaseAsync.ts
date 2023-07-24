import { StepResult } from "../StepResult";
import { ITestContext } from "./ITestContext";

/** Defines a test case */
export interface ITestCaseAsync {
    /** Name to use for the test case */
    name: string;

    fakeServerAutoRespond?: boolean;

    useFakeServer?: boolean;

    useFakeFetch?: boolean;
    fakeFetchAutoRespond?: boolean;

    useFakeTimers?: boolean;

    /** time to wait after pre before invoking post and calling start() */
    stepDelay: number;

    /** async steps */
    steps: Array<(testContext?: ITestContext, pollingDoneCallback?: () => void) => StepResult|boolean|void>;

    /**
     * Terminate and fail the test if it runs longer than this
     */
    timeOut?: number;

    /** Used for debugging, set this value to ignore the automatic timeout for tests that return a promise */
    skipTimeout?: boolean;

    /**
     * Flag which specifies that once all of the steps are completed the test case is completed.
     * True by default
     */
    autoComplete?: boolean;

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
