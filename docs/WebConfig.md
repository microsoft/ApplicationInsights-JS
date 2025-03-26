# Microsoft Application Insights JavaScript SDK - Web Config for CfgSync Plugin

Define ThrottleMgrCfg Configurations and feature opt-in status details.

## Change History

### Version

1.0.0 (March, 2024)

CDN details

| Name    | Description | Details
|---------|------|----------------
| enabled | General on/off | `true` (on)
| featureOptIn | opt-in feature list | iKeyUsage (*inital opt-in*)
| featureOptIn.iKeyUsage.mode | feature-iKeyUsage enable/disable status | `3` (enable/opt-in)
| featureOptIn.iKeyUsage.onCfg | override values of the following cdn `config` when feature-iKeyUsage is enabled |  <sub>DefaultThrottleMsgKey</sub></br>throttleMgrCfg.109.disabled: `false`</br> <sub>InstrumentationKeyDeprecation</sub></br> throttleMgrCfg.106.disabled: `false`
| featureOptIn.iKeyUsage.offCfg | override values of the following cdn `config` when feature-iKeyUsage is disabled | <sub>DefaultThrottleMsgKey</sub></br>throttleMgrCfg.109.disabled: `true`</br> <sub>InstrumentationKeyDeprecation</sub></br> throttleMgrCfg.106.disabled: `true`
| config | override values for user's core config | throttleMgrCfg
| config.throttleMgrCfg | override values for user's throttleMgrCfg under core config | <sub>InstrumentationKeyDeprecation</sub></br> throttleMgrCfg.106:</br>{  `"disabled": false`, *// will send ikey InstrumentationKey Deprecation message*</br>`"limit": { "samplingRate": 1, "maxSendNumber": 1}`, *// sampling rate: 0.0001%, and will send max one message per time* </br>`"interval": {"monthInterval": 2,"daysOfMonth": [1]}`} *// message will be sent on the first day every 2 months*,</br><sub>DefaultThrottleMsgKey</sub></br>throttleMgrCfg.109:</br>{  `"disabled": false`, *// generally enable*</br> ... *// all other settings are same with the InstrumentationKeyDeprecation settings*}</br>

#### Note

This change will begin InstrumentationKeyDeprecation message throttling. If InstrumentationKey is used instead of ConnectionString for appInsights SDK initialization, logs with InstrumentationKeyDeprecation(106) message id will be sent.

## Basic Usage

### Change Feature Opt-in Status

Under your config, define opt-in details in `featureOptIn`

```js

//to define iKeyUsage opt-in details
{
    connectionString: "YOUR_CONNECTION_STRING",
    ...
    featureOptIn: {["iKeyUsage"]: {
        mode: FeatureOptInMode.disable, // set feature-iKeyUsage opt-in status to disable
        blockCdnCfg: false, //define if should block any changes from web config cdn
        } as IFeatureOptInDetails
    }
}

```

### Disable Fetching From CDN

For users behind a firewall, if fetching config CDN needs to be disabled, the following changes can be applied to your root configurations.

```js
{
    connectionString: "YOUR_CONNECTION_STRING",
    ...
    extensionConfig: {
            ["AppInsightsCfgSyncPlugin"]: {
                cfgUrl: "" // this will block fetching from default cdn
            }
    }
}

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

The software may collect information about you and your use of the software and send it to Microsoft. Microsoft may use this information to provide services and improve our products and services. You may turn off the telemetry as described in the repository. There are also some features in the software that may enable you and Microsoft to collect data from users of your applications. If you use these features, you must comply with applicable law, including providing appropriate notices to users of your applications together with a copy of Microsoft's privacy statement. Our privacy statement is located at https://go.microsoft.com/fwlink/?LinkID=824704. You can learn more about data collection and use in the help documentation and our privacy statement. Your use of the software operates as your consent to these practices.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party's policies.

## License

[MIT](LICENSE)
