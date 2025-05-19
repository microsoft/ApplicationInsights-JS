// Test script for the safeDynamicProto implementation with property redefinition
// Note: This is a simple test script that would need to be built properly to run
// In a real environment, the code would be properly bundled

// Mock dynamicProto for testing purposes
const dynamicProto = (theClass, target, delegateFunc, options) => {
    console.log('Using dynamicProto with options:', options);
    
    if (options && options.setInstFuncs === false) {
        console.log('Using dynamicProto with setInstFuncs=false to avoid property redefinition');
    } else {
        console.log('Using standard dynamicProto implementation');
        
        // Simulate the error that happens in Cloudflare Worker when isServerSideRender() is true
        // This simulates the failure when trying to redefine the 'name' property on a function
        if (typeof window === 'undefined') {
            throw new Error('Cannot redefine property: name');
        }
    }
    
    // Call the delegate function like the real dynamicProto would
    delegateFunc(target, theClass.prototype);
};

// The SSR detection function
const isServerSideRender = () => {
    // Mock the SSR detection
    return typeof window === 'undefined' || typeof document === 'undefined';
};

// Our safeDynamicProto wrapper implementation
const safeDynamicProto = (theClass, target, delegateFunc, options) => {
    if (isServerSideRender()) {
        // The core issue in Cloudflare Workers is with dynamicProto attempting to redefine properties
        // on functions that are non-configurable in strict mode (particularly the 'name' property).
        // Create custom options to prevent property redefinition
        const ssrOptions = options ? { ...options } : {};
        ssrOptions.setInstFuncs = false;
        
        try {
            dynamicProto(theClass, target, delegateFunc, ssrOptions);
        } catch (e) {
            console.log('Error in dynamicProto, falling back to direct delegate call:', e.message);
            // As a fallback if dynamicProto still fails
            try {
                delegateFunc(target, theClass.prototype);
            } catch (innerError) {
                console.error('Error in fallback delegate call:', innerError.message);
            }
        }
    } else {
        // In normal browser environments, use the standard dynamicProto
        dynamicProto(theClass, target, delegateFunc, options);
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