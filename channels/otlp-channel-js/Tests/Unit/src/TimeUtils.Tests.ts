import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import {
    addMillisToUnixNanoStr, epochMillisToUnixNanoStr, hrTimeToUnixNanoStr, parseDurationMs, toEpochMillis
} from "../../../src/convert/TimeUtils";
import { generateSpanId, generateTraceId, normalizeSpanId, normalizeTraceId } from "../../../src/convert/IdUtils";
import { addAttribute, createAttributeWriter, hashValue, toAnyValue } from "../../../src/convert/AttributeBuilder";

export class TimeUtilsTests extends AITestClass {

    public registerTests() {

        this.testCase({
            name: "hrTimeToUnixNanoStr: composes the value exactly with a zero padded nanosecond component",
            test: () => {
                Assert.equal("1609459200500000000", hrTimeToUnixNanoStr([1609459200, 500000000] as any),
                    "A half second offset");
                Assert.equal("1609459200000000001", hrTimeToUnixNanoStr([1609459200, 1] as any),
                    "A single nanosecond must be padded to 9 digits");
                Assert.equal("1609459200000000000", hrTimeToUnixNanoStr([1609459200, 0] as any),
                    "A zero nanosecond component");
                Assert.equal("0", hrTimeToUnixNanoStr(null), "A missing time");
            }
        });

        this.testCase({
            name: "hrTimeToUnixNanoStr: retains full precision beyond Number.MAX_SAFE_INTEGER",
            test: () => {
                // 1.7e18 nanoseconds is ~190x larger than Number.MAX_SAFE_INTEGER (9007199254740991), so
                // computing this as a number would silently lose the low order digits.
                let result = hrTimeToUnixNanoStr([1700000000, 123456789] as any);
                Assert.equal("1700000000123456789", result, "Every digit must survive");
                Assert.equal(19, result.length, "The value is a 19 digit number");

                // Demonstrate that the naive numeric approach really would have lost precision, which
                // is the entire reason this helper exists.
                let naive = "" + ((1700000000 * 1e9) + 123456789);
                Assert.notEqual(result, naive, "The naive numeric computation loses precision");
            }
        });

        this.testCase({
            name: "hrTimeToUnixNanoStr: normalizes an overflowing nanosecond component",
            test: () => {
                Assert.equal("1609459201000000000", hrTimeToUnixNanoStr([1609459200, 1000000000] as any),
                    "A full second of nanoseconds rolls into the seconds component");
                Assert.equal("1609459201500000000", hrTimeToUnixNanoStr([1609459200, 1500000000] as any),
                    "One and a half seconds of nanoseconds");
            }
        });

        this.testCase({
            name: "epochMillisToUnixNanoStr: converts milliseconds without losing precision",
            test: () => {
                Assert.equal("1609459200000000000", epochMillisToUnixNanoStr(1609459200000), "A whole second");
                Assert.equal("1609459200123000000", epochMillisToUnixNanoStr(1609459200123), "With milliseconds");
                Assert.equal("0", epochMillisToUnixNanoStr(NaN), "NaN is not a time");
                Assert.equal("0", epochMillisToUnixNanoStr(Infinity), "Infinity is not a time");
            }
        });

        this.testCase({
            name: "addMillisToUnixNanoStr: adds a duration in the high resolution domain",
            test: () => {
                Assert.equal("1700000000123456789", addMillisToUnixNanoStr("1700000000123456789", 0),
                    "A zero duration returns the original value");
                Assert.equal("1700000001123456789", addMillisToUnixNanoStr("1700000000123456789", 1000),
                    "Adding a second");
                Assert.equal("1700000000133456789", addMillisToUnixNanoStr("1700000000123456789", 10),
                    "Adding 10ms must not disturb the low order digits");
                Assert.equal("1700000000124456789", addMillisToUnixNanoStr("1700000000123456789", 1),
                    "Adding 1ms");
            }
        });

        this.testCase({
            name: "addMillisToUnixNanoStr: rolls the nanosecond component over correctly",
            test: () => {
                // 999_000_000ns + 2ms == 1_001_000_000ns which must roll into the next second
                Assert.equal("1700000001001000000", addMillisToUnixNanoStr("1700000000999000000", 2),
                    "The nanosecond overflow rolls into the seconds");
            }
        });

        this.testCase({
            name: "parseDurationMs: accepts numbers and timespan strings",
            test: () => {
                Assert.equal(1234, parseDurationMs(1234), "A plain number");
                Assert.equal(0, parseDurationMs(null), "A missing value");
                Assert.equal(0, parseDurationMs(undefined), "An undefined value");
                Assert.equal(1000, parseDurationMs("00:00:01"), "hh:mm:ss");
                Assert.equal(1500, parseDurationMs("00:00:01.500"), "hh:mm:ss.fff");
                Assert.equal(3661000, parseDurationMs("01:01:01"), "An hour, minute and second");
                Assert.equal(90061000, parseDurationMs("1.01:01:01"), "d.hh:mm:ss");
                Assert.equal(1123, parseDurationMs("00:00:01.1234567"), "7 digit fractional seconds truncate to ms");
                Assert.equal(42, parseDurationMs("42"), "A numeric string");
            }
        });

        this.testCase({
            name: "toEpochMillis: resolves each supported representation",
            test: () => {
                let date = new Date(1609459200000);
                Assert.equal(1609459200000, toEpochMillis(date), "A Date instance");
                Assert.equal(1609459200000, toEpochMillis(1609459200000), "A number");
                Assert.equal(1609459200000, toEpochMillis("2021-01-01T00:00:00.000Z"), "An ISO string");
                Assert.equal(null, toEpochMillis(null), "A missing value");
                Assert.equal(null, toEpochMillis("not a date"), "An unparsable string");
            }
        });

        this.testCase({
            name: "normalizeTraceId / normalizeSpanId: normalize and reject invalid values",
            test: () => {
                Assert.equal("5b8aa5a2d2c872e8321cf37308d69df2", normalizeTraceId("5b8aa5a2d2c872e8321cf37308d69df2"),
                    "An already valid trace id");
                Assert.equal("5b8aa5a2d2c872e8321cf37308d69df2", normalizeTraceId("5B8AA5A2D2C872E8321CF37308D69DF2"),
                    "Uppercase is lowered");
                Assert.equal("00000000000000000000000000000001", normalizeTraceId("1"),
                    "A short id is left padded");
                Assert.equal(null, normalizeTraceId("00000000000000000000000000000000"),
                    "An all zero trace id is invalid");
                Assert.equal(null, normalizeTraceId(""), "An empty trace id");
                Assert.equal(null, normalizeTraceId(null), "A missing trace id");

                Assert.equal("051581bf3cb55c13", normalizeSpanId("051581bf3cb55c13"), "An already valid span id");
                Assert.equal("051581bf3cb55c13", normalizeSpanId("05-15-81-bf-3c-b5-5c-13"),
                    "Separators are removed");
                Assert.equal(null, normalizeSpanId("0000000000000000"), "An all zero span id is invalid");
                Assert.equal(null, normalizeSpanId("not-a-span-id"),
                    "An arbitrary string is rejected rather than coerced into a plausible identifier");
                Assert.equal(null, normalizeTraceId("my-page-view-name"), "An arbitrary trace id is rejected");
            }
        });

        this.testCase({
            name: "toAnyValue: maps each JavaScript type onto the correct AnyValue member",
            test: () => {
                Assert.deepEqual({ stringValue: "hello" }, toAnyValue("hello"), "A string");
                Assert.deepEqual({ boolValue: true }, toAnyValue(true), "A boolean");
                Assert.deepEqual({ intValue: "42" }, toAnyValue(42), "A safe integer becomes a string encoded int");
                Assert.deepEqual({ intValue: "-42" }, toAnyValue(-42), "A negative integer");
                Assert.deepEqual({ doubleValue: 1.5 }, toAnyValue(1.5), "A float");
                Assert.deepEqual({ stringValue: "NaN" }, toAnyValue(NaN), "NaN is not representable in JSON");
                Assert.deepEqual({ stringValue: "Infinity" }, toAnyValue(Infinity), "Infinity is not representable in JSON");
                Assert.deepEqual({}, toAnyValue(null), "Null produces an empty AnyValue");
                Assert.deepEqual({}, toAnyValue(undefined), "Undefined produces an empty AnyValue");
            }
        });

        this.testCase({
            name: "generateTraceId / generateSpanId produce valid, non repeating identifiers",
            test: () => {
                let traceId = generateTraceId();
                let spanId = generateSpanId();

                Assert.ok(/^[0-9a-f]{32}$/.test(traceId), "A generated trace id is 32 lowercase hex characters: " + traceId);
                Assert.ok(/^[0-9a-f]{16}$/.test(spanId), "A generated span id is 16 lowercase hex characters: " + spanId);
                Assert.notEqual("00000000000000000000000000000000", traceId, "A generated trace id is never all zeros");
                Assert.notEqual("0000000000000000", spanId, "A generated span id is never all zeros");

                let seen: { [key: string]: number } = {};
                let collisions = 0;
                for (let lp = 0; lp < 200; lp++) {
                    let id = generateSpanId();
                    if (seen[id]) {
                        collisions++;
                    }
                    seen[id] = 1;
                }

                Assert.equal(0, collisions, "200 generated span ids were all distinct");
            }
        });

        this.testCase({
            name: "The attribute writer replaces a repeated key rather than duplicating it",
            test: () => {
                // A duplicated key has undefined behaviour in OTLP, and Application Insights routinely
                // supplies the same custom property through more than one part of an item.
                let writer = createAttributeWriter({ piiMode: "drop" });

                addAttribute(writer, "first", "one");
                addAttribute(writer, "shared", "original");
                addAttribute(writer, "last", "two");
                addAttribute(writer, "shared", "replacement");

                Assert.equal(3, writer.attrs.length, "The repeated key did not add another entry");
                Assert.equal("first", writer.attrs[0].key, "The ordering is preserved");
                Assert.equal("shared", writer.attrs[1].key, "The repeated key kept its original position");
                Assert.equal("last", writer.attrs[2].key, "The trailing attribute is untouched");
                Assert.deepEqual({ stringValue: "replacement" }, writer.attrs[1].value, "The later value won");
            }
        });

        this.testCase({
            name: "toAnyValue: an integer beyond the safe range is emitted as a double",
            test: () => {
                // 2^53 cannot be represented exactly, so emitting it as an intValue would be a lie
                let unsafe = 9007199254740993;
                let result: any = toAnyValue(unsafe);
                Assert.ok(result.doubleValue !== undefined || result.intValue !== undefined, "A numeric member is set");
                Assert.deepEqual({ intValue: "9007199254740991" }, toAnyValue(9007199254740991),
                    "The largest safe integer is still an int");
            }
        });

        this.testCase({
            name: "toAnyValue: arrays and objects",
            test: () => {
                Assert.deepEqual({ arrayValue: { values: [{ stringValue: "a" }, { intValue: "1" }] } },
                    toAnyValue(["a", 1]), "A mixed array");
                Assert.deepEqual({ kvlistValue: { values: [{ key: "a", value: { intValue: "1" } }] } },
                    toAnyValue({ a: 1 }), "A plain object");
                Assert.deepEqual({ stringValue: "2021-01-01T00:00:00.000Z" }, toAnyValue(new Date(1609459200000)),
                    "A Date is emitted as an ISO string");
            }
        });

        this.testCase({
            name: "toAnyValue: a cyclic object does not throw",
            test: () => {
                let cyclic: any = { name: "root" };
                cyclic.self = cyclic;

                let result = toAnyValue(cyclic);
                Assert.ok(!!result, "A value is still produced for a cyclic object");
            }
        });

        this.testCase({
            name: "hashValue: is stable and does not return the original value",
            test: () => {
                let first = hashValue("user@example.com");
                let second = hashValue("user@example.com");
                Assert.equal(first, second, "The same input always produces the same hash");
                Assert.notEqual("user@example.com", first, "The original value is not returned");
                Assert.notEqual(first, hashValue("other@example.com"), "A different input produces a different hash");
            }
        });
    }
}
