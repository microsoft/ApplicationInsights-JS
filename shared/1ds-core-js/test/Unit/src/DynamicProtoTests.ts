import { AITestClass } from "@microsoft/ai-test-framework";
import dynamicProto from '@microsoft/dynamicproto-js';
import * as sinon from 'sinon';

interface IInheritTest {
    executionOrder:string[];
    testFunction?(): void;
}

class InheritTest1 implements IInheritTest {
    public executionOrder:string[] = [];

    constructor() {
        this.executionOrder.push("InheritTest1()");
    }

    public testFunction() {
        this.executionOrder.push("InheritTest1.test()");
    }
}

class InheritTest2 extends InheritTest1 {
    constructor() {
        super();
        this.executionOrder.push("InheritTest2()");
    }

    public testFunction() {
        super.testFunction();
        this.executionOrder.push("InheritTest2.test()");
    }
}

class InheritTest3 extends InheritTest2 {
    constructor() {
        super();
        this.executionOrder.push("InheritTest3()");
    }

    public testFunction() {
        super.testFunction();
        this.executionOrder.push("InheritTest3.test()");
    }
}

class DynInheritTest1 implements IInheritTest {
    public executionOrder:string[] = [];

    public testFunction?(): void;

    constructor() {
        this.executionOrder.push("DynInheritTest1()");
        dynamicProto(DynInheritTest1, this, (_self, base) => {
            _self.testFunction = () => {
                this.executionOrder.push("DynInheritTest1.test()");
            }
        });
    }
}

class InheritTest4 extends DynInheritTest1 {
    constructor() {
        super();
        this.executionOrder.push("InheritTest4()");
    }

    public testFunction() {
        super.testFunction();
        this.executionOrder.push("InheritTest4.test()");
    }
}

class InheritTest5 extends InheritTest4 {
    constructor() {
        super();
        this.executionOrder.push("InheritTest5()");
    }

    public testFunction() {
        super.testFunction();
        this.executionOrder.push("InheritTest5.test()");
    }
}

class DynInheritTest2 extends InheritTest1 {
    constructor() {
        super();
        this.executionOrder.push("DynInheritTest2()");
        dynamicProto(DynInheritTest2, this, (_self, base) => {
            _self.testFunction = () => {
                base.testFunction();
                this.executionOrder.push("DynInheritTest2.test()");
            }
        });
    }
}

class DynInheritTest3 extends DynInheritTest2 {
    constructor() {
        super();
        this.executionOrder.push("DynInheritTest3()");
        dynamicProto(DynInheritTest3, this, (_self, base) => {
            _self.testFunction = () => {
                base.testFunction();
                this.executionOrder.push("DynInheritTest3.test()");
            }
        });
    }
}

class InheritTest6 extends DynInheritTest2 {
    constructor() {
        super();
        this.executionOrder.push("InheritTest6()");
    }

    public testFunction() {
        super.testFunction();
        this.executionOrder.push("InheritTest6.test()");
    }
}

class DynInheritTest4 extends InheritTest6 {
    constructor() {
        super();
        this.executionOrder.push("DynInheritTest4()");
        dynamicProto(DynInheritTest4, this, (_self, base) => {
            _self.testFunction = () => {
                base.testFunction();
                this.executionOrder.push("DynInheritTest4.test()");
            }
        });
    }
}

class DynInheritTest5 extends DynInheritTest1 {
    constructor() {
        super();
        this.executionOrder.push("DynInheritTest5()");
        dynamicProto(DynInheritTest5, this, (_self, base) => {
            _self.testFunction = () => {
                base.testFunction();
                this.executionOrder.push("DynInheritTest5.test()");
            }
        });
    }
}

class DynInheritTest6 extends DynInheritTest5 {
    constructor() {
        super();
        this.executionOrder.push("DynInheritTest6()");
        dynamicProto(DynInheritTest6, this, (_self, base) => {
            _self.testFunction = () => {
                base.testFunction();
                this.executionOrder.push("DynInheritTest6.test()");
            }
        });
    }
}

class InstInherit1 implements IInheritTest {
    public executionOrder:string[] = [];

    public testFunction?():void;

    constructor() {
        this.executionOrder.push("InstInherit1()");

        this.testFunction = () => {
            this.executionOrder.push("InstInherit1.test()");
        }
    }
}

class InstInherit2 extends InheritTest2 {
    constructor() {
        super();
        this.executionOrder.push("InstInherit2()");

        this.testFunction = () => {
            super.testFunction();
            this.executionOrder.push("InstInherit2.test()");
        }
    }
}

class InheritTest7 extends InstInherit1 {
    constructor() {
        super();
        this.executionOrder.push("InheritTest7()");
    }

    public testFunction() {
        super.testFunction();
        this.executionOrder.push("InheritTest7.test()");
    }
}

class DynInheritTest7 extends InstInherit1 {
    constructor() {
        super();
        this.executionOrder.push("DynInheritTest7()");
        dynamicProto(DynInheritTest7, this, (_self, base) => {
            _self.testFunction = () => {
                base.testFunction();
                this.executionOrder.push("DynInheritTest7.test()");
            }
        });
    }
}

class InstInherit3 extends DynInheritTest7 {
    constructor() {
        super();
        this.executionOrder.push("InstInherit3()");

        this.testFunction = () => {
            super.testFunction();
            this.executionOrder.push("InstInherit3.test()");
        }
    }
}

class DynInheritTest8 extends InstInherit3 {
    constructor() {
        super();
        this.executionOrder.push("DynInheritTest8()");
        dynamicProto(DynInheritTest8, this, (_self, base) => {
            _self.testFunction = () => {
                base.testFunction();
                this.executionOrder.push("DynInheritTest8.test()");
            }
        });
    }
}

class BadInstInherit1 extends InstInherit1 {
    constructor() {
        super();
        this.executionOrder.push("BadInstInherit1()");

        this.testFunction = () => {
            try {
                super.testFunction();
            } catch (e) {
                this.executionOrder.push("BadInstInherit1.throw()");
            }
            this.executionOrder.push("BadInstInherit1.test()");
        }
    }
}

class DynInheritTest9 extends BadInstInherit1 {
    constructor() {
        super();
        this.executionOrder.push("DynInheritTest9()");
        dynamicProto(DynInheritTest9, this, (_self, base) => {
            _self.testFunction = () => {
                base.testFunction();
                this.executionOrder.push("DynInheritTest9.test()");
            }
        });
    }
}

class GoodInstInherit1 extends InstInherit1 {
    constructor() {
        super();
        this.executionOrder.push("GoodInstInherit1()");

        let prevTestFunc = this.testFunction;
        this.testFunction = () => {
            prevTestFunc.call(this);
            this.executionOrder.push("GoodInstInherit1.test()");
        }
    }
}

class DynInheritTest10 extends GoodInstInherit1 {
    constructor() {
        super();
        this.executionOrder.push("DynInheritTest10()");
        dynamicProto(DynInheritTest10, this, (_self, base) => {
            _self.testFunction = () => {
                base.testFunction();
                this.executionOrder.push("DynInheritTest10.test()");
            }
        });
    }
}

class GoodInstInherit2 extends DynInheritTest10 {
    constructor() {
        super();
        this.executionOrder.push("GoodInstInherit2()");

        let prevTestFunc = this.testFunction;
        this.testFunction = () => {
            prevTestFunc.call(this);
            this.executionOrder.push("GoodInstInherit2.test()");
        }
    }
}

export class DynamicProtoTests extends AITestClass {

    public testInitialize() {
    }

    private _validateOrder(message:string, actual:string[], expected:string[]) {
        QUnit.assert.equal(actual.length, expected.length, message + ": Checking the length");

        let passed = true;
        let error = "";
        for (let lp = 0; lp < expected.length; lp++) {
            if (lp < actual.length) {
                if (actual[lp] !== expected[lp]) {
                    passed = false
                    error += " **[" + actual[lp] + "!=" + expected[lp] + "]**;"
                } else {
                    error += " " + expected[lp] + ";";
                }
            } else {
                passed = false;
                error += " --[" + expected[lp] + "]--;"
            }
        }

        // Fail test and log any extra unexpected calls
        for (let lp = expected.length; lp < actual.length; lp++) {
            passed = false;
            error += " ++[" + actual[lp] + "]++;"
        }

        QUnit.assert.ok(passed, message + ":" + error);
    }

    private doTest(message:string, theTest:IInheritTest, expectedOrder:string[])
    {
        theTest.testFunction();
        this._validateOrder(message, theTest.executionOrder, expectedOrder);
    }

    public registerTests() {
        this.testCase({
            name: "Inheritance tests",
            test: () => {
                this.doTest("InheritTest1", new InheritTest1(), [
                    "InheritTest1()", 
                    "InheritTest1.test()"
                ]);

                this.doTest("InheritTest2", new InheritTest2(), [
                    "InheritTest1()", 
                    "InheritTest2()", 
                    "InheritTest1.test()",
                    "InheritTest2.test()"
                ]);

                this.doTest("InheritTest3", new InheritTest3(), [
                    "InheritTest1()", 
                    "InheritTest2()", 
                    "InheritTest3()", 
                    "InheritTest1.test()",
                    "InheritTest2.test()",
                    "InheritTest3.test()"
                ]);

                this.doTest("InheritTest4", new InheritTest4(), [
                    "DynInheritTest1()", 
                    "InheritTest4()", 
                    "DynInheritTest1.test()",
                    "InheritTest4.test()"
                ]);

                this.doTest("InheritTest5", new InheritTest5(), [
                    "DynInheritTest1()", 
                    "InheritTest4()", 
                    "InheritTest5()", 
                    "DynInheritTest1.test()",
                    "InheritTest4.test()",
                    "InheritTest5.test()"
                ]);

                this.doTest("DynInheritTest1", new DynInheritTest1(), [
                    "DynInheritTest1()", 
                    "DynInheritTest1.test()"
                ]);

                this.doTest("DynInheritTest2", new DynInheritTest2(), [
                    "InheritTest1()", 
                    "DynInheritTest2()", 
                    "InheritTest1.test()",
                    "DynInheritTest2.test()"
                ]);

                this.doTest("DynInheritTest3", new DynInheritTest3(), [
                    "InheritTest1()", 
                    "DynInheritTest2()", 
                    "DynInheritTest3()", 
                    "InheritTest1.test()",
                    "DynInheritTest2.test()",
                    "DynInheritTest3.test()"
                ]);

                this.doTest("InheritTest6", new InheritTest6(), [
                    "InheritTest1()", 
                    "DynInheritTest2()", 
                    "InheritTest6()", 
                    "InheritTest1.test()",
                    "DynInheritTest2.test()",
                    "InheritTest6.test()"
                ]);

                this.doTest("DynInheritTest4", new DynInheritTest4(), [
                    "InheritTest1()", 
                    "DynInheritTest2()", 
                    "InheritTest6()", 
                    "DynInheritTest4()", 
                    "InheritTest1.test()",
                    "DynInheritTest2.test()",
                    "InheritTest6.test()",
                    "DynInheritTest4.test()"
                ]);

                this.doTest("DynInheritTest5", new DynInheritTest5(), [
                    "DynInheritTest1()", 
                    "DynInheritTest5()", 
                    "DynInheritTest1.test()",
                    "DynInheritTest5.test()"
                ]);

                this.doTest("DynInheritTest6", new DynInheritTest6(), [
                    "DynInheritTest1()", 
                    "DynInheritTest5()", 
                    "DynInheritTest6()", 
                    "DynInheritTest1.test()",
                    "DynInheritTest5.test()",
                    "DynInheritTest6.test()"
                ]);


                this.doTest("InstInherit1", new InstInherit1(), [
                    "InstInherit1()", 
                    "InstInherit1.test()"
                ]);

                this.doTest("InstInherit2", new InstInherit2(), [
                    "InheritTest1()",
                    "InheritTest2()", 
                    "InstInherit2()",
                    "InheritTest1.test()",
                    "InheritTest2.test()",
                    "InstInherit2.test()"
                ]);

                // NOTE: Notice that InheritTest7.test() was not called -- this is because TS doesn't handle this
                this.doTest("InheritTest7", new InheritTest7(), [
                    "InstInherit1()",
                    "InheritTest7()", 
                    "InstInherit1.test()"
                ]);

                // NOTE: Notice that DynInheritTest7.test() IS called -- this is because dynamicProto handles this scenario
                this.doTest("DynInheritTest7", new DynInheritTest7(), [
                    "InstInherit1()", 
                    "DynInheritTest7()", 
                    "InstInherit1.test()",
                    "DynInheritTest7.test()"
                ]);

                this.doTest("InstInherit3", new InstInherit3(), [
                    "InstInherit1()", 
                    "DynInheritTest7()", 
                    "InstInherit3()", 
                    "InstInherit1.test()",
                    "DynInheritTest7.test()",
                    "InstInherit3.test()"
                ]);
                
                this.doTest("DynInheritTest8", new DynInheritTest8(), [
                    "InstInherit1()", 
                    "DynInheritTest7()", 
                    "InstInherit3()", 
                    "DynInheritTest8()", 
                    "InstInherit1.test()",
                    "DynInheritTest7.test()",
                    "InstInherit3.test()",
                    "DynInheritTest8.test()"
                ]);
                
                // Note: Bad inherit as with InheritTest7 fails to call base instance and actually throws in this case
                this.doTest("BadInstInherit1", new BadInstInherit1(), [
                    "InstInherit1()", 
                    "BadInstInherit1()",
                    "BadInstInherit1.throw()",
                    "BadInstInherit1.test()"
                ]);

                // Note: dynamicProto doesn't fix broken base classes, but it still calls them in the correct order
                this.doTest("DynInheritTest9", new DynInheritTest9(), [
                    "InstInherit1()", 
                    "BadInstInherit1()",
                    "DynInheritTest9()",
                    "BadInstInherit1.throw()",
                    "BadInstInherit1.test()",
                    "DynInheritTest9.test()"
                ]);

                this.doTest("GoodInstInherit1", new GoodInstInherit1(), [
                    "InstInherit1()", 
                    "GoodInstInherit1()", 
                    "InstInherit1.test()",
                    "GoodInstInherit1.test()"
                ]);

                this.doTest("DynInheritTest10", new DynInheritTest10(), [
                    "InstInherit1()", 
                    "GoodInstInherit1()",
                    "DynInheritTest10()",
                    "InstInherit1.test()",
                    "GoodInstInherit1.test()",
                    "DynInheritTest10.test()"
                ]);

                this.doTest("GoodInstInherit2", new GoodInstInherit2(), [
                    "InstInherit1()", 
                    "GoodInstInherit1()",
                    "DynInheritTest10()",
                    "GoodInstInherit2()",
                    "InstInherit1.test()",
                    "GoodInstInherit1.test()",
                    "DynInheritTest10.test()",
                    "GoodInstInherit2.test()",
                ]);
            }
        });
    }
}
