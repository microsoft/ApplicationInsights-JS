/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../JavaScriptSDK/util.ts" />

class UtilTests extends TestClass {

    public registerTests() {
        var Util = Microsoft.ApplicationInsights.Util;
        
        this.testCase({
            name: "UtilTests: getStorage with available storage",
            test: () => {
                var storage = this.getMockStorage();
                var getStorageObjectStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "_getLocalStorageObject",() => storage);

                storage["test"] = "A";

                Assert.equal("A", Util.getStorage("test"), "getStorage should return value of getItem for known keys");
                Assert.equal(undefined, Util.getStorage("another"), "getStorage should return value of getItem for unknown keys");

                
            }
        });

        this.testCase({
            name: "UtilTests: getStorage with no storage support",
            test: () => {
                var storage = undefined;
                var getStorageObjectStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "_getLocalStorageObject",() => storage);

                Assert.equal(null, Util.getStorage("test"), "getStorage should return null when storage is unavailable");

                
            }
        });

        this.testCase({
            name: "UtilTests: setStorage with available storage",
            test: () => {
                var storage = this.getMockStorage();
                var getStorageObjectStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "_getLocalStorageObject",() => storage);

                Assert.ok(Util.setStorage("test","A"), "setStorage should return true if storage is available for writes");

                
            }
        });

        this.testCase({
            name: "UtilTests: setStorage with no storage support",
            test: () => {
                var storage = undefined;
                var getStorageObjectStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "_getLocalStorageObject",() => storage);

                Assert.ok(!Util.setStorage("test", "A"), "setStorage should return false if storage is unavailable for writes");

                
            }
        });

        this.testCase({
            name: "UtilTests: removeStorage with available storage",
            test: () => {
                var storage = this.getMockStorage();
                var getStorageObjectStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "_getLocalStorageObject",() => storage);

                storage["test"] = "A";

                Assert.ok(Util.removeStorage("test"), "removeStorage should return true if storage is available for writes");
                Assert.deepEqual(undefined, storage["test"], "removeStorage should remove items from storage");

                
            }
        });

        this.testCase({
            name: "UtilTests: removeStorage with no storage support",
            test: () => {
                var storage = undefined;
                var getStorageObjectStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "_getLocalStorageObject",() => storage);

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
                    document.__defineGetter__('cookie',() => {
                        var output = [];
                        for (var cookieName in cookies) {
                            output.push(cookieName + "=" + cookies[cookieName]);
                        }
                        return output.join(";");
                    });
                    document.__defineSetter__('cookie',(s) => {
                        var indexOfSeparator = s.indexOf("=");
                        var key = s.substr(0, indexOfSeparator);
                        var value = s.substring(indexOfSeparator + 1);
                        cookies[key] = value;
                        return key + "=" + value;
                    });
                    document.clearCookies = () => {
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
                test(10, "00:00:00.010", "milliseconds digit 2");
                test(100, "00:00:00.100", "milliseconds digit 3");
                test(1 * 1000, "00:00:01.000", "seconds digit 1");
                test(10 * 1000, "00:00:10.000", "seconds digit 2");
                test(1 * 60 * 1000, "00:01:00.000", "minutes digit 1");
                test(10 * 60 * 1000, "00:10:00.000", "minutes digit 2");
                test(1 * 60 * 60 * 1000, "01:00:00.000", "hours digit 1");
                test(10 * 60 * 60 * 1000, "10:00:00.000", "hours digit 2");
                test(24 * 60 * 60 * 1000, "00:00:00.000", "hours overflow");
                test(11 * 3600000 + 11 * 60000 + 11111, "11:11:11.111", "all digits");

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
                var callback = function(e) {
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