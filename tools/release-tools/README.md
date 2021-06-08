# 1DS JavaScript Release Tools

1DS JavaScript Release tools.

This script is used internally to both prepare a release and to automatically generate beta/nightly builds.

## setVersion.js

This script is designed as a helper for setting and updating the version number used for all components, in both the package.json and versions directly embedded in the source / test files.

When run, it will
- Set the specified version in the version.json (which is used as the default when not specified on the command line)
- Updates the "version" within EVERY package.json for all channels/extensions/shared/skus/snippets/examples
- Updates ALL of the referenced versions for the "@microsoft/1ds-xxx" dependencies/peerDependencies/devDependencies, so that when rush creates references they all reference the local build.

After running this script and the version number has changed you WILL need to also run the "rush update" ```npm run update``` to ensure that the dependencies and hashes identified in the npm-shrinkwrap.json are updated correctly.

### When to use

There are a couple of usages for this script
- When preparing a new release you should run the script with either an explicit version or specify the switch to automatically increment the version number
    - ```npm run setVersion 3.2.0``` Sets the version explicitly as 3.2.0 (for ALL components), only use this if all components are on the same version.
    - ```npm run setVersion -- -patch``` Increments version to the next patch version number x.y.[z+1] (eg. ```3.1.2``` => ```3.1.3```) This will increment the patch level based on the components current version and not the root package.json version.
    - ```npm run setVersion -- -minor``` Increments the version to the next minor version number x.[y+1].0 (eg. ```3.1.2``` => ```3.2.0```)
- During the build pipeline, this script will be called from with the dev-ops pipeline so that we can create an automated pipeline for generating alpha/beta/dev/nightly/release builds, with or without the current build number. This will be used to generate official "Beta" release generation job.
    - Note: At this stage the version number will NOT be checked back into the repo

### Example Usages

Not all combinations are show, you can combine several options.

General help displayed when the passed arguments appear to be incorrect.

```
setVersion.js [<newVersion>|-patch|-minor|-major] [-dev|-alpha|-beta|-release] [-bld ######] [-test]
--------------------------
 <newVersion> - Identifies the version to set for all packages, must start with x.y.z
 -patch      - Increment the current version to the next patch number (x.y.z => x.y.[z+1]
 -minor      - Increment the current version to the next minor number (x.y.z => x.[y+1].0
 -major      - Increment the current version to the next major number (x.y.z => [x+1].0.0
 -dev        - Add the 'dev' pre-release to the number (x.y.z => x.y.z-dev)
 -alpha      - Add the 'alpha' pre-release to the number (x.y.z => x.y.z-alpha)
 -beta       - Add the 'beta' pre-release to the number (x.y.z => x.y.z-beta)
 -release    - Remove any existing pre-release tags (x.y.z-prerel => x.y.z)
 -bld ###### - Append the provided build number to the version (x.y.z => x.y.z-[prerel].######) [prerel] defaults to dev if not defined
 -pre ###### - Set the pre-release to the provided value (x.y.z => x.y.z-[prerel])
 -react      - Update only the react packages (Require as the react components need to update after the core because of the different versions of TypeScript being used.)
 -test       - Scan all of the package.json files and log the changes, but DON'T update the files
```

#### Set the version explicitly

To set the version to specific build number, just pass as one of the arguments

```npm run setVersion 3.2.0```

```npm run setVersion -- 3.2.0```

The ```--``` is only when passing switch arguments to the script, so when specifying an explicit version it's optional as npm will pass the argument correctly.

#### Increase to the next patch level

```npm run setVersion -- -patch``` (eg. ```3.1.2``` => ```3.1.3```)

#### Increase to the next minor release

```npm run setVersion -- -minor``` (eg. ```3.1.2``` => ```3.2.0```)

#### Increase to the next major release

```npm run setVersion -- -major``` (eg. ```3.1.2``` => ```4.0.0```)

#### Dev Pre-release

Change the current version as a ```dev``` pre-release build

```npm run setVersion``` (eg. ```3.1.2``` => ```3.1.2-dev```)

```npm run setVersion -- -dev``` (eg. ```3.1.2``` => ```3.1.2-dev```)

#### Dev Pre-release and next patch level

```npm run setVersion -- -patch -dev``` (eg. ```3.1.2``` => ```3.1.3-dev```)

#### Set the version as a release version

Running this removes any current pre-release tag.

```npm run setVersion -- -release``` (eg. ```3.1.2-dev``` => ```3.1.2```)

#### Set as a specific pre-release

```npm run setVersion -- -pre nightly``` (eg. ```3.1.2``` => ```3.1.2-nightly```)

#### Add a build number to the release (implied pre-release)

> Using this switch implies that the resulting version WILL be a pre-release complete with a &lt;pre-release&gt; tag. And when no &lt;pre-release&gt; is specified (dev/alpha/beta/etc) ```dev``` will be assumed and added.
>
> And when also used with the release switch the &lt;pre-release&gt; tag will default to ```rc```

Build numbers are added using the "." prefix as based on the [semver](https://semver.org/) specification the build number "+" does not uniquely identify or define a sequence for resolving precedence.

```npm run setVersion -- -bld 20210525.1``` (eg. ```3.1.2 => 3.1.2-dev.20210525.1```)

```npm run setVersion -- -bld 20210525.1 -dev``` (eg. ```3.1.2 => 3.1.2-dev.20210525.1```)

```npm run setVersion -- -bld 20210525.1 -pre nightly``` (eg. ```3.1.2 => 3.1.2-nightly.20210525.1```)

```npm run setVersion -- -bld 20210525.1 -release``` (eg. ```3.1.2 => 3.1.2-rc.20210525.1```)

