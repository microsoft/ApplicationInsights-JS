## appinsights-extension-solution-sample

This is a sample SharePoint Framework Extension solution that will set up Application Insights on a SharePoint Online modern site.

### Building the code

```bash
git clone the repo
```
Inside AppInsightsExtensionSolutionSample root folder
```bash
npm i
npm i -g gulp
gulp
```
For solution deployment, check out the [Set up deployment](https://github.com/microsoft/ApplicationInsights-JS/tree/master/SPO/README.md#set-up-deployment) configuration section.

This package produces the following:

* lib/* - intermediate-stage commonjs build artifacts
* dist/* - the bundled script, along with other resources
* deploy/* - all resources which should be uploaded to a CDN.

### Build options

gulp clean - TODO
gulp test - TODO
gulp serve - TODO
gulp bundle - TODO
gulp package-solution - TODO
