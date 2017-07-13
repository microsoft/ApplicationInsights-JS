module.exports = function (grunt) {
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
        out: 'bundle/DefinitionTypes/ai.types.js',
        options: {
          module: 'amd'
        }
      }
    },
    uglify: {
      my_target: {
        files: {
          'bundle/ai.min.js': ['bundle/ai.js']
        },
        options: {
          sourceMap: true,
          sourceMapIncludeSources: true,
          sourceMapIn: 'bundle/ai.js.map'
        },
      }
    }
  });
  grunt.loadNpmTasks("grunt-ts");
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask("default", ["ts:default", "uglify"]);
  grunt.registerTask("module", ["ts:module"]);
  grunt.registerTask("test", ["ts:test", "ts:types"]);
};