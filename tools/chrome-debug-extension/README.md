# Application Insights Debug Viewer

## What the tool does

This tool runs in your browser, either Chrome or Edge, and provides you real time visualization of events flowing through Application Insights. You can use it to monitor the telemetry that your web application is emitting as part of your dev inner loop or bug investigations, or you can use it to monitor the internal calls within Application Insights to debug your integration of Application Insights into your web application.

We recommend building a configuration file to represent the schema of the telemetry your web application emits, and have your engineering team use it during the dev inner loop to ensure their changes are emitting the expected telemetry, and to also catch warnings/errors early.

## How to install the tool

1. Open the Manage Extensions page in either Chrome or Edge
   - Browse to either edge://extensions or chrome://extensions/ respectively
   - Or choose Extensions from the ... menu
1. Enable Developer Mode
1. Click `Load unpacked`
1. Browse to `PATH_TO_BUILD_SHARE`
1. Click `Select Folder`

## How to update the tool

Your browser will load the latest version of the tool each time you restart the browser. To force it to load the latest without restarting, you can click the `Reload` button next to the extension in the Manage Extensions page.

## How to run the tool

Click the `small puzzle piece` icon next to the address bar and select `Telemetry Viewer`![Telemetry-Viewer-icon](images/icon-19.png) from the extension dropdown to launch the tool.

## Configuring the tool

Since each web application logs telemetry in a different schema, you'll first be asked to select a configuration to load. If your web application does not have a configuration defined yet, see the `Creating a new configuration` section below.

## Creating a new configuration

You can draft a configuration directly in the tool on the `Configuration Selection` page. You can always get back to that page by clicking the "gear" icon.

To add your configuration to the dropdown list, you'll need to check in a change to [`src/configuration/Configuration.types.ts`](src/configuration/Configuration.types.ts#L16) to add your configuration's URL to the list. Follow the instructions in that file.

## Updating your configuration

Once your configuration is in the list, you will need to follow your team's process for updating the configuration file, since it is hosted in a team-specific location. It may be in a repo where you have to check in changes to it, or it may be on a OneDrive share that you can update directly.

## Authoring a configuration directly in the tool without a check in

When you load a configuration, the contents of the configuration will be shown on the `Configuration Selection` page of the tool where you can modify it directly. This is an easy way to iterate on a configuration file for your team before publishing it to your team's share, or even before you add your team's configuration to the list.

## Contributing to the tool

This tool is internally open sourced - if you would like to make a contribution, please follow the process [here](https://github.com/microsoft/ApplicationInsights-JS/tree/master#contributing)
