/// <reference path="..\External\qunit.d.ts" />
/// <reference path="testclass.ts" />

class PollingAssert {
    /*
    * Starts polling assertion function for a period of time after which it's considered failed.
    * @assertionFunctionReturnsBoolean - funciton returning true if condition passes and false if condition fails. Assert will be done on this function's result.
    * @assertDescription - message shown with assert
    * @timeoutSeconds - timeout in seconds after which assert is considered failed
    * @pollIntervalMs - polling interval in milliseconds
    */
    public static createPollingAssert(assertionFunctionReturnsBoolean: () => boolean, assertDescription: string, timeoutSeconds: number = 30, pollIntervalMs: number = 500) {
        var timeout = new Date(new Date().getTime() + timeoutSeconds * 1000);
        var pollingAssert = (nextTestStep) => {
            var polling = () => {
                if (assertionFunctionReturnsBoolean.apply(this)) {
                    Assert.ok(true, assertDescription);
                    nextTestStep();
                } else if (timeout < new Date()) {
                    Assert.ok(false, "assert didn't succeed for " + timeout + " seconds: " + assertDescription);
                    nextTestStep();
                } else {
                    setTimeout(polling, pollIntervalMs);
                }
            }
            setTimeout(polling, pollIntervalMs);
        }

        pollingAssert[TestClass.isPollingStepFlag] = true;

        return pollingAssert;
    }
}
