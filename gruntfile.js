module.exports = function (grunt) {
    grunt.initConfig({
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
            common: {
                tsconfig: './tsconfig.json',
                src: [
                    'AppInsightsCommon/applicationinsights-common.ts',
                    'AppInsightsCommon/*.ts',
                    'AppInsightsCommon/Interfaces/*.ts'
                ],
                out: 'AppInsightsCommon/amd/bundle/applicationinsights-common.js'
            },
            commoncjs: {
                tsconfig: './AppInsightsCommon/cjs/tsconfigcommonjs.json',
                src: [
                    'AppInsightsCommon/applicationinsights-common.ts',
                    'AppInsightsCommon/*.ts',
                    'AppInsightsCommon/Interfaces/*.ts'
                ]
            },
            channel: {
                tsconfig: './tsconfig.json',
                src: [
                    'AppInsightsChannel/*.ts',
                    'AppInsightsChannel/TelemetryValidation/*.ts'
                ],
                out: 'AppInsightsChannel/amd/bundle/aichannel.js'
            },
            channelcjs: {
                tsconfig:'./AppInsightsChannel/cjs/tsconfigcommonjs.json',
                src: [
                    'AppInsightsChannel/*.ts',
                    'AppInsightsChannel/TelemetryValidation/*.ts'
                ]
            },
            corecjs: {
                tsconfig: './coreSDK/cjs/tsconfigcommonjs.json',
                src: [
                    'coreSDK/JavaScriptSDK.Interfaces/IConfiguration.ts',
                    'coreSDK/JavaScriptSDK.Interfaces/IChannelControls.ts',
                    'coreSDK/JavaScriptSDK.Interfaces/ITelemetryPlugin.ts',
                    'coreSDK/JavaScriptSDK.Interfaces/ITelemetryItem.ts',
                    'coreSDK/JavaScriptSDK.Interfaces/IAppInsightsCore.ts',
                    'coreSDK/JavaScriptSDK.Interfaces/CoreUtils.ts',
                    'coreSDK/JavaScriptSDK/AppInsightsCore.ts',
                    'coreSDK/applicationinsights-core-js.ts'
                ]
            },
            channelcommonjs: {
                tsconfig:'./AppInsightsChannel/cjs/tsconfigcommonjs.json',
                src: [
                    'AppInsightsChannel/*.ts',
                    'AppInsightsChannel/TelemetryValidation/*.ts'
                ]
            },
            appinsightscjs: {
                tsconfig:'./ApplicationInsights/cjs/tsconfigcommonjs.json',
                 src: [
                    'ApplicationInsights/JavascriptSDK/*.ts',
                    'ApplicationInsights/JavascriptSDK.Interfaces/*.ts',
                    'ApplicationInsights/*.ts'
                ]
            },
            core: {
                tsconfig: './tsconfig.json',
                src: [
                    'coreSDK/JavaScriptSDK.Interfaces/IConfiguration.ts',
                    'coreSDK/JavaScriptSDK.Interfaces/IChannelControls.ts',
                    'coreSDK/JavaScriptSDK.Interfaces/ITelemetryPlugin.ts',
                    'coreSDK/JavaScriptSDK.Interfaces/ITelemetryItem.ts',
                    'coreSDK/JavaScriptSDK.Interfaces/IAppInsightsCore.ts',
                    'coreSDK/JavaScriptSDK.Interfaces/CoreUtils.ts',
                    'coreSDK/JavaScriptSDK/AppInsightsCore.ts',
                    'coreSDK/applicationinsights-core-js.ts'
                ],
                out: 'coreSDK/amd/bundle/applicationinsights-core-js.js',
            }, 
            appinsights: {
                tsconfig: './tsconfig.json',
                src: [
                    'ApplicationInsights/JavascriptSDK.Interfaces/*.ts',
                    'ApplicationInsights/JavascriptSDK/*.ts',
                    'ApplicationInsights/*.ts'
                ],
                out: 'ApplicationInsights/amd/bundle/applicationinsights-analytics-js.js',
            },
             aisku: {
                 tsconfig: './tsconfig.json',
                src: [
                    'AISKU/Init.ts'
                 ],
                out: 'AISKU/amd/bundle/aisdk-js.js'
             },
            module: {
                tsconfig: './tsconfig.json',
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
            coretest: {
                tsconfig: './tsconfig.json',
                src: [
                    'coreSDK/JavaScriptSDK.Tests/Selenium/ApplicationInsightsCore.Tests.ts',
		            'coreSDK/JavaScriptSDK.Tests/Selenium/aitests.ts'
                ],
                out: 'coreSDK/JavaScriptSDK.Tests/Selenium/aicore.tests.js'
            },
            channeltest: {
                tsconfig: './tsconfig.json',
                src: [
                    'AppInsightsChannel/Tests/Selenium/*.ts'
                ],
                out: 'AppInsightsChannel/Tests/Selenium/aichannel.tests.js'
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
            channel: {
                options: {
                    urls: [
                        'AppInsightsChannel/Tests/Selenium/Tests.html',
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
                        'coreSDK/JavaScriptSDK.Tests/Selenium/Tests.html'                       
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
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.registerTask("default", ["ts:default", "uglify:ai", "uglify:snippet"]);
    grunt.registerTask("core", ["ts:core"]);
    grunt.registerTask("corecjs", ["ts:corecjs"])
    grunt.registerTask("common", ["ts:common"]);
    grunt.registerTask("commoncjs", ["ts:commoncjs"]);
    grunt.registerTask("channel", ["ts:channel"]);
    grunt.registerTask("channelcjs", ["ts:channelcjs"]);
    grunt.registerTask("module", ["ts:module"]);
    grunt.registerTask("ai", ["ts:appinsights"]);
    grunt.registerTask("aicjs", ["ts:appinsightscjs"]);
    grunt.registerTask("aisku", ["ts:aisku"]);
    grunt.registerTask("coretest", ["ts:core", "ts:coretest", "qunit:core"]);
    grunt.registerTask("test", ["ts:default", "ts:test", "ts:testSchema", "ts:testE2E", "ts:types", "qunit:all"]);
    grunt.registerTask("testchannel", ["ts:channel", "ts:channeltest", "qunit:channel"]);
};