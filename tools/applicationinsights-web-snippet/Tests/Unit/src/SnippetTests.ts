import { AITestClass } from "@microsoft/ai-test-framework";
import { webSnippetVersion, webSnippet, webSnippetCs } from "../../../build/applicationinsights-web-snippet";

export class SnippetTests extends AITestClass {

    private _global: any = null;

    public testInitialize() {
    }

    public registerTests() {
        this.testCase({
            name: "Check snippet version",
            test: () => {
                QUnit.assert.equal("6", webSnippetVersion());
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
    }
}
