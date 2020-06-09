# How to create a SPFx extension solution with AppInsights installed from scratch

## Set up Application Insights 
1. Follow [SPFx Extensions instruction](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/extensions/get-started/build-a-hello-world-extension) to create a SharePoint Framework Extension.
2. Install Application Insights via [NPM setup](https://github.com/microsoft/ApplicationInsights-JS#getting-started). 
3. Under your Extension solution src folder, update ApplicationCustomizer.ts file:
    a. [Set up Application Insights](https://github.com/microsoft/ApplicationInsights-JS#npm-setup-ignore-if-using-snippet-setup)
    ```js
    import { ApplicationInsights } from '@microsoft/applicationinsights-web'

    const appInsights = new ApplicationInsights({ config: {
    instrumentationKey: 'YOUR_INSTRUMENTATION_KEY_GOES_HERE'
    /* ...Other Configuration Options... */
    } });
    appInsights.loadAppInsights();
    appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview
    ```

    b. Expose all configuration options you need in the ApplicationCustomizerProperties interface.
    ```js
    export interface IAppInsightsApplicationCustomizerProperties {
        /* ...Other Configuration Options... */
        instrumentationKey: string;
    }
    ```
    c. Update appInsights instance config to map with exposed properties.
    ```js
    import { ApplicationInsights } from '@microsoft/applicationinsights-web'

    const appInsights = new ApplicationInsights({ config: {
    instrumentationKey: this.properties.instrumentationKey
    /* ...Other Configuration Options... */
    } });
    appInsights.loadAppInsights();
    appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview
    ```
## Set up deployment configuration
### Deploy Extension solution Tenant wide (All sites share same iKey)
1. Under your Extension solution config folder, set the skipFeatureDeployment attribute to true in the package-solution.json file. And add "ClientSideInstance.xml" file under "features"/"assets"/"elementManifests".
<p><img src="./img/image3.png"/></p>

2. Export properties you defined from ClientSideInstance.xml file. 
    ```js
    <?xml version="1.0" encoding="utf-8"?>
    <Elements xmlns="http://schemas.microsoft.com/sharepoint/">
        <ClientSideComponentInstance
            Title="AppinsightsExtension"
            Location="ClientSideExtension.ApplicationCustomizer"
            ComponentId="96262ed0-fe5d-4786-abc2-9f6b9cb3fefc"
            Properties="{&quot;instrumentationKey&quot;:&quot;YOUR_INSTRUMENTATION_KEY_GOES_HERE&quot;}">
        </ClientSideComponentInstance>
    </Elements>
    ```
3. Run following command to create .sppkg file. Check [Host extension from CDN](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/extensions/get-started/hosting-extension-from-office365-cdn) for reference.
    ```sh
    gulp bundle --ship
    gulp package-solution --ship
    ```
4. Open your tenant app catalog.
5. Click on Apps for SharePoint.
6. Upload the solution to the catalog.
7. Check the option Make this solution available to all sites in the organization .
<p><img src="./img/image4.png"/></p>

> Now Application Insights web JS SDK is installed tenant wide on your SPO. If you need to edit configurations, you could do it through SharePoint UI: 

1. On your tenant app catalog page, go to Site Contents.
9. Open the list Tenant Wide Extensions.
10. Edit the ApplicationInsightsExtension item. For example, you can use a different instrumentationKey or set other configuration properties you set up in Set up Application Insights section.
<p><img src="./img/image5.png"/></p>
11. Save the item and all your modern SharePoint site on Office 365 are ready to be monitored. If this was the first solution globally deployed on your tenant, it may take up to 20 minutes get available.
<p><img src="./img/image6.png"/></p>

### Deploy Extension solution on a single site
1. Remove skipFeatureDeployment attribute from package-solution file.
2. Export properties you defined from elements.xml file.
    ```js
    <?xml version="1.0" encoding="utf-8"?>
    <Elements xmlns="http://schemas.microsoft.com/sharepoint/">
        <CustomAction
            Title="AppInsights"
            Location="ClientSideExtension.ApplicationCustomizer"
            ClientSideComponentId="53048b36-d45c-4706-b6ae-00afa52b2b3d"
            ClientSideComponentProperties="{&quot;instrumentationKey&quot;:&quot;YOUR_INSTRUMENTATION_KEY_GOES_HERE&quot;}">
        </CustomAction>
    </Elements>
    ```
3. Run following command to create .sppkg file. Check [Host extension from CDN](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/extensions/get-started/hosting-extension-from-office365-cdn) for reference.
    ```sh
    gulp bundle --ship
    gulp package-solution --ship
    ```
4. Open your tenant app catalog.
5. Click on Apps for SharePoint.
6. Upload the solution to the catalog.
7. Click Deploy.
<p><img src="./img/image1.png"/></p>
8. On the site you want to install Application Insights, click "+New" -> App , to add appinsights extension to your site.
> Wait until the extension is added to your site, AppInsights Web JS SDK is installed on your site. With this route, you can not edit properties on SharePoint UI. If you change the AI configuration, you'll need to repeate step 3-8.
<p><img src="./img/image2.png"/></p>

Check AppInsightsExtensionSolutionSample. 
