/// <reference path="../../javascriptsdk/telemetry/exception.ts" />
/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../javascriptsdk/appinsights.ts" />

class AutoCollectionTests extends TestClass {

    /** Turns on/off sinon's syncronous implementation of setTimeout. On by default. */
    public errorSpy: SinonSpy;

    /** Method called before the start of each test method */
    public testInitialize() {
        this.useFakeTimers = false;
        this.clock.restore();
        this.errorSpy = this.getListener("ErrorSpy");
    }

    /** Method called after each test method has completed */
    public testCleanup() {
        this.useFakeTimers = true;
        this.errorSpy.reset();
    }

    public registerTests() {
        var delay = 5000;

        this.testCaseAsync({
            name: "AutoCollection: ajax",
            stepDelay: delay,
            steps: [
                () => {
                    this.loadErrorTest("ajax");
                }
            ].concat(this.poll(() => {
                return this.verifyAjax(this.errorSpy, [
                    {
                        commandName: "https://code.jquery.com/jquery-2.1.4.min.js",
                        success: true,
                        dependencyTypeName: "Ajax",
                        dependencyKind: 1,
                        dependencySource: 2
                    },
                    {
                        commandName: "http://dc.services.visualstudio.com/v2/track",
                        success: false,
                        dependencyTypeName: "Ajax",
                        dependencyKind: 1,
                        dependencySource: 2
                    },
                    {
                        commandName: "http://dc.services.visualstudio.com/v2/track",
                        success: false,
                        dependencyTypeName: "Ajax",
                        dependencyKind: 1,
                        dependencySource: 2
                    },
                    {
                        commandName: "http://dc.services.visualstudio.com/v2/track",
                        success: false,
                        dependencyTypeName: "Ajax",
                        dependencyKind: 1,
                        dependencySource: 2
                    }
                ]);
            }))
        });

        //var errorDomSpy = this.getListener("errorDom");
        this.testCaseAsync({
            name: "AutoCollection: errorDom",
            stepDelay: delay,
            steps: [
                () => {
                    this.loadErrorTest("errorDom");
                }
            ].concat(this.poll(() => {
                    return this.verifyErrorMessages(this.errorSpy, [
                    //General Error message
                        "NotFoundError",
                    
                    // Safari specific error message
                        "An attempt was made to reference a Node in a context where it does not exist"
                    ], 1);
                }))
        });
        
        //var errorScriptGlobalSpy = this.getListener("errorScriptGlobal");
        this.testCaseAsync({
            name: "AutoCollection: errorScriptGlobal",
            stepDelay: delay,
            steps: [
                () => {
                    this.loadErrorTest("errorScriptGlobal");
                }
            ].concat(this.poll(() => {
                return this.verifyErrorMessages(this.errorSpy, [
                // General errors
                    "undefinedObject is not defined",

                // IE specific error messages
                    "Object doesn't support property or method 'unsupportedMethod'",
                    "The use of a keyword for an identifier is invalid",
                    "Array length must be a finite positive integer",
                    "Cannot assign to a function result",
                    "'undefinedObject' is undefined",
                    "Boolean.prototype.toString: 'this' is not a Boolean object",
                    "Function expected",

                // Chrome specific error messages    
                    "Invalid array length",
                    "Invalid left-hand side in assignment",
                    "Boolean.prototype.toString is not generic",
                    "object is not a function",
                    "undefined is not a function", 

                // Firefox specific error messages    
                    "obj.unsupportedMethod is not a function",
                    "invalid array length",
                    "invalid assignment left-hand side",
                    "toString method called on incompatible Object",
                    "o is not a function",

                // Safari specific error messages    
                    "'undefined' is not a function",
                    "Array size is not a small enough positive integer",
                    "Left side of assignment is not a reference",
                    "Can't find variable: undefinedObject",
                    "Type error",
                    "'[object Object]' is not a function (evaluating 'o()')"
                ], 7);
            }))
        });

        //var errorScriptNestedSpy = this.getListener("errorScriptNested");
        this.testCaseAsync({
            name: "AutoCollection: errorScriptNested",
            stepDelay: delay,
            steps: [
                () => {
                    this.loadErrorTest("errorScriptNested");
                }
            ].concat(this.poll(() => {
                return this.verifyErrorMessages(this.errorSpy, [
                //General Error message
                    "first is not defined",
                    "afterFullAiLoads",
                    
                // IE specific error messages
                    "'first' is undefined",
                    "Unable to get property 'exist' of undefined or null reference",
                    
                // Chrome specific error messages
                    "Cannot read property 'exist' of undefined",

                // Firefox specific error messages
                    "no element found",
                    "window.doesNot is undefined",

                // Safari specific error messages
                    "Can't find variable: first",
                    "'undefined' is not an object"
                ], 3);
            }))
        });

        //var errorScriptSyntaxSpy = this.getListener("errorScriptSyntax");
        this.testCaseAsync({
            name: "AutoCollection: errorScriptSyntax",
            stepDelay: delay,
            steps: [
                () => {
                    this.loadErrorTest("errorScriptSyntax");
                }
            ].concat(this.poll(() => {
                return this.verifyErrorMessages(this.errorSpy, [
                // IE specific error messages
                    "Object doesn't support property or method 'unsupportedMethod'",
                    "Expected '}'",
                    "Unterminated string constant",

                // Chrome specific error messages
                    "undefined is not a function",
                    "Unexpected end of input",
                    "Unexpected token ILLEGAL",

                // Firefox specific error messages
                    "obj.unsupportedMethod is not a function",
                    "missing } in compound statement",
                    "unterminated string literal",
                    "missing } after function body",

                // Safari specific error messages
                    "Expected token '}'",
                    "Unexpected EOF"
                ], 5);
            }))
        });

    }

    private getListener(address): SinonSpy {
        var listener = { onMessage: () => null };
        var spy = sinon.spy(listener, "onMessage");

        if (window.addEventListener) {
            addEventListener("message", listener.onMessage, false);
        } else {
            window["attachEvent"].call("onmessage", listener.onMessage);
        }

        return spy;
    }

    private loadErrorTest(path) {
        window["appInsights"] = undefined;
        var href = window.location.href.toLowerCase();
        var fullPath = href.split("e2etests")[0] + "e2etests/" + path + ".html";
        var iframe = document.createElement("iframe");
        iframe.src = fullPath;
        iframe.id = path;
        document.getElementsByTagName("body")[0].parentNode.appendChild(iframe);
        return iframe;
    }

    private poll(func: () => boolean, count: number = 1) {
        var polling = [];
        for (var i = 0; i < count; i++) {
            polling.push(() => {
                if (func()) {
                    Assert.ok(true, "validated, stopping poll cycle");
                    this.testCleanup();
                }
            });
        }

        return polling;
    }

    private getTelemetryItemsFromMessage(args, telemetryType) {
        var items = [];
        for (var i = 0; i < args.length; i++) {
            var payload = args[i][0];
            try {
                var data = JSON.parse(payload.data);
                for (var j = 0; j < data.length; j++) {
                    var d = data[j].data;
                    if (d && d.baseType === telemetryType) {
                        items.push(d.baseData);
                    }
                }
            } catch (e) { }
        }

        return items;
    }

    private getExceptionsFromMessage(args) {
        var exceptions = [];
        for (var i = 0; i < args.length; i++) {
            var payload = args[i][0];
            var data = JSON.parse(payload.data);
            for (var j = 0; j < data.length; j++) {
                var d = data[j].data;
                if (d && d.baseType === Microsoft.ApplicationInsights.Telemetry.Exception.dataType) {
                    exceptions.push(d.baseData);
                }
            }
        }

        return exceptions;
    }

    private verifyAjax(spy: SinonSpy, expectedItems) {
        if (spy.called) {
            var args = spy.args;
            var ajaxItems = this.getTelemetryItemsFromMessage(args, Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData.dataType);

            Assert.equal(expectedItems.length, ajaxItems.length, "Number of expected and actual ajax calls must match");

            for (var i = 0; i < ajaxItems.length; ++i) {
                var actual = ajaxItems[i];
                var expected = expectedItems[i];

                Assert.equal(expected.commandName, actual.commandName, "CommandName must match");
                Assert.equal(expected.success, actual.success, "Success property must match");
                Assert.equal(expected.dependencyTypeName, actual.dependencyTypeName, "DependencyTypeName must match");
                Assert.equal(expected.dependencyKind, actual.dependencyKind, "DependencyKind must match");
                Assert.equal(expected.dependencySource, actual.dependencySource, "DependencyType must match");
            }

        }

        return true;
    }

    private verifyErrorMessages(spy: SinonSpy, expectedMessages, numberOfTests) {
        var done = false;

        if (spy.called) {
            var args = spy.args;
            var exceptions = this.getExceptionsFromMessage(args);
            var count = 0;
            for (var i = 0; i < exceptions.length; i++) {
                var exception = exceptions[i];
                var message = exception.exceptions[0].message;
                for (var j = 0; j < expectedMessages.length; j++) {
                    if (message.indexOf(expectedMessages[j]) >= 0) {
                        Assert.ok(true, "Message '" + expectedMessages[j] + "' is contained in: " + message);
                        count++;
                        break;
                    }
                }
            }

            done = count >= numberOfTests;
        }

        return done;
    }
}
new AutoCollectionTests().registerTests();