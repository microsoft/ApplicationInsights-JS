import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { eRequestHeaders, RequestHeaders } from "../../../../src/Common/RequestResponseHeaders";

export class RequestHeadersTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "RequestHeaders values",
            test: () => {
                Assert.equal(0, eRequestHeaders.requestContextHeader, "Check eRequestHeaders.requestContextHeader");
                Assert.equal(1, eRequestHeaders.requestContextTargetKey, "Check eRequestHeaders.requestContextTargetKey");
                Assert.equal(2, eRequestHeaders.requestContextAppIdFormat, "Check eRequestHeaders.requestContextAppIdFormat");
                Assert.equal(3, eRequestHeaders.requestIdHeader, "Check eRequestHeaders.requestIdHeader");
                Assert.equal(4, eRequestHeaders.traceParentHeader, "Check eRequestHeaders.traceParentHeader");
                Assert.equal(5, eRequestHeaders.traceStateHeader, "Check eRequestHeaders.traceStateHeader");
                Assert.equal(6, eRequestHeaders.sdkContextHeader, "Check eRequestHeaders.sdkContextHeader");
                Assert.equal(7, eRequestHeaders.sdkContextHeaderAppIdRequest, "Check eRequestHeaders.sdkContextHeaderAppIdRequest");
                Assert.equal(8, eRequestHeaders.requestContextHeaderLowerCase, "Check eRequestHeaders.requestContextHeaderLowerCase");

                Assert.equal("Request-Context", RequestHeaders.requestContextHeader, "Check RequestHeaders.requestContextHeader");
                Assert.equal("appId", RequestHeaders.requestContextTargetKey, "Check RequestHeaders.requestContextTargetKey");
                Assert.equal("appId=cid-v1:", RequestHeaders.requestContextAppIdFormat, "Check RequestHeaders.requestContextAppIdFormat");
                Assert.equal("Request-Id", RequestHeaders.requestIdHeader, "Check RequestHeaders.requestIdHeader");
                Assert.equal("traceparent", RequestHeaders.traceParentHeader, "Check RequestHeaders.traceParentHeader");
                Assert.equal("tracestate", RequestHeaders.traceStateHeader, "Check RequestHeaders.traceStateHeader");
                Assert.equal("Sdk-Context", RequestHeaders.sdkContextHeader, "Check RequestHeaders.sdkContextHeader");
                Assert.equal("appId", RequestHeaders.sdkContextHeaderAppIdRequest, "Check RequestHeaders.sdkContextHeaderAppIdRequest");
                Assert.equal("request-context", RequestHeaders.requestContextHeaderLowerCase, "Check RequestHeaders.requestContextHeaderLowerCase");

                Assert.equal("Request-Context", RequestHeaders[eRequestHeaders.requestContextHeader], "Check RequestHeaders[eRequestHeaders.requestContextHeader]");
                Assert.equal("appId", RequestHeaders[eRequestHeaders.requestContextTargetKey], "Check RequestHeaders[eRequestHeaders.requestContextTargetKey]");
                Assert.equal("appId=cid-v1:", RequestHeaders[eRequestHeaders.requestContextAppIdFormat], "Check RequestHeaders[eRequestHeaders.requestContextAppIdFormat]");
                Assert.equal("Request-Id", RequestHeaders[eRequestHeaders.requestIdHeader], "Check RequestHeaders[eRequestHeaders.requestIdHeader]");
                Assert.equal("traceparent", RequestHeaders[eRequestHeaders.traceParentHeader], "Check RequestHeaders[eRequestHeaders.traceParentHeader]");
                Assert.equal("tracestate", RequestHeaders[eRequestHeaders.traceStateHeader], "Check RequestHeaders[eRequestHeaders.traceStateHeader]");
                Assert.equal("Sdk-Context", RequestHeaders[eRequestHeaders.sdkContextHeader], "Check RequestHeaders[eRequestHeaders.sdkContextHeader]");
                Assert.equal("appId", RequestHeaders[eRequestHeaders.sdkContextHeaderAppIdRequest], "Check RequestHeaders[eRequestHeaders.sdkContextHeaderAppIdRequest]");
                Assert.equal("request-context", RequestHeaders[eRequestHeaders.requestContextHeaderLowerCase], "Check RequestHeaders[eRequestHeaders.requestContextHeaderLowerCase]");
            }
       });
    }
}
