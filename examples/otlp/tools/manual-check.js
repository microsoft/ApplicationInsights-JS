/* One off verification that the manual (button driven) flow works end to end. */
const path = require("path");
const { spawn } = require("child_process");

const PORT = 8097;
const BASE = "http://localhost:" + PORT;
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

    await page.goto(BASE + "/index.html", { waitUntil: "load" });
    await delay(600);

    // The isolation checklist must render as soon as the page initializes
    const initialIsolation = await page.evaluate(
        "Array.prototype.map.call(document.querySelectorAll('#isolation li'), function (li) { return li.textContent; })");
    console.log("Isolation checklist on load:");
    initialIsolation.forEach((line) => console.log("   " + line));

    await page.click("#generate");
    await delay(4000);

    await page.click("#validate");
    await delay(1500);

    const validationText = await page.evaluate("document.getElementById('validation').textContent");
    const report = JSON.parse(validationText);
    console.log("");
    console.log("Manual validation button -> ok=" + report.ok + " passed=" + report.passedCount +
        " failed=" + report.failedCount);

    const logText = await page.evaluate("document.getElementById('log').textContent");
    console.log("");
    console.log("Activity log:");
    logText.split("\n").forEach((l) => { if (l.trim()) { console.log("   " + l); } });

    // Now exercise the unload-one-instance flow on the checkout page
    const checkout = await browser.newPage();
    await checkout.goto(BASE + "/checkout.html", { waitUntil: "load" });
    await delay(600);
    await checkout.click("#unloadFirst");
    await delay(500);
    await checkout.click("#generate");
    await delay(4000);

    const afterUnload = await checkout.evaluate("window.__otlpPageComplete ? window.__otlpPageComplete.generated : -1");
    const checkoutLog = await checkout.evaluate("document.getElementById('log').textContent");
    console.log("");
    console.log("After unloading only the first instance, telemetry generated: " + afterUnload);
    console.log("Checkout log:");
    checkoutLog.split("\n").forEach((l) => { if (l.trim()) { console.log("   " + l); } });

    const allPass = initialIsolation.every((l) => l.indexOf("PASS") === 0);
    console.log("");
    console.log(allPass && report.ok ? "MANUAL FLOW OK" : "MANUAL FLOW PROBLEM");

    await browser.close();
    server.kill();
    process.exit(allPass && report.ok ? 0 : 1);
})();
