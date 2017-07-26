module.exports = function(grunt) {
    grunt.initConfig({
        ts: {
            default: {
                src: [
                    'JavaScript/JavaScriptSDK.Interfaces/*.ts',
                    'JavaScript/JavaScriptSDK/*.ts',
                ],
                out: 'bundle/ai.js',
                comments: true,
                options: {
                    module: 'amd',
                    alwaysStrict: true,
                    declaration: true,
                    noImplicitAny: false // TODO: true
                }
            },
            module: {
                src: [
                    'JavaScript/JavaScriptSDK.Interfaces/*.ts',
                    'JavaScript/JavaScriptSDK.Module/*.ts',
                ],
                out: 'bundle/ai.module.js',
                comments: true,
                options: {
                    module: 'amd',
                    alwaysStrict: true,
                    declaration: true,
                    noImplicitAny: false // TODO: true
                }
            },
            test: {
                src: [
                    'JavaScript/JavaScriptSDK.Tests/Selenium/*.ts'
                ],
                out: 'JavaScript/JavaScriptSDK.Tests/Selenium/ai.tests.js',
                options: {
                    module: 'amd'
                }
            },
            types: {
                src: [
                    'JavaScript/JavaScriptSDK.Tests/DefinitionTypes/*.ts'
                ],
                out: 'bundle/test/ai.types.js',
                options: {
                    module: 'amd'
                }
            }
        },
        uglify: {
            ai: {
                files: {
                    'bundle/ai.min.js': ['bundle/ai.js'],
                },
                options: {
                    sourceMap: true,
                    sourceMapIncludeSources: true,
                    sourceMapIn: 'bundle/ai.js.map'
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
                        // FIX: 'JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.autoCollection.tests.htm'
                        // phantom: 'JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.DisableTelemetryTests.htm'
                        // phantom: 'JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.PublicApiTests.htm'
                        // phantom: 'JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.SanitizerE2ETests.htm'
                        // phantom: 'JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.Sender.tests.htm'
                        // phantom: 'JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.snippetTests.htm'
                        // FIX: 'JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.ValidateApiTests.htm'
                    ],
                    timeout: 120 * 1000,
                    console: false,
                    summaryOnly: true,
                }
            }
        }
    });

    grunt.event.on('qunit.testStart', function(name) {
        grunt.log.ok('Running test: ' + name);
    });

    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    grunt.registerTask("default", ["ts:default", "uglify:ai", "uglify:snippet"]);
    grunt.registerTask("module", ["ts:module"]);
    grunt.registerTask("test", ["ts:test", "ts:types", "qunit"]);
};