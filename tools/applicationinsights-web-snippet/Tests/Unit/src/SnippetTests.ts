import { AITestClass } from "@microsoft/ai-test-framework";
import { webSnippetVersion, webSnippet, webSnippetCs, substituteInstrumentationKey, substituteConnectionString } from "../../../dist-es5/applicationinsights-web-snippet";

export class SnippetTests extends AITestClass {

    private _global: any = null;

    public testInitialize() {
    }

    public registerTests() {
        this.testCase({
            name: "Check snippet version",
            test: () => {
                QUnit.assert.equal("7", webSnippetVersion());
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
                let theSnippet = substituteInstrumentationKey(key);
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
                let theSnippet = substituteConnectionString(key);
                console.log(theSnippet);
                QUnit.assert.notEqual(-1, theSnippet.indexOf("InstrumentationKey"), "The Snippet contains InstrumentationKey");
                QUnit.assert.equal(-1, theSnippet.indexOf("YOUR_CONNECTION_STRING"), "The Snippet should not contain YOUR_CONNECTION_STRING");
                QUnit.assert.notEqual(-1, theSnippet.indexOf(key), "key is injected");
            }
        });
    }
}
