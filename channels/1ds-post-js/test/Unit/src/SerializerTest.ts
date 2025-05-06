import { AITestClass } from "@microsoft/ai-test-framework";
import { HttpManager } from '../../../src/HttpManager';
import { AppInsightsCore, EventLatency, EventSendType, IEventProperty, SendRequestReason } from '@microsoft/1ds-core-js';
import { PostChannel, IXHROverride, IPayloadData } from '../../../src/Index';
import { IPostTransmissionTelemetryItem, EventBatchNotificationReason, IChannelConfiguration } from '../../../src/DataModels';
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
