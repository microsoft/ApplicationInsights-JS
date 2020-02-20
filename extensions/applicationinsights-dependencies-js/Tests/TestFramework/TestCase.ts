
/** Defines a test case */
class TestCase {
    /** Name to use for the test case */
    public name: string;

    /** Test case method */
    public test: () => void;
}


/** Defines a test case */
interface TestCaseAsync {
    /** Name to use for the test case */
    name: string;

    /** time to wait after pre before invoking post and calling start() */
    stepDelay: number;

    /** async steps */
    steps: Array<(done?:VoidFunction) => void>;

    /**
     * Terminate and fail the test if it runs longer than this
     */
    timeOut?: number

    /** 
     * Flag which specifies that once all of the steps are completed the test case is completed.
     * True by default
     */
    autoComplete?: boolean;
}