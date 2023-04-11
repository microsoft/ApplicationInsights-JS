<properties
	pageTitle="Application Insights JavaScript SDK - Snippets"
	description="Reference doc"
	services="application-insights"
    documentationCenter=".net"
/>

<tags
	ms.service="application-insights"
	ms.workload="tbd"
	ms.tgt_pltfrm="ibiza"
	ms.devlang="na"
	ms.topic="article"
	ms.date="8/28/2020"/>

# Microsoft Application Insights JavaScript SDK - Snippet Injection

## How to push Application Insights JS snippet changes consumed by Application Insights dotnet package.

1.  Fork Application Insights dotnet [Repo](https://github.com/microsoft/ApplicationInsights-dotnet).
2.  Get the latest copy of JS snippet and make changes in `NETCORE\src\Microsoft.ApplicationInsights.AspNetCore\Resources.resx` file.

### Build/Test Changes:
1. Open `Everything.sln` file. Run build and Tests on AspNetCore project

### Test Changes Locally:

1. Create a dot net [SampleWebApp](https://docs.microsoft.com/en-us/visualstudio/ide/quickstart-aspnet-core?view=vs-2019).
2.  Open your SampleWebApp and enable client side telemetry. More details on how to do this [here](https://docs.microsoft.com/en-us/azure/azure-monitor/app/asp-net-core#enable-client-side-telemetry-for-web-applications)
3.  In `SampleWebApp\Startup.cs` configure ikey
4.  In `SampleWebApp\WebApplication1.csproj` Refer the package `Microsoft.ApplicationInsights.AspNetCore` you just built from the build output folder: `\your visual studio workspace\bin\Debug\NuGet`.

## How to inject Javascript with Sharepoint Framework Extensions through [Snippet Setup](https://github.com/microsoft/ApplicationInsights-JS/tree/master/SPO#snippet-setup-ignore-if-using-npm-setup)

Due to security concerns, you can't directly add the script that's described in [this](https://docs.microsoft.com/en-us/azure/azure-monitor/app/sharepoint) article to your webpages in the SharePoint modern UX. As an alternative, you can use [SharePoint Framework (SPFx)](/sharepoint/dev/spfx/extensions/overview-extensions) to build a custom extension that you can use to install Application Insights on your SharePoint sites. There are two ways to add Application Insights to your extension solution, either install via NPM setup or drop a script tag on the extension head. If you choose the second option, [view the sample](https://github.com/pnp/sp-dev-fx-extensions/tree/master/samples/js-application-appinsights). 

- Snippet for SPO (Sharepoint online) modern UX scenario: 
```js
`!function(v,y,T){var S=v.location,k="script",D="instrumentationKey",C="ingestionendpoint",I="disableExceptionTracking",E="ai.device.",b="toLowerCase",w=(D[b](),"crossOrigin"),N="POST",e="appInsightsSDK",t=T.name||"appInsights",n=((T.name||v[e])&&(v[e]=t),v[t]||function(l){var u=!1,d=!1,g={initialize:!0,queue:[],sv:"6",version:2,config:l};function m(e,t){var n={},a="Browser";return n[E+"id"]=a[b](),n[E+"type"]=a,n["ai.operation.name"]=S&&S.pathname||"_unknown_",n["ai.internal.sdkVersion"]="javascript:snippet_"+(g.sv||g.version),{time:(a=new Date).getUTCFullYear()+"-"+i(1+a.getUTCMonth())+"-"+i(a.getUTCDate())+"T"+i(a.getUTCHours())+":"+i(a.getUTCMinutes())+":"+i(a.getUTCSeconds())+"."+(a.getUTCMilliseconds()/1e3).toFixed(3).slice(2,5)+"Z",iKey:e,name:"Microsoft.ApplicationInsights."+e.replace(/-/g,"")+"."+t,sampleRate:100,tags:n,data:{baseData:{ver:2}}};function i(e){e=""+e;return 1===e.length?"0"+e:e}}var e,n,f=l.url||T.src;function a(e){var t,n,a,i,o,s,r,c,p;u=!0,g.queue=[],d||(d=!0,i=f,r=(c=function(){var e,t={},n=l.connectionString;if(n)for(var a=n.split(";"),i=0;i<a.length;i++){var o=a[i].split("=");2===o.length&&(t[o[0][b]()]=o[1])}return t[C]||(t[C]="https://"+((e=(n=t.endpointsuffix)?t.location:null)?e+".":"")+"dc."+(n||"services.visualstudio.com")),t}()).instrumentationkey||l[D]||"",c=(c=c[C])?c+"/v2/track":l.endpointUrl,(p=[]).push((t="SDK LOAD Failure: Failed to load Application Insights SDK script (See stack for details)",n=i,o=c,(s=(a=m(r,"Exception")).data).baseType="ExceptionData",s.baseData.exceptions=[{typeName:"SDKLoadFailed",message:t.replace(/\./g,"-"),hasFullStack:!1,stack:t+"\nSnippet failed to load ["+n+"] -- Telemetry is disabled\nHelp Link: https://go.microsoft.com/fwlink/?linkid=2128109\nHost: "+(S&&S.pathname||"_unknown_")+"\nEndpoint: "+o,parsedStack:[]}],a)),p.push((s=i,t=c,(o=(n=m(r,"Message")).data).baseType="MessageData",(a=o.baseData).message='AI (Internal): 99 message:"'+("SDK LOAD Failure: Failed to load Application Insights SDK script (See stack for details) ("+s+")").replace(/\"/g,"")+'"',a.properties={endpoint:t},n)),i=p,r=c,JSON&&((o=v.fetch)&&!T.useXhr?o(r,{method:N,body:JSON.stringify(i),mode:"cors"}):XMLHttpRequest&&((s=new XMLHttpRequest).open(N,r),s.setRequestHeader("Content-type","application/json"),s.send(JSON.stringify(i)))))}function i(e,t){d||setTimeout(function(){!t&&g.core||a()},500)}f&&((n=y.createElement(k)).src=f,!(o=T[w])&&""!==o||"undefined"==n[w]||(n[w]=o),n.onload=i,n.onerror=a,n.onreadystatechange=function(e,t){"loaded"!==n.readyState&&"complete"!==n.readyState||i(0,t)},e=n,T.ld<0?y.getElementsByTagName("head")[0].appendChild(e):setTimeout(function(){y.getElementsByTagName(k)[0].parentNode.appendChild(e)},T.ld||0));try{g.cookie=y.cookie}catch(h){}function t(e){for(;e.length;)!function(t){g[t]=function(){var e=arguments;u||g.queue.push(function(){g[t].apply(g,e)})}}(e.pop())}var s,r,o="track",c="TrackPage",p="TrackEvent",o=(t([o+"Event",o+"PageView",o+"Exception",o+"Trace",o+"DependencyData",o+"Metric",o+"PageViewPerformance","start"+c,"stop"+c,"start"+p,"stop"+p,"addTelemetryInitializer","setAuthenticatedUserContext","clearAuthenticatedUserContext","flush"]),g.SeverityLevel={Verbose:0,Information:1,Warning:2,Error:3,Critical:4},(l.extensionConfig||{}).ApplicationInsightsAnalytics||{});return!0!==l[I]&&!0!==o[I]&&(t(["_"+(s="onerror")]),r=v[s],v[s]=function(e,t,n,a,i){var o=r&&r(e,t,n,a,i);return!0!==o&&g["_"+s]({message:e,url:t,lineNumber:n,columnNumber:a,error:i,evt:v.event}),o},l.autoExceptionInstrumented=!0),g}(T.cfg));function a(){T.onInit&&T.onInit(n)}(v[t]=n).queue&&0===n.queue.length?(n.queue.push(a),n.trackPageView({})):a()}(window,document,{
    src: "https://js.monitor.azure.com/scripts/b/ai.2.gbl.min.js", // The SDK URL Source
    // name: "appInsights", // Global SDK Instance name defaults to "appInsights" when not supplied
    // ld: 0, // Defines the load delay (in ms) before attempting to load the sdk. -1 = block page load and add to head. (default) = 0ms load after timeout,
    // useXhr: 1, // Use XHR instead of fetch to report failures (if available),
    crossOrigin: "anonymous", // When supplied this will add the provided value as the cross origin attribute on the script tag
    // onInit: null, // Once the application insights instance has loaded and initialized this callback function will be called with 1 argument -- the sdk instance (DO NOT ADD anything to the sdk.queue -- As they won't get called)
    cfg: { // Application Insights Configuration
        connectionString: "InstrumentationKey=` + this.properties.instrumentationKey + `"
    }
});`
```

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to
agree to a Contributor License Agreement (CLA) declaring that you have the right to,
and actually do, grant us the rights to use your contribution. For details, visit
https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need
to provide a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the
instructions provided by the bot. You will only need to do this once across all repositories using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/)
or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Data Collection

As this SDK is designed to enable applications to perform data collection which is sent to the Microsoft collection endpoints the following is required to identify our privacy statement.

The software may collect information about you and your use of the software and send it to Microsoft. Microsoft may use this information to provide services and improve our products and services. You may turn off the telemetry as described in the repository. There are also some features in the software that may enable you and Microsoft to collect data from users of your applications. If you use these features, you must comply with applicable law, including providing appropriate notices to users of your applications together with a copy of Microsoft’s privacy statement. Our privacy statement is located at https://go.microsoft.com/fwlink/?LinkID=824704. You can learn more about data collection and use in the help documentation and our privacy statement. Your use of the software operates as your consent to these practices.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft’s Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party’s policies.

## License

[MIT](LICENSE)
