
/** Defines a test case */
export class TestCase {
    /** Name to use for the test case */
    public name: string;

    useFakeServer?: boolean;
    fakeServerAutoRespond?: boolean;

    useFakeTimers?: boolean;

    /** Test case method */
    public test: () => void|Promise<any>;

    /** We expect the test to complete within this interval (defaults to 5 seconds) */
    public timeout?: number;

    /** Used for debugging, set this value to ignore the automatic timeout for tests that return a promise */
    public skipTimeout? : boolean;
}

export const enum StepResult {
    Abort = -1,
    Complete = 0,
    Repeat = 90,
    Retry = 99
}

export interface ITestContext {
    context: { [key: string]: any };
    retryCnt: number;
    testDone: VoidFunction;     // Consider that the test is complete
}

/** Defines a test case */
export interface TestCaseAsync {
    /** Name to use for the test case */
    name: string;

    useFakeServer?: boolean;
    fakeServerAutoRespond?: boolean;

    useFakeTimers?: boolean;

    /** time to wait after pre before invoking post and calling start() */
    stepDelay: number;

    /** async steps */
    steps: Array<(testContext?: ITestContext) => StepResult|boolean|void>;

    /**
     * Terminate and fail the test if it runs longer than this
     */
    timeOut?: number;

    /** 
     * Flag which specifies that once all of the steps are completed the test case is completed.
     * True by default
     */
    autoComplete?: boolean;
}