/* Dump one full example of each span shape the channel produces. */
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

const PORT = 8096;
const BASE = "http://localhost:" + PORT;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function httpGet(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            const c = [];
            res.on("data", (d) => c.push(d));
            res.on("end", () => resolve(JSON.parse(Buffer.concat(c).toString("utf8"))));
        }).on("error", reject);
    });
}

(async () => {
    const server = spawn(process.execPath, [path.join(__dirname, "server.js")], {
        stdio: "ignore",
        env: Object.assign({}, process.env, { OTLP_EXAMPLE_PORT: String(PORT) })
    });
    await delay(1500);

    const puppeteer = require("puppeteer");
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.goto(BASE + "/index.html?autorun", { waitUntil: "load" });
    await page.waitForFunction("window.__otlpAutoRunComplete === true", { timeout: 30000 });
    await delay(2500);

    const collected = await httpGet(BASE + "/__collected");

    const traceReq = collected.requests.filter((r) => r.signal === "traces")[0];
    console.log("=========== RAW REQUEST (exactly what was POSTed to /v1/traces) ===========");
    console.log("url         : " + traceReq.url);
    console.log("content-type: " + traceReq.contentType);
    console.log("body bytes  : " + traceReq.rawLength);
    console.log("");
    console.log("--- first 700 chars of the raw body ---");
    console.log(traceReq.raw.substring(0, 700) + " ...");

    const spans = [];
    collected.requests.forEach((r) => {
        if (r.signal !== "traces" || !r.body) { return; }
        (r.body.resourceSpans || []).forEach((rs) => {
            (rs.scopeSpans || []).forEach((ss) => (ss.spans || []).forEach((s) => spans.push(s)));
        });
    });

    const pick = (predicate) => spans.filter(predicate)[0];

    console.log("\n\n=========== A: span from a real startSpan() OTel span ===========");
    console.log(JSON.stringify(pick((s) => s.name.indexOf("example-span") === 0), null, 2));

    console.log("\n\n=========== B: auto-collected fetch dependency (CLIENT) ===========");
    console.log(JSON.stringify(pick((s) => s.name.indexOf("/api/products") !== -1), null, 2));

    console.log("\n\n=========== C: the deliberately failing request (status ERROR) ===========");
    console.log(JSON.stringify(pick((s) => s.name.indexOf("/api/missing") !== -1), null, 2));

    console.log("\n\n=========== D: page view span (generated span id) ===========");
    console.log(JSON.stringify(pick((s) => s.name === "home"), null, 2));

    const logReq = collected.requests.filter((r) => r.signal === "logs")[0];
    const logRecords = [];
    (logReq.body.resourceLogs || []).forEach((rl) => {
        (rl.scopeLogs || []).forEach((sl) => (sl.logRecords || []).forEach((l) => logRecords.push(l)));
    });
    console.log("\n\n=========== E: exception log record ===========");
    console.log(JSON.stringify(logRecords.filter((l) =>
        (l.attributes || []).some((a) => a.key === "exception.type"))[0], null, 2));

    console.log("\n\n=========== F: the resource both share ===========");
    console.log(JSON.stringify(traceReq.body.resourceSpans[0].resource, null, 2));

    await browser.close();
    server.kill();
    process.exit(0);
})();
