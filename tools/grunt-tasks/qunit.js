/*
 * grunt-contrib-qunit
 * https://gruntjs.com/
 *
 * Copyright (c) 2016 "Cowboy" Ben Alman, contributors
 * Licensed under the MIT license.
 */

'use strict';

// Nodejs libs.
var fs = require('fs');
var path = require('path');
var url = require('url');
var EventEmitter = require('eventemitter2');
// NPM libs.
var puppeteer = require('puppeteer');

var Promise = global.Promise;

// From -  https://github.com/sindresorhus/p-each-series/blob/main/index.js
async function pEachSeries(iterable, iterator) {
	let index = 0;

	for (const value of iterable) {
		// eslint-disable-next-line no-await-in-loop
		const returnValue = await iterator(await value, index++);

		if (returnValue === pEachSeries.stop) {
			break;
		}
	}

	return iterable;
};

pEachSeries.stop = Symbol('pEachSeries.stop');
// -----------------------------------------------------------------

// Shared functions

// Allow an error message to retain its color when split across multiple lines.
function formatMessage (message) {
  var str = String(message);
  if (typeof message === 'object' && /^\[object .*\]$/.test(str)) {
    // try to use the JSON as a better string representation
    try {
      str = JSON.stringify(message, null, 2);
    } catch ( _ ) {
    }
  }
  return String(str).split('\n')
    .map(function(s) {
      return s.magenta;
    })
    .join('\n');
}


function createRunEnd () {
  return {
    status: 'passed',
    testCounts: {
      passed: 0,
      failed: 0,
      skipped: 0,
      todo: 0,
      total: 0
    },
    runtime: 0
  };
}

function combineRunEnd(combined, runEnd) {
  if (runEnd.status === 'failed') {
    combined.status = runEnd.status;
  }
  combined.testCounts.passed += runEnd.testCounts.passed;
  combined.testCounts.failed += runEnd.testCounts.failed;
  combined.testCounts.skipped += runEnd.testCounts.skipped;
  combined.testCounts.todo += runEnd.testCounts.todo;
  combined.testCounts.total += runEnd.testCounts.total;
  combined.runtime += runEnd.runtime;
}

function generateMessage(combined) {
  return [
    combined.testCounts.total,
    ' tests completed in ',
    combined.runtime,
    'ms, with ',
    combined.testCounts.failed,
    ' failed, ' +
    combined.testCounts.skipped,
    ' skipped, and ',
    combined.testCounts.todo,
    ' todo.'
  ].join('');
}

// Copied from QUnit source code
function generateHash (module) {
  var hex;
  var i = 0;
  var hash = 0;
  var str = module + '\x1C' + 'undefined';
  var len = str.length;

  for (; i < len; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }

  // Convert the possibly negative integer hash code into an 8 character
  // hex string, which isn't strictly necessary but increases user understanding
  // that the id is a SHA-like hash
  hex = (0x100000000 + hash).toString(16);
  if (hex.length < 8) {
    hex = '0000000' + hex;
  }

  return hex.slice(-8);
}

function getPath(url) {
  if (url.substr( 0, 7 ) === 'http://' || url.substr( 0, 8 ) === 'https://') {
    return url;
  }

  return 'file://' + path.resolve(process.cwd(), url);
}

module.exports = function(grunt) {

  var eventBus = new EventEmitter({wildcard: true, maxListeners: 0});

  // Keep track of the last-started module and test. Additionally, keep track
  // of status for individual test files and the entire test suite.
  var options;
  var combinedRunEnd;
  var failureBuffer = [];
  var browser;
  var page;

  // Get an asset file, local to the root of the project.
  var asset = path.join.bind(null, __dirname, '..');

  // If options.force then log an error, otherwise exit with a warning
  function warnUnlessForced (message) {
    if (options && options.force) {
      grunt.log.error(message);
    } else {
      grunt.warn(message);
    }
  }

  function formatFailedAssertion(error) {
    var failure = '' +
      'Message: ' + formatMessage(error.message) + '\n' +
      'Actual: ' + formatMessage(error.actual) + '\n' +
      'Expected: ' + formatMessage(error.expected);
    if (error && error.stack) {
      failure += '\n' + error.stack.replace(/^\s+(at) /g, '  $1 ');
    }
    return failure;
  }


  // QUnit hooks.
  eventBus.on('qunit.on.testStart', function(testStart) {
    var name = testStart.fullName.join(' > ');
    grunt.verbose.write(name + '...');
  });

  eventBus.on('qunit.on.testEnd', function(testEnd) {
    var testPassed = (testEnd.status !== 'failed');
    if (testPassed) {
      // plainly "passed", or "skipped", or expected-failing "todo".
      //
      // Either complete the verbose testStart line, or continue dot progress.
      grunt.verbose.ok().or.write('.');
      return;
    }
    if (options && options.summaryOnly) {
      return;
    }

    var failure;
    if (testEnd.status === 'todo') {
      failure = 'Expected at least one failing assertion in todo test';
    } else {
      failure = testEnd.errors.map(formatFailedAssertion).join('\n');
    }

    if (grunt.option('verbose')) {
      grunt.log.error();
      grunt.log.error(failure);
    } else {
      var name = testEnd.fullName.join(' > ');
      failureBuffer.push(name + '\n' + failure);
      grunt.log.write('F'.red);
    }
  });

  eventBus.on('qunit.on.runEnd', function(runEnd) {
    if (!grunt.option('verbose')) {
      // End the non-verbose dot progress line
      if (runEnd.status === 'failed') {
        grunt.log.writeln();
      } else {
        grunt.log.ok();
      }
    }
    if (failureBuffer.length) {
      grunt.log.error(failureBuffer.join('\n'));
      failureBuffer.length = 0;
    }

    combineRunEnd(combinedRunEnd, runEnd);
  });

  // Re-broadcast qunit events on grunt.event.
  eventBus.on('qunit.**', function() {
    var args = [this.event].concat(grunt.util.toArray(arguments));
    grunt.event.emit.apply(grunt.event, args);
  });

  // Built-in error handlers.
  eventBus.on('fail.load', function(url) {
    grunt.verbose.write('...');
    grunt.event.emit('qunit.fail.load', url);
    grunt.log.error('Chrome unable to load \'' + url + '\' URI.');

    combinedRunEnd.status = 'failed';
  });

  eventBus.on('fail.timeout', function() {
    grunt.log.writeln();
    grunt.event.emit('qunit.fail.timeout');
    grunt.log.error('Chrome timed out, possibly due to:\n' +
        '- QUnit is not loaded correctly.\n- A missing QUnit start() call.\n' +
        '- Or, a misconfiguration of this task.');

    combinedRunEnd.status = 'failed';
  });

  eventBus.on('error.onError', function (msg) {
    // It is the responsibility of QUnit to ensure a run is marked as failure
    // if there are (unexpected) messages received from window.onerror.
    //
    // Prior to QUnit 2.17, details of global failures were printed by
    // creating a fake test with "testEnd" event. Now, it is our responsiblity
    // to print these, via browser-level pageerror or `QUnit.on('error')`.
    grunt.log.writeln();
    if (msg) {
      grunt.log.error(msg.stack || msg);
    } else {
      grunt.log.error(new Error('Unknown error'));
    }
    grunt.event.emit('qunit.error.onError', msg);
  });

  grunt.registerMultiTask('qunit', 'Run QUnit tests in Headless Chrome.', function() {
    // Chrome sandbox is incompatible with Docker and most CI environments
    var defaultChromiumArgs = (
      process.env.CHROMIUM_FLAGS || (process.env.CI ? '--no-sandbox' : '')
    ).split(' ');

    // Merge task-specific and/or target-specific options with these defaults.
    options = this.options({
      // Default Chrome timeout.
      timeout: 5000,
      // QUnit-Chrome bridge file to be injected.
      inject: asset('grunt-tasks/chrome/bridge.js'),
      // Explicit non-file URLs to test.
      urls: [],
      force: false,
      // Connect Chrome console output to Grunt output
      console: true,
      // Do not use an HTTP base by default
      httpBase: false,
      summaryOnly: false
    });
    var puppeteerLaunchOptions = Object.assign(
      {
        headless: 'new',
        args: defaultChromiumArgs
      },
      options.puppeteer
    );

    // This task is asynchronous.
    var done = this.async();
    var urls;

    // Read the content of the specified bridge files
    var bridgeFiles = Array.isArray(options.inject) ? options.inject : [options.inject];
    var bridgContents = [
      "__grunt_contrib_qunit_timeout__ = " + JSON.stringify( options.timeout ) + ";"
    ];

    for (var i = 0; i < bridgeFiles.length; i++) {
      try {
        bridgContents.push(fs.readFileSync(bridgeFiles[i], 'utf8'));
      } catch (err) {
        grunt.fail.fatal('Could not load the specified Chrome/QUnit bridge file: ' + bridgeFiles[i]);
      }
    }

    if (options.httpBase) {
      // If URLs are explicitly referenced, use them still
      urls = options.urls;
      // Then create URLs for the src files
      this.filesSrc.forEach(function(testFile) {
        urls.push(options.httpBase + '/' + testFile);
      });
    } else {
      // Combine any specified URLs with src files.
      urls = options.urls.concat(this.filesSrc);
    }

    // The final tasks to run before terminating the task
    function finishTask(success) {
      // Close the puppeteer browser
      if (browser) {
        browser.close();
      }
      // Finish the task
      done(success);
    }

    function appendToUrls (queryParam, value) {
      // Append the query param to all urls
      urls = urls.map(function(testUrl) {
        var parsed = url.parse(testUrl, true);
        parsed.query[queryParam] = value;
        delete parsed.search;
        return url.format(parsed);
      });
    }

    if (options.noGlobals) {
      // Append a noglobal query string param to all urls
      appendToUrls('noglobals', 'true');
    }

    if (grunt.option('modules')) {
      var modules = grunt.option('modules').split(',');
      var hashes = modules.map(function(module) {
        return generateHash(module.trim());
      });
      // Append moduleId to all urls
      appendToUrls('moduleId', hashes);
    }

    if (grunt.option('seed')) {
      // Append seed to all urls
      appendToUrls('seed', grunt.option('seed'));
    }

    // Reset combined data.
    combinedRunEnd = createRunEnd();

    // Instantiate headless browser
    puppeteer.launch(puppeteerLaunchOptions)
      .then(function(b) {
        browser = b;
        return b.newPage();
      })
      .then(function(p) {
        page = p;
        // emit events published in bridge.js.
        // This function exposure survives url navigations.
        return page.exposeFunction('__grunt_contrib_qunit__', function() {
          eventBus.emit.apply(eventBus, [].slice.call(arguments));
        });
      })
      .then(function() {
        // Pass through the console logs if instructed
        if (options.console) {
          page.on('console', function(msg) {
            // The `msg` is a puppeteer.ConsoleMessage, which represents the console call
            // including multple arguments passed to it.
            //
            // msg.text() formats the arguments into a naive newline-joined string, and
            // includes error objects as a useless "JSHandle@error".
            //
            // msg.args() returns a JSHandle object for each argument, but all its
            // evaluation features happen asynchronously via the browser, and in this
            // event handler we can't await those easily as the grunt output will have
            // moved on to other tests. If we want to print these, we'd have to refactor
            // this so pEachSeries() below is aware of async code here. For now, we just
            // let the useless "JSHandle" through and rely on developers to stringify any
            // useful information ahead of time, e.g. `console.warn(String(err))`.
            //
            // Ref https://pptr.dev/#?product=Puppeteer&version=v9.0.0&show=api-class-consolemessage
            var colors = {
              'error': 'red',
              'warning': 'yellow'
            };
            var txt = msg.text();
            var color = colors[msg.type()];
            grunt.log.writeln(color ? txt[color] : txt);
            // grunt.log.writeln(`${msg.location().url}:${msg.location().lineNumber}`.gray); // debug
          });
        }

        // Surface uncaught exceptions
        // Ref https://pptr.dev/#?product=Puppeteer&version=v9.0.0&show=api-event-pageerror
        page.on('pageerror', function(err) {
          eventBus.emit('error.onError', err);
        });

        // Whenever a page is loaded with a new document, before scripts execute, inject the bridge file.
        // Tell the client that when DOMContentLoaded fires, it needs to tell this
        // script to inject the bridge. This should ensure that the bridge gets
        // injected before any other DOMContentLoaded or window.load event handler.
        page.evaluateOnNewDocument('if (window.QUnit) {\n' + bridgContents.join(";") + '\n} else {\n' + 'document.addEventListener("DOMContentLoaded", function() {\n' + bridgContents.join(";") + '\n});\n}\n');

        return pEachSeries(urls, function(url) {
          // Reset current module.
          grunt.event.emit('qunit.spawn', url);
          grunt.verbose.subhead('Testing ' + url + ' ').or.write('Testing ' + url + ' ');

          return Promise.all([
            // Setup listeners for qunit.done / fail events
            new Promise(function(resolve, reject) {
              eventBus.once('qunit.on.runEnd', function() { resolve(); });
              eventBus.once('fail.*', function() { reject(url); });
            }),

            // Navigate to the url to be tested
            page.goto(getPath(url), { timeout: options.timeout })
          ]);
        });
      })
      .then(function() {
        // All tests have been run.
        var message = generateMessage(combinedRunEnd);
        var success = (combinedRunEnd.status === 'passed');

        // Log results.
        if (!success) {
          warnUnlessForced(message);
        } else {
          grunt.verbose.writeln();
          grunt.log.ok(message);
        }

        if (!success && options && options.force) {
          success = true;
        }

        // All done!
        finishTask(success);
      })
      .catch(function(err) {
        // If anything goes wrong, terminate the grunt task
        grunt.log.error("There was an error with headless chrome");
        grunt.fail.fatal(err);
        finishTask(false);
      });
  });

};
