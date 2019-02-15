module.exports = {
  '1. Navigate to tests' : function (browser) {
    var reportName = `tests_output/qunit_output_${browser.options.desiredCapabilities.browserName}${browser.options.desiredCapabilities.version || ''}.html`;
    var ieAppendage = browser.options.desiredCapabilities.version;
    ieAppendage = ieAppendage ? `?version=${ieAppendage}` : '';
    browser
      .url(`http://localhost:8000/Tests/Selenium/Tests.html${ieAppendage}`)
      .pause(1500);

    var pollResults = () => {
      try {
        browser.elements('css selector', 'li[class*="fail"] [class*="test-name"]', (result) => {
          if (result.value && result.value.length > 0) {
            browser.getTitle(title => {
              if (title.includes('✖')) {
                saveHtml(browser, reportName);
                clearTimeout(a);
                browser.assert.ok(false, 'Tests failed');
                browser.end();
              } else {
                a = setTimeout(pollResults, 1000);
                browser.pause(1500);
              }
            });
          }
        });

        browser.elements('css selector', 'li[class*="running"] [class*="test-name"]', (result) => {
          if (result.value && result.value.length === 0) {
            browser.getTitle(title => {
              if (title.includes('✔')) {
                saveHtml(browser, reportName);
                clearTimeout(a);
                browser.assert.ok(true, 'Tests passed');
                browser.end();
              } else {
                a = setTimeout(pollResults, 1000);
                browser.pause(1500);
              }
            })
          } else {
            a = setTimeout(pollResults, 1000);
            browser.pause(1500);
          }
        });
      } catch (e) {
        browser.assert.ok(false, 'Tests failed due to error');
        browser.end();
      }
    };
    var a = setTimeout(pollResults, 1000);
  }
};

function saveHtml(browser, reportName) {
  browser.source(result => {
    require('fs').writeFile(reportName, result.value);
  })
}
