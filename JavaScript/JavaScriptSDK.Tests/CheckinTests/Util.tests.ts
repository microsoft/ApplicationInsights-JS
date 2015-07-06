/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../JavaScriptSDK/util.ts" />

class UtilTests extends TestClass {

    public registerTests() {

        this.testCase({
            name: "UtilTests: isArray",
            test: () => {
                var isArray = Microsoft.ApplicationInsights.Util["isArray"];
                Assert.ok(isArray([]));
                Assert.ok(!isArray("sdf"));
                Assert.ok(isArray([0, 1]));
                Assert.ok(!isArray({ length: "" }));
                Assert.ok(!isArray({ length: 10 }));

                // arr instanceof Array; // false for this case
                var iframe = document.createElement('iframe');
                iframe.style.cssText = 'display:none;';
                document.body.appendChild(iframe);
                var iframeArray = window.frames[window.frames.length - 1].Array;
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
                Microsoft.ApplicationInsights.Util.setCookie("test", expectedValue);

                var ua = navigator.userAgent.toLowerCase();
                var isSafari = ua.indexOf('safari') > -1 && ua.indexOf('chrome') < 0;
                if (isSafari) {
                    Assert.ok("Safari doesn't allow mocking cookies");
                } else {
                    var actualValue = Microsoft.ApplicationInsights.Util.getCookie("test");
                    Assert.equal(expectedValue, actualValue, "cookie content was set and retrieved");

                    actualValue = Microsoft.ApplicationInsights.Util.getCookie("");
                    Assert.equal("", actualValue, "cookie content was set and retrieved");
                }
            }
        });

        this.testCase({
            name: "UtilTests: parse cookie",
            test: () => {
                var test = (cookie, query, expected) => {
                    Microsoft.ApplicationInsights.Util["document"] = <any>{
                        cookie: cookie
                    };

                    var actual = Microsoft.ApplicationInsights.Util.getCookie(query);
                    Assert.deepEqual(expected, actual, "cookie is parsed correctly");
                }

                test("testCookie=id|acq|renewal", "testCookie", "id|acq|renewal");
                test("other=foo; testCookie=id|acq|renewal", "testCookie", "id|acq|renewal");
                test("another=bar; ;a=testCookie=; testCookie=id|acq|renewal; other=foo|3|testCookie=", "testCookie", "id|acq|renewal");
                test("xtestCookiex=id|acq|renewal", "testCookie", "");
                test("", "testCookie", "");
            }
        });

        this.testCase({
            name: "UtilTests: new GUID",
            test: () => {
                sinon.stub(Math, "random",() => 0);
                var expected = "00000000-0000-4000-8000-000000000000";
                var actual = Microsoft.ApplicationInsights.Util.newGuid();
                Assert.equal(expected, actual, "expected guid was generated");
            }
        });

        this.testCase({
            name: "UtilTests: toISO string for IE8",
            test: () => {
                var test = () => {
                    var date = new Date();
                    var output = Microsoft.ApplicationInsights.Util.toISOStringForIE8(date);
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
                    var actual = Microsoft.ApplicationInsights.Util.msToTimeSpan(input);
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
                Assert.ok(Microsoft.ApplicationInsights.Util.stringToBoolOrDefault(undefined) === false);
                Assert.ok(Microsoft.ApplicationInsights.Util.stringToBoolOrDefault(null) === false);
                Assert.ok(Microsoft.ApplicationInsights.Util.stringToBoolOrDefault("") === false);
                Assert.ok(Microsoft.ApplicationInsights.Util.stringToBoolOrDefault("asdf") === false);
                Assert.ok(Microsoft.ApplicationInsights.Util.stringToBoolOrDefault(0) === false);
                Assert.ok(Microsoft.ApplicationInsights.Util.stringToBoolOrDefault({ asfd: "sdf" }) === false);
                Assert.ok(Microsoft.ApplicationInsights.Util.stringToBoolOrDefault(new Object()) === false);

                Assert.ok(Microsoft.ApplicationInsights.Util.stringToBoolOrDefault("true") === true);
                Assert.ok(Microsoft.ApplicationInsights.Util.stringToBoolOrDefault("TrUe") === true);
            }
        });

        this.testCase({
            name: "UtilTests: isCrossOriginError",
            test: () => {
                Assert.ok(Microsoft.ApplicationInsights.Util.isCrossOriginError("Script error.", "", 0, 0, null) === true);

                Assert.ok(Microsoft.ApplicationInsights.Util.isCrossOriginError("Script error.", "http://microsoft.com", 0, 0, null)
                    === false);
            }
        });

        this.testCase({
            name: "Util.dump returns string that includes information about object type",
            test: () => {
                var object: any = new Error();

                var result: string = Microsoft.ApplicationInsights.Util.dump(object);

                var toStringRepresentation = Object.prototype.toString.call(object);
                Assert.notEqual(-1, result.indexOf(toStringRepresentation));
            }
        });

        this.testCase({
            name: "Util.dump returns string that includes information about object property values",
            test: () => {
                var object: any = { "property": "value" };

                var result: string = Microsoft.ApplicationInsights.Util.dump(object);

                var jsonRepresentation: string = JSON.stringify(object);
                Assert.notEqual(-1, result.indexOf(jsonRepresentation));
            }
        });

        this.testCase({
            name: "Util.isBrowserIE should correctly detect IE family browsers",
            test: () => {
                var ie11 = "Mozilla/5.0 (Windows NT 6.3; WOW64; Trident/7.0; .NET4.0E; .NET4.0C; .NET CLR 3.5.30729; .NET CLR 2.0.50727; .NET CLR 3.0.30729; InfoPath.3; rv:11.0) like Gecko";
                var ie10 = "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)";
                var ie9 = "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 7.1; Trident/5.0)";

                Assert.ok(Microsoft.ApplicationInsights.Util.isBrowserIE(ie11), "Browser was IE but the method failed to detect it");
                Assert.ok(Microsoft.ApplicationInsights.Util.isBrowserIE(ie10), "Browser was IE but the method failed to detect it");
                Assert.ok(Microsoft.ApplicationInsights.Util.isBrowserIE(ie9), "Browser was IE but the method failed to detect it");
            }
        });

        this.testCase({
            name: "Util.isBrowserIE should correctly detect if the browser is not from the IE family",
            test: () => {
                var chrome = "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36";
                var firefox = "Mozilla/5.0 (Windows NT 6.3; WOW64; rv:39.0) Gecko/20100101 Firefox/39.0";
                var safari = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A";
                var opera = "Opera/9.80 (X11; Linux i686; Ubuntu/14.10) Presto/2.12.388 Version/12.16";

                Assert.equal(false, Microsoft.ApplicationInsights.Util.isBrowserIE(chrome));
                Assert.equal(false, Microsoft.ApplicationInsights.Util.isBrowserIE(firefox));
                Assert.equal(false, Microsoft.ApplicationInsights.Util.isBrowserIE(safari));
                Assert.equal(false, Microsoft.ApplicationInsights.Util.isBrowserIE(opera));
            }
        });
    }
}
new UtilTests().registerTests(); 