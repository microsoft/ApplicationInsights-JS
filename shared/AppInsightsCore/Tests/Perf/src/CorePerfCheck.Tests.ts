import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { _eInternalMessageId } from "@microsoft/applicationinsights-common";
import { _InternalLogMessage } from "../../../src/Diagnostics/DiagnosticLogger";
import { optimizeObject, setValue } from "@microsoft/applicationinsights-common";
import { isObject, isPlainObject, isString, objForEachKey, objKeys } from "@nevware21/ts-utils";

interface PerfMeasurements {
    duration: number;
    iteration: number;
    avgIteration: number;
    avgDuration: number;
    maxDuration: number;
    total: number;
    attempts: number;
    deviation: number;
};

export class CorePerfCheckTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "PerfChecks: isString",
            test: () => {
                let testObject = "Value";
                let iterations = 500000;
                let checks = 0;
                let duration = this._runPerfTest("isString", () => {
                    if (isString(testObject)) {
                        checks++;
                    }
                }, 10, iterations, 0.00001);

                Assert.equal(iterations * duration.attempts, checks, "Make sure we hit all of them");
            }
        });

        this.testCase({
            name: "PerfChecks: isObject",
            test: () => {
                let testObject = {
                    test: "Value"
                };
                let iterations = 500000;
                let checks = 0;
                let duration = this._runPerfTest("isObject", () => {
                    if (isObject(testObject)) {
                        checks++;
                    }
                }, 10, iterations, 0.00001);

                Assert.equal(iterations * duration.attempts, checks, "Make sure we hit all of them");
            }
        });

        this.testCase({
            name: "PerfChecks: isPlainObject",
            test: () => {
                let testObject = {
                    test: "Value"
                };
                let iterations = 100000;
                let checks = 0;
                let duration = this._runPerfTest("isPlainObject", () => {
                    if (isPlainObject(testObject)) {
                        checks++;
                    }
                }, 65, iterations, 0.00001);

                Assert.equal(iterations * duration.attempts, checks, "Make sure we hit all of them");
            }
        });

        /**
         * This test always currently fails on chromium based browsers due to the way that chromium provides super
         * fast internal private classes for fixed objects and using the optimizeObject() creates a non-optimized
         * dynamic class -- so commenting out for future validation and local runs on Firefox
         */
        // this.testCase({
        //     name: "PerfChecks: objForEachKey fixed large object",
        //     test: () => {
        //         let iterations = 100000;
        //         let baseTestObject = {
        //             "test.value0": "Test Value 0",
        //             "test.value1": "Test Value 1",
        //             "test.value2": "Test Value 2",
        //             "test.value3": "Test Value 3",
        //             "test.value4": "Test Value 4",
        //             "test.value5": "Test Value 5",
        //             "test.value6": "Test Value 6",
        //             "test.value7": "Test Value 7",
        //             "test.value8": "Test Value 8",
        //             "test.value9": "Test Value 9",
        //             "test.value10": "Test Value 10",
        //             "test.value11": "Test Value 11",
        //             "test.value12": "Test Value 12",
        //             "test.value13": "Test Value 13",
        //             "test.value14": "Test Value 14",
        //             "test.value15": "Test Value 15",
        //             "test.value16": "Test Value 16",
        //             "test.value17": "Test Value 17",
        //             "test.value18": "Test Value 18",
        //             "test.value19": "Test Value 19",
        //             "test.value20": "Test Value 20",
        //             "test.value21": "Test Value 21",
        //             "test.value22": "Test Value 22",
        //             "test.value23": "Test Value 23",
        //             "test.value24": "Test Value 24",
        //             "test.value25": "Test Value 25",
        //             "test.value26": "Test Value 26",
        //             "test.value27": "Test Value 27",
        //             "test.value28": "Test Value 28",
        //             "test.value29": "Test Value 29",
        //             "test.value30": "Test Value 30",
        //             "test.value31": "Test Value 31",
        //             "test.value32": "Test Value 32",
        //             "test.value33": "Test Value 33",
        //             "test.value34": "Test Value 34",
        //             "test.value35": "Test Value 35",
        //             "test.value36": "Test Value 36",
        //             "test.value37": "Test Value 37",
        //             "test.value38": "Test Value 38",
        //             "test.value39": "Test Value 39"
        //         } as any;
        //         let objectFields = Object["keys"](baseTestObject).length;

        //         // JIT Optimization if we know we are playing with a dynamic object
        //         let optTestObject = optimizeObject(baseTestObject);

        //         let testObject6 = Object["assign"]({}, baseTestObject);
        //         testObject6["_dummy"] = 0;
        //         testObject6 = Object["assign"]({}, testObject6);
        //         delete testObject6["_dummy"];
        //         let adjOptTestObject = optimizeObject(testObject6);

        //         let checks = 0;
        //         let baseDuration = this._runPerfTest("baseTestObject", () => {
        //             objForEachKey(baseTestObject, (name, value) => {
        //                 checks++;
        //             });
        //         }, 200, iterations, 0.003, 20);

        //         Assert.equal(iterations * objectFields * baseDuration.attempts, checks, "Make sure we hit all of them");

        //         checks = 0;
        //         let optDuration1 = this._runPerfTest("optTestObject", () => {
        //             objForEachKey(optTestObject, (name, value) => {
        //                 checks++;
        //             });
        //         }, 300, iterations, 0.003, 20);

        //         Assert.equal(iterations * objectFields * optDuration1.attempts, checks, "Make sure we hit all of them");
        //         this._checkRun(baseDuration, optDuration1);

        //         checks = 0;
        //         let optDuration2 = this._runPerfTest("adjOptTestObject", () => {
        //             objForEachKey(adjOptTestObject, (name, value) => {
        //                 checks++;
        //             });
        //         }, 300, iterations, 0.003, 20);

        //         Assert.equal(iterations * objectFields * optDuration2.attempts, checks, "Make sure we hit all of them");

        //         this._checkRun(baseDuration, optDuration2);
        //     }
        // });

        this.testCase({
            name: "PerfChecks: objForEachKey dynamic large (40 fields) object",
            timeout: 60000,
            test: () => {
                let iterations = 90000;
                let baseTestObject = { };
                for (let lp = 0; lp < 40; lp++) {
                    baseTestObject["test.value" + lp] = "Test Value " + lp;
                }
                let objectFields = Object["keys"](baseTestObject).length;

                // JIT Optimization if we know we are playing with a dynamic object
                let optTestObject = optimizeObject(baseTestObject);

                let checks = 0;
                return this._runPerfTestAsync("baseTestObject", () => {
                    objForEachKey(baseTestObject, (name, value) => {
                        checks++;
                    });
                }, 400, iterations, 0.003).then((baseDuration) => {
                    Assert.equal(iterations * objectFields * baseDuration.attempts, checks, "Make sure we hit all of them");

                    checks = 0;
                    return this._runPerfTestAsync("optTestObject", () => {
                        objForEachKey(optTestObject, (name, value) => {
                            checks++;
                        });
                    }, 400, iterations, 0.003, baseDuration).then((optDuration1) => {
                        Assert.equal(iterations * objectFields * optDuration1.attempts, checks, "Make sure we hit all of them");
                        this._checkRun(baseDuration, optDuration1);
                    }).catch((reason) => {
                        Assert.ok(false, "Promise rejected - " + reason);
                    });
                }).catch((reason) => {
                    Assert.ok(false, "Promise rejected - " + reason);
                });
            }
        });

        this.testCase({
            name: "PerfChecks: objForEachKey complete small (<20 fields) dynamic object",
            timeout: 60000,
            test: () => {
                let iterations = 90000;
                let baseTestObject = { } as any;
                let objectFields = 19; // There is a JIT optimization for objects with <= 19 fields
                for (let lp = 0; lp < objectFields; lp++) {
                    setValue(baseTestObject, "test.value." + lp, "Test Value " + lp);
                }

                // JIT Optimization if we know we are playing with a dynamic object
                let optTestObject = optimizeObject(baseTestObject);

                let checks = 0;
                return this._runPerfTestAsync("baseTestObject", () => {
                    objForEachKey(baseTestObject, (name, value) => {
                        checks++;
                    });
                }, 400, iterations, 0.0015).then((baseDuration) => {
                    Assert.equal(iterations * objectFields * baseDuration.attempts, checks, "Make sure we hit all of them");

                    checks = 0;
                    return this._runPerfTestAsync("optTestObject", () => {
                        objForEachKey(optTestObject, (name, value) => {
                            checks++;
                        });
                    }, 400, iterations, 0.001, baseDuration).then((optDuration) => {
                        Assert.equal(iterations * objectFields * optDuration.attempts, checks, "Make sure we hit all of them");
    
                        this._checkRun(baseDuration, optDuration);
                    }).catch((reason) => {
                        Assert.ok(false, "Promise rejected - " + reason);
                    });
                }).catch((reason) => {
                    Assert.ok(false, "Promise rejected - " + reason);
                });
            }
        });

        this.testCase({
            name: "PerfChecks: objForEachKey complete large (>= 20 fields) dynamic object",
            timeout: 60000,
            test: () => {
                let iterations = 90000;
                let baseTestObject = { } as any;
                let objectFields = 21; // There is a JIT optimization for objects with <= 19 fields
                for (let lp = 0; lp < objectFields; lp++) {
                    setValue(baseTestObject, "test.value." + lp, "Test Value " + lp);
                }

                // JIT Optimization if we know we are playing with a dynamic object
                let optTestObject = optimizeObject(baseTestObject);

                let checks = 0;
                return this._runPerfTestAsync("baseTestObject", () => {
                    objForEachKey(baseTestObject, (name, value) => {
                        checks++;
                    });
                }, 400, iterations, 0.002).then((baseDuration) => {
                    Assert.equal(iterations * objectFields * baseDuration.attempts, checks, "Make sure we hit all of them");

                    checks = 0;
                    return this._runPerfTestAsync("optTestObject", () => {
                        objForEachKey(optTestObject, (name, value) => {
                            checks++;
                        });
                    }, 400, iterations, 0.002, baseDuration).then((optDuration) => {
                        Assert.equal(iterations * objectFields * optDuration.attempts, checks, "Make sure we hit all of them");
    
                        this._checkRun(baseDuration, optDuration);
                    }).catch((reason) => {
                        Assert.ok(false, "Promise rejected - " + reason);
                    });
                }).catch((reason) => {
                    Assert.ok(false, "Promise rejected - " + reason);
                });
            }
        });

        this.testCase({
            name: "PerfChecks: objForEachKey with small (<20 fields) extended dynamic object",
            timeout: 60000,
            test: () => {
                let iterations = 90000;
                let baseTestObject = { 
                    a: 1
                 } as any;
                let objectFields = 18;
                for (let lp = 0; lp < objectFields - 1; lp++) {
                    setValue(baseTestObject, "test.value." + lp, "Test Value " + lp);
                }

                // JIT Optimization if we know we are playing with a dynamic object
                let optTestObject = optimizeObject(baseTestObject);

                let checks = 0;
                return this._runPerfTestAsync("baseTestObject", () => {
                    objForEachKey(baseTestObject, (name, value) => {
                        checks++;
                    });
                }, 400, iterations, 0.0015).then((baseDuration) => {
                    Assert.equal(iterations * objectFields * baseDuration.attempts, checks, "Make sure we hit all of them");

                    checks = 0;
                    return this._runPerfTestAsync("optTestObject", () => {
                        objForEachKey(optTestObject, (name, value) => {
                            checks++;
                        });
                    }, 400, iterations, 0.001, baseDuration).then((optDuration) => {
                        Assert.equal(iterations * objectFields * optDuration.attempts, checks, "Make sure we hit all of them");
    
                        this._checkRun(baseDuration, optDuration);
                    }).catch((reason) => {
                        Assert.ok(false, "Promise rejected - " + reason);
                    });
                }).catch((reason) => {
                    Assert.ok(false, "Promise rejected - " + reason);
                });
            }
        });

        this.testCase({
            name: "PerfChecks: objForEachKey with large (>=20 fields) extended dynamic object",
            timeout: 60000,
            test: () => {
                let iterations = 90000;
                let baseTestObject = { 
                    a: 1
                 } as any;
                let objectFields = 20;
                for (let lp = 0; lp < objectFields - 1; lp++) {
                    setValue(baseTestObject, "test.value." + lp, "Test Value " + lp);
                }

                // JIT Optimization if we know we are playing with a dynamic object
                let optTestObject = optimizeObject(baseTestObject);

                let checks = 0;
                return this._runPerfTestAsync("baseTestObject", () => {
                    objForEachKey(baseTestObject, (name, value) => {
                        checks++;
                    });
                }, 400, iterations, 0.0015).then((baseDuration) => {
                    Assert.equal(iterations * objectFields * baseDuration.attempts, checks, "Make sure we hit all of them");

                    checks = 0;
                    return this._runPerfTestAsync("optTestObject", () => {
                        objForEachKey(optTestObject, (name, value) => {
                            checks++;
                        });
                    }, 400, iterations, 0.0015, baseDuration).then((optDuration) => {
                        Assert.equal(iterations * objectFields * optDuration.attempts, checks, "Make sure we hit all of them");
    
                        this._checkRun(baseDuration, optDuration);
                    }).catch((reason) => {
                        Assert.ok(false, "Promise rejected - " + reason);
                    });
                }).catch((reason) => {
                    Assert.ok(false, "Promise rejected - " + reason);
                });
            }
        });

        /**
         * This test always currently fails on chromium based browsers due to the way that chromium provides super
         * fast internal private classes for fixed objects and using the optimizeObject() creates a non-optimized
         * dynamic class -- so commenting out for future validation and local runs on Firefox
         */
        // this.testCase({
        //     name: "PerfChecks: json.stringify fixed large (40 fields) object",
        //     test: () => {
        //         let iterations = 100000;
        //         let baseTestObject = {
        //             "test.value0": "Test Value 0",
        //             "test.value1": "Test Value 1",
        //             "test.value2": "Test Value 2",
        //             "test.value3": "Test Value 3",
        //             "test.value4": "Test Value 4",
        //             "test.value5": "Test Value 5",
        //             "test.value6": "Test Value 6",
        //             "test.value7": "Test Value 7",
        //             "test.value8": "Test Value 8",
        //             "test.value9": "Test Value 9",
        //             "test.value10": "Test Value 10",
        //             "test.value11": "Test Value 11",
        //             "test.value12": "Test Value 12",
        //             "test.value13": "Test Value 13",
        //             "test.value14": "Test Value 14",
        //             "test.value15": "Test Value 15",
        //             "test.value16": "Test Value 16",
        //             "test.value17": "Test Value 17",
        //             "test.value18": "Test Value 18",
        //             "test.value19": "Test Value 19",
        //             "test.value20": "Test Value 20",
        //             "test.value21": "Test Value 21",
        //             "test.value22": "Test Value 22",
        //             "test.value23": "Test Value 23",
        //             "test.value24": "Test Value 24",
        //             "test.value25": "Test Value 25",
        //             "test.value26": "Test Value 26",
        //             "test.value27": "Test Value 27",
        //             "test.value28": "Test Value 28",
        //             "test.value29": "Test Value 29",
        //             "test.value30": "Test Value 30",
        //             "test.value31": "Test Value 31",
        //             "test.value32": "Test Value 32",
        //             "test.value33": "Test Value 33",
        //             "test.value34": "Test Value 34",
        //             "test.value35": "Test Value 35",
        //             "test.value36": "Test Value 36",
        //             "test.value37": "Test Value 37",
        //             "test.value38": "Test Value 38",
        //             "test.value39": "Test Value 39"
        //         } as any;

        //         let optTestObject = optimizeObject(baseTestObject);
        //         Assert.equal(JSON.stringify(baseTestObject), JSON.stringify(optTestObject), "Make sure the new assigned object is the same");

        //         let checks = 0;
        //         let baseDuration = this._runPerfTest("baseTestObject", () => {
        //             JSON.stringify(baseTestObject);
        //         }, 550, iterations, 0.005);

        //         checks = 0;
        //         let optDuration = this._runPerfTest("optTestObject", () => {
        //             JSON.stringify(optTestObject);
        //         }, 550, iterations, 0.005);

        //         this._checkRun(baseDuration, optDuration);
        //     }
        // });

        this.testCase({
            name: "PerfChecks: json.stringify dynamic large (40 fields) object",
            timeout: 120000,
            test: () => {
                let iterations = 10000;
                let baseTestObject = { };
                for (let lp = 0; lp < 40; lp++) {
                    baseTestObject["test.value" + lp] = "Test Value " + lp;
                }

                let optTestObject = optimizeObject(baseTestObject);
                Assert.equal(JSON.stringify(baseTestObject), JSON.stringify(optTestObject), "Make sure the new assigned object is the same");

                let checks = 0;
                return this._runPerfTestAsync("baseTestObject", () => {
                    JSON.stringify(baseTestObject);
                }, 150, iterations, 0.015).then((baseDuration) => {
                    checks = 0;
                    return this._runPerfTestAsync("optTestObject", () => {
                        JSON.stringify(optTestObject);
                    }, 150, iterations, 0.015, baseDuration).then((optDuration) => {
                        this._checkRun(baseDuration, optDuration);
                    }).catch((reason) => {
                        Assert.ok(false, "Promise rejected - " + reason);
                    });
                }).catch((reason) => {
                    Assert.ok(false, "Promise rejected - " + reason);
                });
            }
        });

        this.testCase({
            name: "PerfChecks: json.stringify complete small (<20 fields) dynamic object",
            timeout: 120000,
            test: () => {
                let iterations = 10000;
                let baseTestObject = { } as any;
                let objectFields = 19; // There is a JIT optimization for objects with <= 19 fields
                for (let lp = 0; lp < objectFields; lp++) {
                    setValue(baseTestObject, "test.value." + lp, "Test Value " + lp);
                }

                let optTestObject = optimizeObject(baseTestObject);
                Assert.equal(JSON.stringify(baseTestObject), JSON.stringify(optTestObject), "Make sure the new assigned object is the same");

                let checks = 0;
                return this._runPerfTestAsync("baseTestObject", () => {
                    JSON.stringify(baseTestObject);
                }, 60, iterations, 0.005).then((baseDuration) => {
                    checks = 0;
                    return this._runPerfTestAsync("optTestObject", () => {
                        JSON.stringify(optTestObject);
                    }, 50, iterations, 0.005, baseDuration).then((optDuration) => {
                        this._checkRun(baseDuration, optDuration);
                    }).catch((reason) => {
                        Assert.ok(false, "Promise rejected - " + reason);
                    });
                }).catch((reason) => {
                    Assert.ok(false, "Promise rejected - " + reason);
                });
            }
        });

        this.testCase({
            name: "PerfChecks: json.stringify with small (<20 fields) extended dynamic object",
            timeout: 120000,
            test: () => {
                let iterations = 10000;
                let baseTestObject = { 
                    a: 1
                 } as any;
                let objectFields = 19;
                for (let lp = 0; lp < objectFields - 1; lp++) {
                    setValue(baseTestObject, "test.value." + lp, "Test Value " + lp);
                }

                // Jit Optimization!!!
                let optTestObject = optimizeObject(baseTestObject);

                Assert.equal(JSON.stringify(baseTestObject), JSON.stringify(optTestObject), "Make sure the new assigned object is the same");

                return this._runPerfTestAsync("baseTestObject", () => {
                    JSON.stringify(baseTestObject);
                }, 60, iterations, 0.005).then((baseDuration) => {
                    return this._runPerfTestAsync("optTestObject", () => {
                        JSON.stringify(optTestObject);
                    }, 50, iterations, 0.003, baseDuration).then((optDuration) => {
                        this._checkRun(baseDuration, optDuration);
                    }).catch((reason) => {
                        Assert.ok(false, "Promise rejected - " + reason);
                    });
                }).catch((reason) => {
                    Assert.ok(false, "Promise rejected - " + reason);
                });
            }
        });

        this.testCase({
            name: "PerfChecks: json.stringify with large (>= 20 fields) extended dynamic object",
            timeout: 60000,
            test: () => {
                let iterations = 10000;
                let baseTestObject = { 
                    a: 1
                 } as any;
                let objectFields = 20;
                for (let lp = 0; lp < objectFields - 1; lp++) {
                    setValue(baseTestObject, "test.value." + lp, "Test Value " + lp);
                }

                let optTestObject = optimizeObject(baseTestObject);
                Assert.equal(JSON.stringify(baseTestObject), JSON.stringify(optTestObject), "Make sure the new assigned object is the same");

                return this._runPerfTestAsync("baseTestObject", () => {
                    JSON.stringify(baseTestObject);
                }, 100, iterations, 0.01).then((baseDuration) => {
                    return this._runPerfTestAsync("optTestObject", () => {
                        JSON.stringify(optTestObject);
                    }, 100, iterations, 0.01, baseDuration).then((optDuration) => {
                        this._checkRun(baseDuration, optDuration);
                    }).catch((reason) => {
                        Assert.ok(false, "Promise rejected - " + reason);
                    });
                }).catch((reason) => {
                    Assert.ok(false, "Promise rejected - " + reason);
                });
            }
        });

        this.testCase({
            name: "PerfChecks: objKeys with small (<20 fields) dynamic object",
            timeout: 60000,
            test: () => {
                let iterations = 100000;
                let objectFields = 19;
                let baseTestObject = { };
                for (let lp = 0; lp < objectFields; lp++) {
                    baseTestObject["value" + lp] = "Test Value " + lp;
                }

                let optTestObject = optimizeObject(baseTestObject);

                let checks = 0;
                return this._runPerfTestAsync("baseTestObject", () => {
                    checks += objKeys(baseTestObject).length;
                }, 300, iterations, 0.0015).then((baseDuration) => {
                    Assert.equal(iterations * objectFields * baseDuration.attempts, checks, "Make sure we hit all of them");

                    checks = 0;
                    return this._runPerfTestAsync("optTestObject", () => {
                        checks += objKeys(optTestObject).length;
                    }, 300, iterations, 0.001, baseDuration).then((optDuration) => {
                        Assert.equal(iterations * objectFields * optDuration.attempts, checks, "Make sure we hit all of them");
    
                        this._checkRun(baseDuration, optDuration);
                    }).catch((reason) => {
                        Assert.ok(false, "Promise rejected - " + reason);
                    });
                }).catch((reason) => {
                    Assert.ok(false, "Promise rejected - " + reason);
                });
            }
        });

        this.testCase({
            name: "PerfChecks: objKeys extended object with small (<20 fields)",
            timeout: 60000,
            test: () => {
                let iterations = 100000;
                let objectFields = 19;
                let baseTestObject = { 
                    a: 1
                };
                for (let lp = 0; lp < objectFields - 1; lp++) {
                    baseTestObject["value" + lp] = "Test Value " + lp;
                }

                let optTestObject = optimizeObject(baseTestObject);

                let checks = 0;
                return this._runPerfTestAsync("baseTestObject", () => {
                    checks += objKeys(baseTestObject).length;
                }, 150, iterations, 0.0015).then((baseDuration) => {
                    Assert.equal(iterations * objectFields * baseDuration.attempts, checks, "Make sure we hit all of them");

                    checks = 0;
                    return this._runPerfTestAsync("optTestObject", () => {
                        checks += objKeys(optTestObject).length;
                    }, 150, iterations, 0.0015, baseDuration).then((optDuration) => {
                        Assert.equal(iterations * objectFields * optDuration.attempts, checks, "Make sure we hit all of them");
    
                        this._checkRun(baseDuration, optDuration);
                    }).catch((reason) => {
                        Assert.ok(false, "Promise rejected - " + reason);
                    });
                }).catch((reason) => {
                    Assert.ok(false, "Promise rejected - " + reason);
                });
            }
        });

        this.testCase({
            name: "PerfChecks: objKeys dynamic object with large (>=20 fields)",
            timeout: 60000,
            test: () => {
                let iterations = 100000;
                let objectFields = 21;
                let baseTestObject = { };
                for (let lp = 0; lp < objectFields; lp++) {
                    baseTestObject["value" + lp] = "Test Value " + lp;
                }

                let checks = 0;
                return this._runPerfTestAsync("baseTestObject", () => {
                    checks += objKeys(baseTestObject).length;
                }, 200, iterations, 0.0015).then((baseDuration) => {
                    Assert.equal(iterations * objectFields * baseDuration.attempts, checks, "Make sure we hit all of them");

                    let optTestObject = optimizeObject(baseTestObject);
                    checks = 0;
                    return this._runPerfTestAsync("optTestObject", () => {
                        checks += objKeys(optTestObject).length;
                    }, 200, iterations, 0.0015, baseDuration).then((optDuration) => {
                        Assert.equal(iterations * objectFields * optDuration.attempts, checks, "Make sure we hit all of them");
    
                        this._checkRun(baseDuration, optDuration);
                    }).catch((reason) => {
                        Assert.ok(false, "Promise rejected - " + reason);
                    });
                }).catch((reason) => {
                    Assert.ok(false, "Promise rejected - " + reason);
                });
            }
        });
    }

    private _getStandardDeviation(values: number[]) {
        const n = values.length
        const mean = values.reduce((a, b) => a + b) / n
        return Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
    }

    private _checkRun(baseDuration: PerfMeasurements, chkDuration: PerfMeasurements) {
        if (chkDuration.duration <= baseDuration.duration) {
            // If the new min is smaller then it's a pass
            Assert.ok(true, `New minimum ${chkDuration.duration} is <= the base ${baseDuration.duration}`);
            return;
        }

        if (chkDuration.avgDuration <= baseDuration.avgDuration) {
            // If the new average is smaller then it's a pass
            Assert.ok(true, `New average ${chkDuration.avgDuration} is <= the base average ${baseDuration.avgDuration}`);
            return
        }

        if (chkDuration.duration <= (baseDuration.avgDuration + (baseDuration.deviation / 2))) {
            // If the new min is smaller then it's a pass
            Assert.ok(true, `Chk minimum ${chkDuration.duration} is <= base average less half base deviation ${baseDuration.avgDuration + (baseDuration.deviation / 2)}`);
            return;
        }

        if ((chkDuration.duration + chkDuration.deviation) <= baseDuration.avgDuration) {
            // If the new min is smaller then it's a pass
            Assert.ok(true, `Chk min plus deviation ${chkDuration.duration + chkDuration.deviation} is <= base average ${baseDuration.avgDuration}`);
            return;
        }

        if ((chkDuration.duration + baseDuration.deviation) <= baseDuration.avgDuration) {
            // If the new min is smaller then it's a pass
            Assert.ok(true, `Chk min plus base deviation ${chkDuration.duration + baseDuration.deviation} is <= base average ${baseDuration.avgDuration}`);
            return;
        }

        if (chkDuration.duration <= baseDuration.avgDuration) {
            // If the new min is smaller than the base average
            Assert.ok(true, `New minimum ${chkDuration.duration} is <= the base average ${baseDuration.avgDuration}`);
            return;
        }

        if (chkDuration.duration <= baseDuration.maxDuration) {
            // If the new min is smaller than the base max value (needed for build servers and shared CPU runs)
            Assert.ok(true, `New minimum ${chkDuration.duration} is <= the base average ${baseDuration.maxDuration}`);
            return;
        }

        Assert.ok(false, "The new values are not smaller or within the standard deviation thresholds\n" +
            `Base: mn:${baseDuration.duration}, avg:${baseDuration.avgDuration}, avg:${baseDuration.maxDuration}, dev:${baseDuration.deviation} it:${baseDuration.iteration} avg:${baseDuration.avgIteration}\n` +
            `Chk : mn:${chkDuration.duration}, avg:${chkDuration.avgDuration}, avg:${chkDuration.maxDuration}, dev:${chkDuration.deviation} it:${chkDuration.iteration} avg:${chkDuration.avgIteration}`);
    }

    private _runPerfIterations(theDuration: PerfMeasurements, testName: string, theTest: () => void, iterations: number, attempts: number[]) {
        let start = performance.now();
        for (let lp = 0; lp < iterations; lp++) {
            theTest();
        }
        let duration = performance.now() - start;
        if (attempts.length === 0) {
            theDuration.duration = duration;
            theDuration.maxDuration = duration;
            theDuration.total = duration;
        } else {
            theDuration.total += duration;
            theDuration.duration = Math.min(theDuration.duration, duration);
            theDuration.maxDuration = Math.max(theDuration.maxDuration, duration);
        }
        attempts.push(duration);
        Assert.ok(true, `${testName}: Attempt: ${(attempts.length)} Took: ${duration}ms Avg: ${duration / iterations}`);
    }

    private _runPerfAttempts(testName: string, theTest: () => void, iterations: number, maxAttempts: number, totalAttempts: number): PerfMeasurements {
        let values: number[] = []
        let theDuration: PerfMeasurements = {
            duration: 0,
            iteration: 0,
            avgIteration: 0,
            avgDuration: 0,
            maxDuration: 0,
            total: 0,
            attempts: totalAttempts,
            deviation: 0
        };
        
        let attempts = 0;
        do {
            attempts++;
            this._runPerfIterations(theDuration, testName, theTest, iterations, values);
        } while (attempts < maxAttempts);

        theDuration.iteration = theDuration.duration / iterations;
        totalAttempts += attempts;
        theDuration.attempts = totalAttempts;
        theDuration.avgDuration = theDuration.total / attempts;
        theDuration.avgIteration = theDuration.avgDuration / iterations;
        theDuration.deviation = this._getStandardDeviation(values);

        return theDuration;
    }

    private _runPerfTest(testName: string, theTest: () => void, maxTime: number, iterations: number, maxIteration: number, baseMeasurements?: PerfMeasurements, maxAttempts = 25): PerfMeasurements {
        let theDuration: PerfMeasurements = {} as PerfMeasurements;

        let retryCount = 0;
        while (retryCount < 5) {
            retryCount++;
            theDuration = this._runPerfAttempts(testName, theTest, iterations, maxAttempts, theDuration.attempts || 0);
            
            let devAllowance = (theDuration.deviation / 2);
            if ((theDuration.duration + devAllowance) <= maxTime && (theDuration.iteration < maxIteration || (theDuration.avgIteration - devAllowance) < maxIteration)) {
                // Good run
                if (!baseMeasurements || theDuration.deviation < baseMeasurements.deviation * 2.5) {
                    break;
                }
            }
        }

        Assert.ok(theDuration.duration <= maxTime, 
            `${testName}: Check min total time for <= ${maxTime}ms from ${iterations} iterations.  Min: ${theDuration.duration}ms Avg: ${theDuration.avgDuration}ms Max: ${theDuration.maxDuration}ms Total: ${theDuration.total}ms Deviation: ${theDuration.deviation}ms`);
        Assert.ok(theDuration.iteration < maxIteration || (theDuration.avgIteration - (theDuration.deviation / 2)) < maxIteration, 
            `${testName}: Check Average iteration. Avg: ${theDuration.avgIteration}ms Min: ${theDuration.iteration}`);

        return theDuration;
    }

    private _runPerfTestAsync(testName: string, theTest: () => void, maxTime: number, iterations: number, maxIteration: number, baseMeasurements?: PerfMeasurements, maxAttempts = 25): Promise<PerfMeasurements> {
        let _self = this;
        
        return new Promise<PerfMeasurements>((runComplete, runReject) => {
            function _scheduleTest(theTest: () => void) {
                AITestClass.orgSetTimeout(() => {
                    try {
                        theTest.call(_self);
                    } catch (e) {
                        Assert.ok(false, "Unexpected exception - " + e);
                        runReject(e);
                    }
                }, 0);
            }
        
            try {
                let theDuration: PerfMeasurements = {} as PerfMeasurements;
                let retryCount = 0;
    
                function doAttempts() {
                    retryCount++;
                    theDuration = _self._runPerfAttempts(testName, theTest, iterations, maxAttempts, theDuration.attempts || 0);
    
                    let devAllowance = (theDuration.deviation / 2);
                    if (retryCount >= 5 || ((theDuration.duration + devAllowance) <= maxTime && (theDuration.iteration < maxIteration || (theDuration.avgIteration - devAllowance) < maxIteration))) {
                        // Last Retry or Good run
                        if (retryCount >= 5 || !baseMeasurements || theDuration.deviation < baseMeasurements.deviation * 2.5) {
                            Assert.ok(theDuration.duration <= maxTime, 
                                `${testName}: Check min total time for <= ${maxTime}ms from ${iterations} iterations.  Min: ${theDuration.duration}ms Avg: ${theDuration.avgDuration}ms Max: ${theDuration.maxDuration}ms Total: ${theDuration.total}ms Deviation: ${theDuration.deviation}ms`);
                            Assert.ok(theDuration.iteration < maxIteration || (theDuration.avgIteration - (theDuration.deviation / 2)) < maxIteration, 
                                `${testName}: Check Average iteration. Avg: ${theDuration.avgIteration}ms Min: ${theDuration.iteration}`);
            
                            runComplete(theDuration);
                            return;
                        }
                    }
    
                    Assert.ok(true, 
                        `${testName}: Summary Min: ${theDuration.duration}ms Avg: ${theDuration.avgDuration}ms Max: ${theDuration.maxDuration}ms Total: ${theDuration.total}ms Deviation: ${theDuration.deviation}ms Iteration  Avg: ${theDuration.avgIteration}ms Min: ${theDuration.iteration}`);
        
                    // reschedule
                    _scheduleTest(doAttempts);
                }
    
                _scheduleTest(doAttempts);
            } catch (e) {
                Assert.ok(false, "Unexpected exception - " + e);
                runReject(e);
            }
        });
    }
}
