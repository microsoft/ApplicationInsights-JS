/* Shared page glue for the OTLP example site. */
(function () {
    "use strict";

    var pageName = document.body.getAttribute("data-page") || "unknown";

    function el(id) {
        return document.getElementById(id);
    }

    function log(message) {
        var output = el("log");
        if (output) {
            output.textContent += message + "\n";
            output.scrollTop = output.scrollHeight;
        }
    }

    function show(id, value) {
        var target = el(id);
        if (target) {
            target.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
        }
    }

    function renderDiagnostics(diagnostics) {
        show("diagnostics", diagnostics);

        var isolation = el("isolation");
        if (!isolation || !diagnostics.instances || diagnostics.instances.length < 2) {
            return;
        }

        var a = diagnostics.instances[0];
        var b = diagnostics.instances[1];
        var checks = [
            ["Each instance has its own core", a.coreId !== b.coreId],
            ["Each instance has its own OTLP channel", a.channelId !== b.channelId],
            ["Each instance has its own config object", a.configId !== b.configId],
            ["Each instance kept its own instrumentation key", a.iKey !== b.iKey && !!a.iKey && !!b.iKey],
            ["Each instance kept its own service.name",
                a.resourceServiceName !== b.resourceServiceName && !!a.resourceServiceName],
            ["Both instances are initialized", a.isInitialized && b.isInitialized],
            ["No initialization errors", (diagnostics.errors || []).length === 0]
        ];

        isolation.innerHTML = "";
        checks.forEach(function (check) {
            var li = document.createElement("li");
            li.className = check[1] ? "pass" : "fail";
            li.textContent = (check[1] ? "PASS  " : "FAIL  ") + check[0];
            isolation.appendChild(li);
        });
    }

    function renderEndpointBanner() {
        var banner = el("endpoint");
        if (!banner) {
            return;
        }

        var usingTap = otlpExample.isUsingTap();
        banner.className = "endpoint " + (usingTap ? "via-tap" : "via-mock");
        banner.innerHTML = "";

        var label = document.createElement("span");
        label.innerHTML = usingTap
            ? "Exporting through the <b>tap &rarr; real OpenTelemetry Collector</b>. Requests appear in the Inspector."
            : "Exporting to the <b>built in mock collector</b>. Nothing will appear in the Inspector.";
        banner.appendChild(label);

        var code = document.createElement("code");
        code.textContent = otlpExample.getEndpoint();
        banner.appendChild(code);

        var toggle = document.createElement("button");
        toggle.textContent = usingTap ? "Switch to mock collector" : "Switch to real collector (tap)";
        toggle.addEventListener("click", function () {
            otlpExample.setEndpoint(usingTap ? null : otlpExample.getTapEndpoint());
        });
        banner.appendChild(toggle);
    }

    /**
     * The navigation links are plain paths, so without this the `?collector=` choice would silently
     * be lost as soon as another page was opened. The endpoint is also persisted, this simply keeps
     * the address bar honest about what is in effect.
     */
    function preserveEndpointOnLinks() {
        if (!otlpExample.isUsingTap()) {
            return;
        }

        var query = "?collector=" + encodeURIComponent(otlpExample.getEndpoint());
        var links = document.querySelectorAll("nav a");

        for (var lp = 0; lp < links.length; lp++) {
            var href = links[lp].getAttribute("href");
            if (href && href.indexOf(".html") !== -1 && href.indexOf("collector=") === -1) {
                links[lp].setAttribute("href", href + query);
            }
        }
    }

    window.addEventListener("load", function () {
        log("Initializing two Application Insights instances for page '" + pageName + "'...");

        var diagnostics = otlpExample.init(pageName);
        renderDiagnostics(diagnostics);
        log("Initialized. Globals: " + diagnostics.globals.names.join(", "));
        log("Exporting OTLP to: " + otlpExample.getEndpoint());

        renderEndpointBanner();
        preserveEndpointOnLinks();

        if (diagnostics.errors.length) {
            log("ERRORS: " + diagnostics.errors.join(" | "));
        }

        var autoRun = window.location.search.indexOf("autorun") !== -1;

        el("generate").addEventListener("click", function () {
            log("Generating telemetry...");
            otlpExample.runPage(pageName).then(function (summary) {
                log("Generated " + summary.generated + " items and " + summary.spans + " span(s), then flushed.");
                renderDiagnostics(summary.diagnostics);
            });
        });

        el("validate").addEventListener("click", function () {
            fetch("/__validate").then(function (r) {
                return r.json();
            }).then(function (report) {
                show("validation", report);
                log("Validation: " + (report.ok ? "PASS" : "FAIL") + " (" + report.passedCount +
                    " passed, " + report.failedCount + " failed)");
            });
        });

        el("reset").addEventListener("click", function () {
            fetch("/__reset", { method: "POST" }).then(function () {
                log("Collector reset.");
                show("validation", "");
            });
        });

        var unloadBtn = el("unloadFirst");
        if (unloadBtn) {
            unloadBtn.addEventListener("click", function () {
                log("Unloading the first instance only...");
                var updated = otlpExample.unloadFirst();
                renderDiagnostics(updated);
                log("First instance unloaded. The second instance must still work - press Generate again.");
            });
        }

        if (autoRun) {
            log("autorun requested");
            otlpExample.runPage(pageName).then(function (summary) {
                log("autorun complete: " + summary.generated + " items, " + summary.spans + " span(s)");
                renderDiagnostics(summary.diagnostics);
                window.__otlpAutoRunComplete = true;
            });
        }
    });
})();
