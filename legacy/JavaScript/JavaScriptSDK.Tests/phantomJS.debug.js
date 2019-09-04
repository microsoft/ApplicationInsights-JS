page = require('webpage').create();
page.open('/JavaScript/JavaScriptSDK.Tests/Selenium/Tests.html?hidepassed', function () {
  debugger;
  page.evaluateAsync(function () {
    debugger; // wait here in the second web browser tab
  });
});