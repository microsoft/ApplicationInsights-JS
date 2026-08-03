/* Diagnostic: dump the OTLP spans produced from a real startSpan() call. */
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

const PORT = 8098;
const BASE = "http://localhost:" + PORT;

function httpGet(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            const chunks = [];
            res.on("data", (c) => chunks.push(c));
            res.on("end", () => resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))));
        }).on("error", reject);
    });
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

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

    const spans = [];
    collected.requests.forEach((r) => {
        if (r.signal !== "traces" || !r.body) { return; }
        (r.body.resourceSpans || []).forEach((rs) => {
            (rs.scopeSpans || []).forEach((ss) => {
                (ss.spans || []).forEach((s) => spans.push(s));
            });
        });
    });

    console.log("total spans: " + spans.length);
    console.log("span names: " + JSON.stringify(spans.map((s) => s.name)));

    const suspect = spans.filter((s) => !s.spanId || !/^[0-9a-f]{16}$/.test(s.spanId || ""));
    console.log("\n=== spans with a bad/missing spanId: " + suspect.length + " ===");
    if (suspect.length) {
        console.log(JSON.stringify(suspect[0], null, 2));
    }

    const dupes = spans.filter((s) => {
        const seen = {};
        return (s.attributes || []).some((a) => {
            if (seen[a.key]) { return true; }
            seen[a.key] = true;
            return false;
        });
    });
    console.log("\n=== spans with duplicate attribute keys: " + dupes.length + " ===");
    if (dupes.length) {
        const s = dupes[0];
        console.log("name: " + s.name + "  kind: " + s.kind);
        const counts = {};
        (s.attributes || []).forEach((a) => { counts[a.key] = (counts[a.key] || 0) + 1; });
        Object.keys(counts).forEach((k) => { if (counts[k] > 1) { console.log("  duplicated key: " + k + " x" + counts[k]); } });
        console.log(JSON.stringify(s, null, 2));
    }

    await browser.close();
    server.kill();
    process.exit(0);
})();
