// Test if the server-side rendering detection works properly

// First, mock the server-side environment
global.window = undefined;
global.document = undefined;

// Import the isServerSideRender function
const { isServerSideRender } = require('./shared/AppInsightsCore/src/JavaScriptSDK/EnvUtils');

// Test the function
console.log('Is server-side render:', isServerSideRender());

// Now create a browser-like environment
global.window = {};
global.document = {};

// Test again
console.log('Is server-side render after adding window/document:', isServerSideRender());