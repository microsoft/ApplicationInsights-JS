import { IAppInsightsDeprecated } from "../../../src/ApplicationInsightsDeprecated";
import { ApplicationInsightsContainer } from "../../../src/ApplicationInsightsContainer";
import { IApplicationInsights, Snippet } from "../../../src/Initialization";
import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { createSnippetV5 } from "./testSnippet";
import { ApplicationInsights } from '../../../src/applicationinsights-web'
import { arrForEach, arrIndexOf, hasOwnProperty, isArray, isBoolean, isFunction, isNumber, isObject, isString, isSymbol, isUndefined, objForEachKey, objKeys } from "@microsoft/applicationinsights-core-js";
import { DistributedTracingModes, IConfig, Util } from "@microsoft/applicationinsights-common";
import { createLegacySnippet } from "./testLegacySnippet";
import { strShimPrototype } from "@microsoft/applicationinsights-shims";

const TestInstrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
const ConnectionString = `InstrumentationKey=${TestInstrumentationKey}`;

const strConstructor = "constructor";
const strPrototype = "prototype";
const strGetOwnPropertyNames = "getOwnPropertyNames";

const MAX_DEPTH = 16;

const ExcludeKeys = [
    "_dynInstFuncs",
    "_dynInstChk",
    //"_dynCls$*",
    "_*"
]

const PrivateKeys = [
    "*.setInitialized",
    "appInsightsNew",
    "dependencies",
    "properties"
];

interface IApiSurfaceDetail {
    value: string;
    props?: IApiSurfaceDetail[];
    funcs?: IApiSurfaceDetail[];
    isErr?: boolean;
}

let regExCache: { [key: string]: RegExp } = {};

function makeRegex(value: string) {
    let regEx = null;
    if (value && value.length > 0) {
        regEx = regExCache[value];
        if (!regEx) {
            let regValue = value.replace(/\\/g, "\\\\");
            // eslint-disable-next-line security/detect-non-literal-regexp
            regValue = regValue.replace(/([\+\?\|\{\[\(\)\^\$\#\.\]\}])/g, "\\$1");
            regValue = regValue.replace(/\*/g, ".*");

            regEx = new RegExp("(" + regValue + ")", "i");
            regExCache[value] = regEx;
        }
    }

    return regEx;
}

function getSnippetConfig(sessionPrefix: string) {
    return {
        src: "",
        cfg: {
            connectionString: ConnectionString,
            disableAjaxTracking: false,
            disableFetchTracking: false,
            enableRequestHeaderTracking: true,
            enableResponseHeaderTracking: true,
            maxBatchInterval: 500,
            disableExceptionTracking: false,
            namePrefix: `${sessionPrefix}`,
            enableCorsCorrelation: true,
            distributedTracingMode: DistributedTracingModes.AI_AND_W3C,
            samplingPercentage: 50
        } as IConfig
    };
};

function getBasicLegacySnippetConfig() {
    return {
        instrumentationKey: TestInstrumentationKey,
        disableAjaxTracking: false,
        disableFetchTracking: false,
        maxBatchInterval: 500
    };
}

function _isObjectOrArrayPrototype(target:any) {
    return target && (target === Object[strPrototype] || target === Array[strPrototype]);
}

/**
 * Helper used to check whether the target is an Object prototype, Array prototype or Function prototype
 * @ignore
 */ 
function _isObjectArrayOrFunctionPrototype(target:any)
{
    return _isObjectOrArrayPrototype(target) || target === Function[strPrototype];
}

function _toString(value: any) {

    if (isUndefined(value)) {
        return "<undefined>";
    } 
    
    if (value === null) {
        return "<null>";
    }

    if (isString(value)) {
        return value;
    }

    if (isNumber(value)) {
        return "" + value;
    }

    if (isBoolean(value)) {
        return "" + value;
    }

    if (isSymbol(value)) {
        return value.toString();
    }

    if (value && isFunction(value["toString"])) {
        return (value["toString"] as any)() || "";
    }

    return "<unknown>";
}
    
function _getTargetKeys(target: any, excludedKeys: string[]) {
    let keys: string[] = objKeys(target);

    if (!Util.isArray(target)) {
        try {
            if (Object[strGetOwnPropertyNames]) {
                // We need to use this for built in objects such as Error which don't return their values via objKeys because they are not enumerable for example
                let propKeys = Object[strGetOwnPropertyNames](target);
                if (propKeys) {
                    arrForEach(propKeys, (key) => {
                        const theKey = _toString(key);
                        if (theKey && keys.indexOf(theKey) === -1) {
                            keys.push(key);
                        }
                    });
                }
            }

            let objProto = Object.getPrototypeOf(target);
            if (objProto && !_isObjectArrayOrFunctionPrototype(objProto)) {
                let protoKeys = _getTargetKeys(objProto, excludedKeys);
                for (let lp = 0; lp < protoKeys.length; lp++) {
                    // Don't add duplicates or the constructor(s)
                    if (keys.indexOf(protoKeys[lp]) === -1 && protoKeys[lp] !== strConstructor) {
                        keys.push(protoKeys[lp]);
                    }
                }
            }
        } catch (ex) {
            // getOwnPropertyNames can fail in ES5, if the argument to this method is not an object (a primitive),
            // then it will cause a TypeError. In ES2015, a non-object argument will be coerced to an object.
        }
    }

    let theKeys: string[] = [];
    arrForEach(keys, (key) => {
        const theKey = _toString(key);
        if (theKey && !_isExcluded(excludedKeys, theKey)) {
            theKeys.push(theKey);
        }
    });

    return theKeys;
}

function _getTargetName(target: any) {
    if (isUndefined(target)) {
        return "<undefined>";
    } else if (target === null) {
        return "<null>";
    } else if (isString(target)) {
        return "string"
    } else if (isNumber(target)) {
        return "number";
    } else if (isArray(target)) {
        return "array";
    } else if (isBoolean(target)) {
        return "boolean";
    }

    if (target) {
        if (isString(target.identifier)) {
            return target.identifier;
        }

        if (isString(target.name)) {
            return target.name;
        }

        if (hasOwnProperty(target, strShimPrototype)) {
            // Look like a prototype
            return target.name || "" + typeof(target);
        }

        return ((target[strConstructor]) || {}).name || "" + typeof(target);
    }

    
    return "" + typeof(target);
}

function _isExcluded(excludedKeys: string[], key: string) {
    for (let lp = 0; lp < excludedKeys.length; lp++) {
        let exclude = excludedKeys[lp];
        if (exclude.indexOf("*") === -1) {
            if (exclude === key) {
                return true;
            }
        } else {
            let rg = makeRegex(exclude);
            let matchTxt = rg.exec(key);
            if (matchTxt && matchTxt[1]) {
                return true;
            }
        }
    }

    return false;
}

function _isPrivate(privateKeys: string[], path: string) {
    for (let lp = 0; lp < PrivateKeys.length; lp++) {
        let privatePath = privateKeys[lp];
        if (privatePath.indexOf("*") === -1) {
            if (privatePath === path) {
                return true;
            }
        } else {
            let rg = makeRegex(privatePath);
            let matchTxt = rg.exec(path);
            if (matchTxt && matchTxt[1]) {
                return true;
            }
        }
    }

    return false;
}

function getApiSurface(target: Object, key: string, level: number, path: string = "", privatePaths: string[] = PrivateKeys, excludeKeys: string[] = ExcludeKeys, thingsReferenced: any[] = [], thingsDumped: any[] = []): IApiSurfaceDetail {
    if (!level) {
        level = 0;
    }

    let isObj = isObject(target) || Util.isError(target);
    let isErr = target["baseType"] === "ExceptionData" || Util.isError(target);

    const props: IApiSurfaceDetail[] = [];
    const funcs: IApiSurfaceDetail[] = [];

    const keys = _getTargetKeys(target, excludeKeys);

    if (level >= MAX_DEPTH) { 
        keys.unshift("<maxdepth>"); 
    }

    for (const key of keys) {
        if (_isExcluded(excludeKeys, key)) {
            continue;
        }

        if (_isPrivate(privatePaths, path + key)) {
            continue;
        }

        let targetValue = target[key];
        if (isSymbol(targetValue)) {
            targetValue = targetValue.toString();
        }

        let container: IApiSurfaceDetail[] = props;
        if (isFunction(targetValue)) {
            container = funcs;
        }

        if (key === "<maxdepth>") {
            container.push({
                value: `${key}: <maxDepth "${_getTargetName(targetValue)}">`,
                isErr
            });
            break;
        }
        else if (targetValue !== null && arrIndexOf(thingsReferenced, targetValue) !== -1) {
            container.push({
                value: `${key}: <circular "${_getTargetName(targetValue)}">`,
                isErr
            });
        }
        else if (targetValue !== null && arrIndexOf(thingsDumped, targetValue) !== -1) {
            container.push({
                value: `${key}: <refObj "${_getTargetName(targetValue)}">`,
                isErr
            });
        }
        else if (targetValue !== null && (isObject(targetValue) || Util.isError(targetValue))) {
            thingsDumped.push(target);
            thingsReferenced.push(target);
            let formatted = getApiSurface(targetValue, key, level + 1, path + key + ".", privatePaths, excludeKeys, thingsReferenced, thingsDumped);
            thingsReferenced.pop();
            if (formatted.isErr) {
                isErr = true;
            }

            container.push(formatted);
        } else {
            let theValue = `${key}: `;
            if (isFunction(targetValue)) {
                const fnStr = targetValue.toString();
                const fnHead = fnStr.match(/^([^{]+)/)[1];
                theValue += `${fnHead}{...}`;
            } else {
                theValue += `${_getTargetName(targetValue)} `
                theValue += "(" + _toString(targetValue) + ")";
            }
            container.push({
                value: theValue,
                isErr
            });
        }
    }

    let rootValue: string;
    if (isObj || props.length || funcs.length) {
        rootValue = `${key ? key : "obj"}: `;
        if (isArray(target)) {
            rootValue += `array [${_getTargetKeys(target, excludeKeys).length}]`;
        } else {
            let targetName = _getTargetName(target);
            if (targetName) {
                rootValue += `${targetName} `
            }
            rootValue += `{${_getTargetKeys(target, excludeKeys).length}}`;
        }

        return {
            value: rootValue,
            props,
            funcs,
            isErr: isErr
        };
    }

    let targetName = _getTargetName(target);
    if (!targetName) {
        targetName += `${_toString(target)}`;
    }

    return {
        value: `${key ? key : "obj"}: ${targetName}`,
        isErr
    }
}

function _indentSpace(indentKey: string, node = true) {
    let result = "";
    let len = indentKey.length;
    for (let lp = 0; lp < len; lp++) {
        if (node && lp === len - 1) {
            result += " +- "
        } else {
            if (indentKey[lp] === "|") {
                result += " |  ";
            } else {
                result += "    ";
            }
        }
    }

    return result;
}

function _dumpApiSurface(apiSurface: IApiSurfaceDetail, indentKey = "") {
    let result = _indentSpace(indentKey) + apiSurface.value + "\n";
    let hasFuncs = apiSurface.funcs && apiSurface.funcs.length;
    if (apiSurface.props && apiSurface.props.length) {
        //result += _indentSpace(indentKey, false) + "  [Properties]\n";
        arrForEach(apiSurface.props.sort((a, b) => a.value > b.value ? 1 : -1), (value, idx) => {
            let isLast = !hasFuncs && idx === apiSurface.props.length - 1;
            result += _dumpApiSurface(value, indentKey + (isLast ? " " : "|"));
        });
    }
    if (hasFuncs) {
        result += _indentSpace(indentKey, false) + " +- [Functions]\n";
        arrForEach(apiSurface.funcs.sort((a, b) => a.value > b.value ? 1 : -1), (value, idx) => {
            let isLast = idx === apiSurface.funcs.length - 1;
            result += _dumpApiSurface(value, indentKey + (isLast ? "  " : " |"));
        });
    }

    return result;
}

export class ApiSurfaceTests extends AITestClass {

    // Sinon
    private isFetchPolyfill:boolean = false;
    private sessionPrefix: string = Util.newId();

    constructor(emulateEs3: boolean = false) {
        super("ApiSurfaceTests", emulateEs3);
    }

    // Add any new snippet configurations to this map
    private _theSnippets = {
        "v5": createSnippetV5
    };
    
    public testInitialize() {
        this._disableDynProtoBaseFuncs(); // We need to disable the useBaseInst performance setting as the sinon spy fools the internal logic and the spy is bypassed

        try {
            this.useFakeServer = true;
            this.fakeServerAutoRespond = true;
            this.isFetchPolyfill = fetch && fetch["polyfill"];

            console.log("* testInitialize()");
        } catch (e) {
            console.error('Failed to initialize', e);
        }
    }

    public testCleanup() {
    }

    public registerTests() {

        this.testCase({
            name: "AppInsights - APISurface",
            test: () => {
                const init = new ApplicationInsights({
                    config: this._getTestConfig(this.sessionPrefix)
                });

                let preApiSurface = getApiSurface(init, "preApplicationInsights", 0);
                let preFormattedSurface = _dumpApiSurface(preApiSurface);

                Assert.ok(true, preFormattedSurface);

                init.loadAppInsights();
    
                let apiSurface = getApiSurface(init, "ApplicationInsights", 0);
                let formattedSurface = _dumpApiSurface(apiSurface);

                Assert.ok(true, formattedSurface);
            }
        });

        this.testCase({
            name: "[Legacy] : Snippet Get APISurface",
            test: () => {
                let theSnippet = this._initializeLegacySnippet(createLegacySnippet(getBasicLegacySnippetConfig())) as any;

                let apiSurface = getApiSurface(theSnippet, "legacySnippet", 0);
                let formattedSurface = _dumpApiSurface(apiSurface);

                Assert.ok(true, formattedSurface);
            }
        });

        this.testCase({
            name: "[Legacy] : Snippet Get Pre Initialize",
            test: () => {
                let preSnippet = createLegacySnippet(getBasicLegacySnippetConfig());

                let preApiSurface = getApiSurface(preSnippet, "preSnippet", 0);
                let preFormattedSurface = _dumpApiSurface(preApiSurface);

                Assert.ok(true, preFormattedSurface);

                let theSnippet = this._initializeLegacySnippet(preSnippet) as any;

                let apiSurface = getApiSurface(theSnippet, "preSnippet", 0);
                let formattedSurface = _dumpApiSurface(apiSurface);

                Assert.ok(true, formattedSurface);
            }
        });

        objForEachKey(this._theSnippets, (snippetName, snippetCreator) => {
            this.testCase({
                name: "[" + snippetName + "] : Snippet Get APISurface",
                test: () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix))) as any;

                    let apiSurface = getApiSurface(theSnippet, "snippet", 0);
                    let formattedSurface = _dumpApiSurface(apiSurface);

                    Assert.ok(true, formattedSurface);
                }
            });

            this.testCase({
                name: "[" + snippetName + "] : Snippet Get Pre Initialize",
                test: () => {
                    let preSnippet = snippetCreator(getSnippetConfig(this.sessionPrefix));

                    let preApiSurface = getApiSurface(preSnippet, "preSnippet", 0);
                    let preFormattedSurface = _dumpApiSurface(preApiSurface);

                    Assert.ok(true, preFormattedSurface);

                    let theSnippet = this._initializeSnippet(preSnippet) as any;

                    let apiSurface = getApiSurface(theSnippet, "preSnippet", 0);
                    let formattedSurface = _dumpApiSurface(apiSurface);

                    Assert.ok(true, formattedSurface);
                }
            });
        });
    }

    private _getTestConfig(sessionPrefix: string) {
        return {
            connectionString: ConnectionString,
            disableAjaxTracking: false,
            disableFetchTracking: false,
            enableRequestHeaderTracking: true,
            enableResponseHeaderTracking: true,
            maxBatchInterval: 2500,
            disableExceptionTracking: false,
            namePrefix: sessionPrefix,
            enableCorsCorrelation: true,
            distributedTracingMode: DistributedTracingModes.AI_AND_W3C,
            samplingPercentage: 50,
            convertUndefined: "test-value"
        };
    }

    private _initializeSnippet(snippet: Snippet): IApplicationInsights {
        try {
            this.useFakeServer = false;

            // Call the initialization
            ((ApplicationInsightsContainer.getAppInsights(snippet, snippet.version)) as IApplicationInsights); 

            // Setup Sinon stuff
            const appInsights = (snippet as any).appInsights;
            Assert.ok(appInsights, "The App insights instance should be populated");
            Assert.ok(appInsights.core, "The Core exists");
            Assert.equal(appInsights.core, (snippet as any).core, "The core instances should match");

            Assert.equal(true, appInsights.isInitialized(), 'App Analytics is initialized');
            Assert.equal(true, appInsights.core.isInitialized(), 'Core is initialized');
        } catch (e) {
            console.error('Failed to initialize');
            Assert.ok(false, e);
        }

        // Note: Explicitly returning the original snippet as this should have been updated!
        return snippet as any;
    }

    private _initializeLegacySnippet(snippet: Snippet): IAppInsightsDeprecated {
        try {
            // Call the initialization
            ((ApplicationInsightsContainer.getAppInsights(snippet, snippet.version)) as IAppInsightsDeprecated); 

            const appInsights = (snippet as any).appInsights;
            Assert.ok(appInsights, "The App insights instance should be populated");
            Assert.ok(appInsights.core, "The Core exists");
            Assert.equal(appInsights.core, (snippet as any).core, "The core instances should match");

            Assert.equal(true, appInsights.isInitialized(), 'App Analytics is initialized');
            Assert.equal(true, appInsights.core.isInitialized(), 'Core is initialized');

            const appInsightsNew = (snippet as any).appInsightsNew;
            Assert.ok(appInsightsNew, "The App insights new instance should be populated");
            Assert.ok(appInsightsNew.core, "The Core exists");
            Assert.equal(appInsightsNew.core, (snippet as any).core, "The core instances should match");
            Assert.equal(true, appInsightsNew.appInsights.isInitialized(), 'App Analytics is initialized');
            Assert.equal(true, appInsightsNew.core.isInitialized(), 'Core is initialized');
        } catch (e) {
            console.error('Failed to initialize');
            Assert.ok(false, e);
        }

        // Note: Explicitly returning the original snippet as this should have been updated!
        return snippet as IAppInsightsDeprecated;
    }
}