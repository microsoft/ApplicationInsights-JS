module.exports = function (grunt) {
  grunt.initConfig({
    ts: {
      default: {
        src: [
          '**/*.ts',
          '!node_modules/**',
          '!bundle/**',
          '!dist/**',
          '!JavaScript/JavaScriptSDK.Tests/**',
          '!JavaScript/JavaScriptSDK/min/**'], // this was the old build drop location
        out: 'bundle/ai.js',
        comments: true
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
  grunt.registerTask("default", ["ts", "uglify"]);
};