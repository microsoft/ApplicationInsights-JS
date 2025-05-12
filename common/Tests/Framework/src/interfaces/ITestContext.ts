export interface ITestContext {
    name: string;                       // Name of the test case
    context: { [key: string]: any };
    pollDelay?: number;                 // The ms between polling attempts
    testDone: VoidFunction;             // Consider that the test is complete
    clock: sinon.SinonFakeTimers;
    finished: boolean;                  // Flag which indicates that the test has completed
    failed?: boolean;                   // Flag which indicates that the test has failed
}
