/**
 * Puppeteer configuration.
 *
 * All browser launches in this repo use the "new" headless mode
 * (headless: 'new' in gruntfile.js and tools/grunt-tasks/qunit.js), which runs
 * the full `chrome` binary. The separate `chrome-headless-shell` binary is
 * never launched.
 *
 * On GitHub CI runners the `chrome-headless-shell` postinstall download
 * repeatedly corrupts ("browser folder exists but the executable is missing"),
 * which fails `npm install` before any build/test runs. Since that binary is
 * unused, skip downloading it so only the (required) full Chrome is fetched.
 * This keeps the CI workflow stock while removing the flaky download.
 */
module.exports = {
    "chrome-headless-shell": {
        skipDownload: true
    }
};
