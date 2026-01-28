import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { AppInsightsCore } from "../../../../src/JavaScriptSDK/AppInsightsCore";
import { IAppInsightsCore } from "../../../../src/JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IConfiguration } from "../../../../src/JavaScriptSDK.Interfaces/IConfiguration";
import { IPlugin } from "../../../../src/JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { _eInternalMessageId } from "../../../../src/JavaScriptSDK.Enums/LoggingEnums";
import { ThrottleMgr } from "../../../../src/Common/ThrottleMgr";
import { SinonSpy } from "sinon";
import { utlCanUseLocalStorage } from "../../../../src/Common/StorageHelperFuncs";
import { IThrottleInterval, IThrottleLimit, IThrottleMgrConfig, IThrottleResult } from "../../../../src/Common/Interfaces/IThrottleMgr";
import { IConfig } from "../../../../src/Common/Interfaces/IConfig";

const daysInMonth = [
    31, // Jan
    28, // Feb
    31, // Mar
    30, // Apr
    31, // May
    30, // Jun
    31, // Jul
    31, // Aug
    30, // Sep
    31, // Oct
    30, // Nov
    31 // Dec
];

const isLeapYear = (year: number) => {
    return (year % 4) === 0 && ((year % 100) !== 0 || (year % 400) === 0);
}

const compareDates = (date1: Date, date: string | Date, expectedSame: boolean = true) => {
    let isSame = false;
    try {
        if (date1 && date) {
            let date2 = typeof date == "string"? new Date(date) : date;
            isSame = date1.getUTCFullYear() === date2.getUTCFullYear() &&
            date1.getUTCMonth() === date2.getUTCMonth() &&
            date1.getUTCDate() === date2.getUTCDate();
        }
    } catch (e) {
        Assert.ok(false,"compare dates error" + e);
    }
    Assert.equal(isSame, expectedSame, "checking that the dates where as expected");
}

export class ThrottleMgrTest extends AITestClass {
    private _core: IAppInsightsCore<IConfiguration & IConfig>;
    private _msgKey: number;
    private _storageName: string;
    private _msgId: _eInternalMessageId;
    private loggingSpy: SinonSpy;
    private _channel;

    public testInitialize() {
        this._core = new AppInsightsCore();
        this._msgKey = _eInternalMessageId.InstrumentationKeyDeprecation;
        this._storageName = "appInsightsThrottle-" + this._msgKey;
        this.loggingSpy = this.sandbox.stub(this._core.logger, "throwInternal");
        this._msgId =  _eInternalMessageId.InstrumentationKeyDeprecation;
        this._channel = new ChannelPlugin();

        if (utlCanUseLocalStorage()) {
            window.localStorage.clear();
        }
    }

    public testCleanup() {
        if (utlCanUseLocalStorage()) {
            window.localStorage.clear();
        }
   
        this.loggingSpy = null;
    }

    public registerTests() {

        this.testCase({
            name: "ThrottleMgrTest: Default config should be set from root",
            test: () => {
                let expectedconfig = {
                    disabled: false,
                    limit: {
                        samplingRate: 100,
                        maxSendNumber: 1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 3,
                        dayInterval: undefined,
                        daysOfMonth: [28]
                    } as IThrottleInterval
                } as IThrottleMgrConfig;
                let coreCfg = {
                    instrumentationKey: "test"
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);
                let actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(expectedconfig, actualConfig[_eInternalMessageId.DefaultThrottleMsgKey], "should get expected default config");
                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false, "should not be triggered");
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: Default config should be set from root with key",
            test: () => {
                let expectedconfig = {
                    disabled: false,
                    limit: {
                        samplingRate: 100,
                        maxSendNumber: 1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 3,
                        dayInterval: undefined,
                        daysOfMonth: [28]
                    } as IThrottleInterval
                } as IThrottleMgrConfig;
                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: {}}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);
                let actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(expectedconfig, actualConfig[this._msgId], "should get expected default config");
                Assert.deepEqual(expectedconfig, actualConfig[_eInternalMessageId.DefaultThrottleMsgKey], "should get expected default config");
                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false, "should not be triggered");
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: Mutiple msg keys - Default config should be set from root",
            test: () => {
                let expectedconfig = {
                    disabled: false,
                    limit: {
                        samplingRate: 100,
                        maxSendNumber: 1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 3,
                        dayInterval: undefined,
                        daysOfMonth: [28]
                    } as IThrottleInterval
                } as IThrottleMgrConfig;
                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: expectedconfig}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);
                let actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(expectedconfig, actualConfig[this._msgId], "should get expected default config");
                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false, "should not be triggered");

                isTriggered = throttleMgr.isTriggered(109);
                Assert.equal(isTriggered, false, "should not be triggered msg key 109");
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: None set msg keys - Default config should be used",
            test: () => {
                let date = new Date();
                let expectedconfig = {
                    disabled: false,
                    limit: {
                        samplingRate: 100,
                        maxSendNumber: 1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: undefined,
                        daysOfMonth: [date.getUTCDate()]
                    } as IThrottleInterval
                } as IThrottleMgrConfig;
                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[_eInternalMessageId.DefaultThrottleMsgKey]: expectedconfig}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);
                let actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(expectedconfig, actualConfig[_eInternalMessageId.DefaultThrottleMsgKey], "should get expected default config");
                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false, "should not be triggered");
                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.equal(canThrottle, true, "should be able to throttle");
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: Config should be updated dynamically",
            useFakeTimers: true,
            test: () => {
                let date = new Date();
                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 50,
                        maxSendNumber: 100
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: undefined,
                        daysOfMonth: [date.getUTCDate()]
                    } as IThrottleInterval
                } as IThrottleMgrConfig;
                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);
                let actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(config, actualConfig[this._msgId], "should get expected config");
                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false, "should not be triggered");
                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.deepEqual(canThrottle, true, "should be able to throttle");
                
                config.disabled = true;
                config.limit =  {
                    samplingRate: 80,
                    maxSendNumber: 10
                } as IThrottleLimit,
                config.interval = {
                    monthInterval: 3,
                    dayInterval: undefined,
                    daysOfMonth: [date.getUTCDate() + 1]
                } as IThrottleInterval;
                this._core.config.throttleMgrCfg = this._core.config.throttleMgrCfg || {};
                this._core.config.throttleMgrCfg[this._msgId] = config;
                this.clock.tick(1);
                actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(config, actualConfig[this._msgId], "config should be updated dynamically");
                canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.deepEqual(canThrottle, false, "should not be able to throttle");
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: Config should be updated dynamically with different keys",
            useFakeTimers: true,
            test: () => {
                let date = new Date();
                let msgId = 109;
                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 50,
                        maxSendNumber: 100
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: undefined,
                        daysOfMonth: [date.getUTCDate()]
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let config1 = {
                    disabled: false,
                    limit: {
                        samplingRate: 60,
                        maxSendNumber: 101
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: undefined,
                        daysOfMonth: [date.getUTCDate()]
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config, [msgId]: config1}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);
                let actualConfig = throttleMgr.getConfig();
                Assert.ok(actualConfig[_eInternalMessageId.DefaultThrottleMsgKey]);
                Assert.deepEqual(config, actualConfig[this._msgId], "should get expected config");
                Assert.deepEqual(config1, actualConfig[msgId], "should get expected config1");
                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false, "should not be triggered");
                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.deepEqual(canThrottle, true, "should be able to throttle");
                isTriggered = throttleMgr.isTriggered(msgId);
                Assert.equal(isTriggered, false, "should not be triggered test1");
                canThrottle = throttleMgr.canThrottle(msgId);
                Assert.deepEqual(canThrottle, true, "should be able to throttle test1");
                
                config.disabled = true;
                config.limit =  {
                    samplingRate: 80,
                    maxSendNumber: 10
                } as IThrottleLimit,
                config.interval = {
                    monthInterval: 3,
                    dayInterval: undefined,
                    daysOfMonth: [date.getUTCDate() + 1]
                } as IThrottleInterval;
                this._core.config.throttleMgrCfg = this._core.config.throttleMgrCfg || {};
                this._core.config.throttleMgrCfg[this._msgId] = config;
                this.clock.tick(1);
                actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(config, actualConfig[this._msgId], "config should be updated dynamically");
                Assert.deepEqual(config1, actualConfig[msgId], "config1 should not be updated dynamically");
                canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.deepEqual(canThrottle, false, "should not be able to throttle");
                canThrottle = throttleMgr.canThrottle(msgId);
                Assert.deepEqual(canThrottle, true, "should be able to throttle config1");
            }
        });


        this.testCase({
            name: "ThrottleMgrTest: flush",
            test: () => {
                let date = new Date();
                let expectedconfig = {
                    disabled: false,
                    limit: {
                        samplingRate: 100,
                        maxSendNumber: 10
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: undefined,
                        daysOfMonth: [date.getUTCDate()]
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: expectedconfig}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);

                let actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(expectedconfig, actualConfig[this._msgId], "should get expected default config");
                let isTriggered = throttleMgr.isTriggered(this._msgKey);
                Assert.equal(isTriggered, false, "should not be triggered");
                let canThrottle = throttleMgr.canThrottle(this._msgKey);
                Assert.equal(canThrottle, true, "should be able to be throttle");

                let isReady = throttleMgr.isReady();
                Assert.equal(isReady, false, "isReady state should be false");
                let result = throttleMgr.sendMessage(this._msgId, "test");
                Assert.equal(result, null, "should not be throttled");
                // note: _getDbgPlgTargets returns array
                let target = throttleMgr["_getDbgPlgTargets"]();
                Assert.ok(target && target.length === 1, "target should contain queue");
                let queue = target[0][this._msgKey];
                Assert.deepEqual(queue.length,1, "should have 1 item");
                Assert.equal(queue[0].msgID, this._msgId, "should be correct msgId");

                throttleMgr.onReadyState(true);
                target = throttleMgr["_getDbgPlgTargets"]();
                queue = target[0][this._msgKey];
                Assert.equal(queue.length, 0, "queue should be empty");
                let storage = window.localStorage[this._storageName];
                let dateNum = date.getUTCDate();
                let prefix = dateNum < 10? "0":"";
                Assert.ok(storage.indexOf(`${date.getUTCMonth() + 1}-${prefix + dateNum}`) > -1, "local storage should have correct date");
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: Mutiple msg keys - flush",
            test: () => {
                let msgId = 109;
                let storageName =   this._storageName = "appInsightsThrottle-" + msgId;
                let date = new Date();
                let expectedconfig = {
                    disabled: false,
                    limit: {
                        samplingRate: 100,
                        maxSendNumber: 10
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: undefined,
                        daysOfMonth: [date.getUTCDate()]
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: expectedconfig, [msgId]: expectedconfig}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);

                let actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(expectedconfig, actualConfig[this._msgId], "should get expected default config");
                Assert.deepEqual(expectedconfig, actualConfig[msgId], "should get expected default config msgId");
                let isTriggered = throttleMgr.isTriggered(this._msgKey);
                Assert.equal(isTriggered, false, "should not be triggered");
                let canThrottle = throttleMgr.canThrottle(this._msgKey);
                Assert.equal(canThrottle, true, "should be able to be throttle");
                isTriggered = throttleMgr.isTriggered(msgId);
                Assert.equal(isTriggered, false, "should not be triggered test1");
                canThrottle = throttleMgr.canThrottle(msgId);
                Assert.equal(canThrottle, true, "should be able to be throttle test1");

                let isReady = throttleMgr.isReady();
                Assert.equal(isReady, false, "isReady state should be false");
                let result = throttleMgr.sendMessage(this._msgId, "test");
                Assert.equal(result, null, "should not be throttled");
                result = throttleMgr.sendMessage(msgId, "test1");
                Assert.equal(result, null, "should not be throttled test1");
                // note: _getDbgPlgTargets returns array
                let target = throttleMgr["_getDbgPlgTargets"]();
                Assert.ok(target && target.length === 1, "target should contain queue");
                let queue = target[0][this._msgKey];
                Assert.deepEqual(queue.length,1, "should have 1 item");
                Assert.equal(queue[0].msgID, this._msgId, "should be correct msgId");
                queue = target[0][msgId];
                Assert.deepEqual(queue.length,1, "should have 1 item test1");
                Assert.equal(queue[0].msgID, msgId, "should be correct msgId test1");

                throttleMgr.onReadyState(true);
                target = throttleMgr["_getDbgPlgTargets"]();
                queue = target[0][this._msgKey];
                Assert.equal(queue.length, 0, "queue should be empty");
                let storage = window.localStorage[this._storageName];
                let dateNum = date.getUTCDate();
                let prefix = dateNum < 10? "0":"";
                Assert.ok(storage.indexOf(`${date.getUTCMonth() + 1}-${prefix + dateNum}`) > -1, "local storage should have correct date");

                target = throttleMgr["_getDbgPlgTargets"]();
                queue = target[0][msgId];
                Assert.equal(queue.length, 0, "queue should be empty test1");
                storage = window.localStorage[storageName];
                dateNum = date.getUTCDate();
                prefix = dateNum < 10? "0":"";
                Assert.ok(storage.indexOf(`${date.getUTCMonth() + 1}-${prefix + dateNum}`) > -1, "local storage should have correct date test1");
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: Throttle Manager can get expected config",
            test: () => {
                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 50,
                        maxSendNumber: 100
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 2,
                        dayInterval: 10,
                        daysOfMonth: undefined
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);
                let actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(config, actualConfig[this._msgId]);

                let isTriggered = throttleMgr.isTriggered(this._msgKey);
                Assert.equal(isTriggered, false);
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: Throttle Manager can get default config",
            test: () => {

                let expectedConfig = {
                    disabled: false,
                    limit: {
                        samplingRate: 100,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 3,
                        dayInterval: undefined,
                        daysOfMonth: [28]
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: {}}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);

                let actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(expectedConfig, actualConfig[this._msgId]);

                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false);
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: monthInterval should be set to 3 when dayInterval and monthInterval are both undefined",
            test: () => {

                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 100,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        daysOfMonth: [25, 26, 28]
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let expectedConfig = {
                    disabled: false,
                    limit: {
                        samplingRate: 100,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 3,
                        dayInterval: undefined,
                        daysOfMonth: [25, 26, 28]
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);

                let actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(expectedConfig, actualConfig[this._msgId]);

                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false);
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: monthInterval and daysOfMonth should be changed to default when dayInterval is defined",
            test: () => {

                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 100,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        dayInterval: 100
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let expectedConfig = {
                    disabled: false,
                    limit: {
                        samplingRate: 100,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: undefined,
                        dayInterval: 100,
                        daysOfMonth: undefined
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);
                let actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(expectedConfig, actualConfig[this._msgId]);

                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false);
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: message can be sent from the first day when dayInterval is set to one",
            test: () => {

                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 100,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        dayInterval: 1
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let expectedConfig = {
                    disabled: false,
                    limit: {
                        samplingRate: 100,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: undefined,
                        dayInterval: 1,
                        daysOfMonth: undefined
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);
                let actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(expectedConfig, actualConfig[this._msgId]);

                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false);

                let canSend = throttleMgr.canThrottle(this._msgId);
                Assert.equal(canSend, true, "can send message from the day")
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: Throttle Manager should trigger when current date is in daysOfMonth",
            test: () => {
                let date = new Date();
                let day = date.getUTCDate();
                let daysOfMonth;
                if (day == 1) {
                    daysOfMonth = [31,day];
                } else {
                    daysOfMonth = [day-1, day];
                }
                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 100,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 3,
                        dayInterval: 28,
                        daysOfMonth: daysOfMonth
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);
                let throttleMgr = new ThrottleMgr(this._core);

                let actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(config, actualConfig[this._msgId]);

                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false);

                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.equal(canThrottle, true, "should throttle");
                
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: Throttle Manager should trigger when interval config is undefined and current date 28",
            test: () => {
                let date = new Date();
                let day = date.getUTCDate();

                let expectedConfig = {
                    disabled: false,
                    limit: {
                        samplingRate: 100,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 3,
                        dayInterval: undefined,
                        daysOfMonth: [28]
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: expectedConfig}
                };
                this._core.initialize(coreCfg, [this._channel]);
                let throttleMgr = new ThrottleMgr(this._core);

                let actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(expectedConfig, actualConfig[this._msgId]);

                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false);

                let shouldTrigger = false;
                if (day === 28) {
                    shouldTrigger = true;
                }

                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.equal(canThrottle, shouldTrigger, "should only throttle on 28th");
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: should not trigger throttle when disabled is true",
            test: () => {
                let config = {
                    disabled: true
                } as IThrottleMgrConfig;
                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);
                let throttleMgr = new ThrottleMgr(this._core);

                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.equal(canThrottle, false);

                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false);
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: should not trigger throttle when month interval requirements are not meet",
            test: () => {
                let date = new Date();
                let month = date.getUTCMonth();
                let year = date.getUTCFullYear();
                if (month == 0) {
                    date.setUTCFullYear(year-1);
                    date.setUTCMonth(11);
                } else {
                    let dayOfMonth = date.getDate();
                    if (dayOfMonth > (daysInMonth[month - 1] + (month === 2 ? (isLeapYear(year - 1) ? 1 : 0 ) : 0 ))) {
                        date.setDate(daysInMonth[month - 1] + (month === 2 ? (isLeapYear(year - 1) ? 1 : 0 ) : 0 ));
                    }
                    date.setUTCMonth(month-1);
                }
                let storageObj = {
                    date: date,
                    count: 0
                }
                window.localStorage[this._storageName] = JSON.stringify(storageObj);
                
                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 1000000,
                        maxSendNumber: 100
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 3,
                        dayInterval: 1
                    } as IThrottleInterval
                } as IThrottleMgrConfig;
                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);
                let throttleMgr = new ThrottleMgr(this._core);

                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.equal(canThrottle, false);

                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false);
            }

        });

        this.testCase({
            name: "ThrottleMgrTest: should not trigger throttle when year and month interval requirements are not meet",
            test: () => {
                let date = new Date();
                let month = date.getUTCMonth();
                let year = date.getUTCFullYear();
             
                if (month == 0) {
                    date.setUTCFullYear(year-2);
                    date.setUTCMonth(11);
                } else {
                    date.setUTCFullYear(year-1);
                    let dayOfMonth = date.getDate();
                    if (dayOfMonth > (daysInMonth[month - 1] + (month === 2 ? (isLeapYear(year - 1) ? 1 : 0 ) : 0 ))) {
                        date.setDate(daysInMonth[month - 1] + (month === 2 ? (isLeapYear(year - 1) ? 1 : 0 ) : 0 ));
                    }
                    date.setUTCMonth(month-1);
                }
                let storageObj = {
                    date: date,
                    count: 0
                }
                window.localStorage[this._storageName] = JSON.stringify(storageObj);

                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 1000000,
                        maxSendNumber: 100
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 3,
                        dayInterval: 1
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);
                let throttleMgr = new ThrottleMgr(this._core);

                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.equal(canThrottle, false);

                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false);
            }

        });

        this.testCase({
            name: "ThrottleMgrTest: should not trigger throttle when day interval requirements are not meet",
            test: () => {
                let date = new Date();
                let curDate = date.getUTCDate();
                let curMonth = date.getUTCMonth();
                if (curDate === 1) {
                    curMonth -= 1;
                    curDate = 28;
                } else {
                    curDate -= 1;
                }
                date.setUTCDate(curDate);
                date.setUTCMonth(curMonth);
                let storageObj = {
                    date: date,
                    count: 0
                }
                window.localStorage[this._storageName] = JSON.stringify(storageObj);

                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 1000000,
                        maxSendNumber: 100
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 31
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);
                let throttleMgr = new ThrottleMgr(this._core);

                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.equal(canThrottle, false);

                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false);
            }

        });

        this.testCase({
            name: "ThrottleMgrTest: should trigger throttle at starting month",
            test: () => {
                let date = new Date();
                let storageObj = {
                    date: date,
                    count: 0
                }
                window.localStorage[this._storageName] = JSON.stringify(storageObj);

                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 1000000,
                        maxSendNumber: 100
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 1
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);
                let throttleMgr = new ThrottleMgr(this._core);

                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.equal(canThrottle, true);

                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false);
            }

        });

        this.testCase({
            name: "ThrottleMgrTest: should trigger throttle when month and day intervals are meet",
            test: () => {
                let date = new Date();
                let year = date.getUTCFullYear() - 2;
                date.setUTCFullYear(year);
                let storageObj = {
                    date: date,
                    count: 0
                }
                window.localStorage[this._storageName] = JSON.stringify(storageObj);

                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 1000000,
                        maxSendNumber: 100
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 4,
                        dayInterval: 1
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);
                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.equal(canThrottle, true);

                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggered, false);
            }

        });

        this.testCase({
            name: "ThrottleMgrTest: should not trigger throttle when _isTrigger state is true (in valid send message date)",
            test: () => {
                let storageObj = {
                    date: new Date(),
                    count: 0,
                    preTriggerDate: new Date()
                }
                window.localStorage[this._storageName] = JSON.stringify(storageObj);
                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 1000000,
                        maxSendNumber: 100
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 1
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);

                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.equal(canThrottle, true);
                let isTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.ok(isTriggered);
                let result = throttleMgr.sendMessage(this._msgId, "test");
                let count = this.loggingSpy.callCount;
                Assert.equal(count,0);
                Assert.deepEqual(result, null);
                let postIsTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.ok(postIsTriggered);

            }

        });

        this.testCase({
            name: "ThrottleMgrTest: should update local storage (in valid send message date)",
            test: () => {
                let date = new Date();
                let msg = "Instrumentation key support will end soon, see aka.ms/IkeyMigrate";
               
                let preTriggerDate = date;
                preTriggerDate.setUTCFullYear(date.getUTCFullYear() - 1);
                let preStorageObj = {
                    date: date,
                    count: 0,
                    preTriggerDate: preTriggerDate
                }
                
                let preStorageVal = JSON.stringify(preStorageObj);
                window.localStorage[this._storageName] = preStorageVal;

                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 1000000,
                        maxSendNumber: 1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 1
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);

                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.equal(canThrottle, true);
                let isPretriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isPretriggered, false);

                throttleMgr.onReadyState(true);
                let sendDate = new Date();
                let result = throttleMgr.sendMessage(this._msgId, msg);
                let expectedRetryRlt = {
                    isThrottled: true,
                    throttleNum: 1
                } as IThrottleResult;
                Assert.deepEqual(result, expectedRetryRlt);
                let isPostTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isPostTriggered, true);

                let afterTriggered = window.localStorage[this._storageName];
                let afterTriggeredObj = JSON.parse(afterTriggered);
                compareDates(date, afterTriggeredObj.date)
                Assert.equal(0, afterTriggeredObj.count);
                compareDates(sendDate, afterTriggeredObj.preTriggerDate);
            }

        });

        this.testCase({
            name: "ThrottleMgrTest: should not trigger sendmessage when isready state is not set and should flush message after isReady state is set",
            test: () => {
                
                let msg = "Instrumentation key support will end soon, see aka.ms/IkeyMigrate";
                let date = new Date();
                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 1000000,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 1
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);

                this.loggingSpy = this.sandbox.stub(this._core.logger, "throwInternal");
               

                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.ok(canThrottle);
                let isTriggeredPre = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggeredPre, false);
                let initialVal = window.localStorage[this._storageName];
                let initObj = JSON.parse(initialVal);
                compareDates(date, initObj.date);
                Assert.equal(0, initObj.count);
                Assert.equal(undefined, initObj.preTriggerDate);
                
                let result = throttleMgr.sendMessage(this._msgId, msg);
                let count = this.loggingSpy.callCount;
                Assert.equal(count,0);
                Assert.deepEqual(result, null);
                let isTriggeredPost = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggeredPost, false);
                let postVal = window.localStorage[this._storageName];
                let postObj = JSON.parse(postVal);
                compareDates(date, postObj.date);
                Assert.equal(0, postObj.count);
                Assert.equal(undefined, postObj.preTriggerDate);

                let isFlushed = throttleMgr.onReadyState(true);
                Assert.ok(isFlushed);
                let isTriggeredAfterReadySate = throttleMgr.isTriggered(this._msgId);
                Assert.ok(isTriggeredAfterReadySate);
                let postOnReadyVal = window.localStorage[this._storageName];
                let postOnReadyObj = JSON.parse(postOnReadyVal);
                compareDates(date, postOnReadyObj.date);
                Assert.equal(0, postOnReadyObj.count);
                compareDates(date, postOnReadyObj.preTriggerDate);

                let onReadyResult = throttleMgr.sendMessage(this._msgId, msg);
                let onReadyCount = this.loggingSpy.callCount;
                let expectedRlt = {
                    isThrottled: false,
                    throttleNum: 0
                } as IThrottleResult
                Assert.equal(onReadyCount,1, "test1");
                Assert.deepEqual(onReadyResult, expectedRlt);
                let onReadyIsTriggered = throttleMgr.isTriggered(this._msgId);
                Assert.equal(onReadyIsTriggered, true);
                let afterResendVal = window.localStorage[this._storageName];
                let afterResendObj = JSON.parse(afterResendVal);
                compareDates(date, afterResendObj.date);
                Assert.equal(1, afterResendObj.count);
                compareDates(date, afterResendObj.preTriggerDate);
            }
        });


        this.testCase({
            name: "ThrottleMgrTest: throw messages with correct number",
            test: () => {
                let msg = "Instrumentation key support will end soon, see aka.ms/IkeyMigrate";
                let date = new Date();
                let testStorageObj = {
                    date: date,
                    count: 5
                }
                let testStorageVal = JSON.stringify(testStorageObj);
                window.localStorage[this._storageName] = testStorageVal;

                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 1000000,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 1
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                
                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);

                this.loggingSpy = this.sandbox.stub(this._core.logger, "throwInternal");


                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.ok(canThrottle);

                let isTriggeredPre = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggeredPre, false);

                throttleMgr.onReadyState(true);

                let result = throttleMgr.sendMessage(this._msgId, msg);
                let count = this.loggingSpy.callCount
                Assert.equal(count,1);
                let expectedRlt = {
                    isThrottled: true,
                    throttleNum: 1
                } as IThrottleResult
                Assert.deepEqual(result, expectedRlt);
            
                let val = window.localStorage[this._storageName];
                let obj = JSON.parse(val);
                compareDates(date, obj.date);
                Assert.equal(0, obj.count);
                compareDates(date, obj.preTriggerDate);

                let isTriggeredPost = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggeredPost, true);
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: Mutiple keys - throw messages with correct number",
            test: () => {
                let msg = "Instrumentation key support will end soon, see aka.ms/IkeyMigrate";
                let msgId = 109;
                let storageName = "appInsightsThrottle-" + msgId;
                let date = new Date();
                let testStorageObj = {
                    date: date,
                    count: 5
                }
                let testStorageVal = JSON.stringify(testStorageObj);
                window.localStorage[this._storageName] = testStorageVal;
                window.localStorage[storageName] = testStorageVal;

                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 1000000,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 1
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                
                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config, [msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);

                this.loggingSpy = this.sandbox.stub(this._core.logger, "throwInternal");


                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.ok(canThrottle, "can throttle");
                canThrottle = throttleMgr.canThrottle(msgId);
                Assert.ok(canThrottle, "can throttle test1");

                let isTriggeredPre = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggeredPre, false, "preTrigger");
                isTriggeredPre = throttleMgr.isTriggered(msgId);
                Assert.equal(isTriggeredPre, false, "preTrigger test1");

                throttleMgr.onReadyState(true);

                let result = throttleMgr.sendMessage(this._msgId, msg);
                let count = this.loggingSpy.callCount
                Assert.equal(count,1, "sendMsg count");
                let expectedRlt = {
                    isThrottled: true,
                    throttleNum: 1
                } as IThrottleResult
                Assert.deepEqual(result, expectedRlt, "expected result");
                result = throttleMgr.sendMessage(msgId, msg);
                count = this.loggingSpy.callCount
                Assert.equal(count,2, "sendMsg count test1");
                expectedRlt = {
                    isThrottled: true,
                    throttleNum: 1
                } as IThrottleResult
                Assert.deepEqual(result, expectedRlt, "expected result test1");
            
                let val = window.localStorage[this._storageName];
                let obj = JSON.parse(val);
                compareDates(date, obj.date);
                Assert.equal(0, obj.count, "local storage count");
                compareDates(date, obj.preTriggerDate);
                val = window.localStorage[storageName];
                obj = JSON.parse(val);
                compareDates(date, obj.date);
                Assert.equal(0, obj.count, "local storage count test1");
                compareDates(date, obj.preTriggerDate);

                let isTriggeredPost = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggeredPost, true, "trigger post");
                isTriggeredPost = throttleMgr.isTriggered(msgId);
                Assert.equal(isTriggeredPost, true, "trigger post test1");
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: None set mutiple keys - throw messages with correct number",
            test: () => {
                let msg = "Instrumentation key support will end soon, see aka.ms/IkeyMigrate";
                let msgId = 109;
                let storageName = "appInsightsThrottle-" + msgId;
                let date = new Date();
                let testStorageObj = {
                    date: date,
                    count: 5
                }
                let testStorageVal = JSON.stringify(testStorageObj);
                window.localStorage[this._storageName] = testStorageVal;
                window.localStorage[storageName] = testStorageVal;

                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 1000000,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 1
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                
                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[_eInternalMessageId.DefaultThrottleMsgKey]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);

                this.loggingSpy = this.sandbox.stub(this._core.logger, "throwInternal");


                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.ok(canThrottle, "can throttle");
                canThrottle = throttleMgr.canThrottle(msgId);
                Assert.ok(canThrottle, "can throttle test1");

                let isTriggeredPre = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggeredPre, false, "preTrigger");
                isTriggeredPre = throttleMgr.isTriggered(msgId);
                Assert.equal(isTriggeredPre, false, "preTrigger test1");

                throttleMgr.onReadyState(true);

                let result = throttleMgr.sendMessage(this._msgId, msg);
                let count = this.loggingSpy.callCount
                Assert.equal(count,1, "sendMsg count");
                let expectedRlt = {
                    isThrottled: true,
                    throttleNum: 1
                } as IThrottleResult
                Assert.deepEqual(result, expectedRlt, "expected result");
                result = throttleMgr.sendMessage(msgId, msg);
                count = this.loggingSpy.callCount
                Assert.equal(count,2, "sendMsg count test1");
                expectedRlt = {
                    isThrottled: true,
                    throttleNum: 1
                } as IThrottleResult
                Assert.deepEqual(result, expectedRlt, "expected result test1");
            
                let val = window.localStorage[this._storageName];
                let obj = JSON.parse(val);
                compareDates(date, obj.date);
                Assert.equal(0, obj.count, "local storage count");
                compareDates(date, obj.preTriggerDate);
                val = window.localStorage[storageName];
                obj = JSON.parse(val);
                compareDates(date, obj.date);
                Assert.equal(0, obj.count, "local storage count test1");
                compareDates(date, obj.preTriggerDate);

                let isTriggeredPost = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggeredPost, true, "trigger post");
                isTriggeredPost = throttleMgr.isTriggered(msgId);
                Assert.equal(isTriggeredPost, true, "trigger post test1");
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: should throw messages 1 time within a day",
            test: () => {
                let msg = "Instrumentation key support will end soon, see aka.ms/IkeyMigrate";

                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 1000000,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 1
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);
                this.loggingSpy = this.sandbox.stub(this._core.logger, "throwInternal");


                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.ok(canThrottle);

                let isTriggeredPre = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggeredPre, false);

                throttleMgr.onReadyState(true);

                let result = throttleMgr.sendMessage(this._msgId, msg);
                let count = this.loggingSpy.callCount
                Assert.equal(count,1);
              
                let expectedRlt = {
                    isThrottled: true,
                    throttleNum: 1
                } as IThrottleResult
                Assert.deepEqual(result, expectedRlt);

                let isTriggeredPost = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggeredPost, true);
                let canThrottlePost = throttleMgr.canThrottle(this._msgId);
                Assert.equal(canThrottlePost, true);

                let retryRlt = throttleMgr.sendMessage(this._msgId, msg);
                let retryCount = this.loggingSpy.callCount
                Assert.equal(retryCount,1);
                let expectedRetryRlt = {
                    isThrottled: false,
                    throttleNum: 0
                } as IThrottleResult
                Assert.deepEqual(retryRlt, expectedRetryRlt);
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: Mutiple msg keys - should throw messages 1 time within a day",
            test: () => {
                let msg = "Instrumentation key support will end soon, see aka.ms/IkeyMigrate";
                let msgId = 109;

                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 1000000,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 1
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[this._msgId]: config, [msgId]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);
                this.loggingSpy = this.sandbox.stub(this._core.logger, "throwInternal");


                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.ok(canThrottle, "can throttle");
                canThrottle = throttleMgr.canThrottle(msgId);
                Assert.ok(canThrottle, "can throttle test1");

                let isTriggeredPre = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggeredPre, false, "is trigger");
                isTriggeredPre = throttleMgr.isTriggered(msgId);
                Assert.equal(isTriggeredPre, false, "is trigger test1");

                throttleMgr.onReadyState(true);

                let result = throttleMgr.sendMessage(this._msgId, msg);
                let count = this.loggingSpy.callCount
                Assert.equal(count,1, "sendMsg count");
                let expectedRlt = {
                    isThrottled: true,
                    throttleNum: 1
                } as IThrottleResult;
                Assert.deepEqual(result, expectedRlt, "expected result");
                result = throttleMgr.sendMessage(msgId, msg);
                count = this.loggingSpy.callCount
                Assert.equal(count,2, "sendMsg count test1");
                Assert.deepEqual(result, expectedRlt, "expected result test1");

                let isTriggeredPost = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggeredPost, true, "trigger post");
                let canThrottlePost = throttleMgr.canThrottle(this._msgId);
                Assert.equal(canThrottlePost, true, "can throttle post");
                isTriggeredPost = throttleMgr.isTriggered(msgId);
                Assert.equal(isTriggeredPost, true, "trigger post test1");
                canThrottlePost = throttleMgr.canThrottle(msgId);
                Assert.equal(canThrottlePost, true, "can throttle post test1");

                let retryRlt = throttleMgr.sendMessage(this._msgId, msg);
                let retryCount = this.loggingSpy.callCount
                Assert.equal(retryCount,2, "retrt count");
                let expectedRetryRlt = {
                    isThrottled: false,
                    throttleNum: 0
                } as IThrottleResult
                Assert.deepEqual(retryRlt, expectedRetryRlt, "retry result");

                retryRlt = throttleMgr.sendMessage(msgId, msg);
                retryCount = this.loggingSpy.callCount
                Assert.equal(retryCount,2, "retrt count test1");
                expectedRetryRlt = {
                    isThrottled: false,
                    throttleNum: 0
                } as IThrottleResult
                Assert.deepEqual(retryRlt, expectedRetryRlt, "retry result test1");
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: None set mutiple msg keys - should throw messages 1 time within a day",
            test: () => {
                let msg = "Instrumentation key support will end soon, see aka.ms/IkeyMigrate";
                let msgId = 109;

                let config = {
                    disabled: false,
                    limit: {
                        samplingRate: 1000000,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 1
                    } as IThrottleInterval
                } as IThrottleMgrConfig;

                let coreCfg = {
                    instrumentationKey: "test",
                    throttleMgrCfg: {[_eInternalMessageId.DefaultThrottleMsgKey]: config}
                };
                this._core.initialize(coreCfg, [this._channel]);

                let throttleMgr = new ThrottleMgr(this._core);
                this.loggingSpy = this.sandbox.stub(this._core.logger, "throwInternal");


                let canThrottle = throttleMgr.canThrottle(this._msgId);
                Assert.ok(canThrottle, "can throttle");
                canThrottle = throttleMgr.canThrottle(msgId);
                Assert.ok(canThrottle, "can throttle test1");

                let isTriggeredPre = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggeredPre, false, "is trigger");
                isTriggeredPre = throttleMgr.isTriggered(msgId);
                Assert.equal(isTriggeredPre, false, "is trigger test1");

                throttleMgr.onReadyState(true);

                let result = throttleMgr.sendMessage(this._msgId, msg);
                let count = this.loggingSpy.callCount
                Assert.equal(count,1, "sendMsg count");
                let expectedRlt = {
                    isThrottled: true,
                    throttleNum: 1
                } as IThrottleResult;
                Assert.deepEqual(result, expectedRlt, "expected result");
                result = throttleMgr.sendMessage(msgId, msg);
                count = this.loggingSpy.callCount
                Assert.equal(count,2, "sendMsg count test1");
                Assert.deepEqual(result, expectedRlt, "expected result test1");

                let isTriggeredPost = throttleMgr.isTriggered(this._msgId);
                Assert.equal(isTriggeredPost, true, "trigger post");
                let canThrottlePost = throttleMgr.canThrottle(this._msgId);
                Assert.equal(canThrottlePost, true, "can throttle post");
                isTriggeredPost = throttleMgr.isTriggered(msgId);
                Assert.equal(isTriggeredPost, true, "trigger post test1");
                canThrottlePost = throttleMgr.canThrottle(msgId);
                Assert.equal(canThrottlePost, true, "can throttle post test1");

                let retryRlt = throttleMgr.sendMessage(this._msgId, msg);
                let retryCount = this.loggingSpy.callCount
                Assert.equal(retryCount,2, "retrt count");
                let expectedRetryRlt = {
                    isThrottled: false,
                    throttleNum: 0
                } as IThrottleResult
                Assert.deepEqual(retryRlt, expectedRetryRlt, "retry result");

                retryRlt = throttleMgr.sendMessage(msgId, msg);
                retryCount = this.loggingSpy.callCount
                Assert.equal(retryCount,2, "retrt count test1");
                expectedRetryRlt = {
                    isThrottled: false,
                    throttleNum: 0
                } as IThrottleResult
                Assert.deepEqual(retryRlt, expectedRetryRlt, "retry result test1");
            }
        });
    }
}


class ChannelPlugin implements IPlugin {

    public isFlushInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;

    public identifier = "Sender";

    public priority: number = 1001;

    constructor() {
        this.processTelemetry = this._processTelemetry.bind(this);
    }
    public pause(): void {
        this.isPauseInvoked = true;
    }

    public resume(): void {
        this.isResumeInvoked = true;
    }

    public teardown(): void {
        this.isTearDownInvoked = true;
    }

    flush(async?: boolean, callBack?: () => void): void {
        this.isFlushInvoked = true;
        if (callBack) {
            callBack();
        }
    }

    public processTelemetry(env: any) {}

    setNextPlugin(next: any) {
        // no next setup
    }

    public initialize = (config: IConfiguration, core: IAppInsightsCore, plugin: IPlugin[]) => {
    }

    private _processTelemetry(env: any) {

    }
}
