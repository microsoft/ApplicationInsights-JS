/*
 * A dependency free static file server and mock OTLP collector for the Application Insights OTLP
 * channel example.
 *
 * Endpoints:
 *   POST /v1/traces        - accepts an OTLP trace export request
 *   POST /v1/logs          - accepts an OTLP log export request
 *   POST /breeze/v2/track  - accepts (and discards) Application Insights ingestion, so that the
 *                            built in sender never reaches the real endpoint during a test
 *   GET  /api/*            - simple endpoints used to generate dependency telemetry
 *   GET  /__collected      - everything the collector has received
 *   GET  /__validate       - runs the validation rules over everything received so far
 *   POST /__reset          - clears the collected data
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { validate } = require("./validate");

const PORT = Number(process.env.OTLP_EXAMPLE_PORT || 8099);
const COLLECTOR_URL = process.env.OTLP_COLLECTOR_URL || "http://localhost:4318";
const PUBLIC_DIR = path.resolve(__dirname, "../public");

/** Every OTLP request the collector has received. */
const collected = [];
/** Every Application Insights ingestion request, kept only so that a manual run can see it. */
const breeze = [];
/**
 * Every OTLP request that passed through the tap on its way to the real OpenTelemetry Collector,
 * together with the response the collector gave. This is what the SDK actually sent, captured before
 * the collector saw it.
 */
const tapped = [];

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".ico": "image/x-icon"
};

function sendJson(res, status, body) {
    const payload = JSON.stringify(body, null, 2);
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(payload),
        "Access-Control-Allow-Origin": "*"
    });
    res.end(payload);
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
    });
}

function serveStatic(req, res, pathname) {
    let filePath = path.join(PUBLIC_DIR, pathname === "/" ? "/index.html" : pathname);

    // Prevent escaping the public directory
    if (!filePath.startsWith(PUBLIC_DIR)) {
        sendJson(res, 403, { error: "forbidden" });
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not found: " + pathname);
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
            "Cache-Control": "no-store"
        });
        res.end(data);
    });
}

async function handleOtlp(req, res, signal, url) {
    const raw = await readBody(req);
    let body = null;
    let parseError = null;

    try {
        body = JSON.parse(raw);
    } catch (e) {
        parseError = e.message;
    }

    collected.push({
        signal,
        url,
        contentType: req.headers["content-type"] || "",
        headers: req.headers,
        raw,
        rawLength: raw.length,
        body,
        parseError,
        receivedAt: new Date().toISOString()
    });

    // An empty JSON object is the standard success response for OTLP/HTTP
    sendJson(res, 200, {});
}

/**
 * Forwards a request to the real OpenTelemetry Collector and resolves with its response.
 */
function forwardToCollector(signalPath, raw, contentType) {
    return new Promise((resolve) => {
        let target;
        try {
            target = new URL(COLLECTOR_URL + signalPath);
        } catch (e) {
            return resolve({ status: 0, body: "", error: "Invalid collector url: " + COLLECTOR_URL });
        }

        const started = Date.now();
        const request = http.request({
            hostname: target.hostname,
            port: target.port || 80,
            path: target.pathname,
            method: "POST",
            headers: {
                "Content-Type": contentType || "application/json",
                "Content-Length": Buffer.byteLength(raw)
            }
        }, (response) => {
            const chunks = [];
            response.on("data", (c) => chunks.push(c));
            response.on("end", () => resolve({
                status: response.statusCode,
                body: Buffer.concat(chunks).toString("utf8"),
                durationMs: Date.now() - started
            }));
        });

        request.on("error", (e) => resolve({
            status: 0,
            body: "",
            error: e.message,
            durationMs: Date.now() - started
        }));

        request.end(raw);
    });
}

/**
 * The tap sits between the SDK and the real collector. It records exactly what the SDK sent, forwards
 * it untouched, and relays the collector's real response back -- so a rejection by the collector is
 * seen by the SDK exactly as it would be without the tap.
 */
async function handleTap(req, res, signalPath) {
    const raw = await readBody(req);
    const contentType = req.headers["content-type"] || "";

    let body = null;
    let parseError = null;
    try {
        body = JSON.parse(raw);
    } catch (e) {
        parseError = e.message;
    }

    const entry = {
        index: tapped.length,
        signal: signalPath.indexOf("traces") !== -1 ? "traces" : "logs",
        signalPath,
        contentType,
        raw,
        rawLength: raw.length,
        body,
        parseError,
        recordCount: _countRecords(body),
        sentAt: new Date().toISOString(),
        collector: null
    };
    tapped.push(entry);

    const result = await forwardToCollector(signalPath, raw, contentType);
    entry.collector = {
        url: COLLECTOR_URL + signalPath,
        status: result.status,
        body: result.body,
        error: result.error || null,
        durationMs: result.durationMs,
        accepted: result.status >= 200 && result.status < 300
    };

    if (result.status === 0) {
        // The collector is unreachable; report it clearly rather than pretending the export worked
        return sendJson(res, 502, {
            error: "The OTLP collector at " + COLLECTOR_URL + " could not be reached",
            detail: result.error
        });
    }

    res.writeHead(result.status, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
    });
    res.end(result.body || "{}");
}

function _countRecords(body) {
    if (!body) {
        return 0;
    }

    let count = 0;
    const resources = body.resourceSpans || body.resourceLogs || [];
    resources.forEach((resource) => {
        const scopes = resource.scopeSpans || resource.scopeLogs || [];
        scopes.forEach((scope) => {
            count += (scope.spans || scope.logRecords || []).length;
        });
    });

    return count;
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));
    const pathname = url.pathname;

    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "*"
        });
        res.end();
        return;
    }

    try {
        if (req.method === "POST" && pathname === "/v1/traces") {
            return await handleOtlp(req, res, "traces", pathname);
        }

        if (req.method === "POST" && pathname === "/v1/logs") {
            return await handleOtlp(req, res, "logs", pathname);
        }

        if (req.method === "POST" && pathname.indexOf("/tap/") === 0) {
            // /tap/v1/traces -> forwarded to <collector>/v1/traces
            return await handleTap(req, res, pathname.substring("/tap".length));
        }

        if (req.method === "POST" && pathname === "/breeze/v2/track") {
            const raw = await readBody(req);
            breeze.push({ length: raw.length, receivedAt: new Date().toISOString() });
            return sendJson(res, 200, { itemsReceived: 1, itemsAccepted: 1, errors: [] });
        }

        if (pathname === "/__tapped") {
            // What the SDK actually sent to the collector, and how the collector answered
            const rejected = tapped.filter((t) => t.collector && !t.collector.accepted);
            return sendJson(res, 200, {
                collectorUrl: COLLECTOR_URL,
                requests: tapped.length,
                records: tapped.reduce((sum, t) => sum + t.recordCount, 0),
                acceptedByCollector: tapped.length - rejected.length,
                rejectedByCollector: rejected.length,
                entries: tapped
            });
        }

        if (pathname === "/__tap-validate") {
            // Validate exactly what was sent to the collector, before the collector touched it
            const asRequests = tapped.map((t) => ({
                signal: t.signal,
                url: t.signalPath,
                contentType: t.contentType,
                body: t.body
            }));

            const report = tapped.length ? validate(asRequests) : {
                ok: false, passedCount: 0, failedCount: 1,
                failures: [{ description: "Nothing has been sent to the collector yet", detail: null }],
                summary: {}
            };

            report.collectorUrl = COLLECTOR_URL;
            report.rejectedByCollector = tapped.filter((t) => t.collector && !t.collector.accepted)
                .map((t) => ({ index: t.index, status: t.collector.status, body: t.collector.body }));

            return sendJson(res, report.ok && !report.rejectedByCollector.length ? 200 : 500, report);
        }

        if (pathname === "/__collected") {
            return sendJson(res, 200, {
                otlpRequests: collected.length,
                breezeRequests: breeze.length,
                requests: collected
            });
        }

        if (pathname === "/__validate") {
            const report = validate(collected);
            report.breezeRequests = breeze.length;
            return sendJson(res, report.ok ? 200 : 500, report);
        }

        if (req.method === "POST" && pathname === "/__reset") {
            collected.length = 0;
            breeze.length = 0;
            tapped.length = 0;
            return sendJson(res, 200, { ok: true });
        }

        if (pathname === "/favicon.ico") {
            res.writeHead(204, { "Cache-Control": "no-store" });
            res.end();
            return;
        }

        if (pathname.startsWith("/api/")) {
            if (pathname === "/api/missing") {
                // Intentionally missing, used by the example to produce a failed dependency
                return sendJson(res, 404, { error: "not found" });
            }

            return sendJson(res, 200, {
                endpoint: pathname,
                items: [{ id: 1, name: "Widget" }, { id: 2, name: "Gadget" }]
            });
        }

        return serveStatic(req, res, pathname);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        sendJson(res, 500, { error: "Internal server error" });
    }
});

server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log("OTLP example running at http://localhost:" + PORT + "/");
    // eslint-disable-next-line no-console
    console.log("  mock collector      : POST /v1/traces  POST /v1/logs");
    // eslint-disable-next-line no-console
    console.log("  tap -> real collector: POST /tap/v1/traces  (forwards to " + COLLECTOR_URL + ")");
    // eslint-disable-next-line no-console
    console.log("  inspector           : http://localhost:" + PORT + "/inspect.html");
    // eslint-disable-next-line no-console
    console.log("  sent to collector   : GET  /__tapped      GET /__tap-validate");
    // eslint-disable-next-line no-console
    console.log("  received by mock    : GET  /__collected   GET /__validate");
});

module.exports = { server, collected, tapped };
