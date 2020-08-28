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
2.  Get the latest copy of JS snippet and make changes in NETCORE\src\Microsoft.ApplicationInsights.AspNetCore\Resources.resx file.

### Build/Test Changes:
1. Open Everything.sln file. Run build and Tests on AspNetCore project

### Test Changes Locally:

1. Create a dot net [SampleWebApp](https://docs.microsoft.com/en-us/visualstudio/ide/quickstart-aspnet-core?view=vs-2019).
2.  Open your SampleWebApp and enable client side telemetry. More details on how to do this [here](https://docs.microsoft.com/en-us/azure/azure-monitor/app/asp-net-core#enable-client-side-telemetry-for-web-applications)
3.  In SampleWebApp\Startup.cs configure ikey
4.  In SampleWebApp\WebApplication1.csproj Refer the package Microsoft.ApplicationInsights.AspNetCore you just build from the build output folder: \your visual studio workspace\bin\Debug\NuGet.
