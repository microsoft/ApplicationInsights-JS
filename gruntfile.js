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
                    'coreSDK/applicationinsights-core.ts'
                ],
                out: 'coreSDK/amd/bundle/aicore.js',
            },
            common: {
                tsconfig: './tsconfig.json',
                src: [
                    'applicationinsights-common.ts',
                    'AppInsightsCommon/*.ts',
                    'AppInsightsCommon/Interfaces/*.ts'
                ],
                out: 'AppInsightsCommon/bundle/applicationinsights-common.js'
            },
            commoncjs: {
                tsconfig: './AppInsightsCommon/commonjs/tsconfigcommonjs.json',
                src: [
                    'applicationinsights-common.ts',
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
                out: 'AppInsightsChannel/bundle/aichannel.js'
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
                tsconfig:'./AppInsightsChannel/commonjs/tsconfigcommonjs.json',
                src: [
                    'AppInsightsChannel/*.ts',
                    'AppInsightsChannel/TelemetryValidation/*.ts'
                ]
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
                    'coreSDK/JavaScriptSDK.Tests/Selenium/ApplicationInsightsCore.Tests.ts'
                ],
                out: 'coreSDK/JavaScriptSDK.Tests/Selenium/aicore.tests.js'
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
<<<<<<< HEAD
    grunt.registerTask("corecjs", ["ts:corecjs"])
=======
    grunt.registerTask("corecommonjs", ["ts:corecommonjs"]);
>>>>>>> master
    grunt.registerTask("common", ["ts:common"]);
    grunt.registerTask("commoncjs", ["ts:commoncjs"]);
    grunt.registerTask("channel", ["ts:channel"]);
    grunt.registerTask("channelcommonjs", ["ts:channelcommonjs"]);
    grunt.registerTask("module", ["ts:module"]);
    grunt.registerTask("coretest", ["ts:core", "ts:coretest", "qunit:core"]);
    grunt.registerTask("test", ["ts:default", "ts:test", "ts:testSchema", "ts:testE2E", "ts:types", "qunit"]);
};