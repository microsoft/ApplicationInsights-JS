module.exports = function (grunt) {

    const versionPlaceholder = '"#version#"';

    const aiCoreDefaultNameReplacements = [
    ];

    const aiDefaultNameReplacements = [
    ];

    const aiInternalConstants = [
        "./src/InternalConstants.ts"
    ];

    const configVer = getConfigVersion(false);
    const configMajorVer = getConfigVersion(true);

    function _encodeStr(str) {
        return str.replace(/\\/g, '\\\\').
        replace(/"/g, '\\"').
        replace(/'/g, '\\\'').
        replace(/\u0008/g, '\\b').
        replace(/\r/g, '\\r').
        replace(/\t/g, '\\t').
        replace(/\n/g, '\\n').
        replace(/\f/g, '\\f');

    }

    function generateNewSnippet(prefix) {
        var srcPath = "./tools/applicationinsights-web-snippet/dist-es5";
        return {
            files: [{
                expand: true,
                cwd: srcPath,
                dest: "./tools/applicationinsights-web-snippet/dist-es5",
                src: "applicationinsights-web-snippet.js"
            }],
            options: {
                replacements: function() {
                    var snippetBuffer = grunt.file.read("./tools/applicationinsights-web-snippet/build/output/snippet.min.js");
                    if (prefix === "ConnString") {
                        snippetBuffer = snippetBuffer.replace(/connectionString:\s*".*?"/gms, "    connectionString: \"YOUR_CONNECTION_STRING\"");
                    } else if (prefix === "IKey") {
                        snippetBuffer = snippetBuffer.replace(/connectionString:\s*".*?"/gms, "    connectionString: \"InstrumentationKey=INSTRUMENTATION_KEY\"");
                    } else if (prefix === "Origin") {
                        snippetBuffer = grunt.file.read("./tools/applicationinsights-web-snippet/build/output/originSnippet.min.js");
                    }
                    var snippetStr = _encodeStr(snippetBuffer.toString());
                    var expectedStr = `##replace${prefix}Snippet##`;
                    return [{
                        pattern: expectedStr,
                        replacement: snippetStr
                    }];
                }
            }
        };
    }

    function expandMin() {
        var srcPath = "./tools/applicationinsights-web-snippet/build/output";
        return {
            files: [{
                expand: true,
                cwd: srcPath,
                dest: "./tools/applicationinsights-web-snippet/build/output",
                src: "snippet.min.js"
            }],
            options: {
                replacements: function() {
               
                    var snippetBuffer = grunt.file.read("./tools/applicationinsights-web-snippet/build/output/snippet.min.js");
                    var snippetConfig = grunt.file.read("./tools/applicationinsights-web-snippet/src/snippet-config.js").trim();

                    while(snippetConfig.endsWith("\r") || snippetConfig.endsWith("\n")) {
                        snippetConfig = snippetConfig.substring(0, snippetConfig.length - 1);
                    }

                    // We assign a value to SnippetConfig and then forcefully overwrite it into the function input.
                    if (snippetBuffer.startsWith("!(function")) {
                        throw "Snippet prefix input is invalid -- replace will fail";
                    }
                    var overWriteString = "!(function (cfg){" + snippetBuffer

                    let orgOverwrite = overWriteString;
                    overWriteString = overWriteString.replace(/\n\/\/# source.*\n/, "})(" + snippetConfig + ");\n");
                    if(overWriteString === orgOverwrite) {
                        throw "Snippet postfix input is invalid -- replace will fail";
                    }

                    return [{
                        pattern: snippetBuffer,
                        replacement: overWriteString
                    }];
                }
            }
        };
    }

    function expandJS() {
        var srcPath = "./tools/applicationinsights-web-snippet/build/output";
        return {
            files: [{
                expand: true,
                cwd: srcPath,
                dest: "./tools/applicationinsights-web-snippet/build/output",
                src: "snippet.js"
            }],
            options: {
                replacements: function() {
               
                    var snippetBuffer = grunt.file.read("./tools/applicationinsights-web-snippet/build/output/snippet.js");
                    var snippetConfig = grunt.file.read("./tools/applicationinsights-web-snippet/src/snippet-config.js").trim();
                    while(snippetConfig.endsWith("\r") || snippetConfig.endsWith("\n")) {
                        snippetConfig = snippetConfig.substring(0, snippetConfig.length - 1);
                    }

                    var overWriteString = snippetBuffer.replace(/\(function \(win, doc\)/, "(function (win, doc, cfg)");
                    if(overWriteString === snippetBuffer) {
                        throw "Snippet prefix input is invalid -- replace will fail";
                    }

                    let orgOverwrite = overWriteString;
                    overWriteString = overWriteString.replace(/}\)\(window, document\);/, "})(window, document, " + snippetConfig + ");")
                    if(overWriteString === orgOverwrite) {
                        throw "Snippet postfix input is invalid -- replace will fail";
                    }

                    return [{
                        pattern: snippetBuffer,
                        replacement: overWriteString
                    }];
                }
            }
        };
    }


    function getConfigVersion(isMajorVer) {
        let version = "";
        try {
            let config = grunt.file.readJSON("./tools/config/package.json");
            let configVer= config["version"];
            version = "." + configVer;
            if (isMajorVer) {
                version = "." + configVer.split(".")[0];
            }

        } catch (e) {
            console.log("stack: '" + e.stack + "', message: '" + e.message + "', name: '" + e.name + "'");
        }
        return version;
    }
   

    function _createRegEx(str) {
        // Converts a string into a global regex, escaping any special characters
        return new RegExp(str.replace(/([.+?^=!:${}()|\[\]\/\\])/g, '\\$1'), 'g');
    }
    
    function setVersionNumber(path, packageVersion) {
        var expectedVersion = _createRegEx(versionPlaceholder);
        var replaceVersion = "'" + packageVersion + "'";
        var srcPath = path + '/src';

        // This is the grunt string-replace configuration to replace version placeholder with the actual version number
        return {
            files: [{
                expand: true,
                cwd: srcPath,
                dest: srcPath,
                src: '**/*.ts'
            }],
            options: {
                replacements: [{
                    pattern: expectedVersion,
                    replacement: replaceVersion
                }]
            }
        };
    }

    function restoreVersionPlaceholder(path, packageVersion) {
        var expectedVersion1 = _createRegEx("'" + packageVersion + "'");
        var expectedVersion2 = _createRegEx('"' + packageVersion + '"');
        var srcPath = path + '/src';

        // This is the grunt string-replace configuration to replace the actual version number with the version placeholder
        return {
            files: [{
                expand: true,
                cwd: srcPath,
                dest: srcPath,
                src: '**/*.ts'
            }],
            options: {
                replacements: [{
                    pattern: expectedVersion1,
                    replacement: versionPlaceholder
                },{
                    pattern: expectedVersion2,
                    replacement: versionPlaceholder
                }]
            }
        };
    }

    function deepMerge(target, src) {
        try {
            var newValue = Object.assign({}, target, src);

            if (target && src) {
                Object.keys(target).forEach((key) => {
                    // Any existing src[key] value would have been assigned over the target[key] version
                    if (src[key] !== undefined) {
                        if (Array.isArray(newValue[key])) {
                            target[key].forEach((value) => {
                                newValue[key].push(value);
                            });
                        } else if (typeof newValue[key] === "object") {
                            // Make sure we merge all properties
                            newValue[key] = deepMerge(newValue[key], target[key]);
                        }
                    }
                });
            }

            return newValue;
        } catch (e) {
            console.error("stack: '" + e.stack + "', message: '" + e.message + "', name: '" + e.name + "'");
        }
    }

    // const perfTestVersions = ["2.0.0","2.0.1","2.1.0","2.2.0","2.2.1","2.2.2","2.3.0","2.3.1",
    // "2.4.1","2.4.3","2.4.4","2.5.2","2.5.3","2.5.4","2.5.5","2.5.6","2.5.7","2.5.8","2.5.9","2.5.10","2.5.11",
    // "2.6.0","2.6.1","2.6.2","2.6.3","2.6.4","2.6.5","2.7.0"];
    const perfTestVersions=["3.3.6"];

    function buildConfig(modules) {
        var buildCmds = {
            ts: {
                options: {
                    comments: true,
                    debug: true,
                    logOutput: true
                }            
            },
            "eslint-ts": {
                options: {
                    debug: true
                }
            },
            "ai-minify": {
                options: {
                    debug: true,
                    //testOnly: true,
                }
            },
            "qunit" : {
                all: {
                    options: {
                    }
                }
            },
            connect: {
                server: {
                    options: {
                        port: 9001,
                         base: '.',
                         debug: true
                    }
                }        
            },
            "string-replace": {

            }
        };

        for (var key in modules) {
            if (modules.hasOwnProperty(key)) {
                var modulePath = modules[key].path;
                var moduleCfg = modules[key].cfg;
                var packageJsonFile = modulePath + '/package.json';

                if (grunt.file.exists(packageJsonFile)) {
                    // Read the actual module version from the package.json
                    var pkg = grunt.file.readJSON(modulePath + '/package.json');

                    var addMinifyTasks = modules[key].autoMinify !== false;
                    if (addMinifyTasks) {
                        var nameMaps = aiDefaultNameReplacements;
                        var internalConstants = aiInternalConstants;
                        if (pkg['name'] === "@microsoft/applicationinsights-core-js") {
                            nameMaps = aiCoreDefaultNameReplacements;
                            internalConstants = [ "./src/JavaScriptSDK/InternalConstants.ts" ];
                        }
    
                        var aiMinify = buildCmds["ai-minify"];
                        aiMinify[key] = {
                            options: {
                                projectRoot: modulePath,
                                src: "./src/**/*.ts",
                                nameMaps: nameMaps,
                                internalConstants: internalConstants
                            }
                        };
    
                        aiMinify[key + "-reverse"] = {
                            options: {
                                projectRoot: modulePath,
                                src: "./src/**/*.ts",
                                restore: true,
                                nameMaps: nameMaps,
                                internalConstants: internalConstants
                            }
                        };
                    }

                    var addStringReplace = modules[key].stringReplace !== false;
                    if (addStringReplace) {
                        var replaceCmds = buildCmds['string-replace'];
                        // Read the actual module version from the package.json
                        var packageVersion = pkg['version'];

                        replaceCmds[key] = setVersionNumber(modulePath, packageVersion);
                        replaceCmds[key + '-reverse'] = restoreVersionPlaceholder(modulePath, packageVersion);                        
                    }
                }

                if (grunt.file.exists(modulePath + '/src/tsconfig.json')) {
                    // Use the src tsconfig (if available)
                    buildCmds.ts[key] = {
                        'tsconfig': modulePath + "/src/tsconfig.json",
                    };
                } else if (grunt.file.exists(modulePath + '/tsconfig.json')) {
                    // Otherwise fall back to the root tsconfig (if available)
                    buildCmds.ts[key] = {
                        'tsconfig': modulePath + "/tsconfig.json",
                    };
                } else {
                    throw new Error("TSConfig not found for [" + key + "]");
                }

                if (moduleCfg) {
                    buildCmds.ts[key] = Object.assign(buildCmds.ts[key], moduleCfg);
                }

                // If the tests have their own tsconfig, add that as a new target
                var addQunit = false;
                var testRoot = "";
                if (modules[key].testHttp !== false) {
                    testRoot = "http://localhost:9001/";
                }

                var testUrl = testRoot + modulePath + "/test/UnitTests.html";
                if (grunt.file.exists(modulePath + '/test/tsconfig.json')) {
                    addQunit = true;
                    buildCmds.ts[key + '-tests'] = {
                        tsconfig: modulePath + "/test/tsconfig.json",
                        src: [
                            modulePath + "/test/Unit/src/**/*.ts"
                        ],
                        out: modulePath + "/test/Unit/dist/" + (modules[key].unitTestName || key + ".tests.js")
                    };
                } else if (grunt.file.exists(modulePath + '/Tests/tsconfig.json')) {
                    addQunit = true;
                    testUrl = testRoot + modulePath + "/Tests/UnitTests.html";
                    buildCmds.ts[key + '-tests'] = {
                        tsconfig: modulePath + "/Tests/tsconfig.json",
                        src: [
                            modulePath + "/Tests/Unit/src/**/*.ts"
                        ],
                        out: modulePath + "/Tests/Unit/dist/" + (modules[key].unitTestName || key + ".tests.js")
                    };
                }

                if (addQunit) {
                    // Remove any "/./" values from the path
                    testUrl = testUrl.replace(/\/\.\//g, "/");

                    buildCmds.qunit[key] = {
                        options: {
                            urls: [testUrl],
                            timeout: 300 * 1000, // 5 min
                            console: true,
                            summaryOnly: false,
                            httpBase: ".",
                            puppeteer: {
                                debug: true,
                                headless: true,
                                timeout: 30000,
                                ignoreHTTPErrors: true,
                                args: [
                                    "--enable-precise-memory-info",
                                    "--expose-internals-for-testing",
                                    "--no-sandbox"
                                ]
                            }
                        }
                    };
                }

                // If the tests have their own tsconfig, add that as a new target
                addQunit = false;
                var testUrl = testRoot + modulePath + "/test/PerfTests.html";
                if (grunt.file.exists(modulePath + '/test/PerfTests.html')) {
                    addQunit = true;
                    buildCmds.ts[key + '-perftest'] = {
                        tsconfig: modulePath + "/test/tsconfig.json",
                        src: [
                            modulePath + "/test/Perf/src/**/*.ts"
                        ],
                        out: modulePath + "/test/Perf/dist/es5/" + (modules[key].perfTestName || key + ".perf.tests.js")
                    };
                } else if (grunt.file.exists(modulePath + '/Tests/PerfTests.html')) {
                    addQunit = true;
                    testUrl = testRoot + modulePath + "/Tests/PerfTests.html";
                    buildCmds.ts[key + '-perftest'] = {
                        tsconfig: modulePath + "/Tests/tsconfig.json",
                        src: [
                            modulePath + "/Tests/Perf/src/**/*.ts"
                        ],
                        out: modulePath + "/Tests/Perf/dist/es5/" + (modules[key].perfTestName || key + ".perf.tests.js")
                    };
                }

                if (addQunit) {
                    var testUrls = [ testUrl ];
                    if (key === "aisku") {
                        testUrls = perfTestVersions.map((version) => {
                            return testUrl + `?version=${version}`;
                        });
                    }

                    buildCmds.qunit[key + "-perf"] = {
                        options: {
                            urls: testUrls,
                            timeout: 300 * 1000, // 5 min
                            console: true,
                            summaryOnly: false,
                            puppeteer: {
                                headless: true,
                                timeout: 30000,
                                ignoreHTTPErrors: true,
                                args: [
                                    '--enable-precise-memory-info',
                                    '--expose-internals-for-testing',
                                    "--no-sandbox"
                                ]
                            }
                        }
                    };
                }

                let esLintCmd = buildCmds["eslint-ts"];
                esLintCmd[key + '-lint'] = {
                    options: {
                        tsconfig: modulePath + '/tsconfig.json'
                    }
                };

                if (moduleCfg) {
                    esLintCmd[key + '-lint'] = Object.assign(buildCmds.ts[key], moduleCfg);
                }

                esLintCmd[key + '-lint-fix'] = deepMerge({ options: { fix: true } }, esLintCmd[key + '-lint']);
            }
        }

        return buildCmds;
    }

    try {
        var theBuildConfig = deepMerge(buildConfig({
            // Shared
            "core":                 { 
                                        path: "./shared/AppInsightsCore",
                                        unitTestName: "aicoreunit.tests.js",
                                        perfTestName: "aicoreperf.tests.js"
                                    },
            "common":               { 
                                        path: "./shared/AppInsightsCommon",
                                        unitTestName: "aicommon.tests.js"
                                    },
            "1dsCore":                 { 
                                        path: "./shared/1ds-core-js",
                                        unitTestName: "core.unittests.js"
                                    },
    
            // SKUs
            "aisku":                { 
                                        path: "./AISKU", 
                                        cfg: { 
                                            src: [ 
                                                "AISKU/src/*.ts" 
                                            ] 
                                        },
                                        unitTestName: "aiskuunittests.tests.js",
                                        perfTestName: "aiskuperftests.tests.js"
                                    },
            "aiskulite":            { 
                                        path: "./AISKULight", 
                                        cfg: { 
                                            src: [ 
                                                "AISKULight/src/*.ts" 
                                            ] 
                                        },
                                        unitTestName: "aiskuliteunittests.tests.js"
                                    },
    
            // Channels
            "aichannel":            { path: "./channels/applicationinsights-channel-js" },
            "offlinechannel":       {
                                        path: "./channels/offline-channel-js"
                                    },
            "teechannel":           { path: "./channels/tee-channel-js" },
            "1dsPost":              {
                                        path: "./channels/1ds-post-js",
                                        unitTestName: "post.unittests.js"
                                    },

            // Extensions
            "appinsights":          { 
                                        path: "./extensions/applicationinsights-analytics-js",
                                        unitTestName: "appinsights-analytics.tests.js"
                                    },
            "clickanalytics":       { 
                                        path: "./extensions/applicationinsights-clickanalytics-js",
                                        unitTestName: "appinsights-clickanalytics.tests.js"
                                    },
            "debugplugin":          { path: "./extensions/applicationinsights-debugplugin-js" },
            "deps":                 { 
                                        path: "./extensions/applicationinsights-dependencies-js",
                                        unitTestName: "dependencies.tests.js"
                                    },
            "perfmarkmeasure":      { 
                                        path: "./extensions/applicationinsights-perfmarkmeasure-js",
                                        unitTestName: "appinsights-perfmarkmeasure.tests.js"
                                    },
            "properties":           { 
                                        path: "./extensions/applicationinsights-properties-js",
                                        unitTestName: "prop.tests.js"
                                    },
            "osplugin":             { 
                                        path: "./extensions/applicationinsights-osplugin-js",
                                        unitTestName: "applicationinsights-osplugin.tests.js"
                                    },
            "cfgsync":               { 
                                        path: "./extensions/applicationinsights-cfgsync-js",
                                        unitTestName: "cfgsync.tests.js"
                                    },

            // Examples
            "example-shared-worker": {
                                        autoMinify: false,
                                        path: "./examples/shared-worker",
                                        testHttp: false
                                    },

            "example-aisku":        {
                                        autoMinify: false,
                                        path: "./examples/AISKU",
                                        testHttp: false
                                    },

            "example-dependency":   {
                                        autoMinify: false,
                                        path: "./examples/dependency",
                                        testHttp: false
                                    },
            "example-cfgsync":        {
                                        autoMinify: false,
                                        path: "./examples/cfgSync",
                                        testHttp: false
                                    },
    
            // Tools
            "rollupuglify":         {
                                        autoMinify: false,
                                        path: "./tools/rollup-plugin-uglify3-js",
                                        cfg: {
                                            src: [
                                                "./tools/rollup-plugin-uglify3-js/src/*.ts",
                                                "!node_modules/**"
                                            ],
                                            out: './tools/rollup-plugin-uglify3-js/out/src/uglify3-js.js'
                                        },
                                        testHttp: false
                                    },
            "rollupes5":            { 
                                        autoMinify: false,
                                        path: "./tools/rollup-es5",
                                        unitTestName: "es5rolluptests.js"
                                    },
            "shims":                {
                                        autoMinify: false,
                                        path: "./tools/shims",
                                        cfg: {
                                            src: [
                                                "./tools/shims/src/*.ts"
                                            ]
                                        },
                                        unitTestName: "shimstests.js"
                                    },
            "chrome-debug-extension": {
                                        autoMinify: false,
                                        path: "./tools/chrome-debug-extension",
                                        cfg: {
                                            src: [
                                                "./tools/chrome-debug-extension/src/**/*.tsx",
                                                "./tools/chrome-debug-extension/src/**/*.ts",
                                            ]
                                        }
                                    },
            "applicationinsights-web-snippet": {
                                        autoMinify: false,
                                        path: "./tools/applicationinsights-web-snippet",
                                        cfg: {
                                            src: [
                                                "./tools/applicationinsights-web-snippet/src/**/*.ts"
                                            ]
                                        }
                                    },
            // Common
            "tst-framework":        {
                                        autoMinify: false,
                                        path: "./common/Tests/Framework",
                                        cfg: {
                                            src: [
                                                "./common/Tests/Framework/src/*.ts"
                                            ]
                                        } 
                                    },
        }));
    
        function tsBuildActions(name, addTests, replaceName) {
            var actions = [
                "eslint-ts:" + name + "-lint-fix"
            ];
            var aiMinifyConfig = theBuildConfig["ai-minify"] || {};
            var gruntTsConfig = theBuildConfig["ts"];
            var replaceConfig = theBuildConfig["string-replace"] || {};
            if (replaceName === true || replaceConfig[name]) {

                actions.push("string-replace:" + name);
                if (aiMinifyConfig[name]) {
                    // Make sure all translations are reversed first
                    actions.push("ai-minify:" + name + "-reverse");
                    // Attempt to compile without any translations (Validates that the original source code is fine before transforming it)
                    actions.push("ts:" + name);
                    actions.push("ai-minify:" + name);
                }

                // Now perform the "real" final compile after minification
                actions.push("ts:" + name);
        
                if (addTests && gruntTsConfig[name + "-tests"]) {
                    actions.push("ts:" + name + "-tests");
                }
                if (aiMinifyConfig[name + "-reverse"]) {
                    actions.push("ai-minify:" + name + "-reverse");
                }
    
                actions.push("string-replace:" + name + "-reverse");
            } else {
                if (aiMinifyConfig[name]) {
                    // Attempt to compile without any translations (Validates that the original source code is fine before transforming it)
                    actions.push("ts:" + name);
                    actions.push("ai-minify:" + name);
                }

                // Now perform the "real" final compile after minification
                actions.push("ts:" + name);
                if (addTests && gruntTsConfig[name + "-tests"]) {
                    actions.push("ts:" + name + "-tests");
                }
                
                if (aiMinifyConfig[name + "-reverse"]) {
                    actions.push("ai-minify:" + name + "-reverse");
                }
            }
    
            actions.push("eslint-ts:" + name + "-lint");
    
            return actions;
        }

        function tsTestActions(name, minifySrc, compileSrc) {
            var gruntTsConfig = theBuildConfig["ts"];
            var aiMinifyConfig = theBuildConfig["ai-minify"] || {};

            var actions = [
                "connect"
            ];

            var replaceConfig = theBuildConfig["string-replace"] || {};
            if (replaceConfig[name]) {
                actions.push("string-replace:" + name);
            }

            if (aiMinifyConfig[name]) {
                if (minifySrc) {
                    // Attempt to compile with translations (Validates that the original source code is fine before transforming it)
                    actions.push("ai-minify:" + name);
                } else if (aiMinifyConfig[name + "-reverse"]){
                    // Attempt to compile without any translations (Validates that the original source code is fine before transforming it)
                    actions.push("ai-minify:" + name + "-reverse");
                }

                if (compileSrc && gruntTsConfig[name]) {
                    actions.push("ts:" + name);
                }
            }

            // If this helper is called then these should always exist
            actions.push("ts:" + name + "-tests");
            actions.push("qunit:" + name);

            if (minifySrc && aiMinifyConfig[name + "-reverse"]) {
                actions.push("ai-minify:" + name + "-reverse");
            }

            if (replaceConfig[name]) {
                actions.push("string-replace:" + name + "-reverse");
            }

            return actions;
        }

        function minTasks(name) {
            var actions = [
            ];
    
            var aiMinifyConfig = theBuildConfig["ai-minify"] || {};
            if (aiMinifyConfig[name]) {
                actions.push("ai-minify:" + name);
            }

            return actions;
        }

        function restoreTasks(name) {
            var actions = [
            ];
    
            var aiMinifyConfig = theBuildConfig["ai-minify"] || {};
            if (aiMinifyConfig[name + "-reverse"]) {
                actions.push("ai-minify:" + name + "-reverse");
            }

            return actions;
        }

        grunt.initConfig(deepMerge(
            theBuildConfig, {
            uglify: {
                snippetvNext: {
                    files: {
                        'AISKU/snippet/snippet.min.js': ['AISKU/snippet/snippet.js']
                    },
                    options: {
                        sourceMap: false,
                        ie8: false,
                        compress: {
                          passes:3,
                          unsafe: true,
                        },
                        output: {
                          webkit:true
                        }
                    }
                }
            },
            'string-replace': {
                'generate-expanded-JS': expandJS(),
                'generate-expanded-min': expandMin(),
                'generate-snippet-ikey': generateNewSnippet("IKey"),
                'generate-snippet-connString': generateNewSnippet("ConnString"),
                'generate-snippet-origin': generateNewSnippet("Origin")
            },
            copy: {
                "originSnippet": {
                    files: [
                        { src: "./tools/applicationinsights-web-snippet/build/output/snippet.min.js", dest: `./tools/applicationinsights-web-snippet/build/output/originSnippet.min.js` }
                       ]
                },
                "snippetToDistEs5": {
                    files: [
                        { expand: true, cwd: "./tools/applicationinsights-web-snippet/build/output/", src: "snippet.**", dest: "./tools/applicationinsights-web-snippet/dist-es5/" },
                        { expand: true, cwd: "./tools/applicationinsights-web-snippet/build/output/common/", src: "**", dest: "./tools/applicationinsights-web-snippet/dist-es5/common/" },
                       ]
                },

                "web-snippet": {
                    files: [  
                        { src: "./tools/applicationinsights-web-snippet/build/output/applicationinsights-web-snippet.js", dest: `./tools/applicationinsights-web-snippet/dist-es5/applicationinsights-web-snippet.js` }
                    ]
                },
                config: {
                    files: [
                        { src: "./tools/config/config.json", dest: `./tools/config/browser/es5/ai.config${configVer}.cfg.json` },
                        { src: "./tools/config/config.json", dest: `./tools/config/browser/es5/ai.config${configMajorVer}.cfg.json` }
                    ]
                },

                testConfig: {
                    files: [
                        { src: "./tools/config/test-config.json", dest: `./tools/config/browser/es5/ai_test.config${configVer}.cfg.json` },
                        { src: "./tools/config/test-config.json", dest: `./tools/config/browser/es5/ai_test.config${configMajorVer}.cfg.json` }
                    ]
                }
            }
        }));
    
        grunt.event.on('qunit.testStart', function (name) {
            grunt.log.ok('Running test: ' + name);
        });
    
        grunt.loadNpmTasks("@nevware21/grunt-ts-plugin");
        grunt.loadNpmTasks("@nevware21/grunt-eslint-ts");
        grunt.loadNpmTasks('grunt-contrib-uglify');
        grunt.loadNpmTasks('grunt-contrib-qunit');
        grunt.loadNpmTasks('grunt-contrib-connect');
        grunt.loadNpmTasks('grunt-contrib-copy');
    
        grunt.loadTasks('./tools/grunt-tasks');
        grunt.registerTask("default", ["ts:rollupuglify", "ts:rollupes5", "ts:rollupes5test", "qunit:rollupes5", "ts:shims", "ts:shimstest", "qunit:shims", "ts:default", "uglify:ai", "uglify:snippet"]);
        

        grunt.registerTask("core", tsBuildActions("core", true));
        grunt.registerTask("core-min", minTasks("core"));
        grunt.registerTask("core-restore", restoreTasks("core"));
        grunt.registerTask("coreunittest", tsTestActions("core"));
        grunt.registerTask("core-mintest", tsTestActions("core", true));
        grunt.registerTask("coreperftest", ["connect", "ts:core-perftest", "qunit:core-perf"]);

        grunt.registerTask("common", tsBuildActions("common"));
        grunt.registerTask("common-min", minTasks("common"));
        grunt.registerTask("common-restore", restoreTasks("common"));
        grunt.registerTask("commontest", tsTestActions("common"));
        grunt.registerTask("common-mintest", tsTestActions("common", true));

        grunt.registerTask("ai", tsBuildActions("appinsights"));
        grunt.registerTask("ai-min", minTasks("appinsights"));
        grunt.registerTask("ai-restore", restoreTasks("appinsights"));
        grunt.registerTask("aitests", tsTestActions("appinsights"));
        grunt.registerTask("ai-mintests", tsTestActions("appinsights", true));

        grunt.registerTask("aisku", tsBuildActions("aisku"));
        grunt.registerTask("aisku-min", minTasks("aisku"));
        grunt.registerTask("aisku-restore", restoreTasks("aisku"));
        grunt.registerTask("aiskuunittests", tsTestActions("aisku"));
        grunt.registerTask("aisku-mintests", tsTestActions("aisku", true));
        grunt.registerTask("aiskuperf", ["connect", "ts:aisku-perftest", "qunit:aisku-perf"]);

        grunt.registerTask("aiskulite", tsBuildActions("aiskulite"));
        grunt.registerTask("aiskulite-min", minTasks("aiskulite"));
        grunt.registerTask("aiskulite-restore", restoreTasks("aiskulite"));
        grunt.registerTask("aiskuliteunittests", tsTestActions("aiskulite"));
        grunt.registerTask("aiskulite-mintests", tsTestActions("aiskulite", true));

        grunt.registerTask("snippetvnext", ["uglify:snippetvNext"]);

        grunt.registerTask("test", ["connect", "ts:default", "ts:test", "ts:testSchema", "ts:testE2E", "qunit:all"]);
        grunt.registerTask("test1ds", ["coretest", "common", "propertiestests", "depstest", "aitests", "aiskutests"]);

        grunt.registerTask("perfmarkmeasure", tsBuildActions("perfmarkmeasure"));
        grunt.registerTask("perfmarkmeasure-min", minTasks("perfmarkmeasure"));
        grunt.registerTask("perfmarkmeasure-restore", restoreTasks("perfmarkmeasure"));
        grunt.registerTask("perfmarkmeasuretests", tsTestActions("perfmarkmeasure"));
        grunt.registerTask("perfmarkmeasure-mintests", tsTestActions("perfmarkmeasure", true));

        grunt.registerTask("properties", tsBuildActions("properties"));
        grunt.registerTask("properties-min", minTasks("properties"));
        grunt.registerTask("properties-restore", restoreTasks("properties"));
        grunt.registerTask("propertiestests", tsTestActions("properties"));
        grunt.registerTask("properties-mintests", tsTestActions("properties", true));

        grunt.registerTask("cfgsync", tsBuildActions("cfgsync"));
        grunt.registerTask("cfgsync-min", minTasks("cfgsync"));
        grunt.registerTask("cfgsync-restore", restoreTasks("cfgsync"));
        grunt.registerTask("cfgsynctests", tsTestActions("cfgsync"));
        grunt.registerTask("cfgsync-mintests", tsTestActions("cfgsync", true));

        grunt.registerTask("deps", tsBuildActions("deps"));
        grunt.registerTask("deps-min", minTasks("deps"));
        grunt.registerTask("deps-restore", restoreTasks("deps"));
        grunt.registerTask("depstest", tsTestActions("deps"));
        grunt.registerTask("deps-mintest", tsTestActions("deps", true));

        grunt.registerTask("debugplugin", tsBuildActions("debugplugin"));
        grunt.registerTask("debugplugin-min", minTasks("debugplugin"));
        grunt.registerTask("debugplugin-restore", restoreTasks("debugplugin"));

        grunt.registerTask("aichannel", tsBuildActions("aichannel"));
        grunt.registerTask("aichannel-min", minTasks("aichannel"));
        grunt.registerTask("aichannel-restore", restoreTasks("aichannel"));
        grunt.registerTask("aichanneltest", tsTestActions("aichannel"));
        grunt.registerTask("aichannel-mintest", tsTestActions("aichannel", true));

        grunt.registerTask("offlinechannel", tsBuildActions("offlinechannel"));
        grunt.registerTask("offlinechannel-min", minTasks("offlinechannel"));
        grunt.registerTask("offlinechannel-restore", restoreTasks("offlinechannel"));
        grunt.registerTask("offlinechanneltest", tsTestActions("offlinechannel"));
        grunt.registerTask("offlinechannel-mintest", tsTestActions("offlinechannel", true));

        grunt.registerTask("teechannel", tsBuildActions("teechannel"));
        grunt.registerTask("teechannel-min", minTasks("teechannel"));
        grunt.registerTask("teechannel-restore", restoreTasks("teechannel"));
        grunt.registerTask("teechanneltest", tsTestActions("teechannel"));
        grunt.registerTask("teechannel-mintest", tsTestActions("teechannel", true));

        grunt.registerTask("rollupuglify", tsBuildActions("rollupuglify"));
        grunt.registerTask("rollupes5", tsBuildActions("rollupes5"));
        grunt.registerTask("rollupes5test", tsTestActions("rollupes5", false));

        grunt.registerTask("shims", tsBuildActions("shims").concat(tsTestActions("shims", false)));
        grunt.registerTask("shimstest", tsTestActions("shims", false));

        grunt.registerTask("chromedebugextension", tsBuildActions("chrome-debug-extension"));
        grunt.registerTask("chromedebugextension-min", minTasks("chrome-debug-extension"));
        grunt.registerTask("chromedebugextension-restore", restoreTasks("chrome-debug-extension"));

        grunt.registerTask("websnippet", tsBuildActions("applicationinsights-web-snippet"));
        grunt.registerTask("snippetCopy", ["copy:snippetToDistEs5"]);
        grunt.registerTask("originSnippetCopy", ["copy:originSnippet"]);
        grunt.registerTask("websnippetReplace", ["string-replace:generate-expanded-JS", "copy:web-snippet", "string-replace:generate-expanded-min", "string-replace:generate-snippet-ikey", "string-replace:generate-snippet-connString", "string-replace:generate-snippet-origin"]);

        grunt.registerTask("snippet-restore", restoreTasks("applicationinsights-web-snippet"));
        grunt.registerTask("websnippettests", tsTestActions("applicationinsights-web-snippet"));

        grunt.registerTask("clickanalytics", tsBuildActions("clickanalytics"));
        grunt.registerTask("clickanalytics-min", minTasks("clickanalytics"));
        grunt.registerTask("clickanalytics-restore", restoreTasks("clickanalytics"));
        grunt.registerTask("clickanalyticstests", tsTestActions("clickanalytics"));
        grunt.registerTask("clickanalytics-mintests", tsTestActions("clickanalytics", true));

        grunt.registerTask("osplugin", tsBuildActions("osplugin"));
        grunt.registerTask("osplugin-min", minTasks("osplugin"));
        grunt.registerTask("osplugin-restore", restoreTasks("osplugin"));
        grunt.registerTask("osplugintests", tsTestActions("osplugin"));
        grunt.registerTask("osplugin-mintests", tsTestActions("osplugin", true));

        grunt.registerTask("1dsCoreBuild", tsBuildActions("1dsCore"));
        grunt.registerTask("1dsCoreTest", tsTestActions("1dsCore"));
        grunt.registerTask("1dsCore", tsTestActions("1dsCore", true));
        grunt.registerTask("1dsCore-min", minTasks("1dsCore"));
        grunt.registerTask("1dsCore-restore", restoreTasks("1dsCore"));
        
        grunt.registerTask("1dsPostBuild", tsBuildActions("1dsPost"));
        grunt.registerTask("1dsPostTest", tsTestActions("1dsPost"));
        grunt.registerTask("1dsPostMinTest", tsTestActions("1dsPost", true));
        grunt.registerTask("1dsPost-min", minTasks("1dsPost"));
        grunt.registerTask("1dsPost-restore", restoreTasks("1dsPost"));

        grunt.registerTask("example-shared-worker", tsBuildActions("example-shared-worker"));
        grunt.registerTask("example-shared-worker-test", tsTestActions("example-shared-worker"));

        grunt.registerTask("tst-framework", tsBuildActions("tst-framework"));
        grunt.registerTask("serve", ["connect:server:keepalive"]);

         grunt.registerTask("copy-config", ["copy:config"]);
         grunt.registerTask("copy-testConfig", ["copy:testConfig"]);

         grunt.registerTask("example-aisku", tsBuildActions("example-aisku"));
         grunt.registerTask("example-dependency", tsBuildActions("example-dependency"));
         grunt.registerTask("example-cfgsync", tsBuildActions("example-cfgsync"));
     } catch (e) {
         console.error(e);
         console.error("stack: '" + e.stack + "', message: '" + e.message + "', name: '" + e.name + "'");
     }
 };
 