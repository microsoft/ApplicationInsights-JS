/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/Util.ts" />

class UtilTests extends TestClass {

    public testCleanup() {

        // reset storage cache
        (<any>Microsoft.ApplicationInsights.Util)._canUseLocalStorage = undefined;
        (<any>Microsoft.ApplicationInsights.Util)._canUseSessionStorage = undefined;
    }

    public registerTests() {
        var Util = Microsoft.ApplicationInsights.Util;
        var UrlHelper = Microsoft.ApplicationInsights.UrlHelper;

        this.testCase({
            name: "UtilTests: getStorage with available storage",
            test: () => {
                var storage = this.getMockStorage();
                var getStorageObjectStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "_getLocalStorageObject", () => storage);

                storage["test"] = "A";

                Assert.equal("A", Util.getStorage("test"), "getStorage should return value of getItem for known keys");
                Assert.equal(undefined, Util.getStorage("another"), "getStorage should return value of getItem for unknown keys");
            }
        });

        this.testCase({
            name: "UtilTests: getStorage with no storage support",
            test: () => {
                var storage = undefined;
                var getStorageObjectStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "_getLocalStorageObject", () => storage);

                Assert.equal(null, Util.getStorage("test"), "getStorage should return null when storage is unavailable");
            }
        });

        this.testCase({
            name: "UtilTests: can disable local and session storage",
            test: () => {
                // can use local and session storage by default
                Assert.ok(Util.canUseLocalStorage(), "can use local storage by default");
                Assert.ok(Util.canUseSessionStorage(), "can use session storage by default");

                Util.setStorage("key1", "value1");
                Util.setSessionStorage("key2", "value2");

                Assert.equal("value1", Util.getStorage("key1"), "can rad from local storage with it is enabled");
                Assert.equal("value2", Util.getSessionStorage("key2"), "can rad from session storage with it is enabled");

                // disable storages
                Util.disableStorage();

                // can't read
                Assert.ok(!Util.canUseLocalStorage(), "can use local storage after it was disabled");
                Assert.ok(!Util.canUseSessionStorage(), "can use session storage after it was disabled");

                Assert.equal(null, Util.getStorage("key1"), "can't read from local storage when disabled");
                Assert.equal(null, Util.getSessionStorage("key2"), "can't read from session storage when disabled");
            }
        });

        this.testCase({
            name: "UtilTests: setStorage with available storage",
            test: () => {
                var storage = this.getMockStorage();
                var getStorageObjectStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "_getLocalStorageObject", () => storage);

                Assert.ok(Util.setStorage("test", "A"), "setStorage should return true if storage is available for writes");


            }
        });

        this.testCase({
            name: "UtilTests: setStorage with no storage support",
            test: () => {
                var storage = undefined;
                var getStorageObjectStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "_getLocalStorageObject", () => storage);

                Assert.ok(!Util.setStorage("test", "A"), "setStorage should return false if storage is unavailable for writes");


            }
        });

        this.testCase({
            name: "UtilTests: removeStorage with available storage",
            test: () => {
                var storage = this.getMockStorage();
                var getStorageObjectStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "_getLocalStorageObject", () => storage);

                storage["test"] = "A";

                Assert.ok(Util.removeStorage("test"), "removeStorage should return true if storage is available for writes");
                Assert.deepEqual(undefined, storage["test"], "removeStorage should remove items from storage");


            }
        });

        this.testCase({
            name: "UtilTests: removeStorage with no storage support",
            test: () => {
                var storage = undefined;
                var getStorageObjectStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "_getLocalStorageObject", () => storage);

                Assert.ok(!Util.removeStorage("test"), "removeStorage should return false if storage is unavailable for writes");


            }
        });

        this.testCase({
            name: "UtilTests: isArray",
            test: () => {
                var isArray = Util["isArray"];
                Assert.ok(isArray([]));
                Assert.ok(!isArray("sdf"));
                Assert.ok(isArray([0, 1]));
                Assert.ok(!isArray({ length: "" }));
                Assert.ok(!isArray({ length: 10 }));

                // arr instanceof Array; // false for this case
                var iframe = document.createElement('iframe');
                iframe.style.cssText = 'display:none;';
                document.body.appendChild(iframe);
                var iframeArray = window.frames[window.frames.length - 1]["Array"];
                if (typeof iframeArray === "function") {
                    var arr = new iframeArray(1, 2, 3); // [1,2,3]
                    Assert.ok(!(arr instanceof Array), "instanceof doesn't work here");
                    Assert.ok(isArray(arr));
                }
            }
        });

        this.testCase({
            name: "UtilTests: cookies",
            test: () => {
                // mock cookies
                ((document) => {
                    var cookies = {};
                    (<any>document).__defineGetter__('cookie', () => {
                        var output = [];
                        for (var cookieName in cookies) {
                            output.push(cookieName + "=" + cookies[cookieName]);
                        }
                        return output.join(";");
                    });
                    (<any>document).__defineSetter__('cookie', (s) => {
                        var indexOfSeparator = s.indexOf("=");
                        var key = s.substr(0, indexOfSeparator);
                        var value = s.substring(indexOfSeparator + 1);
                        cookies[key] = value;
                        return key + "=" + value;
                    });
                    (<any>document).clearCookies = () => {
                        cookies = {};
                    };
                })(document);

                var expectedValue = "testValue";
                Util.setCookie("test", expectedValue);

                var ua = navigator.userAgent.toLowerCase();
                var isSafari = ua.indexOf('safari') > -1 && ua.indexOf('chrome') < 0;
                if (isSafari) {
                    Assert.ok("Safari doesn't allow mocking cookies");
                } else {
                    var actualValue = Util.getCookie("test");
                    Assert.equal(expectedValue, actualValue, "cookie content was set and retrieved");

                    actualValue = Util.getCookie("");
                    Assert.equal("", actualValue, "cookie content was set and retrieved");
                }
            }
        });

        this.testCase({
            name: "UtilTests: can disable cookies",
            test: () => {
                Assert.ok(Util.canUseCookies(), "can use cookies by default");
                Util.disableCookies();
                Assert.ok(!Util.canUseCookies(), "cannot use cookies after they were disabled");

                // reset
                (<any>Util)._canUseCookies = undefined;
            }
        });

        this.testCase({
            name: "UtilTests: parse cookie",
            test: () => {
                try {
                    var test = (cookie, query, expected) => {
                        Util["document"] = <any>{
                            cookie: cookie
                        };

                        var actual = Util.getCookie(query);
                        Assert.deepEqual(expected, actual, "cookie is parsed correctly");
                    }

                    test("testCookie=id|acq|renewal", "testCookie", "id|acq|renewal");
                    test("other=something; testCookie=id|acq|renewal", "testCookie", "id|acq|renewal");
                    test("another=bar; ;a=testCookie=; testCookie=id|acq|renewal; other=something|3|testCookie=", "testCookie", "id|acq|renewal");
                    test("xtestCookiex=id|acq|renewal", "testCookie", "");
                    test("", "testCookie", "");
                } finally {
                    Util["document"] = document;
                }
            }
        });

        this.testCase({
            name: "UtilTests: canUseCookies returns false if document.cookie is not available",
            test: () => {
                var oldDocument = Util["document"];
                (<any>Util)._canUseCookies = undefined;

                Util["document"] = <any>{
                    cookie: undefined
                };

                Assert.equal(false, Util.canUseCookies(), "cookie are not available");

                // restore document object
                Util["document"] = oldDocument;
                (<any>Util)._canUseCookies = undefined;
            }
        });

        this.testCase({
            name: "UtilTests: cannot set/get/delete cookies if document.cookie is not available",
            test: () => {
                var oldDocument = Util["document"];
                (<any>Util)._canUseCookies = undefined;

                Util["document"] = <any>{
                    cookie: undefined
                };

                var name = "test";
                Util.setCookie(name, "value");
                Assert.equal(undefined, Util.getCookie(name), "cookies are not supported");

                Util.deleteCookie(name);

                Assert.equal(undefined, Util.getCookie(name), "cookies are not supported");

                // restore document object
                Util["document"] = oldDocument;
                (<any>Util)._canUseCookies = undefined;

            }
        });

        this.testCase({
            name: "UtilTests: new GUID",
            test: () => {
                var results = [];
                for (var i = 0; i < 100; i++) {
                    var newId = Util.newId();
                    for (var j = 0; j < results.length; j++) {
                        Assert.notEqual(newId, results[j]);
                    }
                    results.push(newId);
                }
            }
        });

        this.testCase({
            name: "UtilTests: toISO string for IE8",
            test: () => {
                var test = () => {
                    var date = new Date();
                    var output = Util.toISOStringForIE8(date);
                    var regex = new RegExp("[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z");
                    Assert.ok(regex.test(output), "expected format was emitted");

                    try {
                        var expected = new Date().toISOString();
                        Assert.equal(expected, output, "format matches default in non-IE8");
                    } catch (e) {
                        Assert.ok(true, "IE8");
                    }
                };

                test();

                var toISOString = Date.prototype.toISOString;
                Date.prototype.toISOString = undefined;
                test();
                Date.prototype.toISOString = toISOString;
            }
        });

        this.testCase({
            name: "UtilTests: msToTimeSpan",
            test: () => {
                var test = (input, expected, message) => {
                    var actual = Util.msToTimeSpan(input);
                    Assert.equal(expected, actual, message);
                }

                test(0, "00:00:00.000", "zero");
                test(1, "00:00:00.001", "milliseconds digit 1");
                test(8.7, "00:00:00.009", "milliseconds digit 1 with high precision");
                test(10, "00:00:00.010", "milliseconds digit 2");
                test(99.99, "00:00:00.100", "milliseconds digit 2 with high precision");
                test(100, "00:00:00.100", "milliseconds digit 3");
                test(456.123, "00:00:00.456", "milliseconds digit 3 with high precision");
                test(999.6789, "00:00:01.000", "milliseconds digit 3 with high precision, rounded to full a second");
                test(1 * 1000, "00:00:01.000", "seconds digit 1");
                test(10 * 1000, "00:00:10.000", "seconds digit 2");
                test(1 * 60 * 1000, "00:01:00.000", "minutes digit 1");
                test(10 * 60 * 1000, "00:10:00.000", "minutes digit 2");
                test(1 * 60 * 60 * 1000, "01:00:00.000", "hours digit 1");
                test(10 * 60 * 60 * 1000, "10:00:00.000", "hours digit 2");
                test(24 * 60 * 60 * 1000, "1.00:00:00.000", "a full day")
                test(10 * 24 * 60 * 60 * 1000 + 123.444, "10.00:00:00.123", "ten days and 123ms")
                test(11 * 3600000 + 11 * 60000 + 11111, "11:11:11.111", "all digits");
                test(11 * 3600000 + 11 * 60000 + 11111 + 0.33333, "11:11:11.111", "all digits with high precision");
                test(7 * 3600000 + 59 * 60000 + 59999 + 0.999, "08:00:00.000", "all digits with high precision, rounded to a full hour");
                test(23 * 3600000 + 59 * 60000 + 59999 + 0.556, "1.00:00:00.000", "all digits with high precision, rounded to a full day");

                test("", "00:00:00.000", "invalid input");
                test("'", "00:00:00.000", "invalid input");
                test(NaN, "00:00:00.000", "invalid input");
                test({}, "00:00:00.000", "invalid input");
                test([], "00:00:00.000", "invalid input");
                test(-1, "00:00:00.000", "invalid input");
            }
        });

        this.testCase({
            name: "Tests stringToBoolOrDefault() returns true only for 'true' string (ignoring case)",
            test: () => {
                Assert.ok(Util.stringToBoolOrDefault(undefined) === false);
                Assert.ok(Util.stringToBoolOrDefault(null) === false);
                Assert.ok(Util.stringToBoolOrDefault("") === false);
                Assert.ok(Util.stringToBoolOrDefault("asdf") === false);
                Assert.ok(Util.stringToBoolOrDefault(0) === false);
                Assert.ok(Util.stringToBoolOrDefault({ asfd: "sdf" }) === false);
                Assert.ok(Util.stringToBoolOrDefault(new Object()) === false);

                Assert.ok(Util.stringToBoolOrDefault("true") === true);
                Assert.ok(Util.stringToBoolOrDefault("TrUe") === true);
            }
        });

        this.testCase({
            name: "UtilTests: isCrossOriginError",
            test: () => {
                Assert.ok(Util.isCrossOriginError("Script error.", "", 0, 0, null) === true);

                Assert.ok(Util.isCrossOriginError("Script error.", "http://microsoft.com", 0, 0, null)
                    === true);
            }
        });

        this.testCase({
            name: "Util.dump returns string that includes information about object type",
            test: () => {
                var object: any = new Error();

                var result: string = Util.dump(object);

                var toStringRepresentation = Object.prototype.toString.call(object);
                Assert.notEqual(-1, result.indexOf(toStringRepresentation));
            }
        });

        this.testCase({
            name: "Util.dump returns string that includes information about object property values",
            test: () => {
                var object: any = { "property": "value" };

                var result: string = Util.dump(object);

                var jsonRepresentation: string = JSON.stringify(object);
                Assert.notEqual(-1, result.indexOf(jsonRepresentation));
            }
        });

        this.testCase({
            name: "Util.addEventHandler should attach the callback for the given event name",
            test: () => {
                // Assemble
                var eventName = 'goat';
                var customEvent = document.createEvent('Event');
                customEvent.initEvent(eventName, true, true);

                var isCallbackExecuted = false;
                var callback = function (e) {
                    isCallbackExecuted = true;
                };

                // Act
                var returnValue = Util.addEventHandler(eventName, callback);
                document.dispatchEvent(customEvent);

                // Assert
                Assert.ok(returnValue, 'Event handler was not attached.');
                Assert.ok(isCallbackExecuted, 'Callback was not executed');
            }
        });

        this.testCase({
            name: "Util.addEventHandler should handle illegal event name",
            test: () => {
                // Assemble
                var eventName = undefined;
                var customEvent = document.createEvent('Event');
                customEvent.initEvent(eventName, true, true);

                var isCallbackExecuted = false;
                var callback = function (e) {
                    isCallbackExecuted = true;
                };

                // Act
                var returnValue = Util.addEventHandler(eventName, callback);
                document.dispatchEvent(customEvent);

                // Assert
                Assert.equal(false, returnValue, 'Event handler was attached for illegal event name');
                Assert.equal(false, isCallbackExecuted, 'Callback was executed when it was not supposed to.');
            }
        });

        this.testCase({
            name: "Util.addEventHandler should handle illegal callback",
            test: () => {
                // Assemble
                var eventName = 'goat';
                var customEvent = document.createEvent('Event');
                customEvent.initEvent(eventName, true, true);

                var isCallbackExecuted = false;
                var callback = undefined;

                // Act
                var returnValue = Util.addEventHandler(eventName, callback);
                document.dispatchEvent(customEvent);

                // Assert
                Assert.equal(false, returnValue, 'Event handler was attached for illegal callback');
            }
        });

        this.testCase({
            name: "getIE function should return null for non-IE user agent string and IE version for IE",
            test: () => {

                // Assert
                Assert.equal(null, Util.getIEVersion("Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36"), "Should return null for non-IE");
                Assert.equal(8, Util.getIEVersion("Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 10.0; Win64; x64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729"), "Should return IE version for IE browser");
            }
        });

        this.testCase({
            name: "isInternalApplicationInsightsEndpoint function handles endpoints correctly",
            test: () => {

                // Assert
                Assert.equal(true, Util.isInternalApplicationInsightsEndpoint("https://dc.services.visualstudio.com/v2/track"));
                Assert.equal(true, Util.isInternalApplicationInsightsEndpoint("https://DC.services.VisualStudio.com/v2/track"));
                Assert.equal(true, Util.isInternalApplicationInsightsEndpoint("https://breeze.aimon.applicationinsights.io/v2/track"));
                Assert.equal(true, Util.isInternalApplicationInsightsEndpoint("https://dc-int.services.visualstudio.com/v2/track"));
                Assert.equal(false, Util.isInternalApplicationInsightsEndpoint("https://somethingelse.com/v2/track"));
            }
        });

        this.testCase({
            name: "UrlHelper: parseUrl should contain host field even if document.createElement is not defined",
            test: () => {
                var origCreateElement = document.createElement;
                document.createElement = null;

                 let passed;
                let match;
                try {
                    const host = UrlHelper.parseUrl("https://portal.azure.com/some/endpoint").host.toLowerCase();
                    passed = true;
                    match = host === "portal.azure.com";
                } catch (e) {
                    passed = false;
                }

                 // Need to reset createElement before doing any assertions, else qunit crashes
                document.createElement = origCreateElement;
                Assert.ok(passed);
                Assert.ok(match, "host should be portal.azure.com");
            }
        });

         this.testCase({
            name: "UrlHelper: parseHost should return correct host name",
            test: () => {
                Assert.equal("portal.azure.com", UrlHelper.parseHost("https://portal.azure.com/some/endpoint"));
                Assert.equal("bing.com", UrlHelper.parseHost("http://www.bing.com"));
                Assert.equal("bing.com", UrlHelper.parseHost("https://www2.bing.com/"));
                Assert.equal("p.r.e.f.i.x.bing.com", UrlHelper.parseHost("http://wwW2.p.r.e.f.i.x.bing.com/"));
            }
        });
    }

    private getMockStorage() {
        var storage = <any>{};
        storage.getItem = (name) => storage[name];
        storage.setItem = (name, value) => (storage[name] = value);
        storage.removeItem = (name, value) => (storage[name] = undefined);
        return storage;
    }
}
new UtilTests().registerTests();