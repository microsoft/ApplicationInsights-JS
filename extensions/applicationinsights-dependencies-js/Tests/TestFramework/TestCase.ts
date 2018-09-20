
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
    steps: Array<() => void>;
}