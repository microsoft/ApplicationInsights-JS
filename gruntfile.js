module.exports = function (grunt) {

    const aiCoreDefaultNameReplacements = [
       {
           src: "./src/JavaScriptSDK.Enums/SdkCoreNames.ts",
           import: "./src/JavaScriptSDK.Enums/SdkCoreNames"
       },
       {
           src: "./src/JavaScriptSDK.Enums/ConfigEnums.ts",
           import: "./src/JavaScriptSDK.Enums/ConfigEnums"
       }
   ];

   const aiDefaultNameReplacements = [
        {
            src: "../shared/AppInsightsCore/src/JavaScriptSDK.Enums/SdkCoreNames.ts",
            import: "@microsoft/applicationinsights-core-js"
        },
        {
            src: "../shared/AppInsightsCore/src/JavaScriptSDK.Enums/ConfigEnums.ts",
            import: "@microsoft/applicationinsights-core-js"
        },
        {
            src: "../../shared/AppInsightsCore/src/JavaScriptSDK.Enums/SdkCoreNames.ts",
            import: "@microsoft/applicationinsights-core-js"
        },
        {
            src: "../../shared/AppInsightsCore/src/JavaScriptSDK.Enums/ConfigEnums.ts",
            import: "@microsoft/applicationinsights-core-js"
        }
    ];

    const aiInternalConstants = [
        "./src/InternalConstants.ts"
    ];

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
    const perfTestVersions=["2.7.4"];

    function buildConfig(modules) {
        var buildCmds = {
            ts: {
                options: {
                    comments: true
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
                        base: '.'
                    }
                }        
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
                    var packageName = pkg["name"];

                    var addMinifyTasks = true;
                    if (packageName.indexOf("rollup-") !== -1 || packageName.indexOf("-shims") !== -1) {
                        addMinifyTasks = false;
                    }

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
                    buildCmds.qunit[key] = {
                        options: {
                            urls: [ testUrl ],
                            timeout: 300 * 1000, // 5 min
                            console: true,
                            summaryOnly: false,
                            '--web-security': 'false' // we need this to allow CORS requests in PhantomJS
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
                        out: modulePath + "/test/Perf/dist/" + (modules[key].perfTestName || key + ".perf.tests.js")
                    };
                } else if (grunt.file.exists(modulePath + '/Tests/PerfTests.html')) {
                    addQunit = true;
                    testUrl = testRoot + modulePath + "/Tests/PerfTests.html";
                    buildCmds.ts[key + '-perftest'] = {
                        tsconfig: modulePath + "/Tests/tsconfig.json",
                        src: [
                            modulePath + "/Tests/Perf/src/**/*.ts"
                        ],
                        out: modulePath + "/Tests/Perf/dist/" + (modules[key].perfTestName || key + ".perf.tests.js")
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
                            puppeteer: { headless: true, args:['--enable-precise-memory-info','--expose-internals-for-testing'] },
                            '--web-security': 'false' // we need this to allow CORS requests in PhantomJS
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
            "react":                { 
                                        path: "./extensions/applicationinsights-react-js",
                                        cfg: {
                                            src: [
                                                "./extensions/applicationinsights-react-js/src/index.ts"
                                            ]
                                        },
                                        unitTestName: "reactplugin.tests.js"
                                    },
            "reactnative":          { 
                                        path: "./extensions/applicationinsights-react-native",
                                        cfg: {
                                            src: [
                                                "./extensions/applicationinsights-react-native/src/**/*.ts"
                                            ]
                                        },
                                        unitTestName: "reactnativeplugin.tests.js"
                                    },
    
            // Tools
            "rollupuglify":         { 
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
            "rollupes3":            { 
                                        path: "./tools/rollup-es3",
                                        unitTestName: "es3rolluptests.js",
                                        testHttp: false
                                    },
            "shims":                { 
                                        path: "./tools/shims",
                                        cfg: {
                                            src: [
                                                "./tools/shims/src/*.ts"
                                            ]
                                        },
                                        unitTestName: "shimstests.js",
                                        testHttp: false
                                    },
            "chrome-debug-extension": { 
                                        path: "./tools/chrome-debug-extension",
                                        cfg: {
                                            src: [
                                                "./tools/chrome-debug-extension/src/**/*.tsx",
                                                "./tools/chrome-debug-extension/src/**/*.ts",
                                            ]
                                        }
                                    },
            // Common
            "tst-framework":        { 
                                        path: "./common/Tests/Framework",
                                        cfg: {
                                            src: [
                                                "./common/Tests/Framework/src/*.ts"
                                            ]
                                        } 
                                    }
        }));
    
        function tsBuildActions(name, addTests, replaceName) {
            var actions = [
                "eslint-ts:" + name + "-lint-fix"
            ];
    
            var aiMinifyConfig = theBuildConfig["ai-minify"] || {};
            var gruntTsConfig = theBuildConfig["ts"];
            if (replaceName) {

                actions.push("string-replace:" + replaceName);
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
    
                actions.push("string-replace:" + replaceName + "-reverse");
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

            if (minifySrc && aiMinifyConfig[name]) {
                // Attempt to compile without any translations (Validates that the original source code is fine before transforming it)
                actions.push("ai-minify:" + name);
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
                        ie8: true,
                        compress: {
                          passes:3,
                          unsafe: true,
                        },
                        output: {
                          webkit:true
                        }
                    }
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
        grunt.loadTasks('./tools/grunt-tasks');
        grunt.registerTask("default", ["ts:rollupuglify", "ts:rollupes3", "ts:rollupes3test", "qunit:rollupes3", "ts:shims", "ts:shimstest", "qunit:shims", "ts:default", "uglify:ai", "uglify:snippet"]);

        grunt.registerTask("core", tsBuildActions("core"));
        grunt.registerTask("core-min", ["ai-minify:core"]);
        grunt.registerTask("core-unmin", ["ai-minify:core-reverse"]);
        grunt.registerTask("coreunittest", tsTestActions("core"));
        grunt.registerTask("core-mintest", tsTestActions("core", true));
        grunt.registerTask("coreperftest", ["connect", "ts:core-perftest", "qunit:core-perf"]);

        grunt.registerTask("common", tsBuildActions("common"));
        grunt.registerTask("common-min", ["ai-minify:common"]);
        grunt.registerTask("common-unmin", ["ai-minify:common-reverse"]);
        grunt.registerTask("commontest", tsTestActions("common"));
        grunt.registerTask("common-mintest", tsTestActions("common", true));

        grunt.registerTask("ai", tsBuildActions("appinsights"));
        grunt.registerTask("ai-min", ["ai-minify:appinsights"]);
        grunt.registerTask("ai-unmin", ["ai-minify:appinsights-reverse"]);
        grunt.registerTask("aitests", tsTestActions("appinsights"));
        grunt.registerTask("ai-mintests", tsTestActions("appinsights", true));

        grunt.registerTask("aisku", tsBuildActions("aisku"));
        grunt.registerTask("aisku-min", ["ai-minify:aisku"]);
        grunt.registerTask("aisku-unmin", ["ai-minify:aisku-reverse"]);
        grunt.registerTask("aiskuunittests", tsTestActions("aisku"));
        grunt.registerTask("aisku-mintests", tsTestActions("aisku", true));
        grunt.registerTask("aiskuperf", ["connect", "ts:aisku-perftest", "qunit:aisku-perf"]);

        grunt.registerTask("aiskulite", tsBuildActions("aiskulite"));
        grunt.registerTask("aiskulite-min", ["ai-minify:aiskulite"]);
        grunt.registerTask("aiskulite-unmin", ["ai-minify:aiskulite-reverse"]);
        grunt.registerTask("aiskuliteunittests", tsTestActions("aiskulite"));
        grunt.registerTask("aiskulite-mintests", tsTestActions("aiskulite", true));

        grunt.registerTask("snippetvnext", ["uglify:snippetvNext"]);

        grunt.registerTask("test", ["connect", "ts:default", "ts:test", "ts:testSchema", "ts:testE2E", "qunit:all"]);
        grunt.registerTask("test1ds", ["coretest", "common", "propertiestests", "depstest", "aitests", "aiskutests", "reactnativetests", "reacttests"]);

        grunt.registerTask("perfmarkmeasure", tsBuildActions("perfmarkmeasure"));
        grunt.registerTask("perfmarkmeasure-min", ["ai-minify:perfmarkmeasure"]);
        grunt.registerTask("perfmarkmeasure-unmin", ["ai-minify:perfmarkmeasure-reverse"]);
        grunt.registerTask("perfmarkmeasuretests", tsTestActions("perfmarkmeasure"));
        grunt.registerTask("perfmarkmeasure-mintests", tsTestActions("perfmarkmeasure", true));

        grunt.registerTask("properties", tsBuildActions("properties"));
        grunt.registerTask("properties-min", ["ai-minify:properties"]);
        grunt.registerTask("properties-unmin", ["ai-minify:properties-reverse"]);
        grunt.registerTask("propertiestests", tsTestActions("properties"));
        grunt.registerTask("properties-mintests", tsTestActions("properties", true));

        grunt.registerTask("react", tsBuildActions("react"));
        grunt.registerTask("react-min", ["ai-minify:react"]);
        grunt.registerTask("react-unmin", ["ai-minify:react-reverse"]);
        grunt.registerTask("reacttests", tsTestActions("react"));
        grunt.registerTask("react-mintests", tsTestActions("react", true));

        grunt.registerTask("reactnative", tsBuildActions("reactnative"));
        grunt.registerTask("reactnative-min", ["ai-minify:reactnative"]);
        grunt.registerTask("reactnative-unmin", ["ai-minify:reactnative-reverse"]);
        grunt.registerTask("reactnativetests", tsTestActions("reactnative"));
        grunt.registerTask("reactnative-mintests", tsTestActions("reactnative", true));

        grunt.registerTask("deps", tsBuildActions("deps"));
        grunt.registerTask("deps-min", ["ai-minify:deps"]);
        grunt.registerTask("deps-unmin", ["ai-minify:deps-reverse"]);
        grunt.registerTask("depstest", tsTestActions("deps"));
        grunt.registerTask("deps-mintest", tsTestActions("deps", true));

        grunt.registerTask("debugplugin", tsBuildActions("debugplugin"));
        grunt.registerTask("debugplugin-min", ["ai-minify:debugplugin"]);
        grunt.registerTask("debugplugin-unmin", ["ai-minify:debugplugin-reverse"]);

        grunt.registerTask("aichannel", tsBuildActions("aichannel"));
        grunt.registerTask("aichannel-min", ["ai-minify:aichannel"]);
        grunt.registerTask("aichannel-unmin", ["ai-minify:aichannel-reverse"]);
        grunt.registerTask("aichanneltest", tsTestActions("aichannel"));
        grunt.registerTask("aichannel-mintest", tsTestActions("aichannel", true));

        grunt.registerTask("rollupuglify", tsBuildActions("rollupuglify"));
        grunt.registerTask("rollupes3", tsBuildActions("rollupes3").concat(["ts:rollupes3-tests", "qunit:rollupes3"]));
        grunt.registerTask("rollupes3test", [ "ts:rollupes3-tests", "qunit:rollupes3" ]);

        grunt.registerTask("shims", tsBuildActions("shims").concat(["ts:shims-tests", "qunit:shims"]));
        grunt.registerTask("shimstest", ["ts:shims-tests", "qunit:shims"]);

        grunt.registerTask("chromedebugextension", tsBuildActions("chrome-debug-extension"));
        grunt.registerTask("chromedebugextension-min", ["ai-minify:chrome-debug-extension"]);
        grunt.registerTask("chromedebugextension-unmin", ["ai-minify:chrome-debug-extension-reverse"]);

        grunt.registerTask("clickanalytics", tsBuildActions("clickanalytics"));
        grunt.registerTask("clickanalytics-min", ["ai-minify:clickanalytics"]);
        grunt.registerTask("clickanalytics-unmin", ["ai-minify:clickanalytics-reverse"]);
        grunt.registerTask("clickanalyticstests", tsTestActions("clickanalytics"));
        grunt.registerTask("clickanalytics-mintests", tsTestActions("clickanalytics", true));

        grunt.registerTask("tst-framework", tsBuildActions("tst-framework"));
        grunt.registerTask("serve", ["connect:server:keepalive"]);
    } catch (e) {
        console.error(e);
        console.error("stack: '" + e.stack + "', message: '" + e.message + "', name: '" + e.name + "'");
    }
};
