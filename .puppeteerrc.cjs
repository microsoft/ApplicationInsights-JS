/**
 * Puppeteer configuration.
 *
 * Tests launch full Chrome via `headless: "new"` (see gruntfile.js / tools/grunt-tasks/qunit.js),
 * so the separate chrome-headless-shell binary is never used. Skipping its download avoids a
 * flaky CI install failure where the headless-shell archive extracts without an executable
 * ("browser folder exists but the executable is missing").
 */
module.exports = {
    "chrome-headless-shell": {
        skipDownload: true
    }
};
