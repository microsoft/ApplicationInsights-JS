module.exports = function (grunt) {
  grunt.initConfig({
    ts: {
      default: {
        src: [
          'JavaScript/JavaScriptSDK.Interfaces/*.ts',
          'JavaScript/JavaScriptSDK/*.ts',
          '!node_modules/**',
          '!bundle/**',
          '!dist/**',
          '!JavaScript/JavaScriptSDK.Tests/**',
          '!JavaScript/JavaScriptSDK/min/**'],
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
          '!node_modules/**',
          '!bundle/**',
          '!dist/**',
          '!JavaScript/JavaScriptSDK.Tests/**',
          '!JavaScript/JavaScriptSDK/min/**'],
        out: 'bundle/ai.module.js',
        comments: true,
        options: {
          module: 'amd',
          alwaysStrict: true,
          noImplicitAny: false // TODO: true
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
};