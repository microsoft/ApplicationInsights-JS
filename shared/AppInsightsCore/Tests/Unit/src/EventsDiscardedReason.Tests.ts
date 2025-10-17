import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { eEventsDiscardedReason, EventsDiscardedReason } from "@microsoft/applicationinsights-common";

export class EventsDiscardedReasonTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "LoggingSeverity values",
            test: () => {
                Assert.equal(0, eEventsDiscardedReason.Unknown, "Check eEventsDiscardedReason.Unknown");
                Assert.equal(1, eEventsDiscardedReason.NonRetryableStatus, "Check eEventsDiscardedReason.NonRetryableStatus");
                Assert.equal(2, eEventsDiscardedReason.InvalidEvent, "Check eEventsDiscardedReason.InvalidEvent");
                Assert.equal(3, eEventsDiscardedReason.SizeLimitExceeded, "Check eEventsDiscardedReason.SizeLimitExceeded");
                Assert.equal(4, eEventsDiscardedReason.KillSwitch, "Check eEventsDiscardedReason.KillSwitch");
                Assert.equal(5, eEventsDiscardedReason.QueueFull, "Check eEventsDiscardedReason.QueueFull");

                Assert.equal(eEventsDiscardedReason.Unknown, EventsDiscardedReason.Unknown, "Check EventsDiscardedReason.Unknown");
                Assert.equal(eEventsDiscardedReason.NonRetryableStatus, EventsDiscardedReason.NonRetryableStatus, "Check EventsDiscardedReason.NonRetryableStatus");
                Assert.equal(eEventsDiscardedReason.InvalidEvent, EventsDiscardedReason.InvalidEvent, "Check EventsDiscardedReason.InvalidEvent");
                Assert.equal(eEventsDiscardedReason.SizeLimitExceeded, EventsDiscardedReason.SizeLimitExceeded, "Check EventsDiscardedReason.SizeLimitExceeded");
                Assert.equal(eEventsDiscardedReason.KillSwitch, EventsDiscardedReason.KillSwitch, "Check EventsDiscardedReason.KillSwitch");
                Assert.equal(eEventsDiscardedReason.QueueFull, EventsDiscardedReason.QueueFull, "Check EventsDiscardedReason.QueueFull");

                Assert.ok(0 === EventsDiscardedReason.Unknown, "Check EventsDiscardedReason.Unknown === 0");
                Assert.ok(1 === EventsDiscardedReason.NonRetryableStatus, "Check EventsDiscardedReason.NonRetryableStatus === 0");
                Assert.ok(2 === EventsDiscardedReason.InvalidEvent, "Check EventsDiscardedReason.InvalidEvent === 0");
                Assert.ok(3 === EventsDiscardedReason.SizeLimitExceeded, "Check EventsDiscardedReason.SizeLimitExceeded === 0");
                Assert.ok(4 === EventsDiscardedReason.KillSwitch, "Check EventsDiscardedReason.KillSwitch === 0");
                Assert.ok(5 === EventsDiscardedReason.QueueFull, "Check EventsDiscardedReason.QueueFull === 0");

                Assert.ok(eEventsDiscardedReason.Unknown === EventsDiscardedReason.Unknown, "Check Unknown === eEventsDiscardedReason.Unknown");
                Assert.ok(eEventsDiscardedReason.NonRetryableStatus === EventsDiscardedReason.NonRetryableStatus, "Check NonRetryableStatus === eEventsDiscardedReason.NonRetryableStatus");
                Assert.ok(eEventsDiscardedReason.InvalidEvent === EventsDiscardedReason.InvalidEvent, "Check InvalidEvent === eEventsDiscardedReason.InvalidEvent");
                Assert.ok(eEventsDiscardedReason.SizeLimitExceeded === EventsDiscardedReason.SizeLimitExceeded, "Check SizeLimitExceeded === eEventsDiscardedReason.SizeLimitExceeded");
                Assert.ok(eEventsDiscardedReason.KillSwitch === EventsDiscardedReason.KillSwitch, "Check KillSwitch === eEventsDiscardedReason.KillSwitch");
                Assert.ok(eEventsDiscardedReason.QueueFull === EventsDiscardedReason.QueueFull, "Check QueueFull === eEventsDiscardedReason.QueueFull");

                Assert.equal("0", EventsDiscardedReason.Unknown.toString(), "Checking value of EventsDiscardedReason.Unknown");
                Assert.equal("1", EventsDiscardedReason.NonRetryableStatus.toString(), "Checking value of EventsDiscardedReason.NonRetryableStatus");
                Assert.equal("2", EventsDiscardedReason.InvalidEvent.toString(), "Checking value of EventsDiscardedReason.InvalidEvent");
                Assert.equal("3", EventsDiscardedReason.SizeLimitExceeded.toString(), "Checking value of EventsDiscardedReason.SizeLimitExceeded");
                Assert.equal("4", EventsDiscardedReason.KillSwitch.toString(), "Checking value of EventsDiscardedReason.KillSwitch");
                Assert.equal("5", EventsDiscardedReason.QueueFull.toString(), "Checking value of EventsDiscardedReason.QueueFull");

                Assert.equal("Unknown", EventsDiscardedReason[EventsDiscardedReason.Unknown], "Checking string value of EventsDiscardedReason.Unknown");
                Assert.equal("NonRetryableStatus", EventsDiscardedReason[EventsDiscardedReason.NonRetryableStatus], "Checking string value of EventsDiscardedReason.NonRetryableStatus");
                Assert.equal("InvalidEvent", EventsDiscardedReason[EventsDiscardedReason.InvalidEvent], "Checking string value of EventsDiscardedReason.InvalidEvent");
                Assert.equal("SizeLimitExceeded", EventsDiscardedReason[EventsDiscardedReason.SizeLimitExceeded], "Checking string value of EventsDiscardedReason.SizeLimitExceeded");
                Assert.equal("KillSwitch", EventsDiscardedReason[EventsDiscardedReason.KillSwitch], "Checking string value of EventsDiscardedReason.KillSwitch");
                Assert.equal("QueueFull", EventsDiscardedReason[EventsDiscardedReason.QueueFull], "Checking string value of EventsDiscardedReason.QueueFull");
            }
       });
    }
}
