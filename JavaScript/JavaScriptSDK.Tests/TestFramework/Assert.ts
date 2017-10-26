/// <reference path="../External/qunit.d.ts" />

/** Wrapper around QUnit asserts. This class has two purposes:
 * - Make Assertion methods easy to discover.
 * - Make them consistent with XUnit assertions in the order of the actual and expected parameter values.
 */
class Assert {
    /**
    * A deep recursive comparison assertion, working on primitive types, arrays, objects, 
    * regular expressions, dates and functions.
    *
    * The deepEqual() assertion can be used just like equal() when comparing the value of 
    * objects, such that { key: value } is equal to { key: value }. For non-scalar values, 
    * identity will be disregarded by deepEqual.
    *
    * @param expected Known comparison value
    * @param actual Object or Expression being tested
    * @param message A short description of the assertion
    */
    public static deepEqual(expected: any, actual: any, message?: string): any {
        return deepEqual(actual, expected, message);
    }

    /** 
    * A non-strict comparison assertion, roughly equivalent to JUnit assertEquals.
    *
    * The equal assertion uses the simple comparison operator (==) to compare the actual 
    * and expected arguments. When they are equal, the assertion passes: any; otherwise, it fails. 
    * When it fails, both actual and expected values are displayed in the test result, 
    * in addition to a given message.
    * 
    * @param expected Known comparison value
    * @param actual Expression being tested
    * @param message A short description of the assertion
    */
    public static equal(expected: any, actual: any, message?: string): any {
        return equal(actual, expected, message);
    }

    /**
    * An inverted deep recursive comparison assertion, working on primitive types, 
    * arrays, objects, regular expressions, dates and functions.
    *
    * The notDeepEqual() assertion can be used just like equal() when comparing the 
    * value of objects, such that { key: value } is equal to { key: value }. For non-scalar 
    * values, identity will be disregarded by notDeepEqual.
    * 
    * @param expected Known comparison value
    * @param actual Object or Expression being tested
    * @param message A short description of the assertion
    */
    public static notDeepEqual(expected: any, actual: any, message?: string): any {
        return notDeepEqual(actual, expected, message);
    }

    /**
    * A non-strict comparison assertion, checking for inequality.
    *
    * The notEqual assertion uses the simple inverted comparison operator (!=) to compare 
    * the actual and expected arguments. When they aren't equal, the assertion passes: any; 
    * otherwise, it fails. When it fails, both actual and expected values are displayed 
    * in the test result, in addition to a given message.
    * 
    * @param expected Known comparison value
    * @param actual Expression being tested
    * @param message A short description of the assertion
    */
    public static notEqual(expected: any, actual: any, message?: string): any {
        return notEqual(actual, expected, message);
    }

    public static notPropEqual(expected: any, actual: any, message?: string): any {
        return notPropEqual(actual, expected, message);
    }

    public static propEqual(expected: any, actual: any, message?: string): any {
        return propEqual(actual, expected, message);
    }

    /**
    * A non-strict comparison assertion, checking for inequality.
    *
    * The notStrictEqual assertion uses the strict inverted comparison operator (!==) 
    * to compare the actual and expected arguments. When they aren't equal, the assertion 
    * passes: any; otherwise, it fails. When it fails, both actual and expected values are 
    * displayed in the test result, in addition to a given message.
    * 
    * @param expected Known comparison value
    * @param actual Expression being tested
    * @param message A short description of the assertion
    */
    public static notStrictEqual(expected: any, actual: any, message?: string): any {
        return notStrictEqual(actual, expected, message);
    }

    /**
    * A boolean assertion, equivalent to CommonJS's assert.ok() and JUnit's assertTrue(). 
    * Passes if the first argument is truthy.
    *
    * The most basic assertion in QUnit, ok() requires just one argument. If the argument 
    * evaluates to true, the assertion passes; otherwise, it fails. If a second message 
    * argument is provided, it will be displayed in place of the result.
    * 
    * @param state Expression being tested
    * @param message A short description of the assertion
    */
    public static ok(state: any, message?: string): any {
        return ok(state, message);
    }

    /**
    * A strict type and value comparison assertion.
    *
    * The strictEqual() assertion provides the most rigid comparison of type and value with 
    * the strict equality operator (===)
    * 
    * @param expected Known comparison value
    * @param actual Expression being tested
    * @param message A short description of the assertion
    */
    public static strictEqual(expected: any, actual: any, message?: string): any {
        return strictEqual(actual, expected, message);
    }

    /**
    * Assertion to test if a callback throws an exception when run.
    * 
    * When testing code that is expected to throw an exception based on a specific set of 
    * circumstances, use throws() to catch the error object for testing and comparison.
    * 
    * @param block Function to execute
    * @param expected Error Object to compare
    * @param message A short description of the assertion
    */
    public static throws(block: () => any, expected: any, message?: string): any;

    /**
    * @param block Function to execute
    * @param message A short description of the assertion
    */
    public static throws(block: () => any, message?: string): any;

    public static throws(block: () => any, expected?: any, message?: string): any {
        return throws(block, expected, message);
    }
}