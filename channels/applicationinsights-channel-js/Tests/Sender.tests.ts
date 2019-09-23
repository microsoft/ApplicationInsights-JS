/// <reference path="./TestFramework/Common.ts" />
import { Sender } from "../src/Sender";
import { Offline } from '../src/Offline';
import { EnvelopeCreator } from '../src/EnvelopeCreator';
import { Exception, CtxTagKeys, Util } from "@microsoft/applicationinsights-common";
import { ITelemetryItem, AppInsightsCore, ITelemetryPlugin, DiagnosticLogger } from "@microsoft/applicationinsights-core-js";

export class SenderTests extends TestClass {
    private _sender: Sender;
    private _instrumentationKey = 'iKey';

    public testInitialize() {
        this._sender = new Sender();
        this._sender.initialize({ instrumentationKey: this._instrumentationKey }, new AppInsightsCore(), []);
    }

    public testCleanup() {
        this._sender = null;
    }

    public registerTests() {

        this.testCase({
            name: "Channel Config: Channel can properly take args from root config",
            test: () => {
                this._sender.initialize(
                    {
                        instrumentationKey: 'abc',
                        maxBatchInterval: 123,
                        endpointUrl: 'https://example.com',
                        maxBatchSizeInBytes: 654,
                        extensionConfig: {
                            [this._sender.identifier]: {
                                maxBatchSizeInBytes: 456
                            }
                        }

                    }, new AppInsightsCore(), []
                );

                Assert.equal(123, this._sender._config.maxBatchInterval(), 'Channel config can be set from root config (maxBatchInterval)');
                Assert.equal('https://example.com', this._sender._config.endpointUrl(), 'Channel config can be set from root config (endpointUrl)');
                Assert.notEqual(654, this._sender._config.maxBatchSizeInBytes(), 'Channel config does not equal root config option if extensionConfig field is also set');
                Assert.equal(456, this._sender._config.maxBatchSizeInBytes(), 'Channel config prioritizes extensionConfig over root config');
            }
        });

        this.testCase({
            name: "processTelemetry can be called with optional fields undefined",
            test: () => {
                this._sender.initialize({
                    instrumentationKey: 'abc'
                }, new AppInsightsCore(), []);

                const loggerSpy = this.sandbox.stub(this._sender, "_setupTimer");
                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };
                try {
                    this._sender.processTelemetry(telemetryItem);
                } catch(e) {
                    Assert.ok(false);
                }

                Assert.ok(loggerSpy.calledOnce);
            }
        })

        this.testCase({
            name: "telemetry is not send when legacy telemetry initializer returns false",
            test: () => {
                const cr = new AppInsightsCore();
                cr.logger = new DiagnosticLogger({instrumentationKey: "ikey"});
                this._sender.initialize({
                    instrumentationKey: 'abc'
                }, cr, []);

                const nextPlugin = <ITelemetryPlugin> {
                    identifier: "foo",
                    processTelemetry: (it) => {},
                    priority: 200,
                    setNextPlugin: (it) => {}
                };
                this._sender.setNextPlugin(nextPlugin);

                const processTelemetrySpy = this.sandbox.stub((this._sender as any)._nextPlugin, "processTelemetry");
                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {},
                    tags: [
                    ]
                };

                telemetryItem.tags["ProcessLegacy"] = [e => true, e => false, f=> true];
                try {
                    this._sender.processTelemetry(telemetryItem);
                } catch(e) {
                    Assert.ok(false);
                }

                Assert.ok(!processTelemetrySpy.calledOnce);
            }
        });

        this.testCase({
            name: 'BeaconAPI is not used when isBeaconApiDisabled flag is true',
            test: () => {
                if (!navigator.sendBeacon) {
                    navigator['sendBeacon'] = (url: string, data?: any) => true;
                }
                const sender = new Sender();
                const cr = new AppInsightsCore();

                const xhrSenderSpy = this.sandbox.stub(sender, "_xhrSender");
                const beaconSenderSpy = this.sandbox.stub(navigator, "sendBeacon");

                sender.initialize({
                    instrumentationKey: 'abc',
                    isBeaconApiDisabled: true
                }, cr, []);

                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                Assert.ok(Util.IsBeaconApiSupported(), "Beacon API is supported");
                Assert.ok(beaconSenderSpy.notCalled, "Beacon API was not called before");
                Assert.ok(xhrSenderSpy.notCalled, "xhr sender was not called before");

                try {
                    sender.processTelemetry(telemetryItem);
                    sender.flush();
                } catch(e) {
                    Assert.ok(false);
                }

                Assert.ok(beaconSenderSpy.notCalled, "Beacon API is disabled, Beacon API is not called");
                Assert.ok(xhrSenderSpy.called, "xhr sender is called when Beacon API is disabled");
            }
        });

        this.testCase({
            name: 'beaconSender is called when isBeaconApiDisabled flag is false',
            test: () => {
                if (!navigator.sendBeacon) {
                    navigator['sendBeacon'] = (url: string, data?: any) => true;
                }

                const cr = new AppInsightsCore();
                const sender = new Sender();

                const beaconSenderSpy = this.sandbox.stub(navigator, "sendBeacon", (a, b) => true);
                const xhrSenderSpy = this.sandbox.spy(sender, "_xhrSender");

                sender.initialize({
                    instrumentationKey: 'abc',
                    isBeaconApiDisabled: false
                }, cr, []);

                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                Assert.ok(Util.IsBeaconApiSupported(), "Beacon API is supported");
                Assert.ok(beaconSenderSpy.notCalled, "Beacon API was not called before");
                Assert.ok(xhrSenderSpy.notCalled, "xhr sender was not called before");

                try {
                    sender.processTelemetry(telemetryItem);
                    sender.flush();
                } catch(e) {
                    Assert.ok(false);
                }

                Assert.ok(xhrSenderSpy.notCalled, "xhr sender is not called when Beacon API is enabled");
                Assert.ok(beaconSenderSpy.called, "Beacon API is enabled, Beacon API is called");
            }
        });

        this.testCase({
            name: 'BeaconAPI is not used when isBeaconApiDisabled flag is false but payload size is over 64k, fall off to xhr sender',
            test: () => {
                if (!navigator.sendBeacon) {
                    navigator['sendBeacon'] = (url: string, data?: any) => true;
                }
                const sender = new Sender();
                const cr = new AppInsightsCore();
                cr["logger"] = new DiagnosticLogger();
                const MAX_PROPERTIES_SIZE = 8000;
                const payload = new Array(MAX_PROPERTIES_SIZE).join('a');

                const beaconSenderSpy = this.sandbox.stub(navigator, "sendBeacon", (a, b) => false);
                const xhrSenderSpy = this.sandbox.spy(sender, "_xhrSender");

                sender.initialize({
                    instrumentationKey: 'abc',
                    isBeaconApiDisabled: false
                }, cr, []);

                const telemetryItems: ITelemetryItem[] = [];
                for (let i = 0; i < 8; i ++) {
                    const telemetryItem: ITelemetryItem = {
                        name: 'fake item',
                        iKey: 'iKey',
                        baseType: 'some type',
                        baseData: {},
                        data: {
                            properties: {
                                payload
                            }
                        }
                    };
                    telemetryItems[i] = telemetryItem;
                }


                Assert.ok(Util.IsBeaconApiSupported(), "Beacon API is supported");
                Assert.ok(beaconSenderSpy.notCalled, "Beacon API was not called before");
                Assert.ok(xhrSenderSpy.notCalled, "xhr sender was not called before");

                try {
                    for (let i = 0; i < 8; i++) {
                        sender.processTelemetry(telemetryItems[i]);
                    }
                    sender.flush();
                } catch(e) {
                    Assert.ok(false);
                }

                Assert.ok(beaconSenderSpy.called, "Beacon API is enabled but payload is over size, Beacon API is called");
                Assert.ok(xhrSenderSpy.called, "xhr sender is called when payload is over size");
            }
        });

        this.testCase({
            name: "AppInsightsTests: AppInsights Envelope created for Custom Event",
            test: () => {
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    ext: {
                        app: {
                            sesId: "d041d2e5fa834b4f9eee41ac163bf402"
                        },
                        device: {
                            deviceClass: "Browser",
                            localId: "browser"
                        }

                    },
                    tags: [{"ai.internal.sdkVersion": "javascript:2.2.4"}],
                    data: {
                        "property1": "val1",
                        "measurement1": 50.0,
                        "measurement2": 1.3,
                        "property2": "val2"
                    },
                    baseData: {
                        "name": "Event Name"
                    }
                };
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null);

                const baseData = appInsightsEnvelope.data.baseData;

                // Assert measurements
                const resultMeasurements = baseData.measurements;
                Assert.ok(resultMeasurements);
                Assert.ok(resultMeasurements["measurement1"]);
                Assert.equal(50.0, resultMeasurements["measurement1"]);
                Assert.ok(resultMeasurements["measurement2"]);
                Assert.equal(1.3, resultMeasurements["measurement2"]);

                // Assert custom properties
                Assert.ok(baseData.properties);
                Assert.equal("val1", baseData.properties["property1"]);
                Assert.equal("val2", baseData.properties["property2"]);

                // Assert Event name
                Assert.ok(baseData.name);
                Assert.equal("Event Name", baseData.name);

                // Assert ver
                Assert.ok(baseData.ver);
                Assert.equal(2, baseData.ver);

                // Assert baseType added by default
                Assert.ok(appInsightsEnvelope.data.baseType);
                Assert.equal("EventData", appInsightsEnvelope.data.baseType);

                // Assert tags
                Assert.ok(appInsightsEnvelope.tags);
                Assert.equal("d041d2e5fa834b4f9eee41ac163bf402", appInsightsEnvelope.tags["ai.session.id"]);
                Assert.equal("browser", appInsightsEnvelope.tags["ai.device.id"]);
                Assert.equal("Browser", appInsightsEnvelope.tags["ai.device.type"]);
                Assert.equal("javascript:2.2.4", appInsightsEnvelope.tags["ai.internal.sdkVersion"]);

                // Assert name
                Assert.ok(appInsightsEnvelope.name);
                Assert.equal("Microsoft.ApplicationInsights.iKey.Event", appInsightsEnvelope.name);

                // Assert iKey
                Assert.ok(appInsightsEnvelope.iKey);
                Assert.equal("iKey", appInsightsEnvelope.iKey);

                // Assert timestamp
                Assert.ok(appInsightsEnvelope.time);
            }
        });

        this.testCase({
            name: "AppInsightsTests: AppInsights Envelope  unknown type returns custom Event data type",
            test: () => {
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    ext: {
                        "ai.session.id": "d041d2e5fa834b4f9eee41ac163bf402",
                        "ai.device.id": "browser",
                        "ai.device.type": "Browser",
                    },
                    tags: [{}],
                    data: {
                        "property1": "val1",
                        "measurement1": 50.0,
                        "measurement2": 1.3,
                        "property2": "val2"
                    },
                    baseType: "PageUnloadData",
                    baseData: {
                        id: "EADE2F09-DEBA-4B60-A222-E1D80BB8AA7F",
                        vpHeight: 1002,
                        vScrollOffset: 292
                    }
                };
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null);
                const baseData = appInsightsEnvelope.data.baseData;

                // Assert measurements
                const resultMeasurements = baseData.measurements;
                Assert.ok(resultMeasurements);
                Assert.ok(resultMeasurements["measurement1"]);
                Assert.equal(50.0, resultMeasurements["measurement1"]);
                Assert.ok(resultMeasurements["measurement2"]);
                Assert.equal(1.3, resultMeasurements["measurement2"]);
                Assert.ok(resultMeasurements["vpHeight"]);
                Assert.equal(1002, resultMeasurements["vpHeight"]);
                Assert.ok(resultMeasurements["vScrollOffset"]);
                Assert.equal(292, resultMeasurements["vScrollOffset"]);

                // Assert custom properties
                Assert.ok(baseData.properties);
                Assert.equal("val1", baseData.properties["property1"]);
                Assert.equal("val2", baseData.properties["property2"]);
                Assert.equal("EADE2F09-DEBA-4B60-A222-E1D80BB8AA7F", baseData.properties["id"]);

                // Assert Event name
                Assert.ok(baseData.name);
                Assert.equal("PageUnloadData", baseData.properties['baseTypeSource']);

                // Assert ver
                Assert.ok(baseData.ver);
                Assert.equal(2, baseData.ver);

                Assert.equal("javascript:2.2.4", appInsightsEnvelope.tags["ai.internal.sdkVersion"]);

            }
        })

        this.testCase({
            name: "AppInsightsTests: AppInsights Envelope create for Dependency Data",
            test: () => {
                // setup
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    ext: {
                        "user" : {
                            "localId": "TestId",
                            "authId": "AuthenticatedId",
                            "id": "TestId"
                        }
                    },
                    tags: [{"ai.user.accountId": "TestAccountId"},
                           {"ai.location.ip": "10.22.8.2"}],
                    baseType: "RemoteDependencyData",
                    baseData: {
                        id: 'some id',
                        name: "Some name given",
                        success: true,
                        responseCode: 200,
                        duration: 123,
                        type: 'Fetch',
                        data: 'some data',
                        target: 'https://example.com/test/name?q=bar',
                        correlationContext: "cid-v1:foo"
                    },
                    data: {
                        property1: "val1",
                        property2: "val2",
                        measurement1: 50.0,
                        measurement2: 1.3
                    }

                }

                // act
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null);
                const { baseData } = appInsightsEnvelope.data;

                // assert
                const resultDuration = baseData.duration;
                Assert.equal("00:00:00.123", resultDuration);

                // Assert measurements
                const resultMeasurements = baseData.measurements;
                Assert.ok(resultMeasurements);
                Assert.ok(resultMeasurements["measurement1"]);
                Assert.equal(50.0, resultMeasurements["measurement1"]);
                Assert.ok(resultMeasurements["measurement2"]);
                Assert.equal(1.3, resultMeasurements["measurement2"]);
                Assert.ok(!resultMeasurements.duration, "duration is not supposed to be treated as measurement");

                // Assert custom properties
                Assert.ok(baseData.properties);
                Assert.equal("val1", baseData.properties["property1"]);
                Assert.equal("val2", baseData.properties["property2"]);

                // Assert baseData
                Assert.ok(baseData.name);
                Assert.equal("Some name given", baseData.data);
                Assert.equal("some id", baseData.id);
                Assert.equal(true, baseData.success);
                Assert.equal(200, baseData.resultCode);
                Assert.equal("Some name given", baseData.name);
                Assert.equal("example.com | cid-v1:foo", baseData.target);

                // Assert ver
                Assert.ok(baseData.ver);
                Assert.equal(2, baseData.ver);

                // Assert baseType
                Assert.ok(appInsightsEnvelope.data.baseType);
                Assert.equal("RemoteDependencyData", appInsightsEnvelope.data.baseType);

                // Assert tags
                Assert.ok(appInsightsEnvelope.tags);
                Assert.equal("TestAccountId", appInsightsEnvelope.tags["ai.user.accountId"]);
                Assert.equal("10.22.8.2", appInsightsEnvelope.tags["ai.location.ip"]);

                Assert.equal("AuthenticatedId", appInsightsEnvelope.tags["ai.user.authUserId"]);
                Assert.equal("TestId", appInsightsEnvelope.tags["ai.user.id"]);

                // Assert name
                Assert.ok(appInsightsEnvelope.name);
                Assert.equal("Microsoft.ApplicationInsights.iKey.RemoteDependency", appInsightsEnvelope.name);

                // Assert iKey
                Assert.ok(appInsightsEnvelope.iKey);
                Assert.equal("iKey", appInsightsEnvelope.iKey);

                // Assert timestamp
                Assert.ok(appInsightsEnvelope.time);
            }
        });

        this.testCase({
            name: "AppInsightsTests: When name is not provided, it is obtained from hostname",
            test: () => {
                // setup
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    ext: {
                        "user" : {
                            "localId": "TestId",
                            "authId": "AuthenticatedId",
                            "id": "TestId"
                        }
                    },
                    tags: [{"ai.user.accountId": "TestAccountId"},
                           {"ai.location.ip": "10.22.8.2"}, {"ai.internal.sdkVersion": "1234"}],
                    baseType: "RemoteDependencyData",
                    baseData: {
                        id: 'some id',
                        success: true,
                        responseCode: 200,
                        duration: 123,
                        type: 'Fetch',
                        data: 'some data',
                        target: 'https://example.com/test/name'
                    },
                    data: {
                        property1: "val1",
                        property2: "val2",
                        measurement1: 50.0,
                        measurement2: 1.3
                    }

                }

                // act
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null);
                const { baseData } = appInsightsEnvelope.data;

                // Assert baseData
                Assert.ok(baseData.name);
                Assert.equal("GET /test/name", baseData.name); // retrieved from target
                Assert.equal("/test/name", baseData.data);

                // Assert sdkVersion
                Assert.equal("1234", appInsightsEnvelope.tags["ai.internal.sdkVersion"])
            }
        });

        this.testCase({
            name: "AppInsightsTests: AppInsights Envelope created for Page View",
            test: () => {
                // setup
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    ext: {
                        "user": {
                            "localId": "TestId",
                            "authId": "AuthenticatedId",
                            "id": "TestId"
                        },
                        "trace": {
                            "traceID": "1528B5FF-6455-4657-BE77-E6664CAC72DC",
                            "parentID": "1528B5FF-6455-4657-BE77-E6664CACEEEE"
                        }
                    },
                    tags: [{"ai.user.accountId": "TestAccountId"}],
                    baseType: "PageviewData",
                    baseData: {
                        "name": "Page View Name",
                        "uri": "https://fakeUri.com",
                        properties: {
                            "property1": "val1",
                            "property2": "val2",
                            "duration": 300000
                        },
                        measurements: {
                            "measurement1": 50.0,
                            "measurement2": 1.3,
                        }
                    },
                    data: {
                        "property3": "val3",
                        "measurement3": 1000
                    }
                };

                // Act
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null);
                const baseData = appInsightsEnvelope.data.baseData;

                // Assert duration
                const resultDuration = baseData.duration;
                Assert.equal("00:05:00.000", resultDuration);

                // Assert measurements
                const resultMeasurements = baseData.measurements;
                const  props = baseData.properties;
                Assert.ok(resultMeasurements);
                Assert.ok(resultMeasurements["measurement1"]);
                Assert.equal(50.0, resultMeasurements["measurement1"]);
                Assert.ok(resultMeasurements["measurement2"]);
                Assert.equal(1.3, resultMeasurements["measurement2"]);
                Assert.ok(!resultMeasurements.duration, "duration is not supposed to be treated as property in envelope");

                // Assert custom properties
                Assert.ok(baseData.properties);
                Assert.equal("val1", baseData.properties["property1"]);
                Assert.equal("val2", baseData.properties["property2"]);

                // Assert deprecated data custom properties/measurements
                Assert.equal("val3", baseData.properties["property3"])
                Assert.equal(1000, baseData.measurements["measurement3"]);

                // Assert Page View name
                Assert.ok(baseData.name);
                Assert.equal("Page View Name", baseData.name);


                // Assert ver
                Assert.ok(baseData.ver);
                Assert.equal(2, baseData.ver);

                // Assert baseType
                Assert.ok(appInsightsEnvelope.data.baseType);
                Assert.equal("PageviewData", appInsightsEnvelope.data.baseType);

                // Assert tags
                Assert.ok(appInsightsEnvelope.tags);
                Assert.equal("TestAccountId", appInsightsEnvelope.tags["ai.user.accountId"]);
                Assert.equal("AuthenticatedId", appInsightsEnvelope.tags["ai.user.authUserId"]);
                Assert.equal("TestId", appInsightsEnvelope.tags["ai.user.id"]);

                // Assert sdkVersion
                Assert.ok(EnvelopeCreator.Version)
                Assert.ok(EnvelopeCreator.Version.length > 0)
                Assert.equal(`javascript:${EnvelopeCreator.Version}`, appInsightsEnvelope.tags["ai.internal.sdkVersion"])

                // Assert.equal("d041d2e5fa834b4f9eee41ac163bf402", appInsightsEnvelope.tags["ai.session.id"]);
                // Assert.equal("browser", appInsightsEnvelope.tags["ai.device.id"]);
                // Assert.equal("Browser", appInsightsEnvelope.tags["ai.device.type"]);
                // Assert.equal("javascript:1.0.18", appInsightsEnvelope.tags["ai.internal.sdkVersion"]);

                // Assert name
                Assert.ok(appInsightsEnvelope.name);
                Assert.equal("Microsoft.ApplicationInsights.iKey.Pageview", appInsightsEnvelope.name);

                // Assert iKey
                Assert.ok(appInsightsEnvelope.iKey);
                Assert.equal("iKey", appInsightsEnvelope.iKey);

                // Assert timestamp
                Assert.ok(appInsightsEnvelope.time);


                Assert.equal("1528B5FF-6455-4657-BE77-E6664CAC72DC", appInsightsEnvelope.tags["ai.operation.id"]);
                Assert.equal("1528B5FF-6455-4657-BE77-E6664CACEEEE", appInsightsEnvelope.tags["ai.operation.parentId"])
            }
        });

        this.testCase({
            name: "AppInsightsTests: AppInsights Envelope created for Page View with duration in customProperties Part C",
            test: () => {
                // setup
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    ext: {
                        "user": {
                            "localId": "TestId",
                            "authId": "AuthenticatedId",
                            "id": "TestId"
                        },
                        "trace": {
                            "traceID": "1528B5FF-6455-4657-BE77-E6664CAC72DC",
                            "parentID": "1528B5FF-6455-4657-BE77-E6664CACEEEE"
                        }
                    },
                    tags: [{"ai.user.accountId": "TestAccountId"}],
                    baseType: "PageviewData",
                    baseData: {
                        "name": "Page View Name",
                        "uri": "https://fakeUri.com",
                        properties: {
                            "property1": "val1",
                            "property2": "val2",
                        },
                        measurements: {
                            "measurement1": 50.0,
                            "measurement2": 1.3,
                        }
                    },
                    data: {
                        "duration": 300000
                    }
                };

                // Act
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null);
                const baseData = appInsightsEnvelope.data.baseData;

                // Assert duration
                const resultDuration = baseData.duration;
                Assert.equal("00:05:00.000", resultDuration);
            }
        });

        this.testCase({
            name: 'Envelope: custom properties are put into envelope for Exception data type',
            test: () => {
                const bd = new Exception(
                    null,
                    new Error(),
                    {"property1": "val1", "property2": "val2" },
                    {"measurement1": 50.0, "measurement2": 1.3 }
                );
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    baseType: Exception.dataType,
                    baseData: bd,
                    data: {
                        "property3": "val3",
                        "measurement3": 3.0
                    },
                    ext: {
                        "user": {
                            "localId": "TestId",
                            "authId": "AuthenticatedId",
                            "id": "TestId"
                        }
                    },
                    tags: [{"user.accountId": "TestAccountId"}],
                };

                // Act
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null);
                const baseData = appInsightsEnvelope.data.baseData;

                Assert.equal(-1, JSON.stringify(baseData).indexOf("property3"), "ExceptionData: searching: customProperties (item.data) are not added to telemetry envelope")
                Assert.equal("val1", baseData.properties["property1"], "ExceptionData: properties (item.baseData.properties) are added to telemetry envelope");
                Assert.equal(50.0, baseData.measurements["measurement1"], "ExceptionData: measurements (item.baseData.measurements) are added to telemetry envelope");

            }
        });

        this.testCase({
            name: 'Offline watcher is listening to events',
            test: () => {
                Assert.ok(Offline.isListening, 'Offline is listening');
                Assert.equal(true, Offline.isOnline(), 'Offline reports online status');
                Assert.equal(false, Offline.isOffline(), 'Offline reports offline status');
            }
        });

        this.testCase({
            name: 'Offline watcher responds to offline events (window.addEventListener)',
            test: () => {
                // Setup
                const offlineEvent = new Event('offline');
                const onlineEvent = new Event('online');

                // Verify precondition
                Assert.ok(Offline.isListening);
                Assert.ok(Offline.isOnline());

                // Act - Go offline
                window.dispatchEvent(offlineEvent);
                this.clock.tick(1);

                // Verify offline
                Assert.ok(Offline.isOffline());

                // Act - Go online
                window.dispatchEvent(onlineEvent);
                this.clock.tick(1);

                // Verify online
                Assert.ok(Offline.isOnline());
            }
        });

        this.testCase({
            name: "AppInsightsTests: AppInsights Envelope created for Page View with new web extension",
            test: () => {
                // setup
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    ext: {
                        "web": {
                            "domain": "www.bing.com",
                            "userConsent": true,
                            "screenRes": "1024x768",
                            "browser": "internet explorer",
                            "browserVer": "48.0",
                            "isManual": true,
                            "browserLang": "EN"
                        }
                    },
                    baseType: "PageviewData",
                    baseData: {
                        "name": "Page View Name",
                        "uri": "https://fakeUri.com",
                        properties: {
                            "property1": "val1",
                            "property2": "val2"
                        },
                        measurements: {
                            "measurement1": 50.0,
                        }
                    }
                };

                // Act
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null);
                const baseData = appInsightsEnvelope.data.baseData;

                // Assert measurements
                const resultMeasurements = baseData.measurements;
                Assert.ok(resultMeasurements);
                Assert.ok(resultMeasurements["measurement1"]);
                Assert.equal(50.0, resultMeasurements["measurement1"]);

                // Assert custom properties
                Assert.ok(baseData.properties);
                Assert.equal("val1", baseData.properties["property1"]);
                Assert.equal("val2", baseData.properties["property2"]);
                Assert.equal("true", baseData.properties["isManual"]);
                Assert.equal("1024x768", baseData.properties["screenRes"]);
                Assert.equal("true", baseData.properties["userConsent"]);
                Assert.equal("www.bing.com", baseData.properties["domain"]);

                Assert.equal("internet explorer", appInsightsEnvelope.tags[CtxTagKeys.deviceBrowser]);
                Assert.equal("48.0", appInsightsEnvelope.tags[CtxTagKeys.deviceBrowserVersion]);
                Assert.equal("EN", appInsightsEnvelope.tags[CtxTagKeys.deviceLanguage]);

                // Assert Page View name
                Assert.ok(baseData.name);
                Assert.equal("Page View Name", baseData.name);

                // Assert ver
                Assert.ok(baseData.ver);
                Assert.equal(2, baseData.ver);

                // Assert baseType
                Assert.ok(appInsightsEnvelope.data.baseType);
                Assert.equal("PageviewData", appInsightsEnvelope.data.baseType);

                // Assert name
                Assert.ok(appInsightsEnvelope.name);
                Assert.equal("Microsoft.ApplicationInsights.iKey.Pageview", appInsightsEnvelope.name);
            }
        });
    }
}
