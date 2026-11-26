import { AITestClass } from "@microsoft/ai-test-framework";
import {
    DiagnosticLogger, EventLatency, EventSendType, IEventProperty, SendRequestReason, _eInternalMessageId
} from '@microsoft/applicationinsights-core-js';
import { objDeepFreeze } from "@nevware21/ts-utils";
import { IChannelConfiguration, IPostTransmissionTelemetryItem } from '../../../src/DataModels';
import { Serializer } from '../../../src/Serializer';
import { EventBatch } from "../../../src/EventBatch";


export class SerializerTest extends AITestClass {

    constructor(name?: string, emulateEs3?: boolean) {
        super(name, emulateEs3);
        
        this.assertNoEvents = true;
        this.assertNoHooks = true;
    }

    public registerTests() {

        this.testCase({
            name: "getEventBlob serializes deeply frozen data without changing it",
            test: () => {
                let event = objDeepFreeze({
                    name: "frozen",
                    ext: { app: { route: { id: "home" } } },
                    baseData: { "navigation.route": { id: 42 } },
                    data: { state: { tag: { value: 123, kind: 13 }, counts: [1, 2] } }
                });
                let serializer = new Serializer(null, null, false, true);
                let blob = serializer.getEventBlob(event);

                QUnit.assert.ok(blob, "The frozen event was not dropped");
                let parsed = JSON.parse(blob);
                QUnit.assert.deepEqual(parsed.ext.app, { route: { id: "home" } });
                QUnit.assert.deepEqual(parsed.data.baseData.navigation, { route: { id: 42 } });
                QUnit.assert.deepEqual(parsed.data.state, { tag: "123", counts: [1, 2] });
                QUnit.assert.deepEqual(parsed.ext.metadata.f.baseData.f.navigation.f.route.f.id, { t: 6 });
                QUnit.assert.deepEqual(parsed.ext.metadata.f.state.f.tag, { t: 417 });
                QUnit.assert.deepEqual(event.data.state.tag, { value: 123, kind: 13 });
            }
        });

        this.testCase({
            name: "getEventBlob serializes frozen class fields and respects custom JSON",
            test: () => {
                class State {
                    public id = "home";
                    public tag = { value: 42, kind: 13 };
                }
                class Label {
                    public id = "label";
                    public toJSON(key: string) {
                        return this.id + ":" + key;
                    }
                }

                let state = objDeepFreeze(new State());
                let event = {
                    name: "frozen",
                    ext: {},
                    data: { state, nested: { state }, label: objDeepFreeze(new Label()), time: new Date(0) }
                };
                let blob = new Serializer().getEventBlob(event);

                QUnit.assert.ok(blob, "The frozen instance did not cause the event to be dropped");
                let parsed = JSON.parse(blob);
                QUnit.assert.deepEqual(parsed.data.state, { id: "home", tag: "42" });
                QUnit.assert.deepEqual(parsed.data.nested.state, parsed.data.state);
                QUnit.assert.deepEqual(parsed.ext.metadata.f.state.f.tag, { t: 417 });
                QUnit.assert.strictEqual(state.tag.value, 42, "Sanitization did not change the input");
                QUnit.assert.strictEqual(parsed.data.label, "label:label");
                QUnit.assert.strictEqual(parsed.data.time, "1970-01-01T00:00:00.000Z");
            }
        });

        this.testCase({
            name: "getEventBlob preserves non-enumerable toJSON on nested records",
            test: () => {
                let label = { id: "home" };
                Object.defineProperty(label, "toJSON", {
                    value: function (key: string) { return this.id + ":" + key; }
                });
                let event = objDeepFreeze({
                    name: "nested",
                    data: { state: { label, labels: [label] } }
                });

                let parsed = JSON.parse(new Serializer().getEventBlob(event));
                QUnit.assert.deepEqual(parsed.data.state, { label: "home:label", labels: ["home:0"] });
            }
        });

        this.testCase({
            name: "appendPayload reports serialization errors and drops only the failed event",
            test: () => {
                let logger = new DiagnosticLogger({ enableDebug: true });
                this.onDone(() => logger.unload(false));
                let report = this.sandbox.spy(logger, "throwInternal");
                let serializer = new Serializer(null, null, null, null, null, null, null, logger);
                let bad = { name: "bad", data: { get broken() { throw new Error("Unreadable field"); } } };
                let good = { name: "good" };
                let batch = EventBatch.create("1234-5678", [bad, good]);
                let payload = serializer.createPayload(0, false, false, false, SendRequestReason.NormalSchedule, EventSendType.Batched);

                serializer.appendPayload(payload, batch, 10);

                QUnit.assert.ok(report.calledOnce, "The failure was reported once");
                QUnit.assert.strictEqual(report.firstCall.args[1], _eInternalMessageId.CannotSerializeObject);
                QUnit.assert.ok(report.firstCall.args[2].indexOf("Unreadable field") !== -1, "The diagnostic includes the exception");
                QUnit.assert.strictEqual(payload.numEvents, 1);
                QUnit.assert.strictEqual(JSON.parse(payload.payloadBlob).name, "good");
                QUnit.assert.deepEqual(batch.events(), [good]);
                QUnit.assert.strictEqual(payload.failedEvts.length, 1);
                QUnit.assert.strictEqual(payload.failedEvts[0].events()[0], bad);
                QUnit.assert.strictEqual(payload.sizeExceed.length, 0);
            }
        });

        this.testCase({
            name: 'getEventBlob with compoundKey support',
            test: () => {
                let serializer = new Serializer(null, null, null, true);
                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    iKey: "1234-5678",
                    latency: EventLatency.Normal,       // Should not get serialized
                    data: {
                        'testObject.testProperty': 456
                    },
                    baseData: {},
                };
                let serializedEvent = serializer.getEventBlob(event);

                QUnit.assert.equal(serializedEvent, '{\"name\":\"testEvent\",\"iKey\":\"o:1234\",\"data\":{\"baseData\":{},\"testObject\":{\"testProperty\":456}}}');
            }
        });

        this.testCase({
            name: "Append payload with max number per batch",
            test: () => {
                let maxNumberEvtPerBatch = 3;
                let serializer = new Serializer(null, null, null, false, null, null);
                let ikey = "1234-5678";
                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    iKey: ikey,
                    latency: EventLatency.Normal,       // Should not get serialized
                    data: {
                        "testObject.testProperty": 456
                    },
                    baseData: {}
                };
                let event1: IPostTransmissionTelemetryItem = {
                    name: "testEvent1",
                    iKey: ikey,
                    latency: EventLatency.Normal,       // Should not get serialized
                    data: {
                        "testObject.testProperty": 456
                    },
                    baseData: {}
                };
    
                let payload = serializer.createPayload(0, false, false, false, SendRequestReason.NormalSchedule, EventSendType.Batched);
                let batch = EventBatch.create(ikey, [event, event1]);
                serializer.appendPayload(payload, batch, maxNumberEvtPerBatch);
                let evts = payload.payloadBlob;
                let expectedPayload = "{\"name\":\"testEvent\",\"iKey\":\"o:1234\",\"data\":{\"baseData\":{},\"testObject.testProperty\":456}}" + "\n" +
                "{\"name\":\"testEvent1\",\"iKey\":\"o:1234\",\"data\":{\"baseData\":{},\"testObject.testProperty\":456}}"
                QUnit.assert.equal(evts, expectedPayload, "should contain both events");
                let overflow = payload.overflow;
                QUnit.assert.equal(overflow, null, "should not have overflow batch");
                let sizeExceed = payload.sizeExceed;
                QUnit.assert.equal(sizeExceed.length, 0, "should not have size exceed batch");
            }
        });

        this.testCase({
            name: "Append payload with exceed max number per batch",
            test: () => {
                let maxNumberEvtPerBatch = 1;
                let serializer = new Serializer(null, null, null, false, null, null);
                let ikey = "1234-5678";
                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    iKey: ikey,
                    latency: EventLatency.Normal,       // Should not get serialized
                    data: {
                        "testObject.testProperty": 456
                    },
                    baseData: {}
                };
                let event1: IPostTransmissionTelemetryItem = {
                    name: "testEvent1",
                    iKey: ikey,
                    latency: EventLatency.Normal,       // Should not get serialized
                    data: {
                        "testObject.testProperty": 456
                    },
                    baseData: {}
                };
    
                let payload = serializer.createPayload(0, false, false, false, SendRequestReason.NormalSchedule, EventSendType.Batched);
                let batch = EventBatch.create(ikey, [event, event1]);
                serializer.appendPayload(payload, batch, maxNumberEvtPerBatch);
                let evts = payload.payloadBlob;
                let expectedPayload = "{\"name\":\"testEvent\",\"iKey\":\"o:1234\",\"data\":{\"baseData\":{},\"testObject.testProperty\":456}}";
                QUnit.assert.equal(evts, expectedPayload, "should contain both events");
                let overflow = payload.overflow;
                QUnit.assert.equal(overflow.count(), 1, "should have only one overflow batch");
                let overflowEvts = overflow.events();
                QUnit.assert.equal(overflowEvts.length, 1, "should have only one overflow event");
                QUnit.assert.equal(overflowEvts[0], event1, "overflow should have event1");
                let sizeExceed = payload.sizeExceed;
                QUnit.assert.equal(sizeExceed.length, 0, "should not have size exceed batch");
            }
        });

        this.testCase({
            name: "Append payload with size limit channel config",
            test: () => {
                let cfg = {
                    requestLimit: {
                        requestLimit: [200, 200],
                        recordLimit: [200,200]
                    }
                } as IChannelConfiguration
                let serializer = new Serializer(null, null, null, false, null, null, cfg);
                let ikey = "1234-5678";
                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    iKey: ikey,
                    latency: EventLatency.Normal,       // Should not get serialized
                    data: {
                        "testObject.testProperty": 456
                    },
                    baseData: {}
                };
                let event1: IPostTransmissionTelemetryItem = {
                    name: "testEvent1",
                    iKey: ikey,
                    latency: EventLatency.Normal,       // Should not get serialized
                    data: {
                        "testObject.testProperty": 456
                    },
                    baseData: {}
                };
    
                let payload = serializer.createPayload(0, false, false, false, SendRequestReason.NormalSchedule, EventSendType.Batched);
                let batch = EventBatch.create(ikey, [event, event1]);
                serializer.appendPayload(payload, batch, 100);
                let evts = payload.payloadBlob;
                let expectedPayload = "{\"name\":\"testEvent\",\"iKey\":\"o:1234\",\"data\":{\"baseData\":{},\"testObject.testProperty\":456}}" + "\n" +
                "{\"name\":\"testEvent1\",\"iKey\":\"o:1234\",\"data\":{\"baseData\":{},\"testObject.testProperty\":456}}"
                QUnit.assert.equal(evts, expectedPayload, "should contain both events");
                let overflow = payload.overflow;
                QUnit.assert.equal(overflow, null, "should not have overflow batch");
                let sizeExceed = payload.sizeExceed;
                QUnit.assert.equal(sizeExceed.length, 0, "should not have size exceed batch");
            }
        });


        this.testCase({
            name: "Append overflow payload with size limit channel config",
            test: () => {
                let cfg = {
                    requestLimit: {
                        recordLimit: [100,100],
                        requestLimit: [100, 100]
                    }
                } as IChannelConfiguration
                let serializer = new Serializer(null, null, null, false, null, null, cfg);
                let ikey = "1234-5678";
                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    iKey: ikey,
                    latency: EventLatency.Normal,       // Should not get serialized
                    data: {
                        "testObject.testProperty": 456
                    },
                    baseData: {}
                };
                let event1: IPostTransmissionTelemetryItem = {
                    name: "testEvent1",
                    iKey: ikey,
                    latency: EventLatency.Normal,       // Should not get serialized
                    data: {
                        "testObject.testProperty": 456
                    },
                    baseData: {}
                };
    
                let payload = serializer.createPayload(0, false, false, false, SendRequestReason.NormalSchedule, EventSendType.Batched);
                let batch = EventBatch.create(ikey, [event, event1]);
                serializer.appendPayload(payload, batch, 100);
                let evts = payload.payloadBlob;
                QUnit.assert.equal(evts, "{\"name\":\"testEvent\",\"iKey\":\"o:1234\",\"data\":{\"baseData\":{},\"testObject.testProperty\":456}}", "should contain only one event");
                let overflow = payload.overflow;
                QUnit.assert.equal(overflow.count(), 1, "should have only one overflow batch");
                let overflowEvts = overflow.events();
                QUnit.assert.equal(overflowEvts.length, 1, "should have only one overflow event");
                QUnit.assert.equal(overflowEvts[0], event1, "overflow should have event1");
            }
        });


        this.testCase({
            name: "Append exceed size payload with size limit channel config",
            test: () => {
                let cfg = {
                    requestLimit: {
                        recordLimit: [100,100],
                        requestLimit: [100, 100]
                    }
                } as IChannelConfiguration
                let serializer = new Serializer(null, null, null, false, null, null, cfg);
                let ikey = "1234-5678";
                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    iKey: ikey,
                    latency: EventLatency.Normal,       // Should not get serialized
                    data: {
                        "testObject.testProperty": 456
                    },
                    baseData: {}
                };
                let largEvent: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    iKey: ikey,
                    latency: EventLatency.Normal,       // Should not get serialized
                    data: {
                        "testObject.testProperty": new Array(100).join("a")
                    },
                    baseData: {}
                };
                let payload = serializer.createPayload(0, false, false, false, SendRequestReason.NormalSchedule, EventSendType.Batched);
                let largeBatch = EventBatch.create(ikey, [event, largEvent]);
                serializer.appendPayload(payload, largeBatch, 100);
                let evts = payload.payloadBlob;
                QUnit.assert.equal(evts, "{\"name\":\"testEvent\",\"iKey\":\"o:1234\",\"data\":{\"baseData\":{},\"testObject.testProperty\":456}}", "should have only one overflow batch");
                let sizeExceed = payload.sizeExceed;
                QUnit.assert.equal(sizeExceed.length, 1, "should have only one payload with size exceed");
                let sizeExceedBatch = sizeExceed[0];
                QUnit.assert.equal(sizeExceedBatch.count(), 1, "exceed Batch should have only one event");
                let sizeExceedEvts = sizeExceedBatch.events();
                QUnit.assert.equal(sizeExceedEvts[0], largEvent, "exceed batch should only contain large event")
            }
        });

        this.testCase({
            name: 'getEventBlob without compoundKey support',
            test: () => {
                let serializer = new Serializer(null, null, null, false);
                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    iKey: "1234-5678",
                    latency: EventLatency.Normal,       // Should not get serialized
                    data: {
                        'testObject.testProperty': 456
                    },
                    baseData: {},
                };
                let serializedEvent = serializer.getEventBlob(event);

                QUnit.assert.equal(serializedEvent, '{\"name\":\"testEvent\",\"iKey\":\"o:1234\",\"data\":{\"baseData\":{},\"testObject.testProperty\":456}}');
            }
        });

        this.testCase({
            name: 'metadata with event property with compoundKey support',
            test: () => {
                let serializer = new Serializer(null, null, null, true);

                let testProperty: IEventProperty = {
                    value: "testValue",
                    kind: 13, //Pii_IPV4AddressLegacy
                    propertyType: 1 //String
                };
                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    baseData: {
                        'testProperty': testProperty
                    },
                    data: {
                        'testPartC': 123,
                        'testObject.testProperty': 456
                    },
                    ext: {}
                };
                let serializedEvent = serializer.getEventBlob(event);
                let parsedEvent = JSON.parse(serializedEvent);
                let expectedMetaData: any = {
                    f: {
                        baseData: {
                            f: {
                                testProperty: { t: 417 }
                            }
                        },
                        testPartC: { t: 6 },
                        testObject: {
                            f: {
                                testProperty: { t: 6 }
                            }
                        }
                    }
                };

                let metaData = JSON.stringify(parsedEvent.ext.metadata);
                QUnit.assert.equal(metaData, JSON.stringify(expectedMetaData), 'Checking: ' + metaData);
            }
        });

        this.testCase({
            name: 'metadata with event property without compoundKey support',
            test: () => {
                let serializer = new Serializer(null, null, null, false);

                let testProperty: IEventProperty = {
                    value: "testValue",
                    kind: 13, //Pii_IPV4AddressLegacy
                    propertyType: 1 //String
                };
                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    baseData: {
                        'testProperty': testProperty
                    },
                    data: {
                        'testPartC': 123,
                        'testObject.testProperty': 456
                    },
                    ext: {}
                };
                let serializedEvent = serializer.getEventBlob(event);
                let parsedEvent = JSON.parse(serializedEvent);
                let expectedMetaData: any = {
                    f: {
                        baseData: {
                            f: {
                                testProperty: { t: 417 }
                            }
                        },
                        testPartC: { t: 6 },
                        'testObject.testProperty': { t: 6 }
                    }
                };

                let metaData = JSON.stringify(parsedEvent.ext.metadata);
                QUnit.assert.equal(metaData, JSON.stringify(expectedMetaData), 'Checking: ' + metaData);
            }
        });

        this.testCase({
            name: 'nested elements metadata',
            test: () => {
                let serializer = new Serializer();
                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    baseData: {
                        "testProperty": {
                            "testA": 123,
                            "testB": "test"
                        }
                    },
                    data: {
                        "testProperty2": 123,
                        "testPartCNested": {
                            "testC": {
                                "testD": {
                                    "test": 456
                                }
                            }
                        }
                    },
                    ext: {}
                };

                let serializedEvent = serializer.getEventBlob(event);
                let parsedEvent = JSON.parse(serializedEvent);

                let expectedMetaData: any = {
                    f: {
                        baseData: {
                            f: {
                                testProperty: {
                                    f: {
                                        testA: { t: 6 }
                                    }
                                }
                            }
                        },
                        testProperty2: { t: 6 },
                        testPartCNested: {
                            f: {
                                testC: {
                                    f: {
                                        testD: {
                                            f: {
                                                test: { t: 6 }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
                
                let metaData = JSON.stringify(parsedEvent.ext.metadata);
                QUnit.assert.equal(metaData, JSON.stringify(expectedMetaData), 'Checking: ' + metaData);
            }
        });

        this.testCase({
            name: 'array metadata',
            test: () => {
                let serializer = new Serializer();
                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    baseData: {
                        "testProperty": {
                            "testA": ["test1", "test2", "test3"]
                        }
                    },
                    data: {
                        "testProperty2": [1, 2, 3, 4]
                    },
                    ext: {}
                };
                let serializedEvent = serializer.getEventBlob(event);
                let parsedEvent = JSON.parse(serializedEvent);

                let expectedMetaData: any = {
                    f: {
                        testProperty2: {
                            a: { t: 6 }
                        }
                    }
                };

                let metaData = JSON.stringify(parsedEvent.ext.metadata);
                QUnit.assert.equal(metaData, JSON.stringify(expectedMetaData), 'Checking: ' + metaData);
            }
        });

        this.testCase({
            name: 'excluded metadata with event property with compoundKey support',
            test: () => {
                let serializer = new Serializer(undefined, undefined, undefined, true, undefined, true);

                let testProperty: IEventProperty = {
                    value: "testValue",
                    kind: 13, //Pii_IPV4AddressLegacy
                    propertyType: 1 //String
                };
                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    baseData: {
                        'testProperty': testProperty
                    },
                    data: {
                        'testPartC': 123,
                        'testObject.testProperty': 456
                    },
                    ext: {}
                };
                let serializedEvent = serializer.getEventBlob(event);
                let parsedEvent = JSON.parse(serializedEvent);
                QUnit.assert.equal(parsedEvent.ext.metadata, undefined, 'Checking: Meta Data was not included');
            }
        });

        this.testCase({
            name: 'exclude metadata with event property without compoundKey support',
            test: () => {
                let serializer = new Serializer(undefined, undefined, undefined, false, undefined, true);

                let testProperty: IEventProperty = {
                    value: "testValue",
                    kind: 13, //Pii_IPV4AddressLegacy
                    propertyType: 1 //String
                };
                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    baseData: {
                        'testProperty': testProperty
                    },
                    data: {
                        'testPartC': 123,
                        'testObject.testProperty': 456
                    },
                    ext: {}
                };
                let serializedEvent = serializer.getEventBlob(event);
                let parsedEvent = JSON.parse(serializedEvent);
                QUnit.assert.equal(parsedEvent.ext.metadata, undefined, 'Checking: Meta Data was not included');
            }
        });

        this.testCase({
            name: 'nested elements excluding metadata',
            test: () => {
                let serializer = new Serializer(undefined, undefined, undefined, undefined, undefined, true);
                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    baseData: {
                        "testProperty": {
                            "testA": 123,
                            "testB": "test"
                        }
                    },
                    data: {
                        "testProperty2": 123,
                        "testPartCNested": {
                            "testC": {
                                "testD": {
                                    "test": 456
                                }
                            }
                        }
                    },
                    ext: {}
                };

                let serializedEvent = serializer.getEventBlob(event);
                let parsedEvent = JSON.parse(serializedEvent);
                QUnit.assert.equal(parsedEvent.ext.metadata, undefined, 'Checking: Meta Data was not included');
            }
        });

        this.testCase({
            name: 'array excluding metadata',
            test: () => {
                let serializer = new Serializer(undefined, undefined, undefined, undefined, undefined, true);
                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    baseData: {
                        "testProperty": {
                            "testA": ["test1", "test2", "test3"]
                        }
                    },
                    data: {
                        "testProperty2": [1, 2, 3, 4]
                    },
                    ext: {}
                };
                let serializedEvent = serializer.getEventBlob(event);
                let parsedEvent = JSON.parse(serializedEvent);
                QUnit.assert.equal(parsedEvent.ext.metadata, undefined, 'Checking: Meta Data was not included');
            }
        });

    }
}
