# Application Insights JavaScript SDK

## Dependency Sample

This Sample shows how to filter, modify, block and disable dependency data with [`addDependencyListener`](../../API-reference.md#adddependencylistener) and [`addDependencyInitializer`](../../API-reference.md#adddependencyinitializer).

## Sample Build

- Build the repository before running this example.
- Run `npm run serve` under root folder.
- Open `http://localhost:9001/examples/dependency/`.

## Description

- button `change-config` will change config dynamically.

- button `add-handlers` will add a dependencyListener with the following changes:

    ```javascript
        context.listener = "dependency-listener-context";
        traceFlags = 0;
    ```

    and a dependencyInitializer with the following changes:

    ```javascript
        item.name = "dependency-name";
        item.properties.url = item.target;
        context.initializer = "dependency-initializer-context";
    ```

- button `stop-dependency-event` will block all dependency events.

- button `remove-all-handlers` will remove all previously added dependency initializers and listeners.

- button `create-fetch-request` will trigger a fetch request.

- button `create-xhr-request` will trigger a xhr request.

- button `untrack-fetch-request` will trigger a fetch request that will be blocked.

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
