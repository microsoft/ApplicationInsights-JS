/// <reference path="..\External\qunit.d.ts" />

class PollingAssert {
    /*
    * Starts polling assertion function for a period of time after which it's considered failed.
    * @assertionFunctionReturnsBoolean - funciton returning true if condition passes and false if condition fails. Assert will be done on this function's result.
    * @assertDescription - message shown with assert
    * @timeoutSeconds - timeout in seconds after which assert is considered failed
    * @pollIntervalMs - polling interval in milliseconds
    */
    public static startPollingAssert(assertionFunctionReturnsBoolean, assertDescription: string, timeoutSeconds: number = 30, pollIntervalMs: number = 500) {
        var timeout = new Date(new Date().getTime() + timeoutSeconds * 1000);
        var polling = () => {
            if (assertionFunctionReturnsBoolean.apply()) {
                Assert.ok(true, assertDescription);
            } else if (timeout < new Date()) {
                Assert.ok(false, "assert didn't succeed for " + timeout + " seconds: " + assertDescription);
            } else {
                setTimeout(polling, pollIntervalMs);
            }
        }
        setTimeout(polling, pollIntervalMs);
    }
}
