/// <reference path="../../TestFramework/Common.ts" />
/// <reference path="../../../JavaScriptSDK/Telemetry/Common/DataSanitizer.ts" />
/// <reference path="../../../JavaScriptSDK/Util.ts"/>

class DataSanitizerTests extends TestClass {

    private origMaxNameLength: number;
    private origMaxStringLength: number;
    private origMaxUrlLength: number;
    private origMaxMessageLength: number;
    private origMaxExceptionLength: number;

    public testInitialize() {
        this.origMaxNameLength = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_NAME_LENGTH"];
        this.origMaxStringLength = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_STRING_LENGTH"];
        this.origMaxUrlLength = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_URL_LENGTH"];
        this.origMaxMessageLength = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_MESSAGE_LENGTH"];
        this.origMaxExceptionLength = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_EXCEPTION_LENGTH"];
    }

    public testCleanup() {
        Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_NAME_LENGTH"] = this.origMaxNameLength;
        Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_STRING_LENGTH"] = this.origMaxStringLength;
        Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_URL_LENGTH"] = this.origMaxUrlLength;
        Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_MESSAGE_LENGTH"] = this.origMaxMessageLength;
        Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_EXCEPTION_LENGTH"] = this.origMaxExceptionLength;
    }   

    public registerTests() {
        this.testCase({
            name: "DataSanitizerTests: Validate key with leading and trailing spaces is trimmed",
            test: () => {
                var expectedName = "Hello World";
                var name = "    \t\r\n" + expectedName + "\r\n\t     ";

                var validatedName = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeKey(name);
                Assert.equal(expectedName, validatedName);
            }
        });

        this.testCase({
            name: "DataSanitizerTests: Validate key is truncated after max length",
            test: () => {
                Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_NAME_LENGTH"] = 5;
                var expectedName = "Hello";
                var name = "HelloWorld";

                var validatedName = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeKey(name);
                Assert.equal(expectedName, validatedName);
            }
        }); 

        this.testCase({
            name: "DataSanitizerTests: Validate string is truncated after max length ",
            test: () => {
                Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_STRING_LENGTH"] = 5;
                var expectedValue = "Hello";
                var value = "HelloWorld";

                var validatedValue = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeString(value);
                Assert.equal(expectedValue, validatedValue);
            }
        });

        this.testCase({
            name: "DataSanitizerTests: Validate object.toString is truncated if object passed to sanitizeString",
            test: () => {
                Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_STRING_LENGTH"] = 5;
                var expectedValue = "[obje";
                var value = { greeting: "Hello", place: "World" };

                var validatedValue = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeString(value);
                Assert.equal(expectedValue, validatedValue);
            }
        });

        this.testCase({
            name: "DataSanitizerTests: Validate url is truncated after max length ",
            test: () => {
                Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_URL_LENGTH"] = 5;
                var expectedUrl = "Hello";
                var url = "HelloWorld";

                var validatedUrl = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeUrl(url);
                Assert.equal(expectedUrl, validatedUrl);
            }
        });

        this.testCase({
            name: "DataSanitizerTests: Validate message is truncated after max length ",
            test: () => {
                Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_MESSAGE_LENGTH"] = 5;
                var expectedMessage = "Hello";
                var message = "HelloWorld";

                var validatedMessage = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeMessage(message);
                Assert.equal(expectedMessage, validatedMessage);
            }
        });

        this.testCase({
            name: "DataSanitizerTests: Validate exception is truncated after max length ",
            test: () => {
                Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_EXCEPTION_LENGTH"] = 5;
                var expectedException = "Hello";
                var exception = "HelloWorld";

                var validatedException = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeException(exception);
                Assert.equal(expectedException, validatedException);
            }
        });

        this.testCase({
            name: "DataSanitizerTests: Validate measurement map is truncated after max length and maintains uniqueness",
            test: () => {
                Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_NAME_LENGTH"] = 5;
                var map = {
                    "hello1": 1,
                    "hello2": 2,
                    "hello3": 3,
                    "hello4": 4,
                    "hello5": 5
                }

                var expectedMap = {
                    "hello": 1,
                    "he001": 2,
                    "he002": 3,
                    "he003": 4,
                    "he004": 5
                }

                var validatedMap = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeMeasurements(map);
                Assert.deepEqual(expectedMap, validatedMap);
            }
        });

        this.testCase({
            name: "DataSanitizerTests: Validate sanitizeString trims whitespaces",
            test: () => {
                var expected = "NoWhiteSpaces";
                var input = "   NoWhiteSpaces  ";

                var actual = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeString(input);
                Assert.equal(expected, actual);
            }
        });

        this.testCase({
            name: "DataSanitizerTests: Validate sanitizestring defaults to DataSanitizer.MAX_STRING_LENGTH length",
            test: () => {
                var expected = "247E5792-7F2";
                var input = "247E5792-7F2A-49DE-81EB-17D868775A06";

                Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_STRING_LENGTH"] = 12;
                var actual = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeString(input);
                Assert.equal(expected, actual);
            }
        });

        this.testCase({
            name: "DataSanitizerTests: Validate sanitizestring checks against input max length",
            test: () => {
                var expected = "24";
                var input = "247E5792-7F2A-49DE-81EB-17D868775A06";

                Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_STRING_LENGTH"] = 12;
                var actual = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeString(input, 2);
                Assert.equal(expected, actual);
            }
        });

        this.testCase({
            name: "DataSanitizerTests: Validate sanitizeProperties trims whitespaces in properties names and values",
            test: () => {
                var expected = "NoWhiteSpaces";
                var input = "   NoWhiteSpaces  ";

                var testProps = { "  prop1  ": "   val  ", "   prop2 ": " val     " };                

                var actual = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeProperties(testProps);
                Assert.equal("val", actual["prop1"]);
                Assert.equal("val", actual["prop2"]);
            }
        });

        this.testCase({
            name: "DataSanitizerTests: Validate sanitizeId trims to valid size",
            test: () => {
                var expected = "247E5";
                var input = "247E5792-7F2A-49DE-81EB-17D868775A06";

                Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer["MAX_ID_LENGTH"] = 5;
                var actual = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeId(input);
                Assert.equal(expected, actual);
            }
        });

        this.testCase({
            name: "DataSanitizerTests: Validate sanitizeString handles null and undefined",
            test: () => {
                Assert.ok(null === Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeString(null));
                Assert.ok(undefined === Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeString(undefined));
            }
        });

        this.testCase({
            name: "DataSanitizerTests: Validate sanitizeInput trims when data exceeds allowed maxlength",
            test: () => {
                var expected = "247E5792-"; // length 9
                var input = "247E5792-7F2A-49DE-81EB-17D868775A06";

                var actual = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeInput(input, 9, Microsoft.ApplicationInsights._InternalMessageId. IdTooLong);
                Assert.equal(expected, actual);
            }
        });

        this.testCase({
            name: "DataSanitizerTests: Validate sanitizeInput trims input data",
            test: () => {
                var expected = "247E5792-"; // length 9
                var input = "   247E5792-    ";

                var actual = Microsoft.ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeInput(input, 9, Microsoft.ApplicationInsights._InternalMessageId. IdTooLong);
                Assert.equal(expected, actual);
            }
        });
    }
}

new DataSanitizerTests().registerTests();
