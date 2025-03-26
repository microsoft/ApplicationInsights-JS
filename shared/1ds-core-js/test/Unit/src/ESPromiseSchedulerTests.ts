import { AITestClass } from "@microsoft/ai-test-framework";
import { DiagnosticLogger } from '@microsoft/applicationinsights-core-js';
import { strIndexOf } from '@nevware21/ts-utils';
import { createAsyncPromise, createNativePromise, createNativeResolvedPromise, createTaskScheduler } from '@nevware21/ts-async';
import * as sinon from 'sinon';

export function makeRegex(value: string) {
    if (value && value.length > 0) {
        // Escape any slashes first!
        value = value.replace(/\\/g, "\\\\");
        // eslint-disable-next-line security/detect-non-literal-regexp
        value = value.replace(/([\+\?\|\{\}\[\]\(\)\^\$\#\.\=\!\:\/])/g, "\\$1");
        value = value.replace(/\*/g, ".*");
        return new RegExp("(" + value + ")");
    }
    
    return null;
}
export class ESPromiseSchedulerTests extends AITestClass {
    private _traceLogger: DiagnosticLogger;

    public testInitialize() {
        this._traceLogger = new DiagnosticLogger(<any>{ loggingLevelConsole: 1 });
    }

    public registerTests() {
        this.testCase({
            name: "Test that the scheduler waits for the events correctly",
            test: () => {
                let scheduler = createTaskScheduler(createAsyncPromise, "test1");

                let order:string[] = [];
                let expectedOrder:string[] = [];
                expectedOrder.push("sch1");
                expectedOrder.push("sch2");
                expectedOrder.push("sch3");
                expectedOrder.push("sch4");
                expectedOrder.push("wait");
                expectedOrder.push("test1");
                expectedOrder.push("finished1");
                expectedOrder.push("test2");
                expectedOrder.push("sch2.1");
                expectedOrder.push("wait2.1");
                expectedOrder.push("sch2.2");
                expectedOrder.push("finished2.1");
                expectedOrder.push("finished2");
                expectedOrder.push("test3");
                expectedOrder.push("sch3.1");
                expectedOrder.push("finished3");
                expectedOrder.push("test4");
                expectedOrder.push("sch4.1");
                expectedOrder.push("reject4-Timeout: Task [test1.0.3-(t4)] - Running: * ms");
                expectedOrder.push("test2.2");
                expectedOrder.push("sch2.3");
                expectedOrder.push("reject2.2-Timeout: Task [test1.0.4-(2.2)] - Running: * ms");
                expectedOrder.push("test3.1");
                expectedOrder.push("finished3.1");
                expectedOrder.push("test4.1");
                expectedOrder.push("wait4.2");
                expectedOrder.push("sch4.3");
                expectedOrder.push("finished4.2");
                expectedOrder.push("finished4.1");
                expectedOrder.push("wait2.3");
                expectedOrder.push("test2.3");
                expectedOrder.push("finished2.3");
                expectedOrder.push("test4.3");
                expectedOrder.push("finished4.3");

                let testWait = createNativePromise((testComplete) => {
                    order.push("sch1");
                    scheduler.queue(() => {
                        return createNativePromise((test1Complete) => {
                            setTimeout(() => {
                                order.push("test1");
                                test1Complete("t1.complete");
                            }, 20);
                        });
                    }, "t1").then(() => {
                        order.push("finished1");
                    });
                    order.push("sch2");
                    scheduler.queue(() => {
                        order.push("test2");
                        order.push("sch2.1");
                        return createNativePromise<void>((t21Resolve) => {
                            order.push("wait2.1");
                            setTimeout(() => {
                                order.push("sch2.2");
                                scheduler.queue(() => {
                                    order.push("test2.2");
                                    order.push("sch2.3");
                                    return scheduler.queue(() => {
                                        return createNativePromise((t23Resolve) => {
                                            order.push("wait2.3");
                                            setTimeout(() => {
                                                order.push("test2.3");
                                                t23Resolve("2.3.complete");
                                            }, 1)
                                        });
                                    }, "2.3").then(() => {
                                        order.push("finished2.3");
                                    }, (reason) => {
                                        order.push("reject2.3-" + reason);
                                    });
                                }, "2.2", 10).then(() => {
                                    order.push("finished2.2");
                                }, (reason) => {
                                    order.push("reject2.2-" + reason);
                                });
                                t21Resolve();
                            }, 1);
                        }).then(() => {
                            order.push("finished2.1");
                        }, (reason) => {
                            order.push("reject2.1-" + reason);
                        });
                    }, "t2").then(() => {
                        order.push("finished2");
                    }, (reason) => {
                        order.push("reject2-" + reason);
                    });
                    order.push("sch3");
                    scheduler.queue(() => {
                        order.push("test3");
                        order.push("sch3.1");
                        scheduler.queue(() => {
                            order.push("test3.1");
                            return createNativeResolvedPromise("t3.1.complete");
                        }, "3.1").then(() => {
                            order.push("finished3.1");
                        }, (reason) => {
                            order.push("reject3.1-" + reason);
                        });
                        return createNativeResolvedPromise("t3.complete");
                    }, "t3", 10).then(() => {
                        order.push("finished3");
                    }, (reason) => {
                        order.push("reject3-" + reason);
                    });

                    order.push("sch4");
                    scheduler.queue(() => {
                        order.push("test4");
                        order.push("sch4.1");
                        // Note because this is returning the scheduling result (promise) it will actually run immediately (this avoids avoid deadlocking) as the test2 event is not complete yet
                        // which means there is actually no "waiting" scheduled event
                        return scheduler.queue(() => {
                            order.push("test4.1");
                            return createNativePromise<void>((t42Resolve) => {
                                order.push("wait4.2");
                                setTimeout(() => {
                                    order.push("sch4.3");
                                    scheduler.queue(() => {
                                        order.push("test4.3");
                                        return createNativeResolvedPromise("resolved");
                                    }, "4.3").then(() => {
                                        order.push("finished4.3");
                                        testComplete("t4.3.complete");
                                    }, (reason) => {
                                        order.push("reject4.3-" + reason);
                                        testComplete("t4.3.complete");
                                    });
                                    // Just resolve this one
                                    t42Resolve();
                                }, 1)
                            }).then(() => {
                                order.push("finished4.2")
                            }, (reason) => {
                                order.push("reject4.2-" + reason);
                            });
                        }, "t4.1").then(() => {
                            order.push("finished4.1");
                        }, (reason) => {
                            order.push("reject4.1-" + reason);
                        });
                    }, "t4", 10).then(() => {
                        order.push("finished4");
                    }, (reason) => {
                        order.push("reject4-" + reason);
                    });
                });

                order.push("wait");
                return testWait.then(() => {
                    QUnit.assert.equal(order.length, expectedOrder.length, "Expecting all scheduled event have completed");
                    for (let lp = 0; lp < expectedOrder.length; lp++) {
                        if (order.length > lp) {
                            if (strIndexOf(expectedOrder[lp], "*")) {
                                QUnit.assert.ok(makeRegex(expectedOrder[lp])!.test(order[lp]), "Checking - " + order[lp]);
                            } else {
                                QUnit.assert.equal(order[lp], expectedOrder[lp], expectedOrder[lp]);
                            }
                        } else {
                            QUnit.assert.ok(false, "Missing expected result - " + expectedOrder[lp]);
                        }
                    }
                }) as PromiseLike<any>;
            }
        });
    }
}
