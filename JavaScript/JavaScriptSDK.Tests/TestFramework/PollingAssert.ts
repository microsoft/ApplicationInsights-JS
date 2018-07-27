/// <reference path="../External/qunit.d.ts" />
/// <reference path="TestClass.ts" />

class PollingAssert {
    static originalSetTimeout: (handler: (...args: any[]) => void, timeout: number) => number;

    public static storeOriginalTimeout(){
        PollingAssert.originalSetTimeout = setTimeout;
    }

    public static setTimeout(handler: (...args: any[]) => void, timeout: number): number{
        return PollingAssert.originalSetTimeout.call(window, handler, timeout);
    }

    /**
    * Starts polling assertion function for a period of time after which it's considered failed.
    * @param {() => boolean} assertionFunctionReturnsBoolean - funciton returning true if condition passes and false if condition fails. Assertion will be done on this function's result.
    * @param {string} assertDescription - message shown with the assertion
    * @param {number} timeoutSeconds - timeout in seconds after which assertion fails
    * @param {number} pollIntervalMs - polling interval in milliseconds
    * @returns {(nextTestStep) => void} callback which will be invoked by the TestClass
    */
    public static createPollingAssert(assertionFunctionReturnsBoolean: () => boolean, assertDescription: string, timeoutSeconds: number = 30, pollIntervalMs: number = 500): (nextTestStep) => void {
        var pollingAssert = (nextTestStep) => {
            var timeout = new Date(new Date().getTime() + timeoutSeconds * 1000);
            var polling = () => {
                if (assertionFunctionReturnsBoolean.apply(this)) {
                    Assert.ok(true, assertDescription);
                    nextTestStep();
                } else if (timeout < new Date()) {
                    Assert.ok(false, "assert didn't succeed for " + timeout + " seconds: " + assertDescription);
                    nextTestStep();
                } else {
                    PollingAssert.setTimeout(polling, pollIntervalMs);
                }
            }
            PollingAssert.setTimeout(polling, pollIntervalMs);
        }

        pollingAssert[TestClass.isPollingStepFlag] = true;

        return pollingAssert;
    }
}

PollingAssert.storeOriginalTimeout();
