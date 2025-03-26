# Application Insights JavaScript SDK deployment scripts

<properties
    pageTitle="Application Insights SDK JavaScript API deployment scripts"
    description="Reference doc"
    services="application-insights"
/>

<tags
    ms.service="application-insights"
    ms.workload="tbd"
    ms.tgt_pltfrm="ibiza"
    ms.devlang="na"
    ms.topic="article"
    ms.date="08/24/2015"/>

## Deployment Scripts

This folder contains PowerShell scripts to assist with the deployment of releases.

The scripts require that the user (or automated runner) has the required access for the specified Azure Storage Account. If you don't have access to the requested account / subscription the scripts will fail with an error message.

Each script will create a log file in the specified logs folder (defaults to <systemDrive>:\Logs if not otherwise specified), this can be changed by passing ``-logPath "<new log path>"`` command-line argument to each script.

The Scripts and examples are included below, but as a summary they are
| Script Name | Description
|-------------|------------
| ./publishAzReleaseToCdn.ps1 | Publish (Copy) the created resource files from the `browser/` folder to the Azure Storage account used as the source for the CDN.
| ./setAzActiveCdnVersion.ps1 | Set the available version of the major (ai.2.min.js) and minor (ai.2.#.min.js) to the previously deployed target version.
| ./listAzCdnVersions.ps1 | List the versions of the resources that are deployed to the Azure Storage account, identifying the associated properties and metadata. Optionally, listing the individual files.

### ./publishAzReleaseToCdn.ps1

This script has been created to automate the deployment of the CDN resources at the same time as publishing of the NPM packages. This script will publish the full version (v2.#.#) of the current build to all staging folders (beta, next and public) of the source storage account, it does NOT change the major (ai.2.min.js) or minor (ai.2.#.min.js) release versions

__Command line arguments__

| Name | Type | Description
|------|------|----------------
| releaseFrom | string | [Optional] Identifies the location of the `package.json` and `browser/` folders are located as these are the source locations of the release. The version number of read from the `package.json` file and then the named version files are read from the `browser/` folder. Defaults to the parent folder of where the script is running from.
| cdnStorePath | string | [Optional] Identifies the target Azure Storage account (by name) where the files will be uploaded to. As you may have access to multiple subscriptions, resource groups, and storage accounts (which can slow the automatic validation / identification process) you can optionally include the a partial subscription id and resource group name with the storage account name. So you can specify the target using any of the following 3 forms :-<br> - &lt;Full storage account name&gt; <br> - &lt;partial or full subscription id&gt;::&lt;Full storage account name&gt; <br> - &lt;partial or full subscription id&gt;::&lt;Full resource group name&gt;::&lt;Full storage account name&gt;<br>The subscription id is used to match against the collection of subscription id's that the user/runner has access to, it uses the PowerShell -like matching by wrapping the value in '*'<br>When a resource group name is supplied it will further limit the collection of storage accounts that are scanned / checked for the storage account name.<br>Example: `"65b2f83e::tstcdnstore"`
| sasToken | string | [Optional] For automated deployments, it is recommended that you pass in a pre-generated Shared Access Signature (SAS) Token to avoid the script attempting to login the user which could cause a blocking UI to be displayed. When supplied the script bypasses the automated scan / checks and will just used the identified storage account name from the `cdnStorePath` argument. If this value is not specified the script will ensure that the user is logged into azure (displaying a login UI), enumerate all of the subscription Id's for the user to find full location of the storage account identified by the `cdnStorePath` argument, once identified it will then Generate a new SAS token for the script (as long as the user has permissions) for the target subscription.
| logPath | string | [Optional] Identifies the location where the automatic log file will be written. Defaults to <systemDrive>:\Logs
| overwrite | switch | By default the script will NOT overwrite any existing Blob with the same name in each container as it sets the CacheControl period to 1yr. As such this flag is provided primarily for testing and validation purposes, passing this switch will include the "-Force" switch for the Azure RM PowerShell functions to cause any existing blob to be overwritten.
| testOnly | switch | [Optional] By default the script will upload to the production containers (beta, next and scripts), for testing this switch will effectively cause the files to be uploaded to the "tst" container with and the normal container names will instead be prepended (simulating folders) to the name. ([tst] scripts/b/ai.2.min.js)
| useConnectedAccount | switch | [Optional] By default the script will use the current logged in user to authenticate with Azure using SAS tokens, if you have disabled SAS token support for the storage account then you will need to use this switch and grant the user "Storage Blob Data Contributor" role.

#### Example Usage and output
From the &lt;repo&gt;/AISKU/scripts folder in a powershell environment

~~~~
PS D:\git\ApplicationInsights-JS\AISKU\scripts> .\publishAzReleaseToCdn.ps1 -cdnStorePath "65b2f83e::tstcdnstore"
[06/29/20 16:34:45] Store Path: 65b2f83e::tstcdnstore
[06/29/20 16:34:45] Overwrite : False
[06/29/20 16:34:45] Test Mode : False
[06/29/20 16:34:45] SourcePath: D:\git\ApplicationInsights-JS\AISKU
[06/29/20 16:34:45] Log Path  : C:\Logs
[06/29/20 16:34:45] Mode      : Manual
[06/29/20 16:34:45] Importing Module AzureRM.Profile for Login-AzureRMAccount
[06/29/20 16:34:45] Importing Module AzureRM.Storage for Get-AzureRmStorageAccount
[06/29/20 16:34:45] ----------------------------------------------------------------------
[06/29/20 16:34:45] Subscription: 65b2f83e
[06/29/20 16:34:45] StoreName   : tstcdnstore
[06/29/20 16:34:45] ----------------------------------------------------------------------
[06/29/20 16:34:45] **********************************************************************
[06/29/20 16:34:45] Generating SAS token for user
[06/29/20 16:34:45] **********************************************************************
[06/29/20 16:34:45] Checking Logged in status.
[06/29/20 16:34:46]   Finding Subscriptions
[06/29/20 16:34:49]   Finding Storage Account
[06/29/20 16:34:49]     Checking Subscription 65b2f83e-7af2-4bc3-0123-456789abcfef
[06/29/20 16:34:55]     - Found Candidate Subscription 65b2f83e-7af2-4bc3-0123-456789abcfef
[06/29/20 16:34:55] Generating SAS Token for
[06/29/20 16:34:55]   Subscription: 65b2f83e-7af2-4bc3-0123-456789abcfef
[06/29/20 16:34:55]   Group       : test
[06/29/20 16:34:55]   StoreName   : tstcdnstore
[06/29/20 16:34:56] ======================================================================
[06/29/20 16:34:56] Releasing from : D:\git\ApplicationInsights-JS\AISKU
[06/29/20 16:34:56] Version        : 2.4.1
[06/29/20 16:34:56] Adding files
[06/29/20 16:34:56]  - D:\git\ApplicationInsights-JS\AISKU\browser\ai.2.4.1.js
[06/29/20 16:34:56]  - D:\git\ApplicationInsights-JS\AISKU\browser\ai.2.4.1.js.map
[06/29/20 16:34:56]  - D:\git\ApplicationInsights-JS\AISKU\browser\ai.2.4.1.min.js
[06/29/20 16:34:56]  - D:\git\ApplicationInsights-JS\AISKU\browser\ai.2.4.1.min.js.map
[06/29/20 16:34:56] Release Files : 4
[06/29/20 16:34:56] ----------------------------------------------------------------------
[06/29/20 16:34:56] Container  : beta Prefix:
[06/29/20 16:34:56]     Using Cache Control: public, max-age=31536000, immutable
[06/29/20 16:34:56] [WRN]     ai.2.4.1.js is already present
[06/29/20 16:34:56] [WRN]     ai.2.4.1.js.map is already present
[06/29/20 16:34:56] [WRN]     ai.2.4.1.min.js is already present
[06/29/20 16:34:56] [WRN]     ai.2.4.1.min.js.map is already present
[06/29/20 16:34:56] Container  : next Prefix:
[06/29/20 16:34:56]     Using Cache Control: public, max-age=31536000, immutable
[06/29/20 16:34:56] [WRN]     ai.2.4.1.js is already present
[06/29/20 16:34:56] [WRN]     ai.2.4.1.js.map is already present
[06/29/20 16:34:56] [WRN]     ai.2.4.1.min.js is already present
[06/29/20 16:34:56] [WRN]     ai.2.4.1.min.js.map is already present
[06/29/20 16:34:56] Container  : scripts Prefix: b/
[06/29/20 16:34:56]     Using Cache Control: public, max-age=31536000, immutable
[06/29/20 16:34:57] [WRN]     b/ai.2.4.1.js is already present
[06/29/20 16:34:57] [WRN]     b/ai.2.4.1.js.map is already present
[06/29/20 16:34:57] [WRN]     b/ai.2.4.1.min.js is already present
[06/29/20 16:34:57] [WRN]     b/ai.2.4.1.min.js.map is already present
[06/29/20 16:34:57] ======================================================================
~~~~

### ./setAzActiveCdnVersion.ps1

This script will set the active release for the specified release folder (beta, next, public) to the requested full version (2.x.x) number. By default it will set both the major (ai.2.min.js) and minor (ai.2.x.min.js) versions to the requested full version, you can optionally only update the minor version.

> :bulb: **Note**
>
> Note: The script does NOT use any local files to upload as the active versions, the full version MUST have already been deployed to the requested folder within the storage account. The script will validate and fail if the requested version is not available.

__Command line arguments__

| Name | Type | Description
|------|------|----------------
| container | string | __[Required]__ Identifies the target container to update (beta, next, public)
| activeVersion | string | __[Required]__ Identifies the source full version number to copy and make the active released version fro the specified container. This MUST be the full version number in the form "a.b.c". The new active versions will be created (or overwritten) as the major version (ai.[a].min.js) and minor version (ai.[a].[b].min.js).
| cdnStorePath | string | [Optional] Identifies the target Azure Storage account (by name) where the files will be uploaded to. As you may have access to multiple subscriptions, resource groups, and storage accounts (which can slow the automatic validation / identification process) you can optionally include the a partial subscription id and resource group name with the storage account name. So you can specify the target using any of the following 3 forms :-<br> - &lt;Full storage account name&gt; <br> - &lt;partial or full subscription id&gt;::&lt;Full storage account name&gt; <br> - &lt;partial or full subscription id&gt;::&lt;Full resource group name&gt;::&lt;Full storage account name&gt;<br>The subscription id is used to match against the collection of subscription id's that the user/runner has access to, it uses the PowerShell -like matching by wrapping the value in '*'<br>When a resource group name is supplied it will further limit the collection of storage accounts that are scanned / checked for the storage account name.<br>Example: `"65b2f83e::tstcdnstore"`
| sasToken | string | [Optional] For automated deployments, it is recommended that you pass in a pre-generated Shared Access Signature (SAS) Token to avoid the script attempting to login the user which could cause a blocking UI to be displayed. When supplied the script bypasses the automated scan / checks and will just used the identified storage account name from the `cdnStorePath` argument. If this value is not specified the script will ensure that the user is logged into azure (displaying a login UI), enumerate all of the subscription Id's for the user to find full location of the storage account identified by the `cdnStorePath` argument, once identified it will then Generate a new SAS token for the script (as long as the user has permissions) for the target subscription.
| logPath | string | [Optional] Identifies the location where the automatic log file will be written. Defaults to <systemDrive>:\Logs
| minorOnly | switch | By default the script will update both the major (ai.2.min.js) and minor (ai.2.#.min.js) available versions of the script. If this switch is set it will only update the minor version (ai.2.#.min.js) and the major version (ai.2.min.js) will be unaffected.
| testOnly | switch | [Optional] By default the script will update the production containers (beta, next and scripts), for testing this switch will effectively only update the "tst" container versions with and the normal container names will instead be prepended (simulating folders) to the name. ([tst] scripts/b/ai.2.min.js)
| useConnectedAccount | switch | [Optional] By default the script will use the current logged in user to authenticate with Azure using SAS tokens, if you have disabled SAS token support for the storage account then you will need to use this switch and grant the user "Storage Blob Data Contributor" role.

 #### Example Usage and output
 From the &lt;repo&gt;/AISKU/scripts folder in a powershell environment

~~~~ 
PS D:\git\ApplicationInsights-JS\AISKU\scripts> .\setAzActiveCdnVersion.ps1 public 2.4.1 -cdnStorePath "65b2f83e::tstcdnstore"
[06/29/20 17:49:20] Container : public
[06/29/20 17:49:20] Version   : 2.4.1
[06/29/20 17:49:20] Store Path: 65b2f83e::tstcdnstore
[06/29/20 17:49:20] Test Mode : False
[06/29/20 17:49:20] Log Path  : C:\Logs
[06/29/20 17:49:20] Mode      : Manual
[06/29/20 17:49:20] Importing Module AzureRM.Profile for Login-AzureRMAccount
[06/29/20 17:49:20] Importing Module AzureRM.Storage for Get-AzureRmStorageAccount
[06/29/20 17:49:20] ----------------------------------------------------------------------
[06/29/20 17:49:20] Subscription: 65b2f83e
[06/29/20 17:49:20] StoreName   : tstcdnstore
[06/29/20 17:49:20] ----------------------------------------------------------------------
[06/29/20 17:49:20] **********************************************************************
[06/29/20 17:49:20] Generating SAS token for user
[06/29/20 17:49:20] **********************************************************************
[06/29/20 17:49:20] Checking Logged in status.
[06/29/20 17:49:28]   Finding Subscriptions
[06/29/20 17:49:33]   Finding Storage Account
[06/29/20 17:49:33]     Checking Subscription 65b2f83e-7af2-4bc3-0123-456789abcfef
[06/29/20 17:49:37]     - Found Candidate Subscription 65b2f83e-7af2-4bc3-0123-456789abcfef
[06/29/20 17:49:37] Generating SAS Token for
[06/29/20 17:49:37]   Subscription: 65b2f83e-7af2-4bc3-0123-456789abcfef
[06/29/20 17:49:37]   Group       : test
[06/29/20 17:49:37]   StoreName   : tstcdnstore
[06/29/20 17:49:37] ======================================================================
[06/29/20 17:49:37] Container  : scripts Prefix: b/
[06/29/20 17:49:39]   - scripts/b/ai.2.4.1.js                     445.0 Kb  2020-06-29 21:52:17
[06/29/20 17:49:39]   - scripts/b/ai.2.4.1.js.map                 761.4 Kb  2020-06-29 21:52:17
[06/29/20 17:49:39]   - scripts/b/ai.2.4.1.min.js                 126.9 Kb  2020-06-29 21:52:17
[06/29/20 17:49:39]   - scripts/b/ai.2.4.1.min.js.map             621.8 Kb  2020-06-29 21:52:17
[06/29/20 17:49:39] Container  : scripts Prefix: b/
[06/29/20 17:49:39] Storage Path : scripts/b
[06/29/20 17:49:39] Container : scripts
[06/29/20 17:49:39] BlobPrefix: b/
[06/29/20 17:49:39] Copying: scripts/b/ai.2.4.1.js                     445.0 Kb  2020-06-29 21:52:17
[06/29/20 17:49:39]        - b/ai.2.4.1.js ==> b/ai.2.4.js.stage
[06/29/20 17:49:39]        - b/ai.2.4.js.stage ==> b/ai.2.4.js
[06/29/20 17:49:40]        - b/ai.2.4.js.stage ==> b/ai.2.js
[06/29/20 17:49:40] Copying: scripts/b/ai.2.4.1.js.map                 761.4 Kb  2020-06-29 21:52:17
[06/29/20 17:49:40]        - b/ai.2.4.1.js.map ==> b/ai.2.4.js.map.stage
[06/29/20 17:49:41]        - b/ai.2.4.js.map.stage ==> b/ai.2.4.js.map
[06/29/20 17:49:42]        - b/ai.2.4.js.map.stage ==> b/ai.2.js.map
[06/29/20 17:49:42] Copying: scripts/b/ai.2.4.1.min.js                 126.9 Kb  2020-06-29 21:52:17
[06/29/20 17:49:42]        - b/ai.2.4.1.min.js ==> b/ai.2.4.min.js.stage
[06/29/20 17:49:43]        - b/ai.2.4.min.js.stage ==> b/ai.2.4.min.js
[06/29/20 17:49:44]        - b/ai.2.4.min.js.stage ==> b/ai.2.min.js
[06/29/20 17:49:44] Copying: scripts/b/ai.2.4.1.min.js.map             621.8 Kb  2020-06-29 21:52:17
[06/29/20 17:49:44]        - b/ai.2.4.1.min.js.map ==> b/ai.2.4.min.js.map.stage
[06/29/20 17:49:45]        - b/ai.2.4.min.js.map.stage ==> b/ai.2.4.min.js.map
[06/29/20 17:49:46]        - b/ai.2.4.min.js.map.stage ==> b/ai.2.min.js.map
[06/29/20 17:49:47] ======================================================================
~~~~

### ./listAzCdnVersions.ps1

This script will list all of the currently deployed application insights versions that are available via the CDN, this script does not change any of the deployed or active versions.

> :bulb: **Note**
>
> Note: No deployed files are modified by this script, it only enumerates the files that have already been deployed to the storage account.

__Command line arguments__

| Name | Type | Description
|------|------|----------------
| container | string | __[Optional]__ Identifies the single target container to list the available versions for (beta, next, public). If not specified all containers will be enumerated.
| cdnStorePath | string | [Optional] Identifies the target Azure Storage account (by name) where the files will be uploaded to. As you may have access to multiple subscriptions, resource groups, and storage accounts (which can slow the automatic validation / identification process) you can optionally include the a partial subscription id and resource group name with the storage account name. So you can specify the target using any of the following 3 forms :-<br> - &lt;Full storage account name&gt; <br> - &lt;partial or full subscription id&gt;::&lt;Full storage account name&gt; <br> - &lt;partial or full subscription id&gt;::&lt;Full resource group name&gt;::&lt;Full storage account name&gt;<br>The subscription id is used to match against the collection of subscription id's that the user/runner has access to, it uses the PowerShell -like matching by wrapping the value in '*'<br>When a resource group name is supplied it will further limit the collection of storage accounts that are scanned / checked for the storage account name.<br>Example: `"65b2f83e::tstcdnstore"`
| sasToken | string | [Optional] For automated deployments, it is recommended that you pass in a pre-generated Shared Access Signature (SAS) Token to avoid the script attempting to login the user which could cause a blocking UI to be displayed. When supplied the script bypasses the automated scan / checks and will just used the identified storage account name from the `cdnStorePath` argument. If this value is not specified the script will ensure that the user is logged into azure (displaying a login UI), enumerate all of the subscription Id's for the user to find full location of the storage account identified by the `cdnStorePath` argument, once identified it will then Generate a new SAS token for the script (as long as the user has permissions) for the target subscription.
| logPath | string | [Optional] Identifies the location where the automatic log file will be written. Defaults to <systemDrive>:\Logs
| showFiles | switch | [Optional] Identifies whether the details of each located blob should be listed, this includes the CacheControl and metadata for each file
| testOnly | switch | [Optional] By default the script will update the production containers (beta, next and scripts), for testing this switch will effectively only update the "tst" container versions with and the normal container names will instead be prepended (simulating folders) to the name. ([tst] scripts/b/ai.2.min.js)
| useConnectedAccount | switch | [Optional] By default the script will use the current logged in user to authenticate with Azure using SAS tokens, if you have disabled SAS token support for the storage account then you will need to use this switch and grant the user "Storage Blob Data Contributor" role.

 #### Example Usages and output
 From the &lt;repo&gt;/AISKU/scripts folder in a powershell environment

~~~~
PS D:\git\ApplicationInsights-JS\AISKU\scripts> .\listAzCdnVersions.ps1 -cdnStorePath "65b2f83e::tstcdnstore"
[06/29/20 18:29:15] Container :
[06/29/20 18:29:15] Store Path: 65b2f83e::tstcdnstore
[06/29/20 18:29:15] Log Path  : C:\Logs
[06/29/20 18:29:15] Show Files: False
[06/29/20 18:29:15] Test Mode : False
[06/29/20 18:29:15] Mode      : Manual
[06/29/20 18:29:15] Importing Module AzureRM.Profile for Login-AzureRMAccount
[06/29/20 18:29:15] Importing Module AzureRM.Storage for Get-AzureRmStorageAccount
[06/29/20 18:29:15] ----------------------------------------------------------------------
[06/29/20 18:29:15] Subscription: 65b2f83e
[06/29/20 18:29:15] StoreName   : tstcdnstore
[06/29/20 18:29:15] ----------------------------------------------------------------------
[06/29/20 18:29:15] **********************************************************************
[06/29/20 18:29:15] Generating SAS token for user
[06/29/20 18:29:15] **********************************************************************
[06/29/20 18:29:15] Checking Logged in status.
[06/29/20 18:29:16]   Finding Subscriptions
[06/29/20 18:29:37]   Finding Storage Account
[06/29/20 18:29:37]     Checking Subscription 65b2f83e-7af2-4bc3-0123-456789abcfef
[06/29/20 18:29:59]     - Found Candidate Subscription 65b2f83e-7af2-4bc3-0123-456789abcfef
[06/29/20 18:29:59] Generating SAS Token for
[06/29/20 18:29:59]   Subscription: 65b2f83e-7af2-4bc3-0123-456789abcfef
[06/29/20 18:29:59]   Group       : test
[06/29/20 18:29:59]   StoreName   : tstcdnstore
[06/29/20 18:30:00] ======================================================================
[06/29/20 18:30:00] Container  : beta Prefix:
[06/29/20 18:30:01] Container  : next Prefix:
[06/29/20 18:30:03] Container  : scripts Prefix: b/
[06/29/20 18:30:03] v2        (12)  -  [beta]/ai.2.5.3.js    [next]/ai.2.5.5.js    [scripts]/b/ai.2.4.1.js
[06/29/20 18:30:03] v2.4      (12)  -  [beta]/ai.2.4.2.js    [next]/ai.2.4.1.js    [scripts]/b/ai.2.4.1.js
[06/29/20 18:30:03] v2.4.1    (12)  -  beta/                 next/                 scripts/b/
[06/29/20 18:30:03] v2.4.2    (12)  -  beta/                 next/                 scripts/b/
[06/29/20 18:30:03] v2.5      ( 8)  -  [beta]/ai.2.5.3.js    [next]/ai.2.5.5.js
[06/29/20 18:30:03] v2.5.0    (12)  -  beta/                 next/                 scripts/b/
[06/29/20 18:30:03] v2.5.1    (12)  -  beta/                 next/                 scripts/b/
[06/29/20 18:30:03] v2.5.2    (12)  -  beta/                 next/                 scripts/b/
[06/29/20 18:30:03] v2.5.3    (12)  -  beta/                 next/                 scripts/b/
[06/29/20 18:30:03] v2.5.4    ( 2)  -  beta/                 scripts/b/
[06/29/20 18:30:03] v2.5.5    ( 8)  -  next/                 scripts/b/
[06/29/20 18:30:03] ======================================================================
~~~~

And listing the individual the files
~~~~
PS D:\git\ApplicationInsights-JS\AISKU\scripts> .\listAzCdnVersions.ps1 public -showFiles -cdnStorePath "65b2f83e::tstcdnstore"
[06/29/20 18:31:24] Container : public
[06/29/20 18:31:24] Store Path: 65b2f83e::tstcdnstore
[06/29/20 18:31:24] Log Path  : C:\Logs
[06/29/20 18:31:24] Show Files: True
[06/29/20 18:31:24] Test Mode : False
[06/29/20 18:31:24] Mode      : Manual
[06/29/20 18:31:24] Importing Module AzureRM.Profile for Login-AzureRMAccount
[06/29/20 18:31:24] Importing Module AzureRM.Storage for Get-AzureRmStorageAccount
[06/29/20 18:31:24] ----------------------------------------------------------------------
[06/29/20 18:31:24] Subscription: 65b2f83e
[06/29/20 18:31:24] StoreName   : tstcdnstore
[06/29/20 18:31:24] ----------------------------------------------------------------------
[06/29/20 18:31:24] **********************************************************************
[06/29/20 18:31:24] Generating SAS token for user
[06/29/20 18:31:24] **********************************************************************
[06/29/20 18:31:24] Checking Logged in status.
[06/29/20 18:31:26]   Finding Subscriptions
WARNING: Unable to acquire token for tenant '1309900a-b9a9-46b6-975d-d3d85f87aa28'
[06/29/20 18:31:47]   Finding Storage Account
[06/29/20 18:31:47]     Checking Subscription 65b2f83e-7af2-4bc3-0123-456789abcfef
[06/29/20 18:32:10]     - Found Candidate Subscription 65b2f83e-7af2-4bc3-0123-456789abcfef
[06/29/20 18:32:10] Generating SAS Token for
[06/29/20 18:32:10]   Subscription: 65b2f83e-7af2-4bc3-0123-456789abcfef
[06/29/20 18:32:10]   Group       : test
[06/29/20 18:32:10]   StoreName   : tstcdnstore
[06/29/20 18:32:10] ======================================================================
[06/29/20 18:32:10] Container  : scripts Prefix: b/
[06/29/20 18:32:12] v2        ( 4)
[06/29/20 18:32:12]   - scripts/b/ai.2.js                         v2.4.1   445.0 Kb  2020-06-30 00:49:40  pub 30m im  aijssdksrc=[scripts]/b/ai.2.4.1.js;
[06/29/20 18:32:12]   - scripts/b/ai.2.js.map                     v2.4.1   761.4 Kb  2020-06-30 00:49:42  pub 30m im  aijssdksrc=[scripts]/b/ai.2.4.1.js.map;
[06/29/20 18:32:12]   - scripts/b/ai.2.min.js                     v2.4.1   126.9 Kb  2020-06-30 00:49:44  pub 30m im  aijssdksrc=[scripts]/b/ai.2.4.1.min.js;
[06/29/20 18:32:12]   - scripts/b/ai.2.min.js.map                 v2.4.1   621.8 Kb  2020-06-30 00:49:47  pub 30m im  aijssdksrc=[scripts]/b/ai.2.4.1.min.js.map;
[06/29/20 18:32:12] v2.4      ( 4)
[06/29/20 18:32:13]   - scripts/b/ai.2.4.js                       v2.4.1   445.0 Kb  2020-06-30 00:49:40  pub 30m im  aijssdksrc=[scripts]/b/ai.2.4.1.js;
[06/29/20 18:32:13]   - scripts/b/ai.2.4.js.map                   v2.4.1   761.4 Kb  2020-06-30 00:49:42  pub 30m im  aijssdksrc=[scripts]/b/ai.2.4.1.js.map;
[06/29/20 18:32:13]   - scripts/b/ai.2.4.min.js                   v2.4.1   126.9 Kb  2020-06-30 00:49:44  pub 30m im  aijssdksrc=[scripts]/b/ai.2.4.1.min.js;
[06/29/20 18:32:13]   - scripts/b/ai.2.4.min.js.map               v2.4.1   621.8 Kb  2020-06-30 00:49:46  pub 30m im  aijssdksrc=[scripts]/b/ai.2.4.1.min.js.map;
[06/29/20 18:32:13] v2.4.1    ( 4)
[06/29/20 18:32:13]   - scripts/b/ai.2.4.1.js                     v2.4.1   445.0 Kb  2020-06-29 21:52:17  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.4.1.js.map                 v2.4.1   761.4 Kb  2020-06-29 21:52:17  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.4.1.min.js                 v2.4.1   126.9 Kb  2020-06-29 21:52:17  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.4.1.min.js.map             v2.4.1   621.8 Kb  2020-06-29 21:52:17  pub 1yr im
[06/29/20 18:32:13] v2.4.2    ( 4)
[06/29/20 18:32:13]   - scripts/b/ai.2.4.2.js                     v2.4.2   445.0 Kb  2020-06-29 20:18:47  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.4.2.js.map                 v2.4.2   761.4 Kb  2020-06-29 20:18:47  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.4.2.min.js                 v2.4.2   126.9 Kb  2020-06-29 20:18:48  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.4.2.min.js.map             v2.4.2   621.8 Kb  2020-06-29 20:18:48  pub 1yr im
[06/29/20 18:32:13] v2.5.0    ( 4)
[06/29/20 18:32:13]   - scripts/b/ai.2.5.0.js                     v2.5.0   445.0 Kb  2020-06-29 19:56:15  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.5.0.js.map                 v2.5.0   761.4 Kb  2020-06-29 19:56:15  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.5.0.min.js                 v2.5.0   126.9 Kb  2020-06-29 19:56:16  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.5.0.min.js.map             v2.5.0   621.8 Kb  2020-06-29 19:56:16  pub 1yr im
[06/29/20 18:32:13] v2.5.1    ( 4)
[06/29/20 18:32:13]   - scripts/b/ai.2.5.1.js                     v2.5.1   445.0 Kb  2020-06-29 19:51:49  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.5.1.js.map                 v2.5.1   761.4 Kb  2020-06-29 19:51:50  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.5.1.min.js                 v2.5.1   126.9 Kb  2020-06-29 19:51:50  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.5.1.min.js.map             v2.5.1   621.8 Kb  2020-06-29 19:51:50  pub 1yr im
[06/29/20 18:32:13] v2.5.2    ( 4)
[06/29/20 18:32:13]   - scripts/b/ai.2.5.2.js                     v2.5.2   445.0 Kb  2020-06-29 20:07:06  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.5.2.js.map                 v2.5.2   761.4 Kb  2020-06-29 20:07:06  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.5.2.min.js                 v2.5.2   126.9 Kb  2020-06-29 20:07:06  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.5.2.min.js.map             v2.5.2   621.8 Kb  2020-06-29 20:07:07  pub 1yr im
[06/29/20 18:32:13] v2.5.3    ( 4)
[06/29/20 18:32:13]   - scripts/b/ai.2.5.3.js                     v2.5.3   445.0 Kb  2020-06-29 20:12:50  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.5.3.js.map                 v2.5.3   761.4 Kb  2020-06-29 20:12:50  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.5.3.min.js                 v2.5.3   126.9 Kb  2020-06-29 20:12:51  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.5.3.min.js.map             v2.5.3   621.8 Kb  2020-06-29 20:12:51  pub 1yr im
[06/29/20 18:32:13] v2.5.4    ( 1)
[06/29/20 18:32:13]   - scripts/b/ai.2.5.4.js                        ---   445.0 Kb  2020-06-25 00:14:26  pub 1yr im
[06/29/20 18:32:13] v2.5.5    ( 4)
[06/29/20 18:32:13]   - scripts/b/ai.2.5.5.js                     v2.5.5   445.0 Kb  2020-06-29 19:28:29  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.5.5.js.map                 v2.5.5   761.4 Kb  2020-06-29 19:28:29  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.5.5.min.js                 v2.5.5   126.9 Kb  2020-06-29 19:28:29  pub 1yr im
[06/29/20 18:32:13]   - scripts/b/ai.2.5.5.min.js.map             v2.5.5   621.8 Kb  2020-06-29 19:28:30  pub 1yr im
[06/29/20 18:32:13] ======================================================================
~~~~

Refer to [our GitHub page](https://github.com/microsoft/applicationinsights-js) for more details on using Application Insights JS SDK.
