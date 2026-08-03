/*
 * Verifies that a custom SKU which places the real OfflineChannel in front of the OTLP channel still
 * delivers telemetry to the OTLP endpoint.
 */
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

(async () => {
    const failures = [];
    await postReset();

    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
    const page = await browser.newPage();

    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await page.goto(BASE + "/custom-sku.html", { waitUntil: "load" });
    await page.waitForFunction("window.__customSkuReady === true", { timeout: 20000 });
    await delay(500);

    const diag = await page.evaluate(() => otlpExample.getSkuDiagnostics());
    console.log("Resolved chain:");
    diag.channels.forEach((c) => console.log("   " + c.identifier + "  priority " + c.priority));
    console.log("otlpIsLast                 : " + diag.otlpIsLast);
    console.log("otlpResolvableByIdentifier : " + diag.otlpResolvableByIdentifier);
    console.log("offlineSupport.url         : " + (diag.offlineSupport && diag.offlineSupport.url));
    console.log("offlineSupport.canSerialize: " + (diag.offlineSupport && diag.offlineSupport.canSerialize));

    if (diag.channels.length !== 2) { failures.push("expected two channels in the queue"); }
    if (!diag.otlpIsLast) { failures.push("the OTLP channel did not sort last"); }
    if (!diag.otlpResolvableByIdentifier) { failures.push("the OTLP channel was not resolvable by identifier"); }
    if (!(diag.offlineSupport && diag.offlineSupport.canSerialize)) {
        failures.push("the OTLP channel did not provide usable offline support");
    }

    // Generate telemetry through the chain. Driven directly rather than through the button so the
    // assertion cannot race the click handler.
    const tracked = await page.evaluate(() => otlpExample.generateSku());
    await page.evaluate(() => otlpExample.flushSku());
    await delay(5000);

    console.log("");
    console.log("items tracked through the SKU : " + tracked);

    if (!tracked) {
        failures.push("the SKU tracked nothing, it was probably not initialized");
    }

    const collected = await httpGet(BASE + "/__collected");
    let records = 0;
    const services = {};
    collected.requests.forEach((r) => {
        if (!r.body) { return; }
        (r.body.resourceSpans || r.body.resourceLogs || []).forEach((res) => {
            (res.resource.attributes || []).forEach((a) => {
                if (a.key === "service.name") { services[a.value.stringValue] = true; }
            });
            (res.scopeSpans || res.scopeLogs || []).forEach((s) => {
                records += (s.spans || s.logRecords || []).length;
            });
        });
    });

    console.log("");
    console.log("records exported through OfflineChannel -> OtlpChannel : " + records);
    console.log("services seen                                          : " + Object.keys(services).join(", "));

    if (records < 3) {
        failures.push("expected at least 3 records to reach the OTLP endpoint, got " + records);
    }
    if (!services["custom-sku"]) {
        failures.push("no telemetry arrived under the custom-sku service");
    }
    if (pageErrors.length) {
        failures.push("page errors: " + pageErrors.join(" | "));
    }

    await browser.close();

    console.log("");
    if (failures.length) {
        console.error("FAILED:");
        failures.forEach((f) => console.error("  - " + f));
        process.exit(1);
    }

    console.log("PASSED - the OTLP channel works when chained behind the real OfflineChannel.");
    process.exit(0);
})();
