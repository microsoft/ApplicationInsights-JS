import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { 
    AnalyticsPluginIdentifier, BreezeChannelIdentifier, DEFAULT_BREEZE_ENDPOINT, DisabledPropertyName,
    DistributedTracingModes, PropertiesPluginIdentifier, RequestHeaders, SeverityLevel
} from "@microsoft/applicationinsights-common";
import { dumpObj, LoggingSeverity, objForEachKey, objKeys, strUndefined } from "@microsoft/applicationinsights-core-js";
import { Snippet } from "../../../src/Initialization";

declare var define;

const enum CdnFormat {
    Umd = 0,
    Gbl = 1,
    CommonJs = 2
}

export class CdnPackagingChecks extends AITestClass {
    // Automatically updated by version scripts
    private readonly currentVer = "2.8.18";

    public testInitialize() {
    }

    public testFinishedCleanup(): void {
        if (typeof window !== strUndefined) {
            var _window = window;
            let aiName = _window["appInsightsSDK"] || "appInsights";
            if (_window[aiName] !== undefined) {
                const snippet: Snippet = _window[aiName] as any;
                if (snippet["unload"]) {
                    snippet["unload"](false);
                } else {
                    if (snippet["appInsightsNew"]) {
                        snippet["appInsightsNew"].unload();
                    }
                }
            }
        }
    }

    public testCleanup() {
    }

    public registerTests() {
        this.checkFullPackaging();
        this.addMinifiedPackaging();
    }

    constructor() {
        super("CdnPackagingChecks");
    }

    private checkFullPackaging(): void {
        this._checkPackaging(`../browser/ai.${this.currentVer[0]}.js`, CdnFormat.Umd);
        this._checkPackaging(`../browser/ai.${this.currentVer[0]}.gbl.js`, CdnFormat.Gbl);
        this._checkPackaging(`../browser/ai.${this.currentVer[0]}.cjs.js`, CdnFormat.CommonJs);
    }

    private addMinifiedPackaging(): void {
        this._checkPackaging(`../browser/ai.${this.currentVer[0]}.min.js`, CdnFormat.Umd);
        this._checkPackaging(`../browser/ai.${this.currentVer[0]}.gbl.min.js`, CdnFormat.Gbl);
        this._checkPackaging(`../browser/ai.${this.currentVer[0]}.cjs.min.js`, CdnFormat.CommonJs);
    }
    
    private _validateExpectedExports(theExports: any) {
        Assert.ok(theExports.ApplicationInsights, "ApplicationInsights exists");
        Assert.ok(theExports.Telemetry, "Telemetry exists");
        Assert.ok(theExports.Telemetry.DistributedTracingModes, "Telemetry.DistributedTracingModes exists");
        Assert.ok(theExports.Telemetry.Util, "Telemetry exists");

        Assert.ok(theExports.LoggingSeverity, "LoggingSeverity exists");
        objForEachKey(LoggingSeverity, (name, value) => {
            Assert.equal(name, theExports.LoggingSeverity[value], `Checking LoggingSeverity.${name} === ${value}`);
            Assert.equal(value, theExports.LoggingSeverity[name], `Checking LoggingSeverity.${value} === ${name}`);
        });

        Assert.ok(theExports.PerfEvent, "PerfEvent exists");
        Assert.ok(theExports.PerfManager, "PerfManager exists");
        Assert.ok(theExports.doPerf, "doPerf exists");
        Assert.ok(theExports.CoreUtils, "CoreUtils exists");
        Assert.ok(theExports.newId, "newId exists");
        Assert.ok(theExports.newGuid, "newGuid exists");
        Assert.ok(theExports.random32, "random32 exists");
        Assert.ok(theExports.randomValue, "randomValue exists");
        Assert.ok(theExports.generateW3CId, "generateW3CId exists");
        Assert.ok(theExports.findW3cTraceParent, "findW3cTraceParent exists");
        Assert.ok(theExports.findMetaTag, "findMetaTag exists");
        Assert.ok(theExports.mergeEvtNamespace, "mergeEvtNamespace exists");
        Assert.ok(theExports.eventOn, "eventOn exists");
        Assert.ok(theExports.eventOff, "eventOff exists");
        Assert.ok(theExports.addEventHandler, "addEventHandler exists");
        Assert.ok(theExports.removeEventHandler, "removeEventHandler exists");
    
        Assert.ok(theExports.isBeaconsSupported, "isBeaconsSupported exists");

        Assert.ok(theExports.Util, "Util exists");
        Assert.equal(theExports.Util, theExports.Telemetry.Util, "Telemetry.Util matches Util");
        Assert.ok(theExports.RequestHeaders, "RequestHeaders exists");
        objForEachKey(RequestHeaders, (name, value) => {
            Assert.equal(value, theExports.RequestHeaders[name], `Checking RequestHeaders.${value} === ${name}`);
            Assert.notEqual(undefined, theExports.RequestHeaders[name], `Checking RequestHeaders.${name} exists`);
        });

        Assert.equal(theExports.DisabledPropertyName, DisabledPropertyName, "DisabledPropertyName value");
        Assert.equal(theExports.DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_ENDPOINT, "DEFAULT_BREEZE_ENDPOINT value");

        Assert.ok(theExports.SeverityLevel, "SeverityLevel exists");
        objForEachKey(SeverityLevel, (name, value) => {
            Assert.equal(name, theExports.SeverityLevel[value], `Checking SeverityLevel.${name} === ${value}`);
            Assert.equal(value, theExports.SeverityLevel[name], `Checking SeverityLevel.${value} === ${name}`);
        });

        Assert.ok(theExports.DistributedTracingModes, "DistributedTracingModes exists");
        Assert.equal(theExports.DistributedTracingModes, theExports.Telemetry.DistributedTracingModes, "Telemetry.DistributedTracingModes equals DistributedTracingModes");
        objForEachKey(DistributedTracingModes, (name, value) => {
            Assert.equal(name, theExports.DistributedTracingModes[value], `Checking DistributedTracingMode.${name} === ${value}`);
            Assert.equal(value, theExports.DistributedTracingModes[name], `Checking DistributedTracingMode.${value} === ${name}`);
        });

        Assert.equal(theExports.PropertiesPluginIdentifier, PropertiesPluginIdentifier, "PropertiesPluginIdentifier value");
        Assert.equal(theExports.BreezeChannelIdentifier, BreezeChannelIdentifier, "BreezeChannelIdentifier value");
        Assert.equal(theExports.AnalyticsPluginIdentifier, AnalyticsPluginIdentifier, "AnalyticsPluginIdentifier value");
    }

    private _validateExportsAsModule(text: string, format: CdnFormat) {
        let orgExports = exports;
        let orgDefine = define;
        
        try {

            // remove any previously registered bundle
            delete window["Microsoft"];

            // Hide define()
            define = undefined;

            // Remove any "exports"
            exports = {};

            // Used to simulate globals without overriding them
            let theExports = {};
            let hostValues = this["_hostValues"] = {
                global: {},
                globalThis: undefined,
                exports: theExports,
                module: {
                    exports: theExports
                },
                define: undefined
            };

            // "process" the script
            eval(text);

            // This test should not be overriding the real globals
            Assert.equal(0, objKeys(exports || {}), "The exports should not have been changed");
            Assert.equal(undefined, define, "define should not have been exposed");
            Assert.equal(undefined, window["Microsoft"], "The global window[\"Microsoft\"] should not have been defined");
            Assert.equal(undefined, exports["Microsoft"], "global not added to exports");
            Assert.equal(undefined, this["Microsoft"], "The this should not have been changed Microsoft namespace does not exists");

            if (format == CdnFormat.Umd) {
                // Because "exports" exists as a module then no namespace is expected
                Assert.equal(undefined, hostValues.global["Microsoft"], "global Microsoft namespace does not exists");
                Assert.equal(undefined, hostValues.exports["Microsoft"], "global not added to cjs exports");

                this._validateExpectedExports(hostValues.exports);
            } else if (format === CdnFormat.Gbl) {
                let microsoft: any = hostValues.global["Microsoft"];
                Assert.equal(0, objKeys(hostValues.exports || {}), "The exports should not have been changed");
                Assert.ok(microsoft, "Microsoft namespace exists on this");
                Assert.ok(microsoft.ApplicationInsights, "Microsoft namespace exists");

                this._validateExpectedExports(microsoft.ApplicationInsights);
            } else if (format === CdnFormat.CommonJs) {
                // There is no namespace for common js
                let microsoft: any = hostValues.global["Microsoft"];
                Assert.equal(undefined, microsoft, "global Microsoft namespace does not exists");
                Assert.equal(undefined, hostValues.exports["Microsoft"], "global Microsoft namespace does not exist on exports");

                this._validateExpectedExports(hostValues.exports);
            }
        } catch (e) {
            Assert.ok(false, dumpObj(e));
        } finally {
            if (orgExports) {
                exports = orgExports;
            } else {
                exports = undefined;
            }

            if (orgDefine) {
                define = orgDefine;
            } else {
                define = undefined;
            }
        }
    }

    private _validateGlobalExports(text: string, format: CdnFormat) {
        let orgExports = window.exports;
        let orgDefine = define;
        try {
            // remove any previously registered bundle
            delete window["Microsoft"];

            // Hide define()
            define = undefined;

            // Remove any "exports"
            exports = undefined;

            // Used to simulate globals without overriding them
            let hostValues = this["_hostValues"] = {
                global: {},
                globalThis: undefined,
                exports: undefined as any,             // Don't provide an "exports"
                module: undefined,
                define: undefined
            };

            if (format === CdnFormat.CommonJs) {
                // CommonJs always needs the "exports" defined
                hostValues.exports = {};
            }
            
            // "process" the script
            eval(text);

            // This test should not be overriding the real globals
            Assert.equal(0, objKeys(exports || {}), "The exports should not have been changed");
            Assert.equal(undefined, define, "define should not have been exposed");
            Assert.equal(undefined, window["Microsoft"], "The global window[\"Microsoft\"] should not have been defined");
            Assert.equal(undefined, exports, "global not added to exports");
            Assert.equal(undefined, this["Microsoft"], "The this should not have been changed Microsoft namespace does not exists");

            if (format == CdnFormat.Umd) {
                // Because we are simulating no "exports" then there should be a global namespace defined
                Assert.equal(undefined, hostValues.exports, "No global exports should have been defined");

                let microsoft: any = hostValues.global["Microsoft"];
                Assert.ok(microsoft, "Microsoft namespace exists");
                Assert.ok(microsoft.ApplicationInsights, "Microsoft namespace exists");
    
                this._validateExpectedExports(microsoft.ApplicationInsights);
            } else if (format === CdnFormat.Gbl) {
                let microsoft: any = window["Microsoft"];
                Assert.equal(undefined, microsoft, "global Microsoft namespace does not exists");
                Assert.equal(undefined, hostValues.exports, "global not added to exports");
                
                microsoft = hostValues.global["Microsoft"];
                Assert.ok(microsoft, "Microsoft namespace exists on this");
                Assert.ok(microsoft.ApplicationInsights, "Microsoft namespace exists");

                this._validateExpectedExports(microsoft.ApplicationInsights);
            } else if (format === CdnFormat.CommonJs) {
                // There is no namespace for common js
                let microsoft: any = hostValues.global["Microsoft"];
                Assert.equal(undefined, microsoft, "global Microsoft namespace does not exists");

                this._validateExpectedExports(hostValues.exports);
            }
        } catch (e) {
            Assert.ok(false, dumpObj(e));
        } finally {
            if (orgExports) {
                exports = orgExports;
            } else {
                exports = undefined;
            }

            if (orgDefine) {
                define = orgDefine;
            } else {
                define = undefined;
            }
        }
    }

    private _validateExportsAsDefine(text: string, format: CdnFormat) {
        let orgExports = window.exports;
        let orgDefine = define;
        try {
            // remove any previously registered bundle
            delete window["Microsoft"];

            // Hide define()
            define = undefined;

            // Remove any "exports"
            exports = undefined;

            let simulatedDefine = (names: string[], factory) => {
                QUnit.assert.ok(false, "Not tagged as 'amd' so should not be called");
            }

            // Used to simulate globals without overriding them
            let hostValues = this["_hostValues"] = {
                global: {},
                globalThis: undefined,
                exports: undefined as any,             // Don't provide an "exports"
                module: undefined,
                define: simulatedDefine
            };

            if (format === CdnFormat.CommonJs) {
                // CommonJs always needs the "exports" defined
                hostValues.exports = {};
            }
            
            // "process" the script
            eval(text);

            // This test should not be overriding the real globals
            Assert.equal(0, objKeys(exports || {}), "The exports should not have been changed");
            Assert.equal(undefined, define, "define should not have been exposed");
            Assert.equal(undefined, window["Microsoft"], "The global window[\"Microsoft\"] should not have been defined");
            Assert.equal(undefined, exports, "global not added to exports");
            Assert.equal(undefined, this["Microsoft"], "The this should not have been changed Microsoft namespace does not exists");

            if (format == CdnFormat.Umd) {
                // Because we are simulating no "exports" then there should be a global namespace defined
                Assert.equal(undefined, hostValues.exports, "No global exports should have been defined");

                let microsoft: any = hostValues.global["Microsoft"];
                Assert.ok(microsoft, "Microsoft namespace exists");
                Assert.ok(microsoft.ApplicationInsights, "Microsoft namespace exists");
    
                this._validateExpectedExports(microsoft.ApplicationInsights);
            } else if (format === CdnFormat.Gbl) {
                let microsoft: any = window["Microsoft"];
                Assert.equal(undefined, microsoft, "global Microsoft namespace does not exists");
                Assert.equal(undefined, hostValues.exports, "global not added to exports");
                
                microsoft = hostValues.global["Microsoft"];
                Assert.ok(microsoft, "Microsoft namespace exists on this");
                Assert.ok(microsoft.ApplicationInsights, "Microsoft namespace exists");

                this._validateExpectedExports(microsoft.ApplicationInsights);
            } else if (format === CdnFormat.CommonJs) {
                // There is no namespace for common js
                let microsoft: any = hostValues.global["Microsoft"];
                Assert.equal(undefined, microsoft, "global Microsoft namespace does not exists");

                this._validateExpectedExports(hostValues.exports);
            }
        } catch (e) {
            Assert.ok(false, dumpObj(e));
        } finally {
            if (orgExports) {
                exports = orgExports;
            } else {
                exports = undefined;
            }

            if (orgDefine) {
                define = orgDefine;
            } else {
                define = undefined;
            }
        }
    }

    private _validateExportsAsAmdDefine(text: string, format: CdnFormat) {
        let orgExports = window.exports;
        let orgDefine = define;
        try {
            // remove any previously registered bundle
            delete window["Microsoft"];

            // Hide define()
            define = undefined;

            // Remove any "exports"
            exports = undefined;

            let defineCalled = false;
            let theNames: string[];
            let theFactory = null;
            let simulatedDefine = (names: string[], factory) => {
                defineCalled = true;
                theNames = names;
                theFactory = factory;
            }
            // Tag the function
            simulatedDefine["amd"] = true;

            // Used to simulate globals without overriding them
            let hostValues = this["_hostValues"] = {
                global: {},
                globalThis: undefined,
                exports: undefined as any,             // Don't provide an "exports"
                module: undefined,
                define: simulatedDefine
            };

            if (format === CdnFormat.CommonJs) {
                // CommonJs always needs the "exports" defined
                hostValues.exports = {};
            }
            
            // "process" the script
            eval(text);

            // This test should not be overriding the real globals
            Assert.equal(0, objKeys(exports || {}), "The exports should not have been changed");
            Assert.equal(undefined, define, "define should not have been exposed");
            Assert.equal(undefined, window["Microsoft"], "The global window[\"Microsoft\"] should not have been defined");
            Assert.equal(undefined, exports, "global not added to exports");
            Assert.equal(undefined, this["Microsoft"], "The this should not have been changed Microsoft namespace does not exists");

            if (format == CdnFormat.Umd) {
                // Because we are simulating no "exports" then there should be a global namespace defined
                Assert.equal(undefined, hostValues.exports, "No global exports should have been defined");
                Assert.equal(undefined, hostValues.global["Microsoft"], "Microsoft namespace should not have been defined");

                let microsoft: any = hostValues.global["Microsoft"];
                Assert.equal(undefined, microsoft, "Microsoft namespace does not exist on the global");

                Assert.equal(true, defineCalled, "Validate that define was called");
                Assert.ok(theNames, "Make sure names was populated");
                Assert.equal(1, theNames.length, "Check the provided names")
                Assert.equal("exports", theNames[0], "Check the provided name")
    
                let theExports = {};
                Assert.ok(theFactory, "Make sure the factory was provided");
                theFactory(theExports);

                microsoft = theExports["Microsoft"];
                Assert.equal(undefined, microsoft, "Microsoft namespace does not exist on the exports");

                this._validateExpectedExports(theExports);
            } else if (format === CdnFormat.Gbl) {
                let microsoft: any = window["Microsoft"];
                Assert.equal(undefined, microsoft, "global Microsoft namespace does not exists");
                Assert.equal(undefined, hostValues.exports, "global not added to exports");
                
                microsoft = hostValues.global["Microsoft"];
                Assert.ok(microsoft, "Microsoft namespace exists on this");
                Assert.ok(microsoft.ApplicationInsights, "Microsoft namespace exists");
                Assert.equal(false, defineCalled, "Validate that define was not called");

                this._validateExpectedExports(microsoft.ApplicationInsights);
            } else if (format === CdnFormat.CommonJs) {
                // There is no namespace for common js
                let microsoft: any = hostValues.global["Microsoft"];
                Assert.equal(undefined, microsoft, "global Microsoft namespace does not exists");
                Assert.equal(false, defineCalled, "Validate that define was not called");

                this._validateExpectedExports(hostValues.exports);
            }
        } catch (e) {
            Assert.ok(false, dumpObj(e));
        } finally {
            if (orgExports) {
                exports = orgExports;
            } else {
                exports = undefined;
            }

            if (orgDefine) {
                define = orgDefine;
            } else {
                define = undefined;
            }
        }
    }

    private _checkPackaging(cdnPackage: string, format: CdnFormat): void {
        let fileName = cdnPackage.split("..")[1];
        this.testCase({
            name: `Test AISKU Cdn packaging - ${fileName}`,
            test: () => {
                Assert.ok(true, `test file: ${fileName}`);
                let request = new Request(cdnPackage, {method:"GET"});
                return fetch(request).then((response) => {
                    if (!response.ok) {
                        Assert.ok(false, `fetch bundle AISKU ${fileName} error: ${response.statusText}`);
                        return;
                    } else {
                        return response.text().then(text => {
                            // Wrap in a closure so the global space is not polluted
                            text = "(function(values) {\n" +
                                "function init(hostValues) {\n" +
                                    "console.log(\"initializing\");" + 
                                    "console.log(JSON.stringify(this));\n" +
                                    "let globalThis = hostValues.globalThis;\n" +
                                    "let exports = hostValues.exports;\n" +
                                    "let module = hostValues.module;\n" +
                                    "let define = hostValues.define;\n" +
                                    "console.log(\"Now running CDN script\");" + 
                                    text + "\n" +
                                    "}\n" +
                                    "init.apply(values.global, [values]);\n" +
                                "})(this._hostValues)";

                            this._validateExportsAsModule(text, format);
                            this._validateGlobalExports(text, format);
                            this._validateExportsAsDefine(text, format);
                            this._validateExportsAsAmdDefine(text, format);
                        }).catch((error: Error) => {
                            Assert.ok(false, `AISKU bundle ${fileName} response error: ${error}`);
                        });
                    }
                }).catch((error: Error) => {
                    Assert.ok(false, `AISKU bundle ${fileName} deflate size error: ${error}`);
                });
            }
        });
    }
}