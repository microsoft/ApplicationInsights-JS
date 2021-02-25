import { Assert } from "./Assert";
import { AITestClass } from "./AITestClass";

export class PollingAssert {
   /**
    * Starts polling assertion function for a period of time after which it's considered failed.
    * @param {() => boolean} assertionFunctionReturnsBoolean - funciton returning true if condition passes and false if condition fails. Assertion will be done on this function's result.
    * @param {string} assertDescription - message shown with the assertion
    * @param {number} timeoutSeconds - timeout in seconds after which assertion fails
    * @param {number} pollIntervalMs - polling interval in milliseconds
    * @returns {(nextTestStep) => void} callback which will be invoked by the AITestClass
    */
    public static createPollingAssert(assertionFunctionReturnsBoolean: () => boolean, assertDescription: string, timeoutSeconds: number = 30, pollIntervalMs: number = 500): (nextTestStep: () => void) => void {
        const pollingAssert = (nextTestStep: () => void) => {
            const timeout = new Date(new Date().getTime() + timeoutSeconds * 1000);
            const polling = () => {
                try {
                    if (assertionFunctionReturnsBoolean.apply(this)) {
                        Assert.ok(true, assertDescription + "[" + (AITestClass.currentTestInfo ? AITestClass.currentTestInfo.name : "<null>") + "]");
                        nextTestStep();
                    } else if (timeout < new Date()) {
                        Assert.ok(false, "assert didn't succeed for " + timeout + " seconds: " + assertDescription + "[" + (AITestClass.currentTestInfo ? AITestClass.currentTestInfo.name : "<null>") + "]");
                        nextTestStep();
                    } else {
                        setTimeout(polling, pollIntervalMs);
                    }
                } catch (e) {
                    Assert.ok(true, "Polling exception - " + e);
                    setTimeout(polling, pollIntervalMs);
                }
            }
            setTimeout(polling, pollIntervalMs);
        }

        pollingAssert[AITestClass.isPollingStepFlag] = true;

        return pollingAssert;
    }
}
