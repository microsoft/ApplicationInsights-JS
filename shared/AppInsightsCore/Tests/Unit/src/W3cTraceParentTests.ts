import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { ITraceParent } from "../../../src/JavaScriptSDK.Interfaces/ITraceParent";
import { generateW3CId, newGuid } from "../../../src/JavaScriptSDK/CoreUtils";
import { dateNow } from "../../../src/JavaScriptSDK/HelperFuncs";
import { random32, randomValue } from "../../../src/JavaScriptSDK/RandomHelper";
import { formatTraceParent, isSampledFlag, isValidSpanId, isValidTraceId, isValidTraceParent, parseTraceParent } from "../../../src/JavaScriptSDK/W3cTraceParent";

export class W3cTraceParentTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "parseTraceParent - Invalid",
            test: () => {
                Assert.equal(null, parseTraceParent(undefined));
                Assert.equal(null, parseTraceParent(null));
                Assert.equal(null, parseTraceParent(""));
                Assert.equal(null, parseTraceParent("00-00000000000000000000000000000000-0000000000000000-00"));
                Assert.equal(null, parseTraceParent("ff-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00"));
                Assert.equal(null, parseTraceParent("ff-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00"));
                Assert.equal(null, parseTraceParent("004bf92f3577b34da6a3ce929d0e0e473600f067aa0ba902b700"));
                Assert.equal(null, parseTraceParent("00-4BF92F3577B34DA6A3CE929D0E0E473G-00F067AA0BA902B7-00"));
            }
        });

        this.testCase({
            name: "parseTraceParent - valid",
            test: () => {
                let traceParent = parseTraceParent("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00");

                Assert.equal("00", traceParent.version);
                Assert.equal("4bf92f3577b34da6a3ce929d0e0e4736", traceParent.traceId);
                Assert.equal("00f067aa0ba902b7", traceParent.spanId);
                Assert.equal(0, traceParent.traceFlags);

                traceParent = parseTraceParent(" 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00 ");

                Assert.equal("00", traceParent.version);
                Assert.equal("4bf92f3577b34da6a3ce929d0e0e4736", traceParent.traceId);
                Assert.equal("00f067aa0ba902b7", traceParent.spanId);
                Assert.equal(0, traceParent.traceFlags);
                traceParent = parseTraceParent("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01");

                Assert.equal("00", traceParent.version);
                Assert.equal("4bf92f3577b34da6a3ce929d0e0e4736", traceParent.traceId);
                Assert.equal("00f067aa0ba902b7", traceParent.spanId);
                Assert.equal(1, traceParent.traceFlags);

                traceParent = parseTraceParent("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-10");

                Assert.equal("00", traceParent.version);
                Assert.equal("4bf92f3577b34da6a3ce929d0e0e4736", traceParent.traceId);
                Assert.equal("00f067aa0ba902b7", traceParent.spanId);
                Assert.equal(16, traceParent.traceFlags);
            }
        });

        this.testCase({
            name: "parseTraceParent - valid - Case Insensitive",
            test: () => {
                let traceParent = parseTraceParent("00-4bf92f3577b34da6a3ce929d0e0e4736-00F067AA0BA902b7-00");

                Assert.equal("00", traceParent.version);
                Assert.equal("4bf92f3577b34da6a3ce929d0e0e4736", traceParent.traceId);
                Assert.equal("00f067aa0ba902b7", traceParent.spanId);
                Assert.equal(0, traceParent.traceFlags);

                traceParent = parseTraceParent(" 00-4bf92f3577b34da6a3cE929D0E0E4736-00f067aa0ba902b7-00 ");

                Assert.equal("00", traceParent.version);
                Assert.equal("4bf92f3577b34da6a3ce929d0e0e4736", traceParent.traceId);
                Assert.equal("00f067aa0ba902b7", traceParent.spanId);
                Assert.equal(0, traceParent.traceFlags);
                traceParent = parseTraceParent("00-4BF92F3577B34DA6A3CE929D0E0E4736-00F067AA0BA902b7-01");

                Assert.equal("00", traceParent.version);
                Assert.equal("4bf92f3577b34da6a3ce929d0e0e4736", traceParent.traceId);
                Assert.equal("00f067aa0ba902b7", traceParent.spanId);
                Assert.equal(1, traceParent.traceFlags);

                traceParent = parseTraceParent("00-4BF92F3577B34DA6A3CE929D0E0E4736-00F067AA0BA902B7-10");

                Assert.equal("00", traceParent.version);
                Assert.equal("4bf92f3577b34da6a3ce929d0e0e4736", traceParent.traceId);
                Assert.equal("00f067aa0ba902b7", traceParent.spanId);
                Assert.equal(16, traceParent.traceFlags);
            }
        });

        this.testCase({
            name: "parseTraceParent - multiple",
            test: () => {
                let traceParent = parseTraceParent("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00,00-11111111111111111111111111111111-2222222222222222-00");

                Assert.equal("00", traceParent.version);
                Assert.equal("4bf92f3577b34da6a3ce929d0e0e4736", traceParent.traceId);
                Assert.equal("00f067aa0ba902b7", traceParent.spanId);
                Assert.equal(0, traceParent.traceFlags);

                traceParent = parseTraceParent(" 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00 , 00-11111111111111111111111111111111-2222222222222222-00");

                Assert.equal("00", traceParent.version);
                Assert.equal("4bf92f3577b34da6a3ce929d0e0e4736", traceParent.traceId);
                Assert.equal("00f067aa0ba902b7", traceParent.spanId);
                Assert.equal(0, traceParent.traceFlags);
                traceParent = parseTraceParent("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01, ,00-11111111111111111111111111111111-2222222222222222-00");

                Assert.equal("00", traceParent.version);
                Assert.equal("4bf92f3577b34da6a3ce929d0e0e4736", traceParent.traceId);
                Assert.equal("00f067aa0ba902b7", traceParent.spanId);
                Assert.equal(1, traceParent.traceFlags);

                traceParent = parseTraceParent("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-10, 00-11111111111111111111111111111111-2222222222222222-00");

                Assert.equal("00", traceParent.version);
                Assert.equal("4bf92f3577b34da6a3ce929d0e0e4736", traceParent.traceId);
                Assert.equal("00f067aa0ba902b7", traceParent.spanId);
                Assert.equal(16, traceParent.traceFlags);

                traceParent = parseTraceParent("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00,00-11111111111111111111111111111111-2222222222222222-00", 1);
                Assert.equal("00", traceParent.version);
                Assert.equal("11111111111111111111111111111111", traceParent.traceId);
                Assert.equal("2222222222222222", traceParent.spanId);
                Assert.equal(0, traceParent.traceFlags);

                traceParent = parseTraceParent(" 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00 , 00-11111111111111111111111111111111-2222222222222222-00", 1);
                Assert.equal("00", traceParent.version);
                Assert.equal("11111111111111111111111111111111", traceParent.traceId);
                Assert.equal("2222222222222222", traceParent.spanId);
                Assert.equal(0, traceParent.traceFlags);

                traceParent = parseTraceParent("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01, ,00-11111111111111111111111111111111-2222222222222222-00", 2);
                Assert.equal("00", traceParent.version);
                Assert.equal("11111111111111111111111111111111", traceParent.traceId);
                Assert.equal("2222222222222222", traceParent.spanId);
                Assert.equal(0, traceParent.traceFlags);

                traceParent = parseTraceParent("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-10, 00-11111111111111111111111111111111-2222222222222222-20", 1);

                Assert.equal("00", traceParent.version);
                Assert.equal("11111111111111111111111111111111", traceParent.traceId);
                Assert.equal("2222222222222222", traceParent.spanId);
                Assert.equal(32, traceParent.traceFlags);
            }
        });

        this.testCase({
            name: "isValidTraceId",
            test: () => {
                Assert.equal(false, isValidTraceId(undefined));
                Assert.equal(false, isValidTraceId(null));
                Assert.equal(false, isValidTraceId(""));
                Assert.equal(false, isValidTraceId("00000000000000000000000000000000"));
                Assert.equal(true, isValidTraceId("4bf92f3577b34da6a3ce929d0e0e4736"));
                Assert.equal(false, isValidTraceId(" 4bf92f3577b34da6a3ce929d0e0e4736"));
                Assert.equal(false, isValidTraceId("4bf92f3577b34da6a3ce929d0e0e4736 "));
                Assert.equal(true, isValidTraceId("4bf92f3577b34DA6A3ce929d0e0e4736"));
                Assert.equal(true, isValidTraceId("4BF92F3577B34DA6A3CE929D0E0E4736"));
            }
        });

        this.testCase({
            name: "isValidSpanId",
            test: () => {
                Assert.equal(false, isValidSpanId(undefined));
                Assert.equal(false, isValidSpanId(null));
                Assert.equal(false, isValidSpanId(""));
                Assert.equal(false, isValidSpanId("0000000000000000"));
                Assert.equal(true, isValidSpanId("00f067aa0ba902b7"));
                Assert.equal(false, isValidSpanId(" 00f067aa0ba902b7"));
                Assert.equal(false, isValidSpanId("00f067aa0ba902b7 "));
                Assert.equal(true, isValidSpanId("00f067aa0BA902B7"));
                Assert.equal(true, isValidSpanId("00F067AA0BA902B7"));
            }
        });

        this.testCase({
            name: "isValidTraceParent",
            test: () => {
                Assert.equal(false, isValidTraceParent(undefined));
                Assert.equal(false, isValidTraceParent(null));
                Assert.equal(false, isValidTraceParent({} as ITraceParent));
                Assert.equal(false, isValidTraceParent({
                    version: "",
                    traceId: "",
                    spanId: "",
                    traceFlags: 0
                } as ITraceParent));
                Assert.equal(false, isValidTraceParent({
                    version: "00",
                    traceId: "",
                    spanId: "",
                    traceFlags: 0
                } as ITraceParent));
                Assert.equal(false, isValidTraceParent({
                    version: "00",
                    traceId: "",
                    spanId: "00f067aa0ba902b7",
                    traceFlags: 0
                } as ITraceParent));
                Assert.equal(true, isValidTraceParent({
                    version: "00",
                    traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
                    spanId: "00f067aa0ba902b7",
                    traceFlags: 0
                } as ITraceParent));
                Assert.equal(false, isValidTraceParent({
                    version: "ff",
                    traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
                    spanId: "00f067aa0ba902b7",
                    traceFlags: 0
                } as ITraceParent));
                Assert.equal(true, isValidTraceParent({
                    version: "00",
                    traceId: "4BF92F3577B34DA6A3CE929D0E0E4736",
                    spanId: "00f067aa0ba902b7",
                    traceFlags: 0
                } as ITraceParent));
            }
        });

        this.testCase({
            name: "isSampledFlag",
            test: () => {
                Assert.equal(false, isSampledFlag(undefined));
                Assert.equal(false, isSampledFlag(null));
                Assert.equal(false, isSampledFlag({} as ITraceParent));
                Assert.equal(false, isSampledFlag({
                    version: "ff",
                    traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
                    spanId: "00f067aa0ba902b7",
                    traceFlags: 0
                } as ITraceParent));
                Assert.equal(false, isSampledFlag({
                    version: "ff",
                    traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
                    spanId: "00f067aa0ba902b7",
                    traceFlags: 1
                } as ITraceParent));
                Assert.equal(true, isSampledFlag({
                    version: "00",
                    traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
                    spanId: "00f067aa0ba902b7",
                    traceFlags: 1
                } as ITraceParent));
                Assert.equal(true, isSampledFlag({
                    version: "00",
                    traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
                    spanId: "00f067aa0ba902b7",
                    traceFlags: 0x11
                } as ITraceParent));
            }
        });

        this.testCase({
            name: "formatTraceParent",
            test: () => {
                Assert.equal("", formatTraceParent(undefined));
                Assert.equal("", formatTraceParent(null));
                Assert.equal("00-00000000000000000000000000000000-0000000000000000-01", formatTraceParent({} as ITraceParent));
                Assert.equal("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-11", formatTraceParent({
                    version: "00",
                    traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
                    spanId: "00f067aa0ba902b7",
                    traceFlags: 0x11
                } as ITraceParent));
                Assert.equal("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01", formatTraceParent({
                    version: "00",
                    traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
                    spanId: "00f067aa0ba902b7",
                    traceFlags: 1
                } as ITraceParent));
                Assert.equal("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00", formatTraceParent({
                    version: "00",
                    traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
                    spanId: "00f067aa0ba902b7",
                    traceFlags: 0
                } as ITraceParent));
                Assert.equal("ff-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00", formatTraceParent({
                    version: "ff",
                    traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
                    spanId: "00f067aa0ba902b7",
                    traceFlags: 0
                } as ITraceParent));

                // Case Insensitive
                Assert.equal("ff-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00", formatTraceParent({
                    version: "ff",
                    traceId: "4bf92f3577b34DA6A3ce929d0e0e4736",
                    spanId: "00f067aa0ba902b7",
                    traceFlags: 0
                } as ITraceParent));

                Assert.equal("ff-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00", formatTraceParent({
                    version: "ff",
                    traceId: "4bf92f3577b34DA6A3ce929d0e0e4736",
                    spanId: "00f067AA0BA902B7",
                    traceFlags: 0
                } as ITraceParent));

                // Only formats to known type
                Assert.equal("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00", formatTraceParent({
                    version: "02",          // Pretend to be version 2
                    traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
                    spanId: "00f067aa0ba902b7",
                    traceFlags: 0
                } as ITraceParent));
            }
        });

        this.testCase({
            name: "org generate guid timings",
            useFakeTimers: false,
            test: () => {
                let maxAttempts = 3;
                let orgTotal = -1;
                do {
                    let start = dateNow();
                    for (let lp = 0; lp < 10000; lp++) {
                        let newId = generateW3CId();
                    }
    
                    orgTotal = dateNow() - start;
                    maxAttempts--;
                    // Virtualized test servers are slooooow, so try and perform a couple of tests before failing
                } while (orgTotal >= 300 && maxAttempts > 0);

                Assert.ok(orgTotal < 300, "Total time for org generateW3cID = " + JSON.stringify({
                    orgTotal
                }));
            }
        });

        this.testCase({
            name: "Validate generation",
            useFakeTimers: false,
            test: () => {
                let key1 = generateW3CId();
                let key2 = generateW3CId();

                Assert.notEqual(key1, key2, "Make sure they are not the same");
                Assert.equal(32, key1.length, "Key1 length: " + key1);
                Assert.equal(32, key2.length, "Key2 length: " + key2);

                Assert.equal("4", key1[12]);
                Assert.equal("4", key2[12]);
            }
        });

        this.testCase({
            name: "generate newGuid timings",
            useFakeTimers: false,
            test: () => {
                let maxAttempts = 3;
                let guidTotal = -1;
                do {
                    let start = dateNow();
                    for (let lp = 0; lp < 10000; lp++) {
                        let newId = newGuid();
                    }

                    guidTotal = dateNow() - start;
                    maxAttempts--;
                    // Virtualized test servers are slooooow, so try and perform a couple of tests before failing
                } while (guidTotal >= 300 && maxAttempts > 0);

                Assert.ok(guidTotal < 300, "Total time for org newGuid = " + JSON.stringify({
                    guidTotal
                }));
            }
        });

        this.testCase({
            name: "Validate newGuid",
            useFakeTimers: false,
            test: () => {
                let key1 = newGuid();
                let key2 = newGuid();

                Assert.notEqual(key1, key2, "Make sure they are not the same");
                Assert.equal(36, key1.length, "Key1 length: " + key1);
                Assert.equal(36, key2.length, "Key2 length: " + key2);
 
                Assert.equal("4", key1[14]);
                Assert.equal("4", key2[14]);
           }
        });
    }
}