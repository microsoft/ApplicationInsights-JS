var http = require('http');
var fs = require('fs');
var crypto = require('crypto');

var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');

var PORT = process.env.PORT || 8000;
var serve = serveStatic(__dirname + "/../../");
var server = http.createServer(function(req, res) {
  var url = req.url;

  // Kill the server
  if (url === '/_done') {
    console.log('Exiting server_nightwatch.js');
    res.write('<h1>Exiting</h1>');
    res.end();
    process.nextTick(() => {process.exit()});

  // Special case - Add Internet Explorer emulation meta tag if query arg is present
  } else if (url.startsWith('/Tests/Selenium/Tests.html?')) {
    fs.readFile('Tests/Selenium/Tests.html', 'utf8', (err, html) => {
      if (err) {
        throw err;
      }

      // Grab version from query params and insert emulation meta tag into html
      var version = parseInt(url.substring('version='.length+url.indexOf('version=')));
      var ieEmulationMetaTag = `<meta http-equiv="X-UA-Compatible" content="IE=EmulateIE${version}" />`;
      var insertAfter = html.indexOf('<head>') + '<head>'.length;
      html = html.substr(0, insertAfter) + ieEmulationMetaTag + html.substr(insertAfter);

      // Send new html
      res.writeHeader(200, {'Content-Type': 'text/html'});
      res.write(html);
      res.end();
    });

  // Serve static files normally
  } else {
    var done = finalhandler(req, res);
    serve(req, res, done);
  }
});

console.log(`Now listening at https://localhost:${PORT}}`)
server.listen(PORT);
