const polka = require("polka");
const sirv = require("sirv");
const fs = require("fs");

const assets = sirv(`${__dirname}/../public`);

polka()
  .use(assets)
  .get('/debugplugin/*', (req, res) => {
    res.writeHead('200', {
      'Content-Type': 'application/javascript'
    })
    res.end(fs.readFileSync(`${__dirname}/../../browser/${req.url.substring('/debugplugin/'.length)}${req.url.endsWith('.map') ? '' : '.js'}`, 'utf8'));
  })
  .get('/analytics/*', (req, res) => {
    res.writeHead('200', {
      'Content-Type': 'application/javascript'
    })
    res.end(fs.readFileSync(`${__dirname}/../../../applicationinsights-analytics-js/browser/${req.url.substring('/analytics/'.length)}${req.url.endsWith('.map') ? '' : '.js'}`, 'utf8'));
  })
  .listen(3000, err => {
    if (err) throw err;
    console.log(`> Running on localhost:3000`);
  });