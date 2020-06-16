# Sample Site How-To

## What is this?

This is an extremely simple website created to help test and develop the
debugging plugin. The site itself is just the buttons along the
top-left corner of the webpage. Clicking on one of these will fire
its respective function.

The plugin provides all the rest of the functionality.

## Setup and Running

Currently this site requires a locally-built version of the plugin.

1. ensure `npm` is installed
2. clone this repository
3. `npm install` while in the main directory
4. navigate to `./extensions/applicationinsights-debugplugin-js`
5. `npm install` in that directory
6. `npm run build` to build a local version of the plugin
7. navigate to `./sample`
8. `npm install` one last time
9. `npm run start` to run this test site on `localhost:3000`