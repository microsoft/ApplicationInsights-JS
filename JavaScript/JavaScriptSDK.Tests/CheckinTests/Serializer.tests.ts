/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../JavaScriptSDK/serializer.ts" />

class SerializerTests extends TestClass {

    private throwInternalNonUserActionableSpy;
    private throwInternalUserActionableSpy;

    /** Method called before the start of each test method */
    public testInitialize() {
        this.throwInternalNonUserActionableSpy = sinon.spy(Microsoft.ApplicationInsights._InternalLogging, "throwInternalNonUserActionable");
        this.throwInternalUserActionableSpy = sinon.spy(Microsoft.ApplicationInsights._InternalLogging, "throwInternalUserActionable");
    }

    /** Method called after each test method has completed */
    public testCleanup() {
        this.throwInternalNonUserActionableSpy.restore();
        this.throwInternalUserActionableSpy.restore();
    }

    public registerTests() {

        this.testCase({
            name: "SerializerTests: empty input",
            test: () => {

                // act
                Microsoft.ApplicationInsights.Serializer.serialize(null);

                // verify
                Assert.ok(this.throwInternalUserActionableSpy.calledOnce, "throw internal when input is null");
            }
        });

        this.testCase({
            name: "SerializerTests: objects without a contract are serialized",
            test: () => {

                // act
                var obj = {
                    str: "str",
                    noContract: {
                        stillSerializable: "yep"
                    },
                    aiDataContract: {
                        str: true,
                        noContract: true
                    }
                };

                var expected = '{"str":"str","noContract":{"stillSerializable":"yep"}}';
                var actual = Microsoft.ApplicationInsights.Serializer.serialize(obj);

                // verify
                Assert.equal(expected, actual, "Object is serialized correctly");
                Assert.ok(this.throwInternalUserActionableSpy.calledOnce, "warning when contract is omitted");
            }
        });

        this.testCase({
            name: "SerializerTests: required objects that are not present throw",
            test: () => {

                // act
                var obj = {
                    aiDataContract: {
                        str: true
                    }
                };

                var expected = "{}";
                var actual = Microsoft.ApplicationInsights.Serializer.serialize(obj);

                // verify
                Assert.equal(expected, actual, "Object is serialized correctly");
                Assert.ok(this.throwInternalUserActionableSpy.calledOnce, "broken contracts throw");
            }
        });

        this.testCase({
            name: "SerializerTests: serialize an item with an array",
            test: () => {

                // act
                var noCycle = { value: "value", aiDataContract: { value: true } };
                var obj = {
                    arr: [
                        noCycle,
                        noCycle,
                        noCycle
                    ],
                    aiDataContract: { arr: [] }
                };
                var expected = '{"arr":[{"value":"value"},{"value":"value"},{"value":"value"}]}';
                var actual = Microsoft.ApplicationInsights.Serializer.serialize(obj);

                // verify
                Assert.equal(expected, actual, "Object is serialized correctly");
                Assert.ok(this.throwInternalNonUserActionableSpy.notCalled, "no non user actionable errors");
                Assert.ok(this.throwInternalUserActionableSpy.notCalled, "no user actionable errors");
            }
        });

        this.testCase({
            name: "SerializerTests: serialize an item which claims to have an array but does not",
            test: () => {

                // act
                var obj = {
                    arr: {},
                    aiDataContract: { arr: [] }
                };

                Microsoft.ApplicationInsights.Serializer.serialize(obj);

                // verify
                Assert.ok(this.throwInternalNonUserActionableSpy.notCalled, "no non user actionable errors");
                Assert.ok(this.throwInternalUserActionableSpy.calledOnce, "got user actionable errors");
            }
        });

        this.testCase({
            name: "SerializerTests: cycles without contracts are handled",
            test: () => {
                // act
                var cyclePt1 = { value: undefined, aiDataContract: { value: true } };
                var cyclePt2 = { value: cyclePt1, aiDataContract: { value: true } };
                cyclePt1.value = cyclePt2;
                var obj = {
                    noContractWithCycle: {
                        notSerializable: cyclePt1
                    },
                    aiDataContract: {
                        noContractWithCycle: true,
                    }
                };

                Microsoft.ApplicationInsights.Serializer.serialize(obj);

                // verify
                Assert.ok(this.throwInternalUserActionableSpy.calledTwice, "user actionable error is thrown");
                var error = this.throwInternalUserActionableSpy.args[0][1].toLowerCase();
                Assert.equal("attempting to serialize an object which does not implement iserializable: nocontractwithcycle", error);
            }
        });

        this.testCase({
            name: "SerializerTests: cycles with contracts are handled",
            test: () => {
                // act
                var cyclePt1 = { value: undefined, aiDataContract: { value: true } };
                var cyclePt2 = { value: cyclePt1, aiDataContract: { value: true } };
                cyclePt1.value = cyclePt2;
                var obj = {
                    aCycleWithContract: cyclePt1,
                    aiDataContract: {
                        aCycleWithContract: true,
                    }
                };

                Microsoft.ApplicationInsights.Serializer.serialize(obj);

                // verify
                Assert.ok(this.throwInternalUserActionableSpy.calledOnce, "error is thrown");
                var error = this.throwInternalUserActionableSpy.args[0][1].toLowerCase();
                Assert.ok(error.indexOf("circular") >= 0 || error.indexOf("cyclic") >= 0, "error message");
            }
        });

        this.testCase({
            name: "SerializerTests: object not present in the contract are not serialized",
            test: () => {

                // act
                var obj = {
                    str: "str",
                    notInContract: "foo",
                    aiDataContract: {
                        str: true,
                    }
                };

                var expected = '{"str":"str"}';
                var actual = Microsoft.ApplicationInsights.Serializer.serialize(obj);

                // verify
                Assert.equal(expected, actual, "Object is serialized correctly");
            }
        });

        this.testCase({
            name: "SerializerTests: cycle detection does not modify input",
            test: () => {

                // act
                var obj = {
                    str: "str",
                    aiDataContract: {
                        str: true
                    }
                };

                var expectedFields = {};
                for (var field in obj) {
                    expectedFields[field] = true;
                }

                var expected = '{"str":"str"}';
                var actual = Microsoft.ApplicationInsights.Serializer.serialize(obj);

                for (var xField in obj) {
                    Assert.ok(expectedFields[xField], "unexpected field present after serialization: '" + xField + "'");
                }

                // verify
                Assert.equal(expected, actual, "Object is serialized correctly");
                Assert.ok(this.throwInternalNonUserActionableSpy.notCalled, "no non user actionable errors");
                Assert.ok(this.throwInternalUserActionableSpy.notCalled, "no user actionable errors");
            }
        });

        this.testCase({
            name: "SerializerTests: properties will be serialized as string:string, measurements will be serilized as string:number",
            test: () => {
                var goodProperties = { a: "1", b: "test" };
                var badProperties = { a: 1, b: { a: "a", b: "b" }, c: [1, 2, 3] };

                var goodMeasurements = { a: 1, b: 2 };
                var badMeasurements = { a: "1", b: "2" };

                var test = (props, meas, message) => {
                    var obj = {
                        properties: props,
                        measurements: meas,
                        aiDataContract: {
                            properties: false,
                            measurements: false
                        }
                    };

                    this.throwInternalUserActionableSpy.reset();
                    var result = Microsoft.ApplicationInsights.Serializer.serialize(obj);

                    Assert.ok(result.indexOf("invalid field") < 0, message);
                    Assert.ok(this.throwInternalUserActionableSpy.notCalled, "no user actionable errors");
                };

                test(goodProperties, goodMeasurements, "properties and measurements");
                test(goodProperties, badMeasurements, "properties and string measurements are parsed to floats");
                test(badProperties, goodMeasurements, "bad properties and measurements");
                test(badProperties, badMeasurements, "bad properties and string measurements are parsed to floatss");
                test(goodProperties, undefined, "properties");
                test(badProperties, undefined, "bad properties");
                test(undefined, goodMeasurements, "measurements");
                test(undefined, badMeasurements, "string measurements are parsed to floats");
                test({ "p1": null, "p2": undefined }, { "m1": null, "m2:": undefined }, "null/undefined check for properties/measurements");
            }
        });

        this.testCase({
            name: "SerializerTests: verifying that null and undefined inputs return expected output",
            test: () => {


                var test = (props, meas, expectedOutput) => {
                    var obj = {
                        properties: props,
                        measurements: meas,
                        aiDataContract: {
                            properties: false,
                            measurements: false
                        }
                    };

                    this.throwInternalUserActionableSpy.reset();
                    var result = Microsoft.ApplicationInsights.Serializer.serialize(obj);

                    Assert.equal(expectedOutput, result);
                    Assert.ok(this.throwInternalUserActionableSpy.notCalled, "no user actionable errors");
                };

                test({ "p1": null, "p2": undefined }, { "m1": null, "m2": undefined, "m3": "notanumber" }, "{\"properties\":{\"p1\":\"null\",\"p2\":\"undefined\"},\"measurements\":{\"m1\":\"null\",\"m2\":\"undefined\",\"m3\":\"NaN\"}}");
                var brokenObject = {};
                brokenObject.toString = undefined;
                test({ "p1": brokenObject }, { "m1": 2 }, "{\"properties\":{\"p1\":\"invalid field: toString() is not defined.\"},\"measurements\":{\"m1\":2}}");



            }
        });

    }
}
new SerializerTests().registerTests();  