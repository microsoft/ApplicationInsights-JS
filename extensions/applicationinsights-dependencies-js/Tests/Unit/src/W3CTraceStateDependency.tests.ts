import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { eDistributedTracingModes } from "@microsoft/otel-core-js";
import { RequestHeaders } from "@microsoft/otel-core-js";
import { AppInsightsCore } from "@microsoft/otel-core-js";
import { createPromise } from "@nevware21/ts-async";

import { AjaxMonitor } from "../../../src/ajax";
import { TestChannelPlugin } from "./TestChannelPlugin";

/**
 * Safe unload function for core instances
 */
function _safeUnloadCore(core: AppInsightsCore) {
    if (core && core.isInitialized()) {
        core.unload(false);
    }
}

/**
 * Helper to ensure a tracestate value exists for testing
 */
function _ensureTraceStateValue(core: AppInsightsCore) {
    const traceCtx = core.getTraceCtx();
    if (traceCtx && traceCtx.traceState) {
        // Manually add a test tracestate value if one doesn't exist
        if (!traceCtx.traceState.toString()) {
            traceCtx.traceState.set("test", "value");
        }
    }
}

export class W3CTraceStateDependencyTests extends AITestClass {
    private _ajax: AjaxMonitor | undefined;
    private _context: { [key: string]: any };
    
    public testInitialize() {
        this.useFakeServer = true;
        this._context = {};
    }

    public testCleanup() {
        // Retrieve any core instance stored in the context and unload it
        if (this._context && this._context.core) {
            _safeUnloadCore(this._context.core);
            this._context.core = null;
        }

        if (this._ajax) {
            this._ajax.teardown();
            this._ajax = undefined;
        }

        this._context = {};
    }

    public registerTests() {
        this.testCase({
            name: "W3CTraceStateDependency: XMLHttpRequest with W3C_TRACE mode includes tracestate header when value present",
            test: () => {
                this._ajax = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = {
                    instrumentationKey: "instrumentationKey",
                    extensions: [this._ajax],
                    channels: [[new TestChannelPlugin()]],
                    extensionConfig: {
                        [this._ajax.identifier]: {
                            distributedTracingMode: eDistributedTracingModes.W3C_TRACE
                        }
                    }
                };

                // Initialize the core with the Ajax monitor as an extension
                appInsightsCore.initialize(coreConfig, []);
                
                // Store the core instance for cleanup
                this._context.core = appInsightsCore;
                
                // Explicitly set a tracestate value to ensure the header is included
                _ensureTraceStateValue(appInsightsCore);
                
                // Set window host for testing
                this._ajax["_currentWindowHost"] = "www.example.com";

                // Act
                var xhr = new XMLHttpRequest();
                var spy = this.sandbox.spy(xhr, "setRequestHeader");
                xhr.open("GET", "http://www.example.com");
                xhr.send();

                // Assert that only W3C headers are sent (tracestate included because there's a value)
                Assert.equal(false, spy.calledWith(RequestHeaders.requestIdHeader), "AI header should not be present");
                Assert.equal(true, spy.calledWith(RequestHeaders.traceParentHeader), "W3c traceparent header should be present");
                Assert.equal(true, spy.calledWith(RequestHeaders.traceStateHeader), "W3c tracestate header should be present with value");

                // Emulate response so perf monitoring is cleaned up
                (xhr as any).respond(200, {"Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*"}, "");
                
                // Unload the core to clean up hooks
                _safeUnloadCore(appInsightsCore);
            }
        });
        
        this.testCase({
            name: "W3CTraceStateDependency: XMLHttpRequest with W3C_TRACE mode but no tracestate value",
            test: () => {
                this._ajax = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = {
                    instrumentationKey: "instrumentationKey",
                    extensions: [this._ajax],
                    channels: [[new TestChannelPlugin()]],
                    extensionConfig: {
                        [this._ajax.identifier]: {
                            distributedTracingMode: eDistributedTracingModes.W3C_TRACE
                        }
                    }
                };

                // Initialize the core with the Ajax monitor as an extension
                appInsightsCore.initialize(coreConfig, []);
                
                // Set window host for testing
                this._ajax["_currentWindowHost"] = "www.example.com";

                // Act
                var xhr = new XMLHttpRequest();
                var spy = this.sandbox.spy(xhr, "setRequestHeader");
                xhr.open("GET", "http://www.example.com");
                xhr.send();

                // Assert that only traceparent header is sent, not AI or tracestate headers
                Assert.equal(false, spy.calledWith(RequestHeaders.requestIdHeader), "AI header should not be present");
                Assert.equal(true, spy.calledWith(RequestHeaders.traceParentHeader), "W3c traceparent header should be present");
                Assert.equal(false, spy.calledWith(RequestHeaders.traceStateHeader), "W3c tracestate header should not be present when no value");

                // Emulate response so perf monitoring is cleaned up
                (xhr as any).respond(200, {"Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*"}, "");
                
                // Unload the core to clean up hooks
                _safeUnloadCore(appInsightsCore);
            }
        });

        this.testCase({
            name: "W3CTraceStateDependency: XMLHttpRequest with W3C_TRACE mode - dynamic configuration change",
            useFakeTimers: true,
            test: () => {
                this._ajax = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = {
                    instrumentationKey: "instrumentationKey",
                    extensions: [this._ajax],
                    channels: [[new TestChannelPlugin()]],
                    extensionConfig: {
                        [this._ajax.identifier]: {
                            distributedTracingMode: eDistributedTracingModes.AI // Start with AI mode
                        }
                    }
                };

                // Initialize the core with the Ajax monitor as an extension
                appInsightsCore.initialize(coreConfig, []);
                this._ajax["_currentWindowHost"] = "www.example.com";

                // Test initial AI mode
                var xhr1 = new XMLHttpRequest();
                var spy1 = this.sandbox.spy(xhr1, "setRequestHeader");
                xhr1.open("GET", "http://www.example.com");
                xhr1.send();

                // Assert AI mode behavior
                Assert.equal(true, spy1.calledWith(RequestHeaders.requestIdHeader), "AI header should be present initially");
                Assert.equal(false, spy1.calledWith(RequestHeaders.traceParentHeader), "W3c traceparent header should not be present initially");
                Assert.equal(false, spy1.calledWith(RequestHeaders.traceStateHeader), "W3c tracestate header should not be present initially");

                // Emulate response
                (xhr1 as any).respond(200, {"Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*"}, "");

                // Update configuration dynamically to W3C_TRACE mode
                if (appInsightsCore.config.extensionConfig) {
                    appInsightsCore.config.extensionConfig[this._ajax.identifier].distributedTracingMode = eDistributedTracingModes.W3C_TRACE;
                }
                
                // Trigger config change detection using fake timers
                this.clock.tick(1);
                
                // Ensure tracestate value exists after config change
                _ensureTraceStateValue(appInsightsCore);

                // Test after dynamic configuration change
                var xhr2 = new XMLHttpRequest();
                var spy2 = this.sandbox.spy(xhr2, "setRequestHeader");
                xhr2.open("GET", "http://www.example.com");
                xhr2.send();

                // Assert W3C_TRACE mode behavior after config change
                Assert.equal(false, spy2.calledWith(RequestHeaders.requestIdHeader), "AI header should not be present after config change");
                Assert.equal(true, spy2.calledWith(RequestHeaders.traceParentHeader), "W3c traceparent header should be present after config change");
                Assert.equal(true, spy2.calledWith(RequestHeaders.traceStateHeader), "W3c tracestate header should be present after config change");

                // Emulate response
                (xhr2 as any).respond(200, {"Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*"}, "");
                
                // Unload the core to clean up hooks
                _safeUnloadCore(appInsightsCore);
            }
        });
        
        this.testCase({
            name: "W3CTraceStateDependency: verify AI_AND_W3C mode does not include tracestate header",
            test: () => {
                // Create a fresh AjaxMonitor
                this._ajax = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = {
                    instrumentationKey: "instrumentationKey",
                    extensions: [this._ajax],
                    channels: [[new TestChannelPlugin()]],
                    extensionConfig: {
                        [this._ajax.identifier]: {
                            distributedTracingMode: eDistributedTracingModes.AI_AND_W3C
                        }
                    }
                };
                
                // Initialize core with AjaxMonitor as extension
                appInsightsCore.initialize(coreConfig, []);
                
                // Set window host for testing
                this._ajax["_currentWindowHost"] = "www.example.com";

                // Act
                var xhr = new XMLHttpRequest();
                var spy = this.sandbox.spy(xhr, "setRequestHeader");
                xhr.open("GET", "http://www.example.com");
                xhr.send();

                // Assert that AI and traceparent headers are sent, but not tracestate
                Assert.equal(true, spy.calledWith(RequestHeaders.requestIdHeader), "AI header should be present");
                Assert.equal(true, spy.calledWith(RequestHeaders.traceParentHeader), "W3c traceparent header should be present");
                Assert.equal(false, spy.calledWith(RequestHeaders.traceStateHeader), "W3c tracestate header should not be present");

                // Emulate response so perf monitoring is cleaned up
                (xhr as any).respond(200, {"Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*"}, "");
                
                // Unload the core to clean up hooks
                _safeUnloadCore(appInsightsCore);
            }
        });
        
        this.testCase({
            name: "W3CTraceStateDependency: verify AI mode does not include any W3C headers",
            test: () => {
                this._ajax = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = {
                    instrumentationKey: "instrumentationKey",
                    extensions: [this._ajax],
                    channels: [[new TestChannelPlugin()]],
                    extensionConfig: {
                        [this._ajax.identifier]: {
                            distributedTracingMode: eDistributedTracingModes.AI
                        }
                    }
                };
                appInsightsCore.initialize(coreConfig, []);
                this._ajax["_currentWindowHost"] = "www.example.com";

                // Act
                var xhr = new XMLHttpRequest();
                var spy = this.sandbox.spy(xhr, "setRequestHeader");
                xhr.open("GET", "http://www.example.com");
                xhr.send();

                // Assert that only AI header is sent, no W3C headers
                Assert.equal(true, spy.calledWith(RequestHeaders.requestIdHeader), "AI header should be present");
                Assert.equal(false, spy.calledWith(RequestHeaders.traceParentHeader), "W3c traceparent header should not be present");
                Assert.equal(false, spy.calledWith(RequestHeaders.traceStateHeader), "W3c tracestate header should not be present");

                // Emulate response so perf monitoring is cleaned up
                (xhr as any).respond(200, {"Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*"}, "");
                
                // Unload the core to clean up hooks
                _safeUnloadCore(appInsightsCore);
            }
        });

        this.testCase({
            name: "W3CTraceStateDependency: verify AI_AND_W3C_TRACE mode includes tracestate header when value present",
            test: () => {
                this._ajax = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = {
                    instrumentationKey: "instrumentationKey",
                    extensions: [this._ajax],
                    channels: [[new TestChannelPlugin()]],
                    extensionConfig: {
                        [this._ajax.identifier]: {
                            distributedTracingMode: eDistributedTracingModes.AI_AND_W3C_TRACE
                        }
                    }
                };
                appInsightsCore.initialize(coreConfig, []);
                
                // Store the core instance for cleanup
                this._context.core = appInsightsCore;
                
                // Explicitly set a tracestate value to ensure the header is included
                _ensureTraceStateValue(appInsightsCore);
                
                this._ajax["_currentWindowHost"] = "www.example.com";

                // Act
                var xhr = new XMLHttpRequest();
                var spy = this.sandbox.spy(xhr, "setRequestHeader");
                xhr.open("GET", "http://www.example.com");
                xhr.send();

                // Assert that all three headers are sent (tracestate included because there's a value)
                Assert.equal(true, spy.calledWith(RequestHeaders.requestIdHeader), "AI header should be present");
                Assert.equal(true, spy.calledWith(RequestHeaders.traceParentHeader), "W3c traceparent header should be present");
                Assert.equal(true, spy.calledWith(RequestHeaders.traceStateHeader), "W3c tracestate header should be present with value");

                // Emulate response so perf monitoring is cleaned up
                (xhr as any).respond(200, {"Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*"}, "");
                
                // Unload the core to clean up hooks
                _safeUnloadCore(appInsightsCore);
            }
        });

        // Fetch API Tests using framework helpers
        this.testCase({
            name: "W3CTraceStateDependency: Fetch with AI_AND_W3C_TRACE mode includes tracestate header when value present",
            test: () => {
                return createPromise<void>((resolve, reject) => {
                    try {
                        // Setup mock fetch using framework helper
                        const fetchCalls = this.hookFetch<Response>((resolveResponse) => {
                            setTimeout(() => {
                                resolveResponse({
                                    headers: new Headers(),
                                    ok: true,
                                    body: null,
                                    bodyUsed: false,
                                    redirected: false,
                                    status: 200,
                                    statusText: "Hello",
                                    trailer: null,
                                    type: "basic",
                                    url: "https://httpbin.org/status/200"
                                } as any);
                            }, 0);
                        });

                        this._ajax = new AjaxMonitor();
                        let appInsightsCore = new AppInsightsCore();
                        let coreConfig = {
                            instrumentationKey: "instrumentationKey",
                            disableFetchTracking: false,
                            disableAjaxTracking: false,
                            extensions: [this._ajax],
                            channels: [[new TestChannelPlugin()]],
                            extensionConfig: {
                                [this._ajax.identifier]: {
                                    distributedTracingMode: eDistributedTracingModes.AI_AND_W3C_TRACE
                                }
                            }
                        };
                        appInsightsCore.initialize(coreConfig, []);
                        let trackSpy = this.sandbox.spy(appInsightsCore, "track");
                        
                        // Store the core instance for cleanup
                        this._context.core = appInsightsCore;
                        
                        // Explicitly set a tracestate value to ensure the header is included
                        _ensureTraceStateValue(appInsightsCore);

                        // Use test hook to simulate the correct url location
                        this._ajax["_currentWindowHost"] = "httpbin.org";

                        // Setup
                        let headers = new Headers();
                        headers.append('My-Header', 'Header field');
                        let init = {
                            method: 'get',
                            headers: headers
                        };
                        const url = 'https://httpbin.org/status/200';

                        // Act
                        Assert.ok(trackSpy.notCalled, "No fetch called yet");
                        fetch(url, init).then(() => {
                            try {
                                // Assert
                                Assert.ok(trackSpy.called, "The request was tracked");

                                Assert.equal(1, fetchCalls.length);
                                Assert.notEqual(undefined, fetchCalls[0].init, "Has init param");
                                
                                // Get headers - handle both Headers object and plain object cases
                                let fetchHeaders = fetchCalls[0].init.headers;
                                let hasHeader = (name: string) => {
                                    if (fetchHeaders instanceof Headers) {
                                        return fetchHeaders.has(name);
                                    } else if (typeof fetchHeaders === 'object') {
                                        return !!fetchHeaders[name];
                                    }
                                    return false;
                                };
                                
                                // Check all headers are present (tracestate included because there's a value)
                                Assert.equal(true, hasHeader(RequestHeaders.requestIdHeader), "AI header should be present");
                                Assert.equal(true, hasHeader(RequestHeaders.traceParentHeader), "W3c traceparent header should be present");
                                Assert.equal(true, hasHeader(RequestHeaders.traceStateHeader), "W3c tracestate header should be present");
                                
                                // Unload the core to clean up hooks
                                _safeUnloadCore(appInsightsCore);
                                
                                resolve();
                            } catch (e) {
                                // Unload the core to clean up hooks even on failure
                                _safeUnloadCore(appInsightsCore);
                                reject(e);
                            }
                        }).catch((err) => {
                            // Unload the core to clean up hooks even on failure
                            _safeUnloadCore(appInsightsCore);
                            reject(new Error("fetch failed! " + (err ? err.toString() : "")));
                        });
                    } catch (ex) {
                        reject(ex);
                    }
                });
            }
        });

        this.testCase({
            name: "W3CTraceStateDependency: Fetch with W3C_TRACE mode includes tracestate header when value present",
            test: () => {
                return createPromise<void>((resolve, reject) => {
                    try {
                        // Setup mock fetch using framework helper
                        const fetchCalls = this.hookFetch<Response>((resolveResponse) => {
                            setTimeout(() => {
                                resolveResponse({
                                    headers: new Headers(),
                                    ok: true,
                                    body: null,
                                    bodyUsed: false,
                                    redirected: false,
                                    status: 200,
                                    statusText: "Hello",
                                    trailer: null,
                                    type: "basic",
                                    url: "https://httpbin.org/status/200"
                                } as any);
                            }, 0);
                        });

                        // Create a fresh AjaxMonitor for each test
                        this._ajax = new AjaxMonitor();
                        let appInsightsCore = new AppInsightsCore();
                        let coreConfig = {
                            instrumentationKey: "instrumentationKey",
                            disableFetchTracking: false,
                            disableAjaxTracking: false,
                            extensions: [this._ajax], // This is critical - add as an extension
                            channels: [[new TestChannelPlugin()]],
                            extensionConfig: {
                                [this._ajax.identifier]: {
                                    distributedTracingMode: eDistributedTracingModes.W3C_TRACE
                                }
                            }
                        };

                        // Initialize the core with the proper plugins
                        appInsightsCore.initialize(coreConfig, []);
                        let trackSpy = this.sandbox.spy(appInsightsCore, "track");
                        
                        // Store the core instance for cleanup
                        this._context.core = appInsightsCore;
                        
                        // Explicitly set a tracestate value to ensure the header is included
                        _ensureTraceStateValue(appInsightsCore);

                        // Use test hook to simulate the correct url location
                        this._ajax["_currentWindowHost"] = "httpbin.org";

                        // Setup
                        let headers = new Headers();
                        headers.append('My-Header', 'Header field');
                        let init = {
                            method: 'get',
                            headers: headers
                        };
                        const url = 'https://httpbin.org/status/200';

                        // Act
                        Assert.ok(trackSpy.notCalled, "No fetch called yet");
                        fetch(url, init).then(() => {
                            try {
                                // Assert
                                Assert.ok(trackSpy.called, "The request was tracked");
                                Assert.equal(1, fetchCalls.length);
                                Assert.notEqual(undefined, fetchCalls[0].init, "Has init param");
                                
                                // Get headers - handle both Headers object and plain object cases
                                let fetchHeaders = fetchCalls[0].init.headers;
                                let hasHeader = (name: string) => {
                                    if (fetchHeaders instanceof Headers) {
                                        return fetchHeaders.has(name);
                                    } else if (typeof fetchHeaders === 'object') {
                                        return !!fetchHeaders[name];
                                    }
                                    return false;
                                };
                                
                                // Check W3C headers are present but not AI headers (tracestate included because there's a value)
                                Assert.equal(false, hasHeader(RequestHeaders.requestIdHeader), "AI header should not be present");
                                Assert.equal(true, hasHeader(RequestHeaders.traceParentHeader), "W3c traceparent header should be present");
                                Assert.equal(true, hasHeader(RequestHeaders.traceStateHeader), "W3c tracestate header should be present with value");
                                
                                // Unload the core to clean up hooks
                                _safeUnloadCore(appInsightsCore);
                                
                                resolve();
                            } catch (e) {
                                // Unload the core to clean up hooks even on failure
                                _safeUnloadCore(appInsightsCore);
                                reject(e);
                            }
                        }).catch((err) => {
                            // Unload the core to clean up hooks even on failure
                            _safeUnloadCore(appInsightsCore);
                            reject(new Error("fetch failed! " + (err ? err.toString() : "")));
                        });
                    } catch (ex) {
                        reject(ex);
                    }
                });
            }
        });

        this.testCase({
            name: "W3CTraceStateDependency: Fetch with W3C_TRACE mode but no tracestate value",
            test: () => {
                return createPromise<void>((resolve, reject) => {
                    try {
                        // Use the framework hookFetch helper
                        const fetchCalls = this.hookFetch<Response>((resolveResponse) => {
                            setTimeout(() => {
                                resolveResponse({
                                    headers: new Headers(),
                                    ok: true,
                                    body: null,
                                    bodyUsed: false,
                                    redirected: false,
                                    status: 200,
                                    statusText: "Hello",
                                    trailer: null,
                                    type: "basic",
                                    url: "https://httpbin.org/status/200"
                                } as any);
                            }, 0);
                        });

                        // Create a fresh AjaxMonitor for each test
                        this._ajax = new AjaxMonitor();
                        let appInsightsCore = new AppInsightsCore();
                        let coreConfig = {
                            instrumentationKey: "instrumentationKey",
                            disableFetchTracking: false,
                            disableAjaxTracking: false,
                            extensions: [this._ajax],
                            channels: [[new TestChannelPlugin()]],
                            extensionConfig: {
                                [this._ajax.identifier]: {
                                    // No appId here, so there should be no tracestate value
                                    distributedTracingMode: eDistributedTracingModes.W3C_TRACE
                                }
                            }
                        };
                        
                        // Store the core instance in context for cleanup
                        this._context.core = appInsightsCore;

                        // Initialize the core with the proper plugins
                        appInsightsCore.initialize(coreConfig, []);
                        let trackSpy = this.sandbox.spy(appInsightsCore, "track");

                        // Use test hook to simulate the correct url location
                        this._ajax["_currentWindowHost"] = "httpbin.org";

                        // Setup
                        let headers = new Headers();
                        headers.append('My-Header', 'Header field');
                        let init = {
                            method: 'get',
                            headers: headers
                        };
                        const url = 'https://httpbin.org/status/200';

                        // Act
                        Assert.ok(trackSpy.notCalled, "No fetch called yet");
                        fetch(url, init).then(() => {
                            try {
                                // Assert
                                Assert.ok(trackSpy.called, "The request was tracked");
                                Assert.equal(1, fetchCalls.length, "One fetch call made");
                                Assert.notEqual(undefined, fetchCalls[0].init, "Has init param");
                                
                                // Get headers - handle both Headers object and plain object cases
                                let fetchHeaders = fetchCalls[0].init.headers;
                                let hasHeader = (name: string) => {
                                    if (fetchHeaders instanceof Headers) {
                                        return fetchHeaders.has(name);
                                    } else if (typeof fetchHeaders === 'object') {
                                        return !!fetchHeaders[name];
                                    }
                                    return false;
                                };
                                
                                // Check traceparent is present but no AI and no tracestate (no value to send)
                                Assert.equal(false, hasHeader(RequestHeaders.requestIdHeader), "AI header should not be present");
                                Assert.equal(true, hasHeader(RequestHeaders.traceParentHeader), "W3c traceparent header should be present");
                                Assert.equal(false, hasHeader(RequestHeaders.traceStateHeader), "W3c tracestate header should not be present when no value");
                                
                                // Unload the core to clean up hooks
                                _safeUnloadCore(appInsightsCore);
                                
                                resolve();
                            } catch (e) {
                                // Unload the core to clean up hooks even on failure
                                _safeUnloadCore(appInsightsCore);
                                reject(e);
                            }
                        }).catch((err) => {
                            // Unload the core to clean up hooks even on failure
                            _safeUnloadCore(appInsightsCore);
                            reject(new Error("fetch failed! " + (err ? err.toString() : "")));
                        });
                    } catch (ex) {
                        reject(ex);
                    }
                });
            }
        });

        this.testCase({
            name: "W3CTraceStateDependency: Fetch with AI_AND_W3C mode does not include tracestate header",
            test: () => {
                return createPromise<void>((resolve, reject) => {
                    try {
                        // Setup mock fetch using framework helper
                        const fetchCalls = this.hookFetch<Response>((resolveResponse) => {
                            setTimeout(() => {
                                resolveResponse({
                                    headers: new Headers(),
                                    ok: true,
                                    body: null,
                                    bodyUsed: false,
                                    redirected: false,
                                    status: 200,
                                    statusText: "Hello",
                                    trailer: null,
                                    type: "basic",
                                    url: "https://httpbin.org/status/200"
                                } as any);
                            }, 0);
                        });

                        this._ajax = new AjaxMonitor();
                        let appInsightsCore = new AppInsightsCore();
                        let coreConfig = {
                            instrumentationKey: "instrumentationKey",
                            disableFetchTracking: false,
                            disableAjaxTracking: false,
                            extensions: [this._ajax],
                            channels: [[new TestChannelPlugin()]],
                            extensionConfig: {
                                [this._ajax.identifier]: {
                                    distributedTracingMode: eDistributedTracingModes.AI_AND_W3C // No tracestate bit
                                }
                            }
                        };
                        appInsightsCore.initialize(coreConfig, []);
                        let trackSpy = this.sandbox.spy(appInsightsCore, "track");

                        // Use test hook to simulate the correct url location
                        this._ajax["_currentWindowHost"] = "httpbin.org";

                        // Setup
                        let headers = new Headers();
                        headers.append('My-Header', 'Header field');
                        let init = {
                            method: 'get',
                            headers: headers
                        };
                        const url = 'https://httpbin.org/status/200';

                        // Act
                        Assert.ok(trackSpy.notCalled, "No fetch called yet");
                        fetch(url, init).then(() => {
                            try {
                                // Assert
                                Assert.ok(trackSpy.called, "The request was tracked");
                                Assert.equal(1, fetchCalls.length);
                                Assert.notEqual(undefined, fetchCalls[0].init, "Has init param");
                                
                                // Get headers - handle both Headers object and plain object cases
                                let fetchHeaders = fetchCalls[0].init.headers;
                                let hasHeader = (name: string) => {
                                    if (fetchHeaders instanceof Headers) {
                                        return fetchHeaders.has(name);
                                    } else if (typeof fetchHeaders === 'object') {
                                        return !!fetchHeaders[name];
                                    }
                                    return false;
                                };
                                
                                // Check that AI and traceparent headers are present but not tracestate
                                Assert.equal(true, hasHeader(RequestHeaders.requestIdHeader), "AI header should be present");
                                Assert.equal(true, hasHeader(RequestHeaders.traceParentHeader), "W3c traceparent header should be present");
                                Assert.equal(false, hasHeader(RequestHeaders.traceStateHeader), "W3c tracestate header should not be present");
                                
                                // Unload the core to clean up hooks
                                _safeUnloadCore(appInsightsCore);
                                
                                resolve();
                            } catch (e) {
                                // Unload the core to clean up hooks even on failure
                                _safeUnloadCore(appInsightsCore);
                                reject(e);
                            }
                        }).catch((err) => {
                            // Unload the core to clean up hooks even on failure
                            _safeUnloadCore(appInsightsCore);
                            reject(new Error("fetch failed! " + (err ? err.toString() : "")));
                        });
                    } catch (ex) {
                        reject(ex);
                    }
                });
            }
        });

        this.testCase({
            name: "W3CTraceStateDependency: Fetch with AI mode does not include W3C headers",
            test: () => {
                return createPromise<void>((resolve, reject) => {
                    try {
                        // Setup mock fetch using framework helper
                        const fetchCalls = this.hookFetch<Response>((resolveResponse) => {
                            setTimeout(() => {
                                resolveResponse({
                                    headers: new Headers(),
                                    ok: true,
                                    body: null,
                                    bodyUsed: false,
                                    redirected: false,
                                    status: 200,
                                    statusText: "Hello",
                                    trailer: null,
                                    type: "basic",
                                    url: "https://httpbin.org/status/200"
                                } as any);
                            }, 0);
                        });

                        this._ajax = new AjaxMonitor();
                        let appInsightsCore = new AppInsightsCore();
                        let coreConfig = {
                            instrumentationKey: "instrumentationKey",
                            disableFetchTracking: false,
                            disableAjaxTracking: false,
                            extensions: [this._ajax],
                            channels: [[new TestChannelPlugin()]],
                            extensionConfig: {
                                [this._ajax.identifier]: {
                                    distributedTracingMode: eDistributedTracingModes.AI // AI mode only
                                }
                            }
                        };
                        appInsightsCore.initialize(coreConfig, []);
                        let trackSpy = this.sandbox.spy(appInsightsCore, "track");

                        // Use test hook to simulate the correct url location
                        this._ajax["_currentWindowHost"] = "httpbin.org";

                        // Setup
                        let headers = new Headers();
                        headers.append('My-Header', 'Header field');
                        let init = {
                            method: 'get',
                            headers: headers
                        };
                        const url = 'https://httpbin.org/status/200';

                        // Act
                        Assert.ok(trackSpy.notCalled, "No fetch called yet");
                        fetch(url, init).then(() => {
                            try {
                                // Assert
                                Assert.ok(trackSpy.called, "The request was tracked");
                                Assert.equal(1, fetchCalls.length);
                                Assert.notEqual(undefined, fetchCalls[0].init, "Has init param");
                                
                                // Get headers - handle both Headers object and plain object cases
                                let fetchHeaders = fetchCalls[0].init.headers;
                                let hasHeader = (name: string) => {
                                    if (fetchHeaders instanceof Headers) {
                                        return fetchHeaders.has(name);
                                    } else if (typeof fetchHeaders === 'object') {
                                        return !!fetchHeaders[name];
                                    }
                                    return false;
                                };
                                
                                // Check that only AI header is present, no W3C headers
                                Assert.equal(true, hasHeader(RequestHeaders.requestIdHeader), "AI header should be present");
                                Assert.equal(false, hasHeader(RequestHeaders.traceParentHeader), "W3c traceparent header should not be present");
                                Assert.equal(false, hasHeader(RequestHeaders.traceStateHeader), "W3c tracestate header should not be present");
                                
                                // Unload the core to clean up hooks
                                _safeUnloadCore(appInsightsCore);
                                
                                resolve();
                            } catch (e) {
                                // Unload the core to clean up hooks even on failure
                                _safeUnloadCore(appInsightsCore);
                                reject(e);
                            }
                        }).catch((err) => {
                            // Unload the core to clean up hooks even on failure
                            _safeUnloadCore(appInsightsCore);
                            reject(new Error("fetch failed! " + (err ? err.toString() : "")));
                        });
                    } catch (ex) {
                        reject(ex);
                    }
                });
            }
        });

        // Additional XMLHttpRequest tests with value presence testing
        this.testCase({
            name: "W3CTraceStateDependency: tracestate header is only included when there's a value",
            test: () => {
                this._ajax = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = {
                    instrumentationKey: "instrumentationKey",
                    extensions: [this._ajax],
                    channels: [[new TestChannelPlugin()]],
                    extensionConfig: {
                        [this._ajax.identifier]: {
                            distributedTracingMode: eDistributedTracingModes.W3C_TRACE
                        }
                    }
                };
                
                appInsightsCore.initialize(coreConfig, []);
                
                // Store the core instance for cleanup
                this._context.core = appInsightsCore;
                
                // Explicitly set a tracestate value to ensure the header is included
                _ensureTraceStateValue(appInsightsCore);
                
                this._ajax["_currentWindowHost"] = "www.example.com";

                // Act - with manually set tracestate value, there should be a tracestate header
                var xhr = new XMLHttpRequest();
                var spy = this.sandbox.spy(xhr, "setRequestHeader");
                xhr.open("GET", "http://www.example.com");
                xhr.send();

                // Assert that W3C headers are sent, including tracestate (because there's a value)
                Assert.equal(false, spy.calledWith(RequestHeaders.requestIdHeader), "AI header should not be present");
                Assert.equal(true, spy.calledWith(RequestHeaders.traceParentHeader), "W3c traceparent header should be present");
                Assert.equal(true, spy.calledWith(RequestHeaders.traceStateHeader), "W3c tracestate header should be present with value");

                // Emulate response
                (xhr as any).respond(200, {"Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*"}, "");
                
                // Create a new monitor without tracestate value
                this._ajax.teardown();
                this._ajax = new AjaxMonitor();
                let coreConfig2 = {
                    instrumentationKey: "instrumentationKey",
                    extensions: [this._ajax],
                    channels: [[new TestChannelPlugin()]],
                    extensionConfig: {
                        [this._ajax.identifier]: {
                            // No tracestate value initially
                            distributedTracingMode: eDistributedTracingModes.W3C_TRACE
                        }
                    }
                };
                
                let appInsightsCore2 = new AppInsightsCore();
                appInsightsCore2.initialize(coreConfig2, [new TestChannelPlugin()]);
                this._ajax["_currentWindowHost"] = "www.example.com";
                
                // Act - without tracestate value, there should be no tracestate header
                var xhr2 = new XMLHttpRequest();
                var spy2 = this.sandbox.spy(xhr2, "setRequestHeader");
                xhr2.open("GET", "http://www.example.com");
                xhr2.send();
                
                // Assert that even with W3C_TRACE mode, tracestate is not sent (no value to send)
                Assert.equal(false, spy2.calledWith(RequestHeaders.requestIdHeader), "AI header should not be present");
                Assert.equal(true, spy2.calledWith(RequestHeaders.traceParentHeader), "W3c traceparent header should be present");
                Assert.equal(false, spy2.calledWith(RequestHeaders.traceStateHeader), "W3c tracestate header should not be present when no value");
                
                // Emulate response
                (xhr2 as any).respond(200, {"Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*"}, "");
                
                // Unload both core instances to clean up hooks
                _safeUnloadCore(appInsightsCore);
                _safeUnloadCore(appInsightsCore2);
            }
        });

        this.testCase({
            name: "W3CTraceStateDependency: AI_AND_W3C_TRACE mode without tracestate value",
            test: () => {
                this._ajax = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = {
                    instrumentationKey: "instrumentationKey",
                    extensions: [this._ajax],
                    channels: [[new TestChannelPlugin()]],
                    extensionConfig: {
                        [this._ajax.identifier]: {
                            // No tracestate value initially
                            distributedTracingMode: eDistributedTracingModes.AI_AND_W3C_TRACE
                        }
                    }
                };
                appInsightsCore.initialize(coreConfig, []);
                
                // Store the core instance for cleanup
                this._context.core = appInsightsCore;
                
                this._ajax["_currentWindowHost"] = "www.example.com";

                // Act - test initially without any tracestate value
                var xhr = new XMLHttpRequest();
                var spy = this.sandbox.spy(xhr, "setRequestHeader");
                xhr.open("GET", "http://www.example.com");
                xhr.send();

                // Assert that AI and traceparent headers are sent, but not tracestate (no value to send)
                Assert.equal(true, spy.calledWith(RequestHeaders.requestIdHeader), "AI header should be present");
                Assert.equal(true, spy.calledWith(RequestHeaders.traceParentHeader), "W3c traceparent header should be present");
                Assert.equal(false, spy.calledWith(RequestHeaders.traceStateHeader), "W3c tracestate header should not be present without value");

                // Emulate response
                (xhr as any).respond(200, {"Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*"}, "");
                
                // Manually add a tracestate value, which should cause the header to be included
                const traceCtx = appInsightsCore.getTraceCtx();
                if (traceCtx && traceCtx.traceState) {
                    traceCtx.traceState.set("test", "value");
                }
                
                // Act - now with a manually added tracestate value
                var xhr2 = new XMLHttpRequest();
                var spy2 = this.sandbox.spy(xhr2, "setRequestHeader");
                xhr2.open("GET", "http://www.example.com");
                xhr2.send();
                
                // Assert that all headers are sent (tracestate included because we manually added a value)
                Assert.equal(true, spy2.calledWith(RequestHeaders.requestIdHeader), "AI header should be present");
                Assert.equal(true, spy2.calledWith(RequestHeaders.traceParentHeader), "W3c traceparent header should be present");
                Assert.equal(true, spy2.calledWith(RequestHeaders.traceStateHeader), "W3c tracestate header should be present with manual value");
                
                // Emulate response so perf monitoring is cleaned up
                (xhr2 as any).respond(200, {"Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*"}, "");
                
                // Unload the core to clean up hooks
                _safeUnloadCore(appInsightsCore);
            }
        });
    }
}
