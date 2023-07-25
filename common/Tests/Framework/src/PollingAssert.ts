import { Assert } from "./Assert";
import { AITestClass } from "./AITestClass";
import { ITestContext } from "./interfaces/ITestContext";
import { scheduleTimeout } from "@nevware21/ts-utils";

export class PollingAssert {
    /**
    * Starts polling assertion function for a period of time after which it's considered failed.
    * @param assertionFunctionReturnsBoolean - funciton returning true if condition passes and false if condition fails. Assertion will be done on this function's result.
    * @param assertDescription - message shown with the assertion
    * @param timeoutSeconds - timeout in seconds after which assertion fails
    * @param pollIntervalMs - polling interval in milliseconds
    * @returns {(nextTestStep) => void} callback which will be invoked by the AITestClass
    */
    public static createPollingAssert(assertionFunctionReturnsBoolean: (testContext?: ITestContext) => boolean, assertDescription: string, timeoutSeconds: number = 30, pollIntervalMs: number = 500): (testContext: ITestContext, nextTestStep: () => void) => void {
        const pollingAssert = (testContext: ITestContext, nextTestStep: () => void) => {
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
                        scheduleTimeout(polling, pollIntervalMs);
                    }
                } catch (e) {
                    Assert.ok(true, "Polling exception - " + e);
                    scheduleTimeout(polling, pollIntervalMs);
                }

                if (testContext.clock) {
                    // Using fake timers, so push the fake time forward in the next execution cycle
                    AITestClass.orgSetTimeout(() => {
                        testContext.clock.tick(pollIntervalMs);
                    }, 0);
                }
            }

            scheduleTimeout(polling, pollIntervalMs);
            if (testContext.clock) {
                AITestClass.orgSetTimeout(() => {
                    testContext.clock.tick(pollIntervalMs);
                }, 0);
            }
        }

        pollingAssert[AITestClass.isPollingStepFlag] = true;

        return pollingAssert;
    }
}
