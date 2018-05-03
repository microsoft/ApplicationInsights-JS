/// <reference path="../testframework/performancetesthelper.ts" />

class PageLoadPerfTests extends PerformanceTestHelper {

    /** Turns on/off sinon's syncronous implementation of setTimeout. On by default. */
    public errorSpy: SinonSpy;

    /** Method called before the start of each test method */
    public testInitialize() {
        this.useFakeTimers = false;
        this.clock.restore();
        this.errorSpy = this.getListener();
    }

    public registerTests() {
        var detect = this.detectPlatformAndOs();
        var platform = detect.platform;
        var os = detect.os;
        var results = [];
        var firstDone = false;
        var secondDone = false;
        var delay = 100;

        this.testCaseAsync({
            name: "perf: testPageNoAppInsights",
            stepDelay: delay,
            steps: [
                () => {
                    // load once to avoid network delays
                    this.loadPageToIFrame("testPageNoAppInsights");
                },
                () => {
                    this.errorSpy.reset();
                    this.loadPageToIFrame("testPageNoAppInsights");
                }
            ].concat(this.poll(() => {
                if (this.errorSpy.called) {
                    var timing = JSON.parse(this.errorSpy.args[0][0].data);
                    results.push({
                        name: "pageLoad.noAppInsights",
                        time: timing.loadEventEnd - timing.navigationStart,
                        count: 1,
                        period: 1,
                        date: +new Date,
                        platform: platform,
                        os: os
                    });

                    this.errorSpy.reset();
                    Assert.ok(true, "collected page load time");
                    firstDone = true;
                    if (firstDone && secondDone) {
                        JSLitmus._tests = results;
                        this.onTestsComplete();
                    } else {
                        return true;
                    }
                } else {
                    return false
                }
            }))
        });

        this.testCaseAsync({
            name: "perf: testPageWithAppInsights",
            stepDelay: delay,
            steps: [
                () => {
                    // load once to avoid network delays
                    this.loadPageToIFrame("testPageNoAppInsights");
                },
                () => {
                    this.errorSpy.reset();
                    this.loadPageToIFrame("testPageWithAppInsights");
                }
            ].concat(this.poll(() => {
                if (this.errorSpy.called) {
                    var timing = JSON.parse(this.errorSpy.args[0][0].data);
                    results.push({
                        name: "pageLoad.withAppInsights",
                        time: timing.loadEventEnd - timing.navigationStart,
                        count: 1,
                        period: 1,
                        date: +new Date,
                        platform: platform,
                        os: os
                    });

                    this.errorSpy.reset();
                    secondDone = true;
                    if (firstDone && secondDone) {
                        JSLitmus._tests = results;
                        this.onTestsComplete();
                    } else {
                        return true;
                    }
                } else {
                    return false
                }
            }))
        });
    }

    private poll(func: () => boolean, count: number = 50) {
        var polling = [];
        if (typeof window != "undefined" && window.performance && window.performance.timing) {
            for (var i = 0; i < count; i++) {
                polling.push(() => {
                    if (func()) {
                        Assert.ok(true, "validated, stopping poll cycle");
                    }
                });
            }
        } else {
            polling.push(() => {
                Assert.ok(true, "this browser does not support page timing (window.performance.timing)");
            });
        }

        return polling;
    }

    private detectPlatformAndOs() {
        // Get platform info but don't worry if you can't recognize everything
        // that's out there.  This is just for the major platforms and OSes.
        var platform = 'unknown platform', ua = navigator.userAgent;

        // Detect OS
        var oses = ['Windows', 'iPhone OS', '(Intel |PPC )?Mac OS X', 'Linux'].join('|');
        var pOS = new RegExp('((' + oses + ') [^ \);]*)').test(ua) ? RegExp.$1 : null;
        if (!pOS) pOS = new RegExp('((' + oses + ')[^ \);]*)').test(ua) ? RegExp.$1 : null;

        // Detect browser
        var pName = /(Chrome|MSIE|Safari|Opera|Firefox)/.test(ua) ? RegExp.$1 : null;

        // Detect version
        var vre = new RegExp('(Version|' + pName + ')[ \/]([^ ;]*)');
        var pVersion = (pName && vre.test(ua)) ? RegExp.$2 : null;
        var platform = (pOS && pName && pVersion) ? pName + ' ' + pVersion + ' on ' + pOS : 'unknown platform';

        return { platform: platform, os: pOS };
    }

    private getListener(): SinonSpy {
        var listener = { onMessage: (data) => null };
        var spy = this.sandbox.spy(listener, "onMessage");

        if (window.addEventListener) {
            addEventListener("message", listener.onMessage, false);
        } else {
            window["attachEvent"].call("onmessage", listener.onMessage);
        }

        return spy;
    }

    private loadPageToIFrame(path) {
        window["appInsights"] = undefined;
        var href = window.location.href.toLowerCase();
        var replace = href.indexOf("performance") >= 0 ? "performance" : "selenium";
        var fullPath = href.split(replace)[0] + "selenium/" + path + ".html";
        var iframe = document.createElement("iframe");
        iframe.src = fullPath;
        iframe.width = "100%";
        iframe.height = "250px";
        iframe.id = path;
        document.getElementsByTagName("body")[0].parentNode.appendChild(iframe);
        return iframe;
    }
}

new PageLoadPerfTests().registerTests();