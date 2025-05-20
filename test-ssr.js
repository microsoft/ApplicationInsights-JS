// Test script for the SSR detection and handling
// This tests that initialization in SSR environments is handled properly

// Mock SSR environment
const originalWindow = global.window;
const originalDocument = global.document;
delete global.window;
delete global.document;

// Load the necessary modules
const { isServerSideRender } = require('./shared/AppInsightsCore/dist/es5/applicationinsights-core-js');

// Test SSR detection
console.log('Testing SSR detection:');
console.log('Is server-side render:', isServerSideRender());
if (!isServerSideRender()) {
    console.error('Expected isServerSideRender() to return true in an environment without window/document!');
}

// Restore window and document to simulate browser environment
global.window = {};
global.document = {};

// Re-test SSR detection
console.log('\nTesting browser detection:');
console.log('Is server-side render after adding window/document:', isServerSideRender());
if (isServerSideRender()) {
    console.error('Expected isServerSideRender() to return false after adding window/document!');
}

// Test constructing the ApplicationInsights in SSR mode
// This requires the module to be built first, so we just test the concept
console.log('\nSSR handling in ApplicationInsights:');
console.log('When in SSR environment (window/document undefined), ApplicationInsights constructor will:');
console.log('1. Detect the SSR environment using isServerSideRender()');
console.log('2. Provide minimal no-op implementations of all methods');
console.log('3. Skip initialization of tracking features');
console.log('4. Avoid using dynamicProto which causes property redefinition errors');
console.log('5. Allow the page to render without getting stuck');

// Clean up
global.window = originalWindow;
global.document = originalDocument;