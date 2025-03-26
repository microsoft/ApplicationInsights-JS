import { AITestClass } from "@microsoft/ai-test-framework";
import { createAsyncAllPromise, createAsyncPromise, createAsyncRejectedPromise, createAsyncResolvedPromise, IPromise } from '@nevware21/ts-async';
import * as sinon from 'sinon';

export class ESPromiseTests extends AITestClass {

    public testInitialize() {
    }

    public registerTests() {
        this.testCase({
            name: "Test promise with invalid resolver",
            test: () => {
                let clock = sinon.useFakeTimers();
                try {
                    try {
                        let promise = createAsyncPromise(undefined as any);
                        QUnit.assert.ok(false, "expected an exception to be thrown with undefined");
                    } catch(e) {
                        QUnit.assert.ok(e.message.indexOf("is not a function") != -1, "Expected the exception message to include reason for failure - " + e.message);
                    }

                    try {
                        let promise = createAsyncPromise(null as any);
                        QUnit.assert.ok(false, "expected an exception to be thrown with null");
                    } catch(e) {
                        QUnit.assert.ok(e.message.indexOf("is not a function") != -1, "Expected the exception message to include reason for failure - " + e.message);
                    }

                    try {
                        let promise = createAsyncPromise(<any>42);
                        QUnit.assert.ok(false, "expected an exception to be thrown with null");
                    } catch(e) {
                        QUnit.assert.ok(e.message.indexOf("is not a function") != -1, "Expected the exception message to include reason for failure - " + e.message);
                    }
                } finally {
                    clock.restore();
                }
            }
        });

        this.testCase({
            name: "Test resolving promise",
            test: () => {
                let clock = sinon.useFakeTimers();
                let promise: IPromise<number>;
                try {
                    let resolvedValue = null;
                    let rejectedValue = null;
                    promise = createAsyncPromise<number>((resolve, reject) => {
                        resolve(42);
                    }).then((value) => {
                        resolvedValue = value;
                        return value;
                    }, (value) => {
                        rejectedValue = value;
                        return value;
                    });

                    // Should not be resolved or rejected yet as this should happen asynchronously
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet");
                    QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected yet");

                    // Cause the async promise execution to occur
                    clock.tick(100);
                    QUnit.assert.equal(resolvedValue, 42, "Expected the promise to be resolved");
                    QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected");

                    resolvedValue = null;
                    rejectedValue = null;
                    promise = createAsyncPromise<number>((resolve, reject) => {
                        resolve(42);
                    }).then((value) => {
                        resolvedValue = value;
                        return value;
                    }).catch((value) => {
                        rejectedValue = value;
                        return value;
                    })

                    // Should not be resolved or rejected yet as this should happen asynchronously
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet");
                    QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected yet");

                    // Cause the async promise execution to occur
                    clock.tick(100);
                    QUnit.assert.equal(resolvedValue, 42, "Expected the promise to be resolved");
                    QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected");
                } finally {
                    clock.restore();
                }
            }
        });

        this.testCase({
            name: "Test rejecting promise",
            test: () => {
                let clock = sinon.useFakeTimers();
                let promise: IPromise<number>;
                try {
                    let resolvedValue: number | null = null;
                    let rejectedValue = null;
                    promise = createAsyncPromise<number>((resolve, reject) => {
                        reject(-42);
                    }).then((value) => {
                        resolvedValue = value;
                        return value;
                    }, (value) => {
                        rejectedValue = value;
                        return value;
                    });

                    // Should not be resolved or rejected yet as this should happen asynchronously
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet");
                    QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected yet");

                    // Cause the async promise execution to occur
                    clock.tick(100);
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved");
                    QUnit.assert.equal(rejectedValue, -42, "Expected the promise to be rejected");

                    resolvedValue = null;
                    rejectedValue = null;
                    promise = createAsyncPromise<number>((resolve, reject) => {
                        reject(-42);
                    }).then((value) => {
                        resolvedValue = value;
                        return value;
                    }).catch((value) => {
                        rejectedValue = value;
                        return value;
                    });

                    // Should not be resolved or rejected yet as this should happen asynchronously
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet");
                    QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected yet");

                    // Cause the async promise execution to occur
                    clock.tick(100);
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved");
                    QUnit.assert.equal(rejectedValue, -42, "Expected the promise to be rejected");
                } finally {
                    clock.restore();
                }
            }
        });

        this.testCase({
            name: "Test rejecting promise by throwing",
            test: () => {
                let clock = sinon.useFakeTimers();
                let promise: IPromise<number> = null;
                try {
                    let resolvedValue: number | null = null;
                    let rejectedValue = null;
                    promise = createAsyncPromise<number>((resolve, reject) => {
                        throw new Error("Simulated failure!");
                    }).then((value) => {
                        resolvedValue = value;
                        return value;
                    }, (value) => {
                        rejectedValue = value;
                        return value;
                    });

                    // Should not be resolved or rejected yet as this should happen asynchronously
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet");
                    QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected yet");

                    // Cause the async promise execution to occur
                    clock.tick(100);
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved");
                    QUnit.assert.ok(rejectedValue != null, "Expected the promise to be rejected with a value");
                    QUnit.assert.ok(rejectedValue.message.indexOf("Simulated failure!") != -1, "Expected the promise to be rejected with the contained exception");

                    resolvedValue = null;
                    rejectedValue = null;
                    promise = createAsyncPromise<number>((resolve, reject) => {
                        throw new Error("Simulated failure!");
                    }).then((value) => {
                        resolvedValue = value;
                        return value;
                    }).catch((value) => {
                        rejectedValue = value;
                        return value;
                    })

                    // Should not be resolved or rejected yet as this should happen asynchronously
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet");
                    QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected yet");

                    // Cause the async promise execution to occur
                    clock.tick(100);
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved");
                    QUnit.assert.ok(rejectedValue != null, "Expected the promise to be rejected with a value");
                    QUnit.assert.ok(rejectedValue.message.indexOf("Simulated failure!") != -1, "Expected the promise to be rejected with the contained exception");
                } finally {
                    clock.restore();
                }
            }
        });

        this.testCase({
            name: "Test resolving promise with a returned value",
            test: () => {
                let clock = sinon.useFakeTimers();
                let promise: IPromise<any> = null;
                let subPromise: IPromise<number> = null;
                try {
                    let resolvedValue: any = null;
                    promise = createAsyncPromise<any>((resolve, reject) => {
                        resolve(42);
                    }).then((value) => {
                        return 53;
                    }).then((value) => {
                        resolvedValue = value;
                        return value;
                    });

                    // Should not be resolved or rejected yet as this should happen asynchronously
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet");

                    // Cause the async promise execution to occur
                    clock.tick(100);
                    QUnit.assert.equal(resolvedValue, 53, "Expected the promise to be resolved with the returned value not the initial resolved value");

                    resolvedValue = null;
                    promise = createAsyncPromise<any>((resolve, reject) => {
                        resolve(42);
                    }).then((value) => {
                        // Don't return anything
                    }).then((value) => {
                        resolvedValue = value;
                    });

                    // Should not be resolved or rejected yet as this should happen asynchronously
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet");

                    // Cause the async promise execution to occur
                    clock.tick(100);
                    QUnit.assert.equal(resolvedValue, undefined, "Expected the promise to be resolved with undefined from the Promise returned by the initial then");
                    
                } finally {
                    clock.restore();
                }
            }
        });

        this.testCase({
            name: "Test resolving promise with a promise",
            test: () => {
                let clock = sinon.useFakeTimers();
                let promise: IPromise<any> = null;
                let preResolved: IPromise<any> = createAsyncResolvedPromise(53);
                let preRejected: IPromise<any> = createAsyncRejectedPromise(new Error("Simulated Pre Rejected Promise..."));
                // Handle the rejected promise to avoid test failure
                preRejected.catch(() => {});

                try {
                    let resolvedValue = null;
                    let rejectedValue = null;
                    promise = createAsyncPromise<any>((resolve, reject) => {
                        resolve(42);
                    }).then((value) => {
                        return preResolved;
                    }).then((value) => {
                        resolvedValue = value;
                    },
                    (value) => {
                        rejectedValue = value;
                    });

                    // Should not be resolved or rejected yet as this should happen asynchronously
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet");
                    QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected yet");

                    // Cause the async promise execution to occur
                    clock.tick(10);
                    QUnit.assert.equal(resolvedValue, 53, "Expected the promise to be resolved");
                    QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected yet");

                    resolvedValue = null;
                    rejectedValue = null;
                    promise = createAsyncPromise<any>((resolve, reject) => {
                        resolve(42);
                    }).then((value) => {
                        return preRejected;
                    }).then((value) => {
                        resolvedValue = value;
                    },
                    (value) => {
                        rejectedValue = value;
                    });

                    // Should not be resolved or rejected yet as this should happen asynchronously
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet");
                    QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected yet");

                    // Cause the async promise execution to occur
                    clock.tick(10);
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to be resolved");
                    QUnit.assert.ok(rejectedValue != null, "Expected the promise to be rejected with a value");
                    QUnit.assert.ok(rejectedValue.message.indexOf("Simulated Pre Rejected Promise") != -1, "Expected the promise to be rejected with the contained exception");

                    let unresolvedPromise = createAsyncPromise((resolve, reject) => {
                        setTimeout(() => {
                            resolve(68);
                        }, 2000);
                    })
                    resolvedValue = null;
                    rejectedValue = null;
                    promise = createAsyncPromise<any>((resolve, reject) => {
                        resolve(42);
                    }).then((value) => {
                        return unresolvedPromise;
                    }).then((value) => {
                        resolvedValue = value;
                    },
                    (value) => {
                        rejectedValue = value;
                    });

                    // Should not be resolved or rejected yet as this should happen asynchronously
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet");
                    QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected yet");

                    // Cause the async promise execution to occur, but not enough for the unresolved promise
                    clock.tick(100);
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet");
                    QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected yet");

                    // let some more time pass but still not enough for the unresolved promise
                    clock.tick(1000);
                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet");
                    QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected yet");

                    // Now lets trigger the unresolved promise
                    clock.tick(1000);
                    QUnit.assert.equal(resolvedValue, 68, "Expected the promise to be resolved");
                    QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected yet");
                } finally {
                    clock.restore();
                }
            }
        });

        this.testCase({
            name: "Testing waiting for multiple promises",
            test: () => {
                let clock = sinon.useFakeTimers();

                try {
                    let workerPromises: IPromise<any>[] = [];
                    let workerResolved: boolean[] = [];
                    let resolvedValue:any = null;

                    // Create the promises
                    for (let lp = 0; lp < 10; lp++) {
                        workerResolved[lp] = false;
                        workerPromises[lp] = createAsyncPromise<any>((resolve, reject) => {
                            setTimeout(() => {
                                // Wait to resolve this promise
                                workerResolved[lp] = true;
                                resolve(lp);
                            }, (lp + 1) * 1000);
                        })
                    }

                    // Create the uber waiting promise
                    let thePromise: IPromise<any> = createAsyncAllPromise(workerPromises);
                    thePromise.then((value) => {
                        resolvedValue = value;
                    });

                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet");

                    for (let lp = 0; lp < 10; lp++) {
                        clock.tick(100);
                        QUnit.assert.equal(workerResolved[lp], false, "Worker not resolved yet");
                        QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet - " + lp);
                        clock.tick(899);
                        QUnit.assert.equal(workerResolved[lp], false, "Worker not resolved yet");
                        QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet - " + lp);
                        // This will cause the worker promise to get resolved
                        clock.tick(1);
                        QUnit.assert.equal(workerResolved[lp], true, "Worker now resolved");
                    }

                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet");
                    clock.tick(50);
                    QUnit.assert.ok(resolvedValue != null, "Expected the promise to be resolved");
                    for (let lp = 0; lp < 10; lp++)
                    {
                        QUnit.assert.equal(resolvedValue[lp], lp, "Value mismatch");
                    }
                } finally {
                    clock.restore();
                }
            }
        });

        this.testCase({
            name: "Testing waiting for multiple promises where one rejects",
            test: () => {
                let clock = sinon.useFakeTimers();

                try {
                    let workerPromises: IPromise<any>[] = [];
                    let workerResolved: boolean[] = [];
                    let resolvedValue:any = null;
                    let rejectedValue:any = null;

                    // Create the promises
                    for (let lp = 0; lp < 10; lp++) {
                        workerResolved[lp] = false;
                        workerPromises[lp] = createAsyncPromise<any>((resolve, reject) => {
                            setTimeout(() => {
                                // Wait to resolve this promise
                                workerResolved[lp] = true;
                                if (lp == 5)
                                {
                                    reject(new Error("Simulated Rejection"));
                                    return;
                                }

                                resolve(lp);
                            }, (lp + 1) * 1000);
                        })
                    }

                    // Create the uber waiting promise
                    let thePromise: IPromise<any> = createAsyncAllPromise(workerPromises);
                    thePromise.then((value) => {
                        resolvedValue = value;
                    },
                    (value) => {
                        rejectedValue = value;
                    });

                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet");
                    QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected yet");

                    for (let lp = 0; lp < 5; lp++) {
                        clock.tick(100);
                        QUnit.assert.equal(workerResolved[lp], false, "Worker not resolved yet");
                        QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet - " + lp);
                        QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected yet - " + lp);
                        clock.tick(899);
                        QUnit.assert.equal(workerResolved[lp], false, "Worker not resolved yet");
                        QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet - " + lp);
                        QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected yet - " + lp);
                        // This will cause the worker promise to get resolved
                        clock.tick(1);
                        QUnit.assert.equal(workerResolved[lp], true, "Worker now resolved");
                    }

                    QUnit.assert.equal(resolvedValue, null, "Expected the promise to not be resolved yet");
                    QUnit.assert.equal(rejectedValue, null, "Expected the promise to not be rejected yet");
                    
                    // Now lets cause the rejected promise to run
                    clock.tick(1500);
                    QUnit.assert.ok(resolvedValue == null, "Expected the promise to not be resolved");
                    QUnit.assert.ok(rejectedValue != null, "Expected the promise to be rejected");
                    QUnit.assert.ok(rejectedValue.message.indexOf("Simulated Rejection") != -1, "Main promise should have rejected with the rejected error");
                } finally {
                    clock.restore();
                }
            }
        });
    }
}
