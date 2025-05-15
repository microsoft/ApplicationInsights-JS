import { Assert } from "./Assert";
import { AITestClass } from "./AITestClass";
import { ITestContext } from "./interfaces/ITestContext";
import { scheduleTimeout } from "@nevware21/ts-utils";
import { createNativePromise, doAwaitResponse, IPromise } from "@nevware21/ts-async";

export class PollingAssert {
    /**
    * Starts polling assertion function for a period of time after which it's considered failed.
    * @param assertionFunctionReturnsBoolean - funciton returning true if condition passes and false if condition fails. Assertion will be done on this function's result.
    * @param assertDescription - message shown with the assertion
    * @param timeoutSeconds - timeout in seconds after which assertion fails
    * @param pollIntervalMs - polling interval in milliseconds
    * @returns {(nextTestStep) =&gt; void} callback which will be invoked by the AITestClass
    */
    public static createPollingAssert(assertionFunctionReturnsBoolean: (testContext?: ITestContext) => boolean, assertDescription: string, timeoutSeconds: number = 30, pollIntervalMs: number = 100): (testContext: ITestContext, nextTestStep: () => void) => void {
        const pollingAssert = (testContext: ITestContext, nextTestStep: () => void) => {
            doAwaitResponse(PollingAssert.asyncTaskPollingAssert(assertionFunctionReturnsBoolean, assertDescription, timeoutSeconds, pollIntervalMs)(testContext), (resp) => {
                if (resp.rejected) {
                    // If the promise was rejected, then we need to call the next test step with the error
                    // and we can also log the error message to the console
                    Assert.ok(false, "Polling assert failed: " + resp.reason + " - " + assertDescription + "[" + (AITestClass.currentTestInfo ? AITestClass.currentTestInfo.name : "<null>") + "]");
                }

                nextTestStep();
            });
        }

        (pollingAssert as any)[AITestClass.isPollingStepFlag] = true;

        return pollingAssert;
    }

    /**
    * Starts polling assertion function for a period of time after which it's considered failed, this is a promise based version
    * of the polling assert, which will resolve once the polling has successfully completed or rejected if the polling fails.
    * @param pollContext - context to use for the polling, this is typically the test context
    * @param assertionFunctionReturnsBoolean - funciton returning true if condition passes and false if condition fails. Assertion will be done on this function's result.
    * @param assertDescription - message shown with the assertion
    * @param timeoutSeconds - timeout in seconds after which assertion fails
    * @param pollIntervalMs - polling interval in milliseconds
    * @param incRetry - if true, then the retry count will be incremented for each failed attempt
    * @returns IPromise<void> which will resolve once the polling has successfully completed
    */
    public static asyncTaskPollingAssert(assertionFunctionReturnsBoolean: (testContext?: ITestContext) => boolean, assertDescription: string, timeoutSeconds: number = 30, pollIntervalMs: number = 0): (pollContext?: ITestContext) => IPromise<void> {

        return (pollContext: ITestContext) => {
            let retryCnt = 0;
            function _next(polling: () => void, pollIntervalMs: number) {
                scheduleTimeout(polling, pollIntervalMs || pollContext.pollDelay || 100);

                if (pollContext && pollContext.clock) {
                    // Using fake timers, so push the fake time forward in the next execution cycle
                    AITestClass.orgSetTimeout(() => {
                        pollContext.clock.tick(pollIntervalMs);
                    }, 0);
                }
            }

            if (pollContext && pollContext.finished) {
                // Test has already completed, so we can just return so we don't try to do any more polling
                return;
            }

            return createNativePromise<void>((resolve, reject) => {
                const timeout = new Date(new Date().getTime() + timeoutSeconds * 1000);
                const polling = () => {
                    if (pollContext && pollContext.finished) {
                        // Test has already completed, so we can just return so we don't try to do any more polling
                        reject();
                        return;
                    }

                    if (retryCnt > 0) {
                        Assert.ok(true, " -- Retry Attempt #" + retryCnt + " [" + assertDescription + "] - " + pollContext.name);
                    }

                    try {
                        if (assertionFunctionReturnsBoolean.call(this, pollContext)) {
                            Assert.ok(true, assertDescription + " [" + (AITestClass.currentTestInfo ? AITestClass.currentTestInfo.name : "<null>") + "]");
                            resolve();
                            return;
                        }
                        
                        if (timeout < new Date()) {
                            Assert.ok(false, "check didn't succeed for " + timeout + " seconds: " + assertDescription + " [" + (AITestClass.currentTestInfo ? AITestClass.currentTestInfo.name : "<null>") + "]");
                            reject();
                            return;
                        }

                        Assert.ok(true, " -- Check didn't succeed: " + assertDescription + " [" + (AITestClass.currentTestInfo ? AITestClass.currentTestInfo.name : "<null>") + "]");
                        retryCnt++;
                    } catch (e) {
                        Assert.ok(true, "Polling exception - " + e);
                        retryCnt++;
                    }

                    _next(polling, pollIntervalMs);
                };

                _next(polling, pollIntervalMs);
            });
        };
    }
}
