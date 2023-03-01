# Application Insights JavaScript SDK

## AISKU Sample

This Sample shows how to track [`pageview`](../../API-reference.md#trackpageview), [`event`](../../API-reference.md#trackevent), [`trace`](../../API-reference.md#tracktrace), [`metric`](../../API-reference.md#trackmetric), [`exception`](../../API-reference.md#trackexception), get cookies details by using `cookieMgr` and record event duration manually by using `startTrackEvent` and `stopTrackEvent`.

## Sample Build

- Build the repository before running this example.
- Run `npm run serve` under root folder.
- Open `http://localhost:9001/examples/AISKU/`.

## Description

- button `Change Config` will change config dynamically.
- button `Create Pageview` will trigger a pageview telemetry.
- button `Create Event` will trigger an event telemetry.
- button `Create Trace` will trigger a trace telemetry.
- button `Create Metric` will trigger a metric telemetry.
- button `Create Exception` will trigger an exception telemetry.
- button `Start Tracking event` will start timing an event with given name `manual_record_event`
- button `Stop Tracking event` will stop timing the previous event with given name `manual_record_event`.

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us the rights to use your contribution. For details, visit <https://cla.microsoft.com>.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions provided by the bot. You will only need to do this once across all repositories using our CLA.

This project has adopted the Microsoft Open Source Code of Conduct. For more information see the Code of Conduct FAQ or contact opencode@microsoft.com with any additional questions or comments.

## Data Collection

As this SDK is designed to enable applications to perform data collection which is sent to the Microsoft collection endpoints the following is required to identify our privacy statement.

The software may collect information about you and your use of the software and send it to Microsoft. Microsoft may use this information to provide services and improve our products and services. You may turn off the telemetry as described in the repository. There are also some features in the software that may enable you and Microsoft to collect data from users of your applications. If you use these features, you must comply with applicable law, including providing appropriate notices to users of your applications together with a copy of Microsoft’s privacy statement. Our privacy statement is located at [here](https://go.microsoft.com/fwlink/?LinkID=824704). You can learn more about data collection and use in the help documentation and our privacy statement. Your use of the software operates as your consent to these practices.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow Microsoft’s Trademark & Brand Guidelines. Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party’s policies.

## License

MIT
