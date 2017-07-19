page = require('webpage').create();
page.open('file:///E:/Dev/ApplicationInsights-JS/JavaScript/JavaScriptSDK.Tests/Selenium/Tests.html?hidepassed', function () {
  debugger;
  page.evaluateAsync(function () {
    debugger; // wait here in the second web browser tab
  });
});