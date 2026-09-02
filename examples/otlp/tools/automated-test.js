/*
 * Automated end to end test for the Application Insights OTLP channel.
 *
 * Starts the mock collector, drives the example site through a real browser using Puppeteer, and
 * then validates every OTLP payload the collector received along with the instance isolation
 * diagnostics reported by each page.
 *
 * Usage:  node tools/automated-test.js [--headful]
 */
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");
const { validate } = require("./validate");

const PORT = Number(process.env.OTLP_EXAMPLE_PORT || 8099);
const BASE = "http://localhost:" + PORT;
const PAGES = ["index.html", "products.html", "checkout.html"];

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

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            await httpGet(BASE + "/__collected");
            return true;
        } catch (e) {
            await delay(200);
        }
    }

    return false;
}

function startServer() {
    const serverPath = path.join(__dirname, "server.js");
    const child = spawn(process.execPath, [serverPath], {
        stdio: ["ignore", "pipe", "pipe"],
        env: Object.assign({}, process.env, { OTLP_EXAMPLE_PORT: String(PORT) })
    });

    child.stdout.on("data", () => { /* keep the server quiet during the test */ });
    child.stderr.on("data", (data) => console.error("[server] " + data.toString().trim()));

    return child;
}

/**
 * Detects a server that is already listening on the port, so that the test reuses it rather than
 * silently failing to bind a second one (which would leave the results depending on whichever server
 * happened to win the port).
 */
async function isServerAlreadyRunning() {
    try {
        await httpGet(BASE + "/__collected");
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Checks the per page diagnostics that describe whether the two instances stayed independent.
 */
function checkIsolation(pageName, diagnostics, failures) {
    function check(condition, description) {
        if (!condition) {
            failures.push("[" + pageName + "] " + description);
        }
    }

    check(diagnostics, "diagnostics were reported");
    if (!diagnostics) {
        return;
    }

    check((diagnostics.errors || []).length === 0,
        "no initialization errors (" + (diagnostics.errors || []).join(" | ") + ")");
    check(diagnostics.instances && diagnostics.instances.length === 2, "both instances were created");

    if (!diagnostics.instances || diagnostics.instances.length !== 2) {
        return;
    }

    const [a, b] = diagnostics.instances;

    check(a.coreId !== b.coreId, "each instance has its own core");
    check(a.channelId !== b.channelId, "each instance has its own OTLP channel");
    check(a.configId !== b.configId, "each instance has its own configuration object");
    check(!!a.iKey && !!b.iKey && a.iKey !== b.iKey, "each instance kept its own instrumentation key");
    check(a.resourceServiceName !== b.resourceServiceName,
        "each instance kept its own service.name");
    check(a.isInitialized && b.isInitialized, "both instances report as initialized");
    check(a.channelPriority === b.channelPriority && a.channelPriority >= 500,
        "the channel priority is in the channel range");

    // Each instance's core must actually contain its own OTLP channel
    [a, b].forEach((inst) => {
        const hasOtlp = (inst.channels || []).some((ch) => ch.identifier === "OtlpChannel");
        check(hasOtlp, "instance '" + inst.id + "' has the OTLP channel registered as a channel");
    });
}

function postReset() {
    return new Promise((resolve, reject) => {
        const req = http.request(BASE + "/__reset", { method: "POST" }, resolve);
        req.on("error", reject);
        req.end();
    });
}

/**
 * Requests that are expected to fail, because the example deliberately issues them in order to
 * produce an unsuccessful dependency span.
 */
const EXPECTED_FAILURES = ["/api/missing"];

async function run() {
    let puppeteer;
    try {
        puppeteer = require("puppeteer");
    } catch (e) {
        console.error("Puppeteer is not available. Install the example dependencies first.");
        process.exit(2);
    }

    const failures = [];
    const reusedServer = await isServerAlreadyRunning();
    if (reusedServer) {
        console.log("Note: a server is already listening on " + BASE + ", reusing it.");
        console.log("      Stop it first if you want a completely isolated run.");
        console.log("");
    }

    const server = reusedServer ? null : startServer();

    let browser = null;
    try {
        if (!(await waitForServer(15000))) {
            throw new Error("The mock collector did not start on " + BASE);
        }

        await postReset();

        browser = await puppeteer.launch({
            headless: process.argv.indexOf("--headful") === -1 ? "new" : false,
            args: ["--no-sandbox", "--disable-dev-shm-usage"]
        });

        for (const pageName of PAGES) {
            const page = await browser.newPage();
            const pageErrors = [];
            const badResponses = [];

            page.on("pageerror", (err) => pageErrors.push(String(err)));
            page.on("console", (msg) => {
                // A failed resource load is reported here without a url, so those are asserted on
                // through the response handler below instead of by matching console text.
                if (msg.type() === "error" && msg.text().indexOf("Failed to load resource") === -1) {
                    pageErrors.push(msg.text());
                }
            });
            page.on("response", (response) => {
                const status = response.status();
                const url = response.url();
                const expected = EXPECTED_FAILURES.some((suffix) => url.indexOf(suffix) !== -1);
                if (status >= 400 && !expected) {
                    badResponses.push(status + " " + url);
                }
            });

            await page.goto(BASE + "/" + pageName + "?autorun", { waitUntil: "load" });

            await page.waitForFunction("window.__otlpAutoRunComplete === true", { timeout: 30000 });

            // Allow the final batch interval to elapse so that everything has been exported
            await delay(2500);

            const summary = await page.evaluate("window.__otlpPageComplete");
            checkIsolation(pageName, summary && summary.diagnostics, failures);

            if (pageErrors.length) {
                failures.push("[" + pageName + "] the page reported errors: " + pageErrors.join(" | "));
            }

            if (badResponses.length) {
                failures.push("[" + pageName + "] unexpected failed request(s): " + badResponses.join(", "));
            }

            console.log("  visited " + pageName + " - generated " + (summary ? summary.generated : 0) +
                " items and " + (summary ? summary.spans : 0) + " span(s)");

            await page.close();
        }

        // Give any trailing batch a chance to arrive
        await delay(1500);

        const collected = await httpGet(BASE + "/__collected");
        const report = validate(collected.body.requests);

        console.log("");
        console.log("OTLP requests received : " + collected.body.otlpRequests);
        console.log("Spans exported         : " + report.summary.spans);
        console.log("Log records exported   : " + report.summary.logs);
        console.log("Services seen          : " + JSON.stringify(report.summary.services));
        console.log("Span kinds             : " + JSON.stringify(report.summary.spanKinds));
        console.log("Telemetry types        : " + JSON.stringify(report.summary.telemetryTypes));
        console.log("Payload assertions     : " + report.passedCount + " passed, " +
            report.failedCount + " failed");

        report.failures.forEach((failure) => {
            failures.push("[payload] " + failure.description +
                (failure.detail === null ? "" : " -- " + JSON.stringify(failure.detail)));
        });

        // Every page must have contributed telemetry for both services
        ["home", "products", "checkout"].forEach((pageName) => {
            const seen = collected.body.requests.some((request) =>
                JSON.stringify(request.body).indexOf("\"" + pageName + "\"") !== -1);
            if (!seen) {
                failures.push("[coverage] no telemetry was received for the '" + pageName + "' page");
            }
        });

        // ------------------------------------------------------------------------------------
        // Unloading one instance must not disturb the other. The collector is reset, the first
        // instance is unloaded, and then only the second instance may still export telemetry.
        // ------------------------------------------------------------------------------------
        await postReset();

        const unloadPage = await browser.newPage();
        await unloadPage.goto(BASE + "/checkout.html", { waitUntil: "load" });
        await unloadPage.evaluate("otlpExample.unloadFirst()");
        await unloadPage.evaluate("otlpExample.runPage('checkout-after-unload')");
        await delay(4000);
        await unloadPage.close();
        await delay(1000);

        const afterUnload = await httpGet(BASE + "/__collected");
        const afterReport = validate(afterUnload.body.requests, {
            expectedServices: ["checkout-widget"],
            expectedTelemetryTypes: ["MessageData", "ExceptionData", "EventData"]
        });

        const servicesAfterUnload = Object.keys(afterReport.summary.services);
        console.log("");
        console.log("After unloading the first instance, services still exporting: " +
            JSON.stringify(servicesAfterUnload));

        if (servicesAfterUnload.indexOf("storefront-web") !== -1) {
            failures.push("[unload] the unloaded instance kept exporting telemetry");
        }

        if (servicesAfterUnload.indexOf("checkout-widget") === -1) {
            failures.push("[unload] the surviving instance stopped exporting telemetry");
        }

        afterReport.failures.forEach((failure) => {
            failures.push("[unload payload] " + failure.description);
        });
    } catch (e) {
        failures.push("[harness] " + e.message);
    } finally {
        if (browser) {
            await browser.close();
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

    console.log("PASSED - all OTLP payloads are valid and the instances stayed isolated.");
    process.exit(0);
}

run();
