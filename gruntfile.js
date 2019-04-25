module.exports = function (grunt) {
    grunt.initConfig({
        tslint: {
            options: {
                rulesDirectory: 'node_modules/tslint-microsoft-contrib',
            },
            files: {
                src: [
                    './vNext/shared/AppInsightsCommon/**/*.ts',
                    './vNext/extensions/**/*.ts',
                    './vNext/AISKU/**/*.ts',
                    '!./**/node_modules/**',
                    '!./**/Tests/**',
                    '!./**/dist-esm/**',
                    '!./**/Generated/**',
                    './JavaScript/**/*.ts',
                    '!./JavaScript/JavaScriptSDK.Tests/**'
                ],
            }
        },
        ts: {
            options: {
                comments: true
            },
            default: {
                tsconfig: './tsconfig.json',
                src: [
                    'JavaScript/JavaScriptSDK.Interfaces/*.ts',
                    'JavaScript/JavaScriptSDK/*.ts',
                ],
                out: 'bundle/ai.js',
            },
            core: {
                tsconfig: './vNext/shared/AppInsightsCore/tsconfig.json'
            },
            coretest: {
                tsconfig: './vNext/shared/AppInsightsCore/src/JavaScriptSDK.Tests/tsconfig.json',
                src: [
                    './vNext/shared/AppInsightsCore/src/JavaScriptSDK.Tests/Selenium/ApplicationInsightsCore.Tests.ts',
                    './vNext/shared/AppInsightsCore/src/JavaScriptSDK.Tests/Selenium/aitests.ts'
                ],
                out: 'vNext/shared/AppInsightsCore/src/JavaScriptSDK.Tests/Selenium/aicore.tests.js'
            },
            common: {
                tsconfig: './vNext/shared/AppInsightsCommon/tsconfig.json'
            },
            commontest: {
                tsconfig: './vNext/shared/AppInsightsCommon/Tests/tsconfig.json',
                src: [
                    './vNext/shared/AppInsightsCommon/Tests/Selenium/appinsights-common.tests.ts',
                ],
                out: 'vNext/shared/AppInsightsCommon/Tests/Selenium/aicommon.tests.js'
            },
            appinsights: {
                tsconfig: './vNext/extensions/applicationinsights-analytics-js/tsconfig.json',
            },
            appinsightstests: {
                tsconfig: './vNext/extensions/applicationinsights-analytics-js/Tests/tsconfig.json',
                src: [
                    './vNext/extensions/applicationinsights-analytics-js/Tests/Selenium/*.ts',
                    './vNext/extensions/applicationinsights-analytics-js/Tests/*.ts'
                ],
                out: 'vNext/extensions/applicationinsights-analytics-js/Tests/Selenium/appinsights-analytics.tests.js'
            },
            aisku: {
                tsconfig: './vNext/AISKU/tsconfig.json',
                src: [
                    'vNext/AISKU/src/*.ts'
                ]
            },
            aiskulite: {
                tsconfig: './vNext/AISKULight/tsconfig.json',
                src: [
                    'vNext/AISKULight/*.ts'
                ]
            },
            aiskutests: {
                tsconfig: './vNext/AISKU/Tests/tsconfig.json',
                src: [
                    'vNext/AISKU/Tests/Selenium/*.ts',
                    'vNext/AISKU/Tests/*.ts'
                ],
                out: 'vNext/AISKU/Tests/Selenium/appinsights-sdk.tests.js'
            },
            properties: {
                tsconfig: './vNext/extensions/applicationinsights-properties-js/tsconfig.json',
                src: [
                    './vNext/extensions/applicationinsights-properties-js/*.ts',
                    './vNext/extensions/applicationinsights-properties-js/Context/*.ts',
                    './vNext/extensions/applicationinsights-properties-js/Interfaces/Context/*.ts',
                    './vNext/extensions/applicationinsights-properties-js/Interfaces/*.ts'
                ]
            },
            propertiestests: {
                tsconfig: './vNext/extensions/applicationinsights-properties-js/Tests/tsconfig.json',
                src: './vNext/extensions/applicationinsights-properties-js/Tests/**/*.ts',
                out: './vNext/extensions/applicationinsights-properties-js/Tests/Selenium/properties.tests.js'
            },
            react: {
                tsconfig: './vNext/extensions/applicationinsights-react-js/tsconfig.json'
            },
            reactnative: {
                tsconfig: './vNext/extensions/applicationinsights-react-native/tsconfig.json',
                src: [
                    './vNext/extensions/applicationinsights-react-native/src/index.ts'
                ]
            },
            reactnativetests: {
                tsconfig: './vNext/extensions/applicationinsights-react-native/Tests/tsconfig.json',
                src: './vNext/extensions/applicationinsights-react-native/Tests/**/*.ts',
                out: './vNext/extensions/applicationinsights-react-native/Tests/Selenium/reactnativeplugin.tests.js'
            },
            deps: {
                tsconfig: './vNext/extensions/applicationinsights-dependencies-js/tsconfig.json'
            },
            depstest: {
                tsconfig: './vNext/extensions/applicationinsights-dependencies-js/Tests/tsconfig.json',
                src: [
                    './vNext/extensions/applicationinsights-dependencies-js/Tests/Selenium/*.ts',
                    './vNext/extensions/applicationinsights-dependencies-js/Tests/TestsFramework/*.ts'
                ],
                out: './vNext/extensions/applicationinsights-dependencies-js/Tests/Selenium/dependencies.tests.js'
            },
            aichannel: {
                tsconfig: './vNext/channels/applicationinsights-channel-js/tsconfig.json'
            },
            aichanneltest: {
                tsconfig: './vNext/channels/applicationinsights-channel-js/Tests/tsconfig.json',
                src: [
                    './vNext/channels/applicationinsights-channel-js/Tests/Selenium/*.ts',
                    './vNext/channels/applicationinsights-channel-js/Tests/*.ts',
                ],
                out: './vNext/channels/applicationinsights-channel-js/Tests/Selenium/aichannel.tests.js'
            },
            module: {
                // Use a different tsconfig for building module in order to not generate a declaration file for module, while keeping declaration for other modules
                tsconfig: './tsconfigmodule.json',
                src: [
                    'JavaScript/JavaScriptSDK.Interfaces/*.ts',
                    'JavaScript/JavaScriptSDK.Module/*.ts',
                ],
                out: 'bundle/ai.module.js'
            },
            types: {
                tsconfig: './tsconfig.json',
                src: [
                    'JavaScript/JavaScriptSDK.Tests/DefinitionTypes/*.ts'
                ],
                out: 'bundle/test/ai.types.js'
            },
            test: {
                tsconfig: './tsconfig.json',
                src: [
                    'JavaScript/JavaScriptSDK.Tests/Selenium/*.ts'
                ],
                out: 'JavaScript/JavaScriptSDK.Tests/Selenium/ai.tests.js'
            },
            testSchema: {
                tsconfig: './tsconfig.json',
                src: [
                    'JavaScript/JavaScriptSDK.Tests/Contracts/Generated/*.ts'
                ],
                out: 'bundle/test/ai.schema.tests.js'
            },
            testE2E: {
                tsconfig: './tsconfig.json',
                files: [
                    {
                        src: 'JavaScript/JavaScriptSDK.Tests/E2ETests/DisableTelemetry.tests.ts',
                        dest: 'bundle/test/e2e/DisableTelemetry.tests.js'
                    },
                    {
                        src: 'JavaScript/JavaScriptSDK.Tests/E2ETests/PublicApi.tests.ts',
                        dest: 'bundle/test/e2e/PublicApiTests.tests.js'
                    },
                    {
                        src: 'JavaScript/JavaScriptSDK.Tests/E2ETests/SanitizerE2E.tests.ts',
                        dest: 'bundle/test/e2e/SanitizerE2E.tests.js'
                    },
                    {
                        src: 'JavaScript/JavaScriptSDK.Tests/E2ETests/SenderE2E.tests.ts',
                        dest: 'bundle/test/e2e/SenderE2E.tests.js'
                    },
                    {
                        src: 'JavaScript/JavaScriptSDK.Tests/E2ETests/Snippet.tests.ts',
                        dest: 'bundle/test/e2e/Snippet.tests.js'
                    },
                    {
                        src: 'JavaScript/JavaScriptSDK.Tests/E2ETests/ValidateApi.tests.ts',
                        dest: 'bundle/test/e2e/ValidateApi.tests.js'
                    }
                ],
                outDir: 'bundle/test/e2e'
            }
        },
        uglify: {
            ai: {
                files: {
                    'bundle/ai.0.js': ['bundle/ai.js'],
                },
                options: {
                    sourceMap: true,
                    sourceMapIncludeSources: true,
                    sourceMapIn: 'bundle/ai.js.map',
                    compress: {
                        ie8: true
                    },
                    mangle: {
                        ie8: true
                    }
                },
            },
            snippet: {
                files: {
                    'bundle/snippet/snippet.min.js': ['JavaScript/JavaScriptSDK/snippet.js']
                }
            },
            snippetvNext: {
                files: {
                    'vNext/AISKU/snippet/snippet.min.js': ['vNext/AISKU/snippet/snippet.js']
                }
            }
        },
        run: {
            reacttests: {
                exec: 'cd vNext/extensions/applicationinsights-react-js && npm run test'
            }
        },
        qunit: {
            all: {
                options: {
                    urls: [
                        'JavaScript/JavaScriptSDK.Tests/Selenium/Tests.html',
                        'JavaScript/JavaScriptSDK.Tests/Contracts/Schema.tests.htm',
                        'JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.DisableTelemetry.tests.htm',
                        'JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.PublicApi.tests.htm',
                        'JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.SanitizerE2E.tests.htm',
                        'JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.Sender.tests.htm',
                        'JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.snippetTests.htm',
                        'JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.ValidateApi.tests.htm'
                    ],
                    timeout: 300 * 1000, // 5 min
                    console: false,
                    summaryOnly: true,
                    '--web-security': 'false' // we need this to allow CORS requests in PhantomJS
                }
            },
            core: {
                options: {
                    urls: [
                        './vNext/shared/AppInsightsCore/src/JavaScriptSDK.Tests/Selenium/Tests.html'
                    ],
                    timeout: 300 * 1000, // 5 min
                    console: false,
                    summaryOnly: true,
                    '--web-security': 'false' // we need this to allow CORS requests in PhantomJS
                }
            },
            common: {
                options: {
                    urls: [
                        './vNext/shared/AppInsightsCommon/Tests/Selenium/Tests.html'
                    ],
                    timeout: 300 * 1000, // 5 min
                    console: false,
                    summaryOnly: true,
                    '--web-security': 'false' // we need this to allow CORS requests in PhantomJS
                }
            },
            aitests: {
                options: {
                    urls: [
                        './vNext/extensions/applicationinsights-analytics-js/Tests/Selenium/Tests.html'
                    ],
                    timeout: 300 * 1000, // 5 min
                    console: false,
                    summaryOnly: true,
                    '--web-security': 'false' // we need this to allow CORS requests in PhantomJS
                }
            },
            deps: {
                options: {
                    urls: [
                        './vNext/extensions/applicationinsights-dependencies-js/Tests/Selenium/Tests.html'
                    ],
                    timeout: 300 * 1000, // 5 min
                    console: false,
                    summaryOnly: true,
                    '--web-security': 'false'
                }
            },
            properties: {
                options: {
                    urls: [
                        './vNext/extensions/applicationinsights-properties-js/Tests/Selenium/Tests.html'
                    ],
                    timeout: 5 * 60 * 1000, // 5 min
                    console: false,
                    summaryOnly: true,
                    '--web-security': 'false'
                }
            },
            reactnative: {
                options: {
                    urls: [
                        './vNext/extensions/applicationinsights-react-native/Tests/Selenium/Tests.html'
                    ],
                    timeout: 5 * 60 * 1000, // 5 min
                    console: true,
                    summaryOnly: true,
                    '--web-security': 'false'
                }
            },
            aisku: {
                options: {
                    urls: [
                        './vNext/AISKU/Tests/Selenium/Tests.html'
                    ],
                    timeout: 5 * 60 * 1000, // 5 min
                    console: false,
                    summaryOnly: true,
                    '--web-security': 'false'
                }
            },
            aichannel: {
                options: {
                    urls: [
                        './vNext/channels/applicationinsights-channel-js/Tests/Selenium/Tests.html'
                    ],
                    timeout: 300 * 1000, // 5 min
                    console: false,
                    summaryOnly: true,
                    '--web-security': 'false'
                }
            }
        }
    });

    grunt.event.on('qunit.testStart', function (name) {
        grunt.log.ok('Running test: ' + name);
    });

    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-tslint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-run');
    grunt.registerTask("default", ["ts:default", "uglify:ai", "uglify:snippet"]);
    grunt.registerTask("core", ["ts:core"]);
    grunt.registerTask("common", ["ts:common"]);
    grunt.registerTask("module", ["ts:module"]);
    grunt.registerTask("ai", ["ts:appinsights"]);
    grunt.registerTask("aitests", ["ts:appinsights", "ts:appinsightstests", "qunit:aitests"]);
    grunt.registerTask("aisku", ["ts:aisku"]);
    grunt.registerTask("aiskulite", ["ts:aiskulite"]);
    grunt.registerTask("snippetvnext", ["uglify:snippetvNext"]);
    grunt.registerTask("aiskutests", ["ts:aisku", "ts:aiskutests", "qunit:aisku"]);
    grunt.registerTask("test", ["ts:default", "ts:test", "ts:testSchema", "ts:testE2E", "qunit:all", "run:reacttests"]);
    grunt.registerTask("test1ds", ["coretest", "common", "propertiestests", "depstest", "aitests", "aiskutests", "reactnativetests"]);
    grunt.registerTask("coretest", ["ts:core", "ts:coretest", "qunit:core"]);
    grunt.registerTask("commontest", ["ts:common", "ts:commontest", "qunit:common"]);
    grunt.registerTask("properties", ["ts:properties"]);
    grunt.registerTask("propertiestests", ["ts:properties", "ts:propertiestests", "qunit:properties"]);
    grunt.registerTask("react", ["ts:react"]);
    grunt.registerTask("reacttests", ["run:reacttests"]);
    grunt.registerTask("reactnative", ["ts:reactnative"]);
    grunt.registerTask("reactnativetests", ["ts:reactnative", "ts:reactnativetests", "qunit:reactnative"]);
    grunt.registerTask("deps", ["ts:deps"]);
    grunt.registerTask("depstest", ["ts:deps", "ts:depstest", "qunit:deps"]);
    grunt.registerTask("aichannel", ["ts:aichannel"]);
    grunt.registerTask("aichanneltest", ["ts:aichannel", "ts:aichanneltest", "qunit:aichannel"]);
};
