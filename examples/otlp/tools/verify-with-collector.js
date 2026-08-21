/*
 * Validates the OTLP channel output against a REAL OpenTelemetry Collector.
 *
 * The browser exports to the collector, which parses the payload with the real protocol
 * implementation -- anything malformed is rejected with a 4xx rather than quietly accepted. What the
 * collector successfully parsed is then re-exported as canonical OTLP/JSON back to the example's
 * mock collector, where the same validation rules are applied to the collector's own
 * re-serialization.
 *
 *   browser  ->  real collector (:4318)  ->  mock collector (:8099)  ->  validator
 *
 * Usage:
 *   node tools/verify-with-collector.js                    # starts the local otelcol binary
 *   node tools/verify-with-collector.js --external         # a collector is already running on 4318
 */
const path = require("path");
const fs = require("fs");
const http = require("http");
const { spawn } = require("child_process");
const { validate } = require("./validate");

const PORT = Number(process.env.OTLP_EXAMPLE_PORT || 8099);
const BASE = "http://localhost:" + PORT;
const COLLECTOR = process.env.OTLP_COLLECTOR_URL || "http://localhost:4318";
const PAGES = ["index.html", "products.html", "checkout.html"];

const collectorDir = path.resolve(__dirname, "../collector");
const collectorExe = path.join(collectorDir, "bin", process.platform === "win32" ? "otelcol.exe" : "otelcol");
const collectorConfig = path.join(collectorDir, "otel-collector-config.yaml");

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function httpGet(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            const chunks = [];
            res.on("data", (c) => chunks.push(c));
            res.on("end", () => {
                const body = Buffer.concat(chunks).toString("utf8");
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        }).on("error", reject);
    });
}

function postEmpty(url) {
    return new Promise((resolve, reject) => {
        const req = http.request(url, { method: "POST" }, resolve);
        req.on("error", reject);
        req.end();
    });
}

async function waitFor(url, timeoutMs, label) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            await httpGet(url);
            return true;
        } catch (e) {
            await delay(300);
        }
    }

    throw new Error("Timed out waiting for " + label + " at " + url);
}

/**
 * The collector has no unauthenticated health endpoint by default, so readiness is probed by POSTing
 * an empty OTLP request to it. A 200 means the receiver is up and parsing.
 */
function probeCollector() {
    return new Promise((resolve) => {
        const body = JSON.stringify({ resourceSpans: [] });
        const req = http.request(COLLECTOR + "/v1/traces", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }
        }, (res) => {
            res.resume();
            resolve(res.statusCode);
        });
        req.on("error", () => resolve(0));
        req.end(body);
    });
}

async function waitForCollector(timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const status = await probeCollector();
        if (status >= 200 && status < 300) {
            return true;
        }
        await delay(400);
    }

    return false;
}

async function run() {
    const external = process.argv.indexOf("--external") !== -1;
    const failures = [];
    const rejected = [];
    let collector = null;
    let server = null;
    let browser = null;
    let collectorOutput = [];

    try {
        const puppeteer = require("puppeteer");

        // ---- the example's own server, which both serves the site and receives the round trip ----
        let serverAlreadyRunning = false;
        try {
            await httpGet(BASE + "/__collected");
            serverAlreadyRunning = true;
            console.log("Note: reusing the server already listening on " + BASE);
        } catch (e) {
            serverAlreadyRunning = false;
        }

        if (!serverAlreadyRunning) {
            server = spawn(process.execPath, [path.join(__dirname, "server.js")], {
                stdio: ["ignore", "ignore", "pipe"],
                env: Object.assign({}, process.env, { OTLP_EXAMPLE_PORT: String(PORT) })
            });
            server.stderr.on("data", (d) => console.error("[server] " + d.toString().trim()));
            await waitFor(BASE + "/__collected", 15000, "the example server");
        }

        await postEmpty(BASE + "/__reset");

        // ---- the real OpenTelemetry Collector ----
        if (!external) {
            if (!fs.existsSync(collectorExe)) {
                console.error("The collector binary was not found at " + collectorExe);
                console.error("Run collector/get-collector.ps1 (or .sh), or start one yourself and");
                console.error("re-run with --external.");
                process.exit(2);
            }

            console.log("Starting the OpenTelemetry Collector ...");
            collector = spawn(collectorExe, ["--config", collectorConfig], {
                cwd: collectorDir,
                stdio: ["ignore", "pipe", "pipe"]
            });

            const collectorLog = [];
            const noteOutput = (text) => {
                collectorLog.push(text);
                // The collector logs with tab separated fields, so the level is matched precisely
                // rather than by looking for the word "error" anywhere in the debug output.
                if (/\terror\t/.test(text) || /Permanent error/.test(text) ||
                        /Exporting failed/.test(text) || /Dropping data/.test(text)) {
                    rejected.push(text.trim());
                }
            };

            collector.stdout.on("data", (d) => noteOutput(d.toString()));
            collector.stderr.on("data", (d) => noteOutput(d.toString()));
            collectorOutput = collectorLog;
        }

        if (!(await waitForCollector(external ? 15000 : 40000))) {
            throw new Error("The OpenTelemetry Collector did not become ready on " + COLLECTOR);
        }
        console.log("Collector is accepting OTLP on " + COLLECTOR);
        console.log("");

        // ---- drive the site, exporting to the real collector ----
        browser = await puppeteer.launch({
            headless: process.argv.indexOf("--headful") === -1 ? "new" : false,
            args: ["--no-sandbox", "--disable-dev-shm-usage"]
        });

        for (const pageName of PAGES) {
            const page = await browser.newPage();
            const badResponses = [];

            page.on("response", (response) => {
                const status = response.status();
                const url = response.url();
                if (status >= 400 && url.indexOf("/api/missing") === -1) {
                    badResponses.push(status + " " + url);
                }
            });

            const target = BASE + "/" + pageName + "?autorun&collector=" + encodeURIComponent(COLLECTOR);
            await page.goto(target, { waitUntil: "load" });
            await page.waitForFunction("window.__otlpAutoRunComplete === true", { timeout: 30000 });
            await delay(2500);

            if (badResponses.length) {
                failures.push("[" + pageName + "] the collector rejected a request: " + badResponses.join(", "));
            }

            console.log("  " + pageName + " exported to the real collector");
            await page.close();
        }

        // Let the collector's batch processor flush and the round trip arrive
        await delay(5000);

        // ---- validate what the real collector re-exported ----
        const collected = await httpGet(BASE + "/__collected");
        const requests = collected.body.requests;

        if (!requests.length) {
            throw new Error("The collector did not re-export anything to the example server. " +
                "Check that the collector config points otlphttp/roundtrip at " + BASE);
        }

        const report = validate(requests);

        console.log("");
        console.log("=== Validation of the REAL collector's own re-serialization ===");
        console.log("Round tripped requests : " + requests.length);
        console.log("Spans                  : " + report.summary.spans);
        console.log("Log records            : " + report.summary.logs);
        console.log("Services               : " + JSON.stringify(report.summary.services));
        console.log("Span kinds             : " + JSON.stringify(report.summary.spanKinds));
        console.log("Telemetry types        : " + JSON.stringify(report.summary.telemetryTypes));
        console.log("Assertions             : " + report.passedCount + " passed, " +
            report.failedCount + " failed");

        report.failures.forEach((f) => {
            failures.push("[round trip] " + f.description +
                (f.detail === null ? "" : " -- " + JSON.stringify(f.detail)));
        });

        if (rejected.length) {
            failures.push("[collector] reported errors: " + rejected.slice(0, 5).join(" | "));
        }

        // Show a slice of what the collector itself parsed, as direct evidence that a real OTLP
        // implementation understood the payload rather than merely accepting the bytes.
        const parsedSample = collectorOutput.join("").split("\n")
            .filter((line) => /^(Span|ResourceSpans|Resource attributes|LogRecord|\s+->|Trace ID|Span ID|Name\s*:|Kind\s*:|Status code)/.test(line.trim()) ||
                /^\s+-> (service\.name|url\.full|server\.address|server\.port|http\.request\.method)/.test(line))
            .slice(0, 24);

        if (parsedSample.length) {
            console.log("");
            console.log("=== What the collector itself parsed (debug exporter) ===");
            parsedSample.forEach((line) => console.log("  " + line.trim()));
        }
    } catch (e) {
        failures.push("[harness] " + e.message);
    } finally {
        if (browser) {
            await browser.close();
        }
        if (collector) {
            collector.kill();
        }
        if (server) {
            server.kill();
        }
    }

    console.log("");
    if (failures.length) {
        console.error("FAILED (" + failures.length + " issue(s)):");
        failures.forEach((f) => console.error("  - " + f));
        process.exit(1);
    }

    console.log("PASSED - a real OpenTelemetry Collector accepted every payload, and its own");
    console.log("         re-serialization of the data satisfies every validation rule.");
    process.exit(0);
}

run();
