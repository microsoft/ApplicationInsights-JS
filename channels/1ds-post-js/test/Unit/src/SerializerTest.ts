import { AITestClass } from "@microsoft/ai-test-framework";
import { HttpManager } from '../../../src/HttpManager';
import { AppInsightsCore, EventLatency, IEventProperty } from '@microsoft/1ds-core-js';
import { PostChannel, IXHROverride, IPayloadData } from '../../../src/Index';
import { IPostTransmissionTelemetryItem, EventBatchNotificationReason } from '../../../src/DataModels';
import { Serializer } from '../../../src/Serializer';


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
