## Contributing

Welcome and thank you for your interest in contributing to ApplicationInsights-JS.

We strongly welcome and encourage contributions to this project. Please read the [contributor's guide][ContribGuide] located in the ApplicationInsights-Home repository. If making a large change we request that you open an [issue][GitHubIssue] first. We follow the [Git Flow][GitFlow] approach to branching.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

[ContribGuide]: https://github.com/microsoft/ApplicationInsights-Home/blob/master/CONTRIBUTING.md
[GitFlow]: http://nvie.com/posts/a-successful-git-branching-model/
[GitHubIssue]: https://github.com/microsoft/ApplicationInsights-JS/issues

## Clone and setup
1. Clone the repository and create a new branch
2. Install all dependencies
	```
	npm install
	npm install -g @microsoft/rush
	```
3. Navigate to the root folder and update rush dependencies
	```
	rush update
	```
4. Build and test
	```
	rush build
	npm run test
	```

## Build and test

The root folder contains 8 packages that are components of this next version of the SDK. When making changes in multiple packages, you can build using the following commands in root folder:

1. rush rebuild --verbose

    This will build all packages in order of dependencies. If there are build errors, verbose options is required to view error details.

2. rush test --verbose

    This will run tests in all packages in parallel.

If you are changing package versions or adding/removing any package dependencies, run> **rush update --purge --recheck --full** before building. Please check-in any files that change under common\ folder.
