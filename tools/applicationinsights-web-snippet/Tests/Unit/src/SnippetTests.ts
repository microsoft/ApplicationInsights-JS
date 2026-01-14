import { AITestClass } from "@microsoft/ai-test-framework";
import { webSnippetVersion, webSnippet, webSnippetCs, getSdkLoaderScript } from "../../../dist-es5/applicationinsights-web-snippet";

export class SnippetTests extends AITestClass {

    private _global: any = null;

    public testInitialize() {
    }

    public registerTests() {
        this.testCase({
            name: "Check snippet version",
            test: () => {
                QUnit.assert.equal("10", webSnippetVersion());
            }
        });

        this.testCase({
            name: "Check contains INSTRUMENTATION_KEY",
            test: () => {
                let theSnippet = webSnippet;

                QUnit.assert.notEqual(-1, theSnippet.indexOf("INSTRUMENTATION_KEY"), "The Snippet contains INSTRUMENTATION_KEY");
                QUnit.assert.notEqual(-1, theSnippet.indexOf("\"InstrumentationKey=INSTRUMENTATION_KEY\""), "The Snippet contains \"InstrumentationKey=INSTRUMENTATION_KEY\"");
                QUnit.assert.equal(-1, theSnippet.indexOf("YOUR_CONNECTION_STRING"), "The Snippet contains YOUR_CONNECTION_STRING");
                QUnit.assert.equal(-1, theSnippet.indexOf("\"YOUR_CONNECTION_STRING\""), "The Snippet contains \"YOUR_CONNECTION_STRING\"");
            }
        });

        this.testCase({
            name: "Check contains YOUR_CONNECTION_STRING",
            test: () => {
                let theSnippet = webSnippetCs;

                QUnit.assert.notEqual(-1, theSnippet.indexOf("YOUR_CONNECTION_STRING"), "The Snippet contains YOUR_CONNECTION_STRING");
                QUnit.assert.notEqual(-1, theSnippet.indexOf("\"YOUR_CONNECTION_STRING\""), "The Snippet contains \"YOUR_CONNECTION_STRING\"");
                QUnit.assert.equal(-1, theSnippet.indexOf("INSTRUMENTATION_KEY"), "The Snippet contains INSTRUMENTATION_KEY");
                QUnit.assert.equal(-1, theSnippet.indexOf("\"InstrumentationKey=INSTRUMENTATION_KEY\""), "The Snippet contains \"InstrumentationKey=INSTRUMENTATION_KEY\"");
            }
        });

        this.testCase({
            name: "Check substituteInstrumentationKey",
            test: () => {
                let key = "814a172a-xxxx-4950-9023-9cf13bb65696";
                let config = {instrumentationKey: key};
                let theSnippet = getSdkLoaderScript(config);
                console.log(theSnippet);
                QUnit.assert.equal(-1, theSnippet.indexOf("InstrumentationKey"), "The Snippet does not contains InstrumentationKey");
                QUnit.assert.equal(-1, theSnippet.indexOf("YOUR_CONNECTION_STRING"), "The Snippet should not contain YOUR_CONNECTION_STRING");
                QUnit.assert.notEqual(-1, theSnippet.indexOf(key), "key is injected");
            }
        });

        this.testCase({
            name: "Check substituteConnectionString",
            test: () => {
                let key = "InstrumentationKey=814a172a-92fd-4950-9023-9cf13bb65696;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/";
                let config = {connectionString: key};
                let theSnippet = getSdkLoaderScript(config);
                console.log(theSnippet);
                QUnit.assert.notEqual(-1, theSnippet.indexOf("InstrumentationKey"), "The Snippet contains InstrumentationKey");
                QUnit.assert.equal(-1, theSnippet.indexOf("YOUR_CONNECTION_STRING"), "The Snippet should not contain YOUR_CONNECTION_STRING");
                QUnit.assert.notEqual(-1, theSnippet.indexOf(key), "key is injected");
            }
        });

        this.testCase({
            name: "Verify config object doesn't include invalid keys",
            test: () => {
                let key = "InstrumentationKey=814a172a-92fd-4950-9023-9cf13bb65696;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/";
                let config = {
                    connectionString: key, 
                    instrumentationKey: key,
                    sri: { "</script>": "bad" },
                    cr: "</script>",
                    name: "</script>Name<script>alert('xss');</script>",
                };
                let theSnippet = getSdkLoaderScript(config);
                QUnit.assert.ok(theSnippet.indexOf("</script>") === -1, "Make sure the Snippet does not contain </script> - " + theSnippet);
                QUnit.assert.ok(theSnippet.indexOf("/script") !== -1, "Make sure the / character is not escaped - " + theSnippet);
            }
        });

        this.testCase({
            name: "Verify that the / character is not escaped",
            test: () => {
                let key = "InstrumentationKey=814a172a-92fd-4950-9023-9cf13bb65696;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/";
                let config = {
                    connectionString: key, 
                    instrumentationKey: key
                };
                let theSnippet = getSdkLoaderScript(config);
                QUnit.assert.ok(theSnippet.indexOf("https://eastus-8.") !== -1, "Make sure the / character is not escaped - " + theSnippet);
                QUnit.assert.ok(theSnippet.indexOf("LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/") !== -1, "Make sure the / character is not escaped - " + theSnippet);
            }
        });

        this.testCase({
            name: "Verify comment line is at the end of the snippet",
            test: () => {
                let key = "InstrumentationKey=814a172a-92fd-4950-9023-9cf13bb65696;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/";
                let config = {
                    connectionString: key
                };
                let theSnippet = getSdkLoaderScript(config);
                          
                // Test that snippet.min.js.ma appears only once
                let sourcemapPattern = "snippet.min.js.map";
                let firstIndex = theSnippet.indexOf(sourcemapPattern);
                let lastIndex = theSnippet.lastIndexOf(sourcemapPattern);
                QUnit.assert.ok(firstIndex !== -1, "Make sure snippet.min.js.ma exists in the snippet");
                QUnit.assert.equal(firstIndex, lastIndex, "Make sure snippet.min.js.ma appears only once");
                
                // Test that snippet.min.js.ma is at the end of the snippet
                let trimmedSnippet = theSnippet.trim();
                QUnit.assert.ok(trimmedSnippet.endsWith("snippet.min.js.map"), "Make sure snippet.min.js.map is at the very end of the snippet");
            }
        });
    }
}
