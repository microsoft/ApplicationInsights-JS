({
include: ["applicationinsights-analytics-js", "applicationinsights-core-js", "applicationinsights-channel-js", "applicationinsights-common"],
  paths: {
      'applicationinsights-analytics-js': 'applicationinsights-analytics-js',
      'applicationinsights-core-js': 'applicationinsights-core-js',
      'applicationinsights-channel-js': 'applicationinsights-channel-js',
      'applicationinsights-common': 'applicationinsights-common'},
    name: "aisdk-js",
    baseUrl: "bundle/sources",
    out: "out.js",
    optimize: "none",
    shim : {
         "aisdk-js" : ["applicationinsights-analytics-js", "applicationinsights-channel-js", "applicationinsights-common", "applicationinsights-core-js"]
      }
})