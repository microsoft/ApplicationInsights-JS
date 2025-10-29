import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { isFunction, isNullOrUndefined, objKeys } from "@nevware21/ts-utils";

export class OTelApiTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        // TODO: Enable these tests once the OpenTelemetry API support is added
        // this.testCase({
        //     name: "TraceState: no config",
        //     test: () => {
        //         const api = createOTelApi({} as any);
        //         Assert.ok(api);
        //         Assert.ok(api.trace);
        //         Assert.ok(api.context);
        //         Assert.ok(api.getTracer);
        //         Assert.ok(isFunction(api.getTracer));

        //         let tracer = api.getTracer("test");
        //         Assert.ok(tracer);
        //         Assert.ok(tracer.startSpan);
        //         Assert.ok(isFunction(tracer.startSpan));
        //         Assert.ok(tracer.startActiveSpan);
        //         Assert.ok(isFunction(tracer.startActiveSpan));

        //         // startSpan
        //         let span = tracer.startSpan("test") as IReadableSpan;
        //         Assert.ok(span);
        //         Assert.ok(isReadableSpan(span), JSON.stringify(objKeys(span)));
        //         Assert.ok(span.spanContext);
        //         Assert.ok(isFunction(span.spanContext));
        //         let spanContext = span.spanContext();
        //         Assert.ok(spanContext);
        //         Assert.ok(!isNullOrUndefined(spanContext.traceId));
        //         Assert.ok(!isNullOrUndefined(spanContext.spanId));
        //         Assert.ok(!isNullOrUndefined(spanContext.traceFlags));
        //         Assert.ok(isNullOrUndefined(spanContext.traceState));
        //         Assert.ok(isNullOrUndefined(spanContext.isRemote));

        //         Assert.ok(span.setAttribute);
        //         Assert.ok(isFunction(span.setAttribute));
        //         // Make sure setting an attribute doesn't throw
        //         span.setAttribute("key", "value");
        //         if (span.isRecording()) {
        //             Assert.equal(objKeys(span.attributes).length, 1);
        //             Assert.equal(span.attributes["key"], "value");
        //         } else {
        //             Assert.equal(objKeys(span.attributes).length, 0);
        //         }

        //         Assert.ok(span.setAttributes);
        //         Assert.ok(isFunction(span.setAttributes));

        //         Assert.ok(span.addEvent);
        //         Assert.ok(isFunction(span.addEvent));
                
        //         // Make sure calling addEvent doesn't throw
        //         span.addEvent("test");
        //         if (span.isRecording()) {
        //             Assert.equal(span.events.length, 1);
        //             Assert.equal(span.events[0].name, "test");
        //         } else {
        //             Assert.equal(span.events.length, 0);
        //         }

        //         Assert.ok(span.addLink);
        //         Assert.ok(isFunction(span.addLink));
        //         // Make sure calling addLink doesn't throw
        //         span.addLink({} as any);
        //         if (span.isRecording()) {
        //             Assert.equal(span.links.length, 1);
        //         } else {
        //             Assert.equal(span.links.length, 0);
        //         }

        //         Assert.ok(span.addLinks);
        //         Assert.ok(isFunction(span.addLinks));

        //         Assert.ok(span.setStatus);
        //         Assert.ok(isFunction(span.setStatus));
        //         // Make sure calling setStatus doesn't throw
        //         span.setStatus({ code: eOTelSpanStatusCode.OK });
        //         if (span.isRecording()) {
        //             Assert.equal(span.status.code, eOTelSpanStatusCode.OK);
        //         } else {
        //             Assert.equal(span.status.code, 0);
        //         }

        //         Assert.ok(span.updateName);
        //         Assert.ok(isFunction(span.updateName));
        //         // Make sure calling updateName doesn't throw
        //         span.updateName("UpdatedTest");
        //         if (span.isRecording()) {
        //             Assert.equal(span.name, "UpdatedTest");
        //         } else {
        //             Assert.equal(span.name, "test");
        //         }

        //         Assert.ok(span.end);
        //         Assert.ok(isFunction(span.end));
        //         // Make sure calling end doesn't throw
        //         span.end();
        //         Assert.ok(span.ended);

        //         Assert.ok(span.isRecording);
        //         Assert.ok(isFunction(span.isRecording));

        //         Assert.ok(span.recordException);
        //         Assert.ok(isFunction(span.recordException));
        //         Assert.ok(span.recordException);
        //         // Make sure calling recordException doesn't throw
        //         span.recordException(new Error("test"));
        //         if (span.isRecording()) {
        //             Assert.equal(span.status.code, eOTelSpanStatusCode.ERROR);
        //         } else {
        //             Assert.equal(span.status.code, 0);
        //         }
        //     }
        // });
   }
}
