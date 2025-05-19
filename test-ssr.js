// Test script for the safeDynamicProto implementation
// Note: This is a simple test script that would need to be built properly to run
// In a real environment, the code would be properly bundled

// This is a skeleton implementation for testing purposes
const isServerSideRender = () => {
    // Mock the SSR detection
    return typeof window === 'undefined' || typeof document === 'undefined';
};

const safeDynamicProto = (theClass, target, delegateFunc, options) => {
    if (isServerSideRender()) {
        // In SSR, just call the delegate function directly
        console.log('Using SSR-safe implementation');
        delegateFunc(target, theClass.prototype);
    } else {
        // In browser, would normally use dynamicProto
        console.log('Would use dynamicProto in browser environment');
        delegateFunc(target, theClass.prototype);
    }
};

// First test: SSR environment
console.log('=== Testing in SSR environment ===');
console.log('Is server-side render:', isServerSideRender());

// Create a test class
class TestClass {
    constructor() {
        // This should use the safe implementation in SSR
        safeDynamicProto(TestClass, this, (target) => {
            target.testMethod = () => "Test Successful";
        });
    }
}

// Instantiate and test
const testInstance = new TestClass();
console.log('Safe dynamic proto test:', testInstance.testMethod ? testInstance.testMethod() : 'Failed');

// Now create a browser-like environment
console.log('\n=== Testing in browser environment ===');
global.window = {};
global.document = {};
console.log('Is server-side render after adding window/document:', isServerSideRender());

// Test in "browser" environment
class TestClass2 {
    constructor() {
        safeDynamicProto(TestClass2, this, (target) => {
            target.testMethod = () => "Browser Test Successful";
        });
    }
}

const browserTestInstance = new TestClass2();
console.log('Browser environment test:', browserTestInstance.testMethod ? browserTestInstance.testMethod() : 'Failed');