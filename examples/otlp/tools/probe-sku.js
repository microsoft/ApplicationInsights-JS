/* Compares the two offline-channel configurations to see which one starves the OTLP channel. */
const http = require("http");
const puppeteer = require("puppeteer");

const BASE = "http://localhost:8099";
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

function postReset() {
    return new Promise((resolve, reject) => {
        const req = http.request(BASE + "/__reset", { method: "POST" }, resolve);
        req.on("error", reject);
        req.end();
    });
}

async function countRecords() {
    const collected = await httpGet(BASE + "/__collected");
    let records = 0;
    collected.requests.forEach((r) => {
        if (!r.body) { return; }
        (r.body.resourceSpans || r.body.resourceLogs || []).forEach((res) => {
            (res.scopeSpans || res.scopeLogs || []).forEach((s) => {
                records += (s.spans || s.logRecords || []).length;
            });
        });
    });
    return records;
}

async function runMode(page, named) {
    await postReset();
    await page.evaluate((n) => {
        otlpExample.unloadSku();
        otlpExample.initSku(n);
    }, named);
    await delay(500);

    const online = await page.evaluate(() => navigator.onLine);
    await page.evaluate(() => otlpExample.generateSku());
    await page.evaluate(() => otlpExample.flushSku());
    await delay(4000);

    const records = await countRecords();
    console.log("primaryOnlineChannelId=" + (named ? "[OtlpChannel]" : "default") +
        "  navigator.onLine=" + online + "  -> records exported: " + records);

    return records;
}

(async () => {
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.error("PAGE ERROR: " + e));

    await page.goto(BASE + "/custom-sku.html", { waitUntil: "load" });
    await page.waitForFunction("window.__customSkuReady === true", { timeout: 20000 });

    const withNamed = await runMode(page, true);
    const withDefault = await runMode(page, false);

    console.log("");
    console.log("named:   " + withNamed + " records");
    console.log("default: " + withDefault + " records");

    await browser.close();
    process.exit(0);
})();
