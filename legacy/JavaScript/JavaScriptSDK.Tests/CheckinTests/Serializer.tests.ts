/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/Serializer.ts" />

class SerializerTests extends TestClass {

    private throwInternal;

    /** Method called before the start of each test method */
    public testInitialize() {
        this.throwInternal = this.sandbox.spy(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");
    }

    public registerTests() {
        
        this.testCase({
            name: "SerializerTests: empty input",
            test: () => {

                // act
                Microsoft.ApplicationInsights.Serializer.serialize(null);

                // verify
                Assert.ok(this.throwInternal.calledOnce, "throw internal when input is null");
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
                        str: Microsoft.ApplicationInsights.FieldType.Required,
                        noContract: Microsoft.ApplicationInsights.FieldType.Required
                    }
                };

                var expected = '{"str":"str","noContract":{"stillSerializable":"yep"}}';
                var actual = Microsoft.ApplicationInsights.Serializer.serialize(obj);

                // verify
                Assert.equal(expected, actual, "Object is serialized correctly");
                Assert.ok(this.throwInternal.calledOnce, "warning when contract is omitted");
            }
        });

        this.testCase({
            name: "SerializerTests: required objects that are not present throw",
            test: () => {

                // act
                var obj = {
                    aiDataContract: {
                        str: Microsoft.ApplicationInsights.FieldType.Required
                    }
                };

                var expected = "{}";
                var actual = Microsoft.ApplicationInsights.Serializer.serialize(obj);

                // verify
                Assert.equal(expected, actual, "Object is serialized correctly");
                Assert.ok(this.throwInternal.calledOnce, "broken contracts throw");
            }
        });

        this.testCase({
            name: "SerializerTests: serialize an item with an array",
            test: () => {

                // act
                var noCycle = { value: "value", aiDataContract: { value: Microsoft.ApplicationInsights.FieldType.Required } };
                var obj = {
                    arr: [
                        noCycle,
                        noCycle,
                        noCycle
                    ],
                    aiDataContract: { arr: Microsoft.ApplicationInsights.FieldType.Array }
                };
                var expected = '{"arr":[{"value":"value"},{"value":"value"},{"value":"value"}]}';
                var actual = Microsoft.ApplicationInsights.Serializer.serialize(obj);

                // verify
                Assert.equal(expected, actual, "Object is serialized correctly");
                Assert.ok(this.throwInternal.notCalled, "no errors");
            }
        });

        this.testCase({
            name: "SerializerTests: serialize an item which claims to have an array but does not",
            test: () => {

                // act
                var obj = {
                    arr: {},
                    aiDataContract: { arr: Microsoft.ApplicationInsights.FieldType.Array }
                };

                Microsoft.ApplicationInsights.Serializer.serialize(obj);

                // verify
                Assert.ok(this.throwInternal.calledOnce, "one error");
            }
        });

        this.testCase({
            name: "SerializerTests: hidden fields are not serialized",
            test: () => {

                // act
                var obj = {
                    str: "yes!",
                    hiddenStr: "im the invisible man",
                    hiddenStrRequired: "required fields can also be marked as hidden",
                    aiDataContract: {
                        str: Microsoft.ApplicationInsights.FieldType.Required,
                        hiddenStr: Microsoft.ApplicationInsights.FieldType.Hidden,
                        hiddenStrRequired: Microsoft.ApplicationInsights.FieldType.Required | Microsoft.ApplicationInsights.FieldType.Hidden,
                    }
                };

                var expected = '{"str":"yes!"}';
                var actual = Microsoft.ApplicationInsights.Serializer.serialize(obj);

                // verify
                Assert.equal(expected, actual, "Object is serialized correctly");
            }
        });

        this.testCase({
            name: "SerializerTests: serialize a field which has a dynamic required state",
            test: () => {

                // act
                var obj = {
                    str: "required",
                    strOptional: "optional",

                    aiDataContract: {
                        str: { isRequired: () => { return Microsoft.ApplicationInsights.FieldType.Required; } },
                        strOptional: { isRequired: () => { return Microsoft.ApplicationInsights.FieldType.Default; } }
                    }
                };

                var expected = '{"str":"required","strOptional":"optional"}';
                var actual = Microsoft.ApplicationInsights.Serializer.serialize(obj);

                // verify
                Assert.equal(expected, actual, "Object is serialized correctly");
            }
        });

        this.testCase({
            name: "SerializerTests: cycles without contracts are handled",
            test: () => {
                // act
                var cyclePt1 = { value: undefined, aiDataContract: { value: Microsoft.ApplicationInsights.FieldType.Required } };
                var cyclePt2 = { value: cyclePt1, aiDataContract: { value: Microsoft.ApplicationInsights.FieldType.Required } };
                cyclePt1.value = cyclePt2;
                var obj = {
                    noContractWithCycle: {
                        notSerializable: cyclePt1
                    },
                    aiDataContract: {
                        noContractWithCycle: Microsoft.ApplicationInsights.FieldType.Required,
                    }
                };

                Microsoft.ApplicationInsights.Serializer.serialize(obj);

                // verify
                Assert.ok(this.throwInternal.calledTwice, "user actionable error is thrown");
                var error = this.throwInternal.args[0][2];
                Assert.equal("Attempting to serialize an object which does not implement ISerializable", error);
            }
        });

        this.testCase({
            name: "SerializerTests: cycles with contracts are handled",
            test: () => {
                // act
                var cyclePt1 = { value: undefined, aiDataContract: { value: Microsoft.ApplicationInsights.FieldType.Required } };
                var cyclePt2 = { value: cyclePt1, aiDataContract: { value: Microsoft.ApplicationInsights.FieldType.Required } };
                cyclePt1.value = cyclePt2;
                var obj = {
                    aCycleWithContract: cyclePt1,
                    aiDataContract: {
                        aCycleWithContract: Microsoft.ApplicationInsights.FieldType.Required,
                    }
                };

                Microsoft.ApplicationInsights.Serializer.serialize(obj);

                // verify
                Assert.ok(this.throwInternal.calledOnce, "error is thrown");
                var error = this.throwInternal.args[0][2];
                Assert.equal("Circular reference detected while serializing object", error, "invalid error message");
            }
        });

        this.testCase({
            name: "SerializerTests: object not present in the contract are not serialized",
            test: () => {

                // act
                var obj = {
                    str: "str",
                    notInContract: "notInContract",
                    aiDataContract: {
                        str: Microsoft.ApplicationInsights.FieldType.Required,
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
                        str: Microsoft.ApplicationInsights.FieldType.Required
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
                Assert.ok(this.throwInternal.notCalled, "no errors");
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
                            properties: Microsoft.ApplicationInsights.FieldType.Default,
                            measurements: Microsoft.ApplicationInsights.FieldType.Default
                        }
                    };

                    this.throwInternal.reset();
                    var result = Microsoft.ApplicationInsights.Serializer.serialize(obj);

                    Assert.ok(result.indexOf("invalid field") < 0, message);
                    Assert.ok(this.throwInternal.notCalled, "no errors");
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
                            properties: Microsoft.ApplicationInsights.FieldType.Default,
                            measurements: Microsoft.ApplicationInsights.FieldType.Default,
                        }
                    };

                    this.throwInternal.reset();
                    var result = Microsoft.ApplicationInsights.Serializer.serialize(obj);

                    Assert.equal(expectedOutput, result);
                    Assert.ok(this.throwInternal.notCalled, "no user actionable errors");
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