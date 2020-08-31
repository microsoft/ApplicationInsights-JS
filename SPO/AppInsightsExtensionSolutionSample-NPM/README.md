## appinsights-extension-solution-sample-npm

This is a sample SharePoint Framework Extension solution that will set up Application Insights on a [SharePoint Online modern site](https://support.microsoft.com/en-ie/office/sharepoint-classic-and-modern-experiences-5725c103-505d-4a6e-9350-300d3ec7d73f?ui=en-us&rs=en-ie&ad=ie) through [NPM setup](https://github.com/microsoft/ApplicationInsights-JS#npm-setup-ignore-if-using-snippet-setup).

### Building the code

```bash
git clone the repo
```
Inside AppInsightsExtensionSolutionSampleNPM root folder
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
