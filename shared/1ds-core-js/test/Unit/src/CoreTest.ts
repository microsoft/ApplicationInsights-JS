import { AITestClass } from "@microsoft/ai-test-framework";
import {
    AppInsightsCore, IExtendedConfiguration, IPropertyStorageOverride,
    IExtendedTelemetryItem, EventLatency, FullVersionString
} from '../../../src/Index';
import { AppInsightsCore as AIInternalCore, IChannelControls, blockDynamicConversion } from '@microsoft/applicationinsights-core-js';
import dynamicProto from "@microsoft/dynamicproto-js";

export class CoreTest extends AITestClass {

    private channelExtension: IChannelControls;
    private channelExtensionWithVer: IChannelControls;

    public testInitialize() {
        // As the class is using dynamicProto we need to construct at least 1 instance
        // before we can override/replace any prototype method as they are not populated
        // until the 1st instance is created.
        this._disableDynProtoBaseFuncs(dynamicProto); // We need to disable the useBaseInst performance setting as the sinon spy fools the internal logic and the spy is bypassed
        // As we are now using the module as is we need to reach inside the current instance to get the correct instance of applicationinsights-core-js
        QUnit.assert.notEqual(Object.getPrototypeOf(new AIInternalCore()).initialize, undefined, 'The prototype method must exist for the instance');
        QUnit.assert.notEqual(AIInternalCore.prototype.initialize, undefined, 'The prototype method must exist');

        this.channelExtension = blockDynamicConversion({
            pause: () => { },
            resume: () => { },
            teardown: () => { },
            flush: (async: any, callBack: any) => { },
            processTelemetry: (env: any) => { },
            setNextPlugin: (next: any) => { },
            initialize: (config: any, core: any, extensions: any) => { },
            identifier: "testChannel",
            priority: 501
        });

        this.channelExtensionWithVer = blockDynamicConversion({
            pause: () => { },
            resume: () => { },
            teardown: () => { },
            flush: (async: any, callBack: any) => { },
            processTelemetry: (env: any) => { },
            setNextPlugin: (next: any) => { },
            initialize: (config: any, core: any, extensions: any) => { },
            identifier: "testChannel",
            priority: 501,
            version: "channelVer"
        });
    }

    public registerTests() {
        this.testCase({
            name: "initialize test",
            test: () => {
                this._disableDynProtoBaseFuncs(dynamicProto); // We need to disable the useBaseInst performance setting as the sinon spy fools the internal logic and the spy is bypassed

                let coreTrackSpy = this.sandbox.spy(AIInternalCore.prototype, 'initialize');
                var core: AppInsightsCore = new AppInsightsCore();

                // As we are now using the module as is we need to reach inside the current instance to get the correct instance of applicationinsights-core-js
                QUnit.assert.notEqual(AIInternalCore.prototype.initialize, Object.getPrototypeOf(core).initialize, 'The prototype method must not be the same as the current instance');

                var testPropertyStorageOverride: IPropertyStorageOverride = {
                    setProperty: (key: string, value: string) => {

                    },
                    getProperty: (key: string) => {
                        return 'test property';
                    }
                };
                var config: IExtendedConfiguration = {
                    instrumentationKey: 'testIkey',
                    propertyStorageOverride: testPropertyStorageOverride
                };
                core.initialize(config, [this.channelExtension]);
                QUnit.assert.equal(coreTrackSpy.called, true, "Expecting AI initialize was called");
                var actualConfig: IExtendedConfiguration = coreTrackSpy.getCall(0).args[0];
                QUnit.assert.equal(actualConfig.endpointUrl, "https://browser.events.data.microsoft.com/OneCollector/1.0/");
                QUnit.assert.equal(actualConfig.instrumentationKey, "testIkey");
                if (actualConfig.propertyStorageOverride) {
                    QUnit.assert.ok(actualConfig.propertyStorageOverride.getProperty('testKey') === 'test property');
                }
                QUnit.assert.equal(core.getWParam(), 0);
            }
        });

        this.testCase({
            name: "Dynamic Config Test",
            useFakeTimers: true,
            test: () => {
                this._disableDynProtoBaseFuncs(dynamicProto); // We need to disable the useBaseInst performance setting as the sinon spy fools the internal logic and the spy is bypassed

                let coreTrackSpy = this.sandbox.spy(AIInternalCore.prototype, 'initialize');
                let config: IExtendedConfiguration = {};
                let expectedIkey: string = "test";
                let expectedEndpointUrl: string = "https://browser.events.data.microsoft.com/OneCollector/1.0/";
                let expectedPropertyStorageOverride: IPropertyStorageOverride;
                let core: AppInsightsCore = new AppInsightsCore();
                
                let onChangeCalled = 0;
                let handler = core.onCfgChange((details) => {
                    onChangeCalled ++;
                    QUnit.assert.equal(expectedIkey, details.cfg.instrumentationKey, `onChangeCalled ${onChangeCalled} times: Expect the iKey to be set`);
                    QUnit.assert.equal(expectedEndpointUrl, details.cfg.endpointUrl, `onChangeCalled ${onChangeCalled} times: Expect the endpoint to be set`);
                    QUnit.assert.deepEqual(expectedPropertyStorageOverride, details.cfg.propertyStorageOverride, `onChangeCalled ${onChangeCalled} times: Expect the propertyStorageOverride to be set`);
                });

                // Check defaults
                config = {instrumentationKey: expectedIkey}
                core.initialize(config, [this.channelExtension]);
                QUnit.assert.equal(coreTrackSpy.called, true, "Expecting AI initialize was called");
                QUnit.assert.equal(1, onChangeCalled, "oncfgChange should be called 1 times");

                // Check config changes
                expectedPropertyStorageOverride = {
                    setProperty: (key: string, value: string) => {
                    },
                    getProperty: (key: string) => {
                        return 'test property';
                    }
                };
                expectedEndpointUrl = "https://testendpoint.com";
                expectedIkey = "test1";
                core.config.instrumentationKey = expectedIkey;
                core.config.endpointUrl = expectedEndpointUrl;
                core.config.propertyStorageOverride = expectedPropertyStorageOverride;
                this.clock.tick(1);
                QUnit.assert.equal(onChangeCalled, 2, "onConfigChange Called 2 times");

            }
        });


        this.testCase({
            name: "track test",
            test: () => {
                this._disableDynProtoBaseFuncs(dynamicProto); // We need to disable the useBaseInst performance setting as the sinon spy fools the internal logic and the spy is bypassed
                let coreTrackSpy = this.sandbox.spy(AIInternalCore.prototype, 'track');
                var core: AppInsightsCore = new AppInsightsCore();

                QUnit.assert.notEqual(AIInternalCore.prototype.track, Object.getPrototypeOf(core).track, 'The prototype method must not be the same as the current instance');

                var config: IExtendedConfiguration = {
                    instrumentationKey: 'testIkey'
                };
                core.initialize(config, [this.channelExtension]);
                var telemetryItem: IExtendedTelemetryItem = {
                    name: 'testEvent',
                    baseType: 'testEventBaseType'
                };
                core.track(telemetryItem);
                QUnit.assert.equal(coreTrackSpy.called, true, "Expecting the AI Core was called");
                var actualEvent: IExtendedTelemetryItem = coreTrackSpy.getCall(0).args[0];
                QUnit.assert.equal(actualEvent.name, "testEvent");
                QUnit.assert.equal(actualEvent.latency, EventLatency.Normal);
                QUnit.assert.ok(actualEvent.ext['sdk']['ver'].indexOf('1DS-Web-JS') > -1);
                QUnit.assert.equal(actualEvent.ext['sdk']['ver'], FullVersionString, actualEvent.ext['sdk']['ver']);
                QUnit.assert.equal(isNaN(actualEvent.timings.trackStart as number), false);
                QUnit.assert.equal(actualEvent.baseData['properties']['version'], '', actualEvent.baseData['properties']['version']);
            }
        });

        this.testCase({
            name: "track test with provided item properties version",
            test: () => {
                this._disableDynProtoBaseFuncs(dynamicProto); // We need to disable the useBaseInst performance setting as the sinon spy fools the internal logic and the spy is bypassed
                let coreTrackSpy = this.sandbox.spy(AIInternalCore.prototype, 'track');
                var core: AppInsightsCore = new AppInsightsCore();

                QUnit.assert.notEqual(AIInternalCore.prototype.track, Object.getPrototypeOf(core).track, 'The prototype method must not be the same as the current instance');

                var config: IExtendedConfiguration = {
                    instrumentationKey: 'testIkey'
                };
           
                core.initialize(config, [this.channelExtensionWithVer]);
                var telemetryItem: IExtendedTelemetryItem = {
                    name: 'testEvent',
                    baseType: 'testEventBaseType',
                    baseData:{}
                };
                telemetryItem.baseData['properties'] = {version:'version1'};
                core.track(telemetryItem);
                QUnit.assert.equal(coreTrackSpy.called, true, "Expecting the AI Core was called");
                var actualEvent: IExtendedTelemetryItem = coreTrackSpy.getCall(0).args[0];
                QUnit.assert.equal(actualEvent.name, "testEvent");
                QUnit.assert.ok(actualEvent.ext['sdk']['ver'].indexOf('1DS-Web-JS') > -1);
                QUnit.assert.equal(actualEvent.ext['sdk']['ver'], FullVersionString, actualEvent.ext['sdk']['ver']);
                QUnit.assert.equal(actualEvent.baseData['properties']['version'], 'version1', actualEvent.baseData['properties']['version']);
            }
        });

        this.testCase({
            name: "track test with provided plugin version and no item properties version",
            test: () => {
                this._disableDynProtoBaseFuncs(dynamicProto); // We need to disable the useBaseInst performance setting as the sinon spy fools the internal logic and the spy is bypassed
                let coreTrackSpy = this.sandbox.spy(AIInternalCore.prototype, 'track');
                var core: AppInsightsCore = new AppInsightsCore();

                QUnit.assert.notEqual(AIInternalCore.prototype.track, Object.getPrototypeOf(core).track, 'The prototype method must not be the same as the current instance');

                var config: IExtendedConfiguration = {
                    instrumentationKey: 'testIkey'
                };
                core.initialize(config, [this.channelExtensionWithVer]);
                var telemetryItem: IExtendedTelemetryItem = {
                    name: 'testEvent',
                    baseType: 'testEventBaseType'
                };
                core.track(telemetryItem);
                QUnit.assert.equal(coreTrackSpy.called, true, "Expecting the AI Core was called");
                var actualEvent: IExtendedTelemetryItem = coreTrackSpy.getCall(0).args[0];
                QUnit.assert.equal(actualEvent.name, "testEvent");
                QUnit.assert.ok(actualEvent.ext['sdk']['ver'].indexOf('1DS-Web-JS') > -1);
                QUnit.assert.equal(actualEvent.ext['sdk']['ver'], FullVersionString, actualEvent.ext['sdk']['ver']);
                QUnit.assert.equal(actualEvent.baseData['properties']['version'], 'testChannel=channelVer', actualEvent.baseData['properties']['version']);
            }
        });

        this.testCase({
            name: "Check inheritence implementation",
            test: () => {
                var core1: AppInsightsCore = new AppInsightsCore();
                var core2: AppInsightsCore = new AppInsightsCore();

                // Make sure the 2 initialize methods are actually different function instances
                QUnit.assert.ok(!core1.hasOwnProperty("initialize"), "initialize should not be an instance function");
                QUnit.assert.ok(!core2.hasOwnProperty("initialize"), "initialize should not be an instance function");
                QUnit.assert.equal(core1.initialize, core2.initialize, "initialize function should be the same (i.e. prototype based methods)");

                QUnit.assert.ok(!core1.hasOwnProperty("track"), "track should not be an instance function");
                QUnit.assert.ok(!core2.hasOwnProperty("track"), "track should not be an instance function");
                QUnit.assert.equal(core1.track, core2.track, "track function should be the same (i.e. prototype based methods)");
            }
        });
    }
}
