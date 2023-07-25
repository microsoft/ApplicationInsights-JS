export interface ITestContext {
    context: { [key: string]: any };
    retryCnt: number;
    testDone: VoidFunction;     // Consider that the test is complete
    clock: sinon.SinonFakeTimers
}
