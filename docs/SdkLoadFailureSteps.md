# SDK Load Failure: Troubleshooting steps

## CDN Blocked

This situation is possible when an Application Insights JS SDK CDN endpoint has been reported and/or identified as being unsafe for some reason. When this occurs, it will cause the endpoint to be publicly block-listed and consumers of these lists will begin to block all access.
Resolving this requires the owner of the CDN endpoint to work with the block-listing entity that has marked the endpoint as unsafe so that it can be removed from the relevant list. 

Check if the CDN endpoint has been identified as unsafe.
- [Google Transparency Report](https://transparencyreport.google.com/safe-browsing/search)
- [VirusTotal](https://www.virustotal.com/gui/home/url)
- [Sucuri SiteCheck](https://sitecheck.sucuri.net/)

Depending on the frequency that the application, firewall or environment update their local copies of these lists, it may take a considerable amount of time and/or require manual intervention by end users or corporate IT departments to force an update or explicitly allow the CDN endpoints to resolve the issue. 

If the CDN endpoint is identified as unsafe, please [create a support ticket](#create-a-support-ticket) with the required details to ensure that the issue is resolved as soon as possible.

You may also want to consider [changing the SDK CDN endpoint](#change-the-cdn-endpoint) to _potentially_ bypass this issue more rapidly.

## Intermittent Network Failure

If the user is experiencing intermittent network connectivity failures, then there are fewer possible solutions and they will generally resolve themselves over a short period of time. For example, if the user reloads your site the files will (eventually) get downloaded and cached locally until an updated version is released.

With this situation [Hosting the SDK on you own CDN](#host-sdk) is unlikely to provide or reduce the occurrences of this exception, as your own CDN will be affected by the same issue.

The same is also true when [using the SDK via NPM packages](#use-npm) solution, however, from the end users perspective when this occurs your entire application fails to load / initialize (rather than _just_ the telemetry SDK - which they don't see visually), so they will most likely refresh your site until is loads completely.

## Add Exceptions for CDN endpoints

Work with your end users or provide documentation informing them that they should allow scripts from the Application Insights CDN endpoints to be downloaded by including them in their browsers plug-in or firewall rule exception list, this will vary based on the end users environment.

Here is an example of how to configure within [Chrome to allow or block access to websites](https://support.google.com/chrome/a/answer/7532419?hl=en)

## Corporate Exceptions for CDN endpoints

This is similar to [adding exceptions for end users](#add-exceptions-for-cdn-endpoints), but you will need to work with your end users IT department to have them configure the Application Insights CDN endpoints to be downloaded by including (or removing) them in any domain block-listing or allow-listing services.

> :warning: **Important**
>
> If the your corporate user is using a [private cloud](https://azure.microsoft.com/overview/what-is-a-private-cloud/) and they cannot enable any form of exception to provide their internal users with public access for the CDN endpoints then you will need to [use the NPM packages](#use-npm) or [host the Application Insights SDK on your own CDN](#host-sdk).

## Change the CDN endpoint

As the snippet and its configuration are returned by your application as part of each generated page, you can change the snippet `src` configuration to use a different URL for the SDK. By using this approach, you could bypass the [CDN Blocked](#cdn-blocked) issue as the new URL should not be blocked.

Current Application Insights JavaScript SDK CDN endpoints
- https://az416426.vo.msecnd.net/scripts/b/ai.2.min.js
- https://js.monitor.azure.com/scripts/b/ai.2.min.js

> :bulb: **Note**
>
> The https://js.monitor.azure.com/ endpoint is an alias that allows us to switch between CDN providers within approximately 5 minutes, without the need for you to change any config. This is to enable us to fix detected CDN related issues more rapidly if a CDN provider is having regional or global issues without requiring everyone to adjust their settings.

## Use NPM
 
Rather than using the snippet and public CDN endpoints you could use the NPM packages to include the SDK as part of your own JavaScript files. With this approach, the SDK will become just another package within your own scripts. Note: It is recommended that when using this approach, you should also use some form of [JavaScript bundler](https://www.bing.com/search?q=javascript+bundler) to assist with code splitting and minification.

As with the snippet, it is also possible that your own scripts (with or without using the SDK NPM packages) could be affected by the same blocking issues listed here, so depending on your application, your users, and your framework you may want to consider implementing something similar to logic in the snippet to detect and report these issues.

> :bulb: **Note**
>
> You will need to use this approach (or [Host the SDK on you own CDN](#host-sdk)) if your users are using a [private cloud](https://azure.microsoft.com/overview/what-is-a-private-cloud/) as they most likely will not have access to the public internet.

## Host SDK
 
Rather than your end users downloading the Application Insights SDK from the public CDN you could host the Application Insights SDK from your own CDN endpoint. If using this approach, it is recommended that you use a specific version (ai.2.#.#.min.js) so that it's easier to identify which version you are using, it is also recommended that update it on a regular basis to the current version (ai.2.min.js) so you can leverage any bug fixes and new features that become available.

<div class="alert alert-info"> 

:bulb: __Note:__ You will need to use this approach (or [Use NPM packages](#use-npm)) if your users are using a [private cloud](https://azure.microsoft.com/overview/what-is-a-private-cloud/) as they most likely will not have access to the public internet.
</div>

## Create a support ticket
 
Use the Azure Support portal to [create a new support ticket](https://azure.microsoft.com/support/create-ticket/) with details of the outage.

> __Please include__ :-
>  1. If the detected failure is caused by block-listing from a public Anti-virus or block-listing provider, please include details of the provider. This will help in reducing the time required to get the issue resolved;
>  2. Checks / Validations that you have already performed;
>  3. The timeframe(s) of the reported issues;
>  4. The Expected SDK version # to be downloaded;
>  5. Stack details from the reported exception (as it includes the CDN endpoint, the hosting page URL and the endpoint used to report the exception);
>  6. The reported browser and if know the version of the browser/environment.
> ---


## SDK Failed to initialize

We will assume that you have already validated that the SDK script was successfully downloaded.

> Basic reporting rules: This section includes different reporting options, it will recommend either creating a support ticket or raising an issue on GitHub.
> - If the issue is only affecting a small number of users and more specifically a specific or subset of browser version(s) (check the details on the reported exception) then it's likely an end user or environment only issue which will probably require you application to provide additional polyfill implementations. For these please raise a GitHub issue.
> - If this issue is affecting your entire application and all of your users are affected then it's probably a release related issue and therefore you should create a support ticket.

First lets check for JavaScript exceptions, using a browser that supports developer tools (F12) load the page and review if any exceptions occurred.

If there are exceptions being reported in the SDK script (for example ai.2.min.js), then this may indicate that the configuration passed into the SDK contains unexpected or missing required configuration or a faulty release has been deployed to the CDN.

To check for faulty configuration, change the configuration passed into the snippet (if not already) so that it only includes your connection string as a string value

> src: "https://az416426.vo.msecnd.net/scripts/b/ai.2.min.js",<br />
> cfg:{<br />
> connectionString: "YOUR_CONNECTION_STRING"<br />
> }});<br />

If when using this minimal configuration you are still seeing a JavaScript exception in the SDK script, please [create a support ticket](#create-a-support-ticket) with the details as this will require the faulty build to be rolled back as it's most likely an issue with a newly deployed version.

If the exception disappears, then the issue is likely caused by a type mismatch or unexpected value, proceed to re-add your configuration options until the exception occurs again and then check the documentation for the item causing the issue. If the documentation is unclear or you need assistance, please [file an issue on GitHub](https://github.com/Microsoft/ApplicationInsights-JS/issues). 

If your configuration was previously deployed and working but just started reporting this exception, then it may be an issue with a newly deployed version, please check whether is affecting only a small set of your users / browser and either [file an issue on GitHub](https://github.com/Microsoft/ApplicationInsights-JS/issues) or [create a support ticket](#create-a-support-ticket).

Assuming there are no exceptions being thrown the next step is to enabling console debugging by adding ```loggingLevelConsole``` setting to the configuration, this will send all initialization errors and warnings to the browsers console (normally available via the developer tools (F12)). Any reported errors should be self-explanatory and if you need further assistance [file an issue on GitHub](https://github.com/Microsoft/ApplicationInsights-JS/issues).
> cfg:{<br />
> connectionString: "CONNECTION_STRING",<br />
> loggingLevelConsole: 2<br />
> }});<br />

> :bulb: **Note**
>
> During initialization the SDK performs some basic checks for known major dependencies, if these are not provided by the current runtime it will report the failures out as warning messages to the console, but only if the loggingLevelConsole is greater than zero.

If it still fails to initialize, try enabling the ```enableDebug``` configuration setting, which will cause all internal errors to be thrown as an exception (which will cause telemetry to be lost), as this is a developer only setting it will probably get very noisy with exceptions getting thrown as part of some internal checks, so you will need to review each exception to determine which issue is causing the SDK to fail. Use the non-minified version of the script (note the extension below it's ".js" and not ".min.js") otherwise the exceptions will be unreadable. 

> :rotating_light: **WARNING:**
>
> This is a developer only setting and should NEVER be enabled in a full production environment as you will loose telemetry.

> src: "https://az416426.vo.msecnd.net/scripts/b/ai.2.js",<br />
> cfg:{<br />
> connectionString: "CONNECTION_STRING",<br />
> enableDebug: true<br />
> }});<br />

If this still does not provide any insights, you should [file an issue on GitHub](https://github.com/Microsoft/ApplicationInsights-JS/issues) with the details and if you have an example site that would be extremely useful. Please ensure to include the browser version, operating system, and JS framework details to help identify the issue.

## <a name="next"></a> Next steps
* [Get additional help by filing an issue on GitHub](https://github.com/Microsoft/ApplicationInsights-JS/issues)
* [SDK Load Failure details](SdkLoadFailure.md)
