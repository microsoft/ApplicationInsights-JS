/* Verifies that the collector choice survives navigating between pages via the nav links. */
const puppeteer = require("puppeteer");

const BASE = "http://localhost:8099";
const TAP = BASE + "/tap";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
    const page = await browser.newPage();

    // Land on the tapped url, exactly as the Edge tab did
    await page.goto(BASE + "/index.html?collector=" + encodeURIComponent(TAP), { waitUntil: "load" });
    await delay(800);

    const homeBanner = await page.evaluate(() => document.getElementById("endpoint").textContent.trim());
    console.log("home banner      : " + homeBanner.substring(0, 100));
    console.log("home usingTap    : " + await page.evaluate(() => otlpExample.isUsingTap()));

    // Click the Checkout nav link -- the exact action that previously lost the setting
    await Promise.all([
        page.waitForNavigation({ waitUntil: "load" }),
        page.click('nav a[href*="checkout"]')
    ]);
    await delay(800);

    console.log("");
    console.log("checkout url     : " + page.url());
    console.log("checkout endpoint: " + await page.evaluate(() => otlpExample.getEndpoint()));
    console.log("checkout usingTap: " + await page.evaluate(() => otlpExample.isUsingTap()));

    // Now generate telemetry from the navigated-to page
    await page.click("#generate");
    await delay(6000);

    // And prove a page opened with NO query string at all still uses the stored choice
    const fresh = await browser.newPage();
    await fresh.goto(BASE + "/products.html", { waitUntil: "load" });
    await delay(800);
    console.log("");
    console.log("fresh tab, no query string:");
    console.log("  endpoint       : " + await fresh.evaluate(() => otlpExample.getEndpoint()));
    console.log("  usingTap       : " + await fresh.evaluate(() => otlpExample.isUsingTap()));

    await browser.close();
})();
