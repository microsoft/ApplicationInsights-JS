# Contributing

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

## Welcome

Welcome and thank you for your interest in contributing to ApplicationInsights-JS.

We strongly welcome and encourage contributions to this project. Please read the [contributor's guide][ContribGuide] located in the ApplicationInsights-Home repository. If making a large change we request that you open an [issue][GitHubIssue] first. We follow the [Git Flow][GitFlow] approach to branching.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

[ContribGuide]: https://github.com/microsoft/ApplicationInsights-Home/blob/main/CONTRIBUTING.md
[GitFlow]: http://nvie.com/posts/a-successful-git-branching-model/
[GitHubIssue]: https://github.com/microsoft/ApplicationInsights-JS/issues

## Clone and setup

Use a patched Node.js runtime before installing dependencies or running any repository tooling:
Node.js 22.23.4+, 24.22.1+, or 26.12.1+ within those respective release lines.
Node.js 24 LTS is recommended; `.nvmrc` selects 24.22.1 for local version managers.
Node.js 18, 20, and other unsupported release lines must not be used for builds or releases.
The root npm and Rush configuration enforce these build-time version requirements; they do not change browser SDK compatibility.

These minimum versions fix [CVE-2026-111497](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases).
Although SDK telemetry compression uses gzip, npm and HTTP clients used by repository tools can decode Brotli responses.
Updating npm dependencies or disabling telemetry compression does not patch the native decoder.
Always update Node.js itself before running `npm install`, including on release agents.

CI selects the latest patches satisfying the security minimums instead of reusing an older cached major version.
GitHub JavaScript actions use the runner's bundled Node.js runtime independently of `actions/setup-node`.
Keep self-hosted runners and their bundled action runtimes patched, and verify managed runner updates separately.
Private release pipelines and container images maintained outside this repository must also use patched runtimes.

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
