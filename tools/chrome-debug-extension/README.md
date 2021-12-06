# Application Insights Debug Viewer

## What the tool does

This tool runs in your browser, either Chrome or Edge, and provides you real time visualization of events flowing through Application Insights. You can use it to monitor the telemetry that your web application is emitting as part of your dev inner loop or bug investigations, or you can use it to monitor the internal calls within Application Insights to debug your integration of Application Insights into your web application.

We recommend building a configuration file to represent the schema of the telemetry your web application emits, and have your engineering team use it during the dev inner loop to ensure their changes are emitting the expected telemetry, and to also catch warnings/errors early.

## Installing the tool

1. Download either the [official](https://js.monitor.azure.com/release/tools/ai.chrome-ext.zip) or [nightly](https://js.monitor.azure.com/nightly/tools/ai.chrome-ext.nightly.zip) build and unzip it into a folder
1. Open the Manage Extensions page in either Chrome or Edge
   - Browse to either edge://extensions or chrome://extensions/ respectively
   - Or choose Extensions from the ... menu
1. Enable Developer Mode
1. Click `Load unpacked`
1. Browse to the path where you unzipped the extension
1. Click `Select Folder`

## Using the tool

1. To launch the tool, click the ![Telemetry-Viewer-icon](images/icon-19.png) icon next to the address bar
    - If it isn't there, click the `small puzzle piece` icon and then the `Telemetry Viewer`![Telemetry-Viewer-icon](images/icon-19.png)
1. The first time you run the tool, it will start in the `Configuration Selection` page, which you can always return to by clicking the gear icon later
    - If your team has a preset configuration in the drop down list, select it
    - Otherwise, use you can start with the Default configuration
    - You can also chooose to craft your own custom configuration, using one of the presets as a starting point by clicking `Copy to Custom Configuration`
1. Click `OK` and you will be taken to the main page where you can view live events as they are generated

## Exploring the tool
1. Tooltips explain what each feature across the top does
1. Clicking on an event will show details of that event in the bottom half of the tool
1. You can save a session to a .json file in your Downloads folder, and open it again by dragging it back into the tool's window
    - This is handy for attaching a session to a bug report for an engineer to be able to examine later

## Updating the tool
1. To get the latest version of the tool, follow step 1 of the installation steps again, and unzip it to the same folder that you orginally unzipped it to
1. In the browser, go to the `Manage Extensions` page
     - Browse to either edge://extensions or chrome://extensions/ respectively
1. Click `Reload` under the `Telemetry Viewer` extension

## Configuring the tool

Get the most out of the tool by customizing its configuration for your project. You can read about all of the options in the comments in [this file](https://github.com/microsoft/ApplicationInsights-JS/blob/master/tools/chrome-debug-extension/src/configuration/IConfiguration.ts)

You have several options for configurations:
1. Use a preset configuration
   - Ideal if your team already has one built that you can reuse - can be highly customized to your telemetry schema
1. Use the default configuration
   - Most suitable for situations where you are debugging the integration of Application Insights into your web application
1. Use a local custom configuration
   - Good for customizing the table layout to best match your telemetry schema
   - Easily and rapidly iterate on your configuration right within the tool without having to recapture session data
       - Click the gear icon to go to the configuration page to modify your custom configuration, then save it to see the results
   - The custom configuration is stored in local storage, so you won't lose it unless you uninstall the plugin
   - You can copy out the configuration and share it with coworkers - best for early prototyping or if you aren't able to add a preset configuration
1. Create a new preset configuration
   - To add your configuration to the preset configuration list, you'll need to check in a change to [`Configuration.types.ts`](https://github.com/microsoft/ApplicationInsights-JS/blob/master/tools/chrome-debug-extension/src/configuration/Configuration.types.ts) to add your configuration's URL to the list. 
   - Once your configuration is in the list, you will need to follow your team's process for updating the configuration file, since it is hosted in a team-specific location. It may be in a repo where you have to check in changes to it, or it may be on a OneDrive share that you can update directly.

## Contributing to the tool

1. Please see the general information about contributing to this repository [here](https://github.com/microsoft/ApplicationInsights-JS/tree/master#contributing)
1. To specifically work on this tool, follow this dev inner loop:
   1. Startup:
      1. Go into Chrome or Edge, go to the `Manage Extensions` page (edge://extensions or chrome://extensions/), and `Remove` the tool if you already have it installed from somewhere other than your enlistment
      1. In the repo root, run `rush install`
      1. Run `rush build --to @microsoft/applicationinsights-chrome-debug-extension`
      1. In the `Manage Extensions` page, click `Load unpacked` and browse to your local `tools/chrome-debug-extension/browser` folder and click `Select Folder`
      1. You can now use your locally built version of the tool in your browser, and use the F12 developer tools to debug the popup
   1. Making incremental changes:
      1. Save your change
      1. Run `rush build --only @microsoft/applicationinsights-chrome-debug-extension`
      1. If you only modified the popup window, just press F5 in the popup window
      1. If you modified any of the content/background code, click `Reload` for the plugin in the `Manage Extensions` page
