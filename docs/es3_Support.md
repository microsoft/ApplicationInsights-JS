## ES3/IE8 Compatibility

> __ES3 / IE8 support has been removed from Version 3.x.__
>
> __If you need to retain ES3 / IE8 compatibility then you will need to use one of the 2.x versions of the SDK, which is now maintained on the old [master branch](https://github.com/Microsoft/ApplicationInsights-JS/tree/master)__

The version 3.x is maintained on the default [main branch](https://github.com/Microsoft/ApplicationInsights-JS/tree/main)


As an SDK there are numerous users which cannot control the browsers that their customers use. As such we need to ensure that this SDK continues to "work" and does not break the JS execution when loaded by an older browser. While it would be ideal to just not support IE8 and older generation (ES3) browsers there are numerous large customers/users that continue to require pages to "work" and as noted they may or cannot control which browser that their end users choose to use.

This does NOT mean that we will only support the lowest common set of features, just that we need to maintain ES3 code compatibility and when adding new features they will need to be added in a manner that would not break ES3 Javascript parsing and added as an optional feature.

As part of enabling ES3/IE8 support we have set the ```tsconfig.json``` to ES3 and ```uglify``` settings in ```rollup.config.js``` transformations to support ie8. This provides a first level of support which blocks anyone from adding unsupported ES3 features to the code and enables the generated javascript to be validily parsed in an ES3+ environment.

Ensuring that the generated code is compatible with ES3 is only the first step, JS parsers will still parse the code when an unsupport core function is used, it will just fail or throw an exception at runtime. Therefore, we also need to require/use polyfill implementations or helper functions to handle those scenarios.

It should also be noted that the overall goal of ES3/IE8 compatibility is the support at least the following 2 usage usage patterns. By supporting these two (2) basic use-cases, application/developers will be able to determine what browsers their users are using and whether they are experiencing any issues. As the SDK will report the data to the server, thus enabling the insights into whether they need to either fully support ES3/IE8 or provide some sort of browser upgrade notifications.

- track()
- trackException()

Beyond terminating support for older browsers that only support ES3, (which we cannot do at this point in time) we will endeavour to maintain support for the above two (2) use-cases.

### Browser must support JSON class

If your users are using a browser that does not support the [JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON) Api you will need to include your own JSON polyfil implementation and this will need to be loaded prior to the application insights code.

This **includes** when running your application within an embedded browser, which on windows will default to using IE in IE7 doc mode -- which does NOT provide the JSON Api. 

For this case either provide a JSON polyfil or add the ["X-UA-Compatible"](https://docs.microsoft.com/en-us/openspecs/ie_standards/ms-iedoco/380e2488-f5eb-4457-a07a-0cb1b6e4b4b5?redirectedfrom=MSDN) meta tag and/or a header to your hosting page so that IE will provide the expected runtime environment.

```
 <meta http-equiv="X-UA-Compatible" content="IE=edge">
 
 <meta http-equiv="X-UA-Compatible" content="IE=11">
```

[More details on this are available here](https://docs.microsoft.com/en-us/archive/blogs/asiatech/ie11-migration-guide-understanding-browser-mode-document-mode-user-agent-and-x-ua-compatible)

### ES3/IE8 Packaging helper (ES3 rollup-plugin)

> Removed for v.3, only supported for 2.x

To ensure that the system conforms to the ES3 spec, by only using ES3 compatible code we have created a rollup plugin which has 2 functions

- es3Poly() finds and rewrite several commonly incompatible functions (such as Object.defineProperty; Object.getOwnPropertyDescriptor; Object.create) with inline polyfill functions that either call the real implementation or provide a basic implementation so that the scripts can be loaded and executed.
- es3Check() finds some of the known ES3 incompatible methods and will stop the packaging process if they are identified (and have not been polyfilled by es3Poly()), this provides a semi-automated validation of not just the application insights code, but also 3rd party libraries that it uses.
- importCheck() checks that the source code does not include imports from specific files or packages, this has been added due to packaging issues while using es3Poly causing imported type values to be renamed as "name$$1", which causes uglify() to missing renaming in some cases where the original source is "name$1". So this is being used to ensure that each source file only imports the values from packages or the original source file and not the main module export like "index". The importCheck can be placed before the nodeResolve() or after the es3Check() the recommendation is to fail fast be having this before the resolve. It should also be noted that only if the import is used will it appear in the final output (packagin), so it may exist in the original source but the packaging will not fail in this case.

To use these rollup plugins you simply need to add the following to your rollup.config.js

To import the module
```
import { es3Poly, es3Check, importCheck } from "@microsoft/applicationinsights-rollup-es3";
```

And then include as part of the packaging plugin list, if you use es3Poly()you should always include it before es3Check() 

```
    plugins: [
      replace({ ... }),
      importCheck({ exclude: [ "Index" ] }),
      nodeResolve({ browser: false, preferBuiltins: false }),
      es3Poly(),
      es3Check()
    ]
```

All plugins take an options which allows you to add additional checks and polyfill replacements. See the [Interfaces.ts](https://github.com/microsoft/ApplicationInsights-JS/blob/master/tools/rollup-es3/src/es3/Interfaces.ts) for the definitions and [ES3Tokens.ts](https://github.com/microsoft/ApplicationInsights-JS/blob/master/tools/rollup-es3/src/es3/Es3Tokens.ts) for the default values, which should provide the examples, if we have missed some common values that you require please feel free to raise an issue or provide a PR to add as the defaults.

It should be noted at this point that the both react and react-native extensions will NOT work in an ES3/IE8 environment out of the box, primarily because of the react code and their dependencies.
You *may* be able to workaround this limitation by providing and your own polyfill implementations for the unsupported methods.

### ES3/IE8 Features, Solutions, Workarounds and Polyfill style helper functions

> Note: We will be removing our internal ES3 / IE8 support polyfills as part of the next major release 3.x.x (scheduled for mid-late 2022), so if you need to retain ES3 compatibility you will need to remain on the 2.x.x versions of the SDK or your runtime will need install polyfill's to your ES3 environment __before__ loading / initializing the SDK.

As part of contributing to the project the following table highlights all of the currently known issues and the available solution/workaround. During PR and reviewing please ensure that you do not use the unsupported feature directly and instead use (or provide) the helper, solution or workaround.

This table does not attempt to include ALL of the ES3 unsupported features, just the currently known functions that where being used at the time or writing. You are welcome to contribute to provide additional helpers, workarounds or documentation of values that should not be used.

|  Feature  |  Description  |  Helper, Solution or Workaround |
|-----------|-----------------|-----------------|
| ```JSON.stringify(obj)``` | We have a hard requirement on JSON support, however, because of the size of adding a specific JSON polyfil just for our usage we decided not to include our own version. As such any user of this Api **MUST** include a JSON polyfil implementation, otherwise, the API simply will not work. | App/Site **MUST** provide their own JSON polyfil.
| ```Object.keys()``` | Not provided by ES3, use the helper  | ```CoreUtils.objKeys(obj: {}): string[]``` |
| ES5+ getters/setters<br>```Object.defineProperty(...)``` | Code will needs to created the individual getters/setters manually in a static initializer. See ```ChannelController.ts``` for example usage.<br>However, to ensure compatibility actual usage of any getters/setters internally in the primary SDK code is not permitted. They may (and should) be used in unit tests to ensure that if used they function as expected (in an ES5+ environment).| ``` CoreUtils.objDefineAccessors<T>(target:any, prop:string, getProp?:() => T, setProp?: (v:T) => void) : boolean``` |
| ```Object.create(protoObj)``` | Not supported in an ES3 environment, use the helper or direct construct the object with SON style notation (if possible) | ```CoreUtils.objCreate(obj:object):any``` |
| ```Object.create(protoObj, descriptorSet)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.defineProperties()``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.getOwnPropertyNames(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.getPrototypeOf(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.getOwnPropertyDescriptor(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.getOwnPropertyNames()``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.preventExtensions(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.isExtensible(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.seal(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.isSealed(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.freeze(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.isFrozen(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Array.prototype.indexOf(...)``` | Use the provided helper | ```CoreUtils.arrIndexOf<T>(arr: T[], searchElement: T, fromIndex?: number): number``` |
| ```Array.prototype.lastIndexOf(...)``` | Not supported and no provided workaround/solution. | N/A |
| ```Array.prototype.every(...)``` | Not supported and no provided workaround/solution. | N/A |
| ```Array.prototype.some(...)``` | Not supported and no provided workaround/solution. | N/A |
| ```Array.prototype.forEach(...)``` | Use the provided helper. | ```arrForEach<T>(arr: T[], callbackfn: (value: T, index?: number, array?: T[]) => void, thisArg?: any):void``` |
| ```Array.prototype.map(...)``` | Use the provided helper. | ```CoreUtils.arrMap<T,R>(arr: T[], callbackfn: (value: T, index?: number, array?: T[]) => R, thisArg?: any): R[]``` |
| ```Array.prototype.filter(...)``` | Not supported and no provided workaround/solution. | N/A |
| ```Array.prototype.reduce(...)``` | Use the provided helper. | ```CoreUtils.arrReduce<T,R>(arr: T[], callbackfn: (previousValue: T|R, currentValue?: T, currentIndex?: number, array?: T[]) => R, initialValue?: R): R``` |
| ```Array.prototype.reduceRight(...)``` | Not supported and no provided workaround/solution. | N/A |
| ```Date.prototype.toISOString()``` | Use the provided helper | ```CoreUtils.toISOString(date: Date)``` |
| ```Date.now()``` | Use the provided helper | ```CoreUtils.dateNow()``` |
| ```performance.now()``` | Use the provided helper for the Performance Api now function. | ```CoreUtils.perfNow()``` |
