import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { IConfiguration, ITelemetryPlugin, ITelemetryItem, IPlugin, CoreUtils, IAppInsightsCore, normalizeJsName, random32, mwcRandom32, mwcRandomSeed } from "../../src/applicationinsights-core-js"
import { AppInsightsCore } from "../../src/JavaScriptSDK/AppInsightsCore";
import { IChannelControls } from "../../src/JavaScriptSDK.Interfaces/IChannelControls";
import { _InternalMessageId, LoggingSeverity } from "../../src/JavaScriptSDK.Enums/LoggingEnums";
import { _InternalLogMessage, DiagnosticLogger } from "../../src/JavaScriptSDK/DiagnosticLogger";

const AIInternalMessagePrefix = "AITR_";
const MaxInt32 = 0xFFFFFFFF;

export class ApplicationInsightsCoreTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "ApplicationInsightsCore: Initialization validates input",
            test: () => {

                const samplingPlugin = new TestSamplingPlugin();

                const appInsightsCore = new AppInsightsCore();
                try {
                    appInsightsCore.initialize(null, [samplingPlugin]);
                } catch (error) {
                    Assert.ok(true, "Validates configuration");
                }

                const config2: IConfiguration = {
                    endpointUrl: "https://dc.services.visualstudio.com/v2/track",
                    instrumentationKey: "40ed4f60-2a2f-4f94-a617-22b20a520864",
                    extensionConfig: {}
                };

                try {
                    appInsightsCore.initialize(config2, null);
                } catch (error) {
                    Assert.ok(true, "Validates extensions are provided");
                }
                const config: IConfiguration = {
                    endpointUrl: "https://dc.services.visualstudio.com/v2/track",
                    instrumentationKey: "",
                    extensionConfig: {}
                };
                try {
                    appInsightsCore.initialize(config, [samplingPlugin]);
                } catch (error) {
                    Assert.ok(true, "Validates instrumentationKey");
                }

                const channelPlugin1 = new ChannelPlugin();
                channelPlugin1.priority = 1001;

                const config3 = {
                    extensions: [channelPlugin1],
                    endpointUrl: "https://dc.services.visualstudio.com/v2/track",
                    instrumentationKey: "",
                    extensionConfig: {}
                };
                try {
                    appInsightsCore.initialize(config3, [samplingPlugin]);
                } catch (error) {
                    Assert.ok(true, "Validates channels cannot be passed in through extensions");
                }

                const channelPlugin2 = new ChannelPlugin();
                channelPlugin2.priority = 200;

                const config4 = {
                    channels: [[channelPlugin2]],
                    endpointUrl: "https://dc.services.visualstudio.com/v2/track",
                    instrumentationKey: "",
                    extensionConfig: {}
                };

                let thrown = false;
                try {
                    appInsightsCore.initialize(config4, [samplingPlugin]);
                } catch (error) {
                    thrown = true;
                }
                Assert.ok(thrown, "Validates channels passed in through config, priority cannot be less Channel controller priority");

            }
        });

        this.testCase({
            name: "ApplicationInsightsCore: Initialization initializes setNextPlugin",
            test: () => {
                const samplingPlugin = new TestSamplingPlugin();
                samplingPlugin.priority = 20;

                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                // Assert prior to initialize
                Assert.ok(!samplingPlugin.nexttPlugin, "Not setup prior to pipeline initialization");

                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41" },
                    [samplingPlugin, channelPlugin]);
                Assert.ok(!!samplingPlugin.nexttPlugin, "setup prior to pipeline initialization");
            }
        });


        this.testCase({
            name: "ApplicationInsightsCore: Plugins can be added with same priority",
            test: () => {
                const samplingPlugin = new TestSamplingPlugin();
                samplingPlugin.priority = 20;

                const samplingPlugin1 = new TestSamplingPlugin();
                samplingPlugin1.priority = 20;

                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;

                const appInsightsCore = new AppInsightsCore();
                try {
                    appInsightsCore.initialize(
                        { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41" },
                        [samplingPlugin, samplingPlugin1, channelPlugin]);

                    Assert.ok("No error on duplicate priority");
                } catch (error) {
                    Assert.ok(false); // duplicate priority does not throw error
                }
            }
        });

        this.testCase({
            name: "ApplicationInsightsCore: flush clears channel buffer",
            test: () => {
                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41" },
                    [channelPlugin]);

                Assert.ok(!channelPlugin.isUnloadInvoked, "Unload not called on initialize");
                appInsightsCore.getTransmissionControls().forEach(queues => {
                    queues.forEach((q: IChannelControls & ChannelPlugin) => {
                        if (q.onunloadFlush) {
                            q.onunloadFlush()
                        }
                    });
                });

                Assert.ok(channelPlugin.isUnloadInvoked, "Unload triggered for channel");
            }
        });

        this.testCase({
            name: "config.channel adds additional queue to existing channels",
            test: () => {
                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1030;

                const channelPlugin1 = new ChannelPlugin();
                channelPlugin1.priority = 1030;

                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41", channels: [[channelPlugin1]] },
                    [channelPlugin]);


                const channelQueues = appInsightsCore.getTransmissionControls();
                Assert.equal(2, channelQueues.length, "Total number of channel queues");
                Assert.equal(1, channelQueues[0].length, "Number of channels in queue 1");
                Assert.equal(1, channelQueues[1].length, "Number of channels in queue 2");
            }
        });

        this.testCase({
            name: 'ApplicationInsightsCore: track adds required default fields if missing',
            useFakeTimers: true,
            test: () => {
                const expectedIKey: string = "09465199-12AA-4124-817F-544738CC7C41";
                const expectedTimestamp = new Date().toISOString();
                const expectedBaseType = "EventData";

                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize({ instrumentationKey: expectedIKey }, [channelPlugin]);

                // Act
                const bareItem: ITelemetryItem = { name: 'test item' };
                appInsightsCore.track(bareItem);
                this.clock.tick(1);

                // Test
                Assert.equal(expectedIKey, bareItem.iKey, "Instrumentation key is added");
                Assert.deepEqual(expectedTimestamp, bareItem.time, "Timestamp is added");
            }
        });

        this.testCase({
            name: "DiagnosticLogger: Critical logging history is saved",
            test: () => {
                // Setup
                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize({ instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41", loggingLevelTelemetry: 999 }, [channelPlugin]);

                const messageId: _InternalMessageId = _InternalMessageId.CannotAccessCookie; // can be any id

                const logInternalSpy = this.sandbox.spy(appInsightsCore.logger, 'logInternalMessage');

                // Test precondition
                Assert.ok(logInternalSpy.notCalled, 'PRE: No internal logging performed yet');
                Assert.equal(0, appInsightsCore.logger.queue.length, 'PRE: No logging recorded');

                // Act
                appInsightsCore.logger.throwInternal(LoggingSeverity.CRITICAL, messageId, "Test Error");

                // Test postcondition
                Assert.ok(logInternalSpy.calledOnce, 'POST: Logging success');
                Assert.equal(messageId, logInternalSpy.args[0][1].messageId, "Correct message logged");
                Assert.ok(logInternalSpy.args[0][1].message.indexOf('Test Error') !== -1, "Correct message logged");
                Assert.equal(1, appInsightsCore.logger.queue.length, "POST: Correct messageId logged");
                Assert.ok(appInsightsCore.logger.queue[0].message.indexOf('Test Error') !== -1, "Correct message logged");
                Assert.equal(messageId, appInsightsCore.logger.queue[0].messageId, "Correct message logged");
            }
        });

        this.testCase({
            name: 'DiagnosticLogger: Logger can be created with default constructor',
            test: () => {
                // setup
                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.logger = new DiagnosticLogger();

                const messageId: _InternalMessageId = _InternalMessageId.CannotAccessCookie; // can be any id
                const logInternalSpy = this.sandbox.spy(appInsightsCore.logger, 'logInternalMessage');

                // Verify precondition
                Assert.ok(logInternalSpy.notCalled, 'PRE: No internal logging performed yet');
                Assert.equal(0, appInsightsCore.logger.queue.length, 'PRE: No internal logging performed yet');

                // Act
                appInsightsCore.logger.throwInternal(LoggingSeverity.CRITICAL, messageId, "Some message");

                // Test postcondition
                Assert.ok(logInternalSpy.calledOnce, 'POST: Logging success');
                Assert.equal(messageId, logInternalSpy.args[0][1].messageId, "Correct message logged");
                Assert.equal(messageId, appInsightsCore.logger.queue[0].messageId, "POST: Correct messageId logged");

                // Logging same error doesn't duplicate
                Assert.equal(1, appInsightsCore.logger.queue.length, "Pre: Only 1 logged message");
                appInsightsCore.logger.throwInternal(LoggingSeverity.CRITICAL, messageId, "Some message");
                Assert.equal(1, appInsightsCore.logger.queue.length, "Pre: Still only 1 logged message");
            }
        });

        // TODO: test no reinitialization
        this.testCase({
            name: "Initialize: core cannot be reinitialized",
            test: () => {
                // Setup
                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                const initFunction = () => appInsightsCore.initialize({ instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41" }, [channelPlugin]);

                // Assert precondition
                Assert.ok(!appInsightsCore.isInitialized(), "PRE: core constructed but not initialized");

                // Init
                initFunction();

                // Assert initialized
                Assert.ok(appInsightsCore.isInitialized(), "core is initialized");

                Assert.throws(initFunction, Error, "Core cannot be reinitialized");
            }
        });

        // TODO: test pollInternalLogs
        this.testCase({
            name: "DiagnosticLogger: Logs can be polled",
            useFakeTimers: true,
            test: () => {
                // Setup
                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    {
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41",
                        diagnosticLogInterval: 1
                    }, [channelPlugin]);
                const trackTraceSpy = this.sandbox.stub(appInsightsCore, "track");

                Assert.equal(0, appInsightsCore.logger.queue.length, "Queue is empty");

                // Setup queue
                const queue: _InternalLogMessage[] = appInsightsCore.logger.queue;
                queue.push(new _InternalLogMessage(1, "Hello1"));
                queue.push(new _InternalLogMessage(2, "Hello2"));
                const poller = appInsightsCore.pollInternalLogs();

                // Assert precondition
                Assert.equal(2, appInsightsCore.logger.queue.length, "Queue contains 2 items");

                // Act
                this.clock.tick(1);

                // Assert postcondition
                Assert.equal(0, appInsightsCore.logger.queue.length, "Queue is empty");

                const data1 = trackTraceSpy.args[0][0];
                Assert.ok(data1.baseData.message.indexOf("Hello1") !== -1);

                const data2 = trackTraceSpy.args[1][0];
                Assert.ok(data2.baseData.message.indexOf("Hello2") !== -1);

                // Cleanup
                clearInterval(poller);
            }
        });

        // TODO: test logger crosscontamination
        this.testCase({
            name: "DiagnosticLogger: Logs in separate cores do not interfere",
            test: () => {
                // Setup
                const channelPlugin = new ChannelPlugin();
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    {
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41",
                        loggingLevelTelemetry: 999
                    }, [channelPlugin]
                );
                const dummyCore = new AppInsightsCore();
                dummyCore.initialize(
                    {
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41",
                        loggingLevelTelemetry: 999
                    }, [channelPlugin]
                );

                const aiSpy = this.sandbox.spy(appInsightsCore.logger, 'logInternalMessage');
                const dummySpy = this.sandbox.spy(dummyCore.logger, 'logInternalMessage');

                const messageId: _InternalMessageId = _InternalMessageId.CannotAccessCookie; // can be any id

                // Test precondition
                Assert.equal(0, appInsightsCore.logger.queue.length, 'PRE: No internal logging performed yet');
                Assert.ok(aiSpy.notCalled, "PRE: messageId not yet logged");
                Assert.equal(0, dummyCore.logger.queue.length, 'PRE: No dummy logging');
                Assert.ok(dummySpy.notCalled, "PRE: No dummy messageId logged");

                // Act
                appInsightsCore.logger.throwInternal(LoggingSeverity.CRITICAL, messageId, "Test Error");

                // Test postcondition
                Assert.equal(1, appInsightsCore.logger.queue.length, 'POST: Logging success');
                Assert.ok(aiSpy.called, "POST: Correct messageId logged");
                Assert.equal(0, dummyCore.logger.queue.length, 'POST: No dummy logging');
                Assert.ok(dummySpy.notCalled, "POST: No dummy messageId logged");
            }
        });

        this.testCase({
            name: "ApplicationInsightsCore: Plugins can be provided through configuration",
            test: () => {
                const samplingPlugin = new TestSamplingPlugin();
                samplingPlugin.priority = 20;

                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;

                const appInsightsCore = new AppInsightsCore();
                try {
                    appInsightsCore.initialize(
                        { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41", extensions: [samplingPlugin] },
                        [channelPlugin]);
                } catch (error) {
                    Assert.ok(false, "No error expected");
                }

                let found = false;
                (appInsightsCore as any)._extensions.forEach(ext => {
                    if (ext.identifier === samplingPlugin.identifier) {
                        found = true;
                    }
                });

                Assert.ok(found, "Plugin pased in through config is part of pipeline");
            }
        });

        this.testCase({
            name: "ApplicationInsightsCore: Non telemetry specific plugins are initialized and not part of telemetry processing pipeline",
            test: () => {
                const samplingPlugin = new TestSamplingPlugin();
                samplingPlugin.priority = 20;

                const testPlugin = new TestPlugin();

                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;

                const appInsightsCore = new AppInsightsCore();
                try {
                    appInsightsCore.initialize(
                        { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41" },
                        [testPlugin, samplingPlugin, channelPlugin]);
                } catch (error) {
                    Assert.ok(false, "Exception not expected");
                }

                Assert.ok(typeof ((appInsightsCore as any)._extensions[0].processTelemetry) !== 'function', "Extensions can be provided through overall configuration");
            }
        });

        this.testCase({
            name: "Channels can be passed in through configuration",
            test: () => {

                const channelPlugin1 = new ChannelPlugin();
                channelPlugin1.priority = 1001;

                const channelPlugin2 = new ChannelPlugin();
                channelPlugin2.priority = 1002;

                const channelPlugin3 = new ChannelPlugin();
                channelPlugin3.priority = 1001;

                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    {
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41",
                        channels: [[channelPlugin1, channelPlugin2], [channelPlugin3]]
                    },
                    []);

                Assert.ok(channelPlugin1._nextPlugin === channelPlugin2);
                Assert.ok(CoreUtils.isNullOrUndefined(channelPlugin3._nextPlugin));
                const channelControls = appInsightsCore.getTransmissionControls();
                Assert.ok(channelControls.length === 2);
                Assert.ok(channelControls[0].length === 2);
                Assert.ok(channelControls[1].length === 1);
                Assert.ok(channelControls[0][0] === channelPlugin1);
                Assert.ok(channelControls[1][0] === channelPlugin3);
                Assert.ok(channelPlugin2._nextPlugin === undefined);
                Assert.ok(channelPlugin3._nextPlugin === undefined);
            }
        });

        this.testCase({
            name: 'ApplicationInsightsCore: user can add two channels in single queue',
            test: () => {
                const channelPlugin1 = new ChannelPlugin();
                channelPlugin1.priority = 1001;

                const channelPlugin2 = new ChannelPlugin();
                channelPlugin2.priority = 1002;

                const channelPlugin3 = new ChannelPlugin();
                channelPlugin3.priority = 1003;

                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    {
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41"
                    },
                    [channelPlugin1, channelPlugin2, channelPlugin3]);

                Assert.ok(channelPlugin1._nextPlugin === channelPlugin2);
                Assert.ok(channelPlugin2._nextPlugin === channelPlugin3);
                Assert.ok(CoreUtils.isNullOrUndefined(channelPlugin3._nextPlugin));
                const channelControls = appInsightsCore.getTransmissionControls();
                Assert.ok(channelControls.length === 1);
                Assert.ok(channelControls[0].length === 3);
                Assert.ok(channelControls[0][0] === channelPlugin1);
                Assert.ok(channelControls[0][1] === channelPlugin2);
                Assert.ok(channelControls[0][2] === channelPlugin3);
            }
        });

        this.testCase({
            name: 'ApplicationInsightsCore: Validates root level properties in telemetry item',
            test: () => {
                const expectedIKey: string = "09465199-12AA-4124-817F-544738CC7C41";

                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                const samplingPlugin = new TestSamplingPlugin(true);
                const appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize({ instrumentationKey: expectedIKey }, [samplingPlugin, channelPlugin]);

                // Act
                const bareItem: ITelemetryItem = {
                    name: 'test item',
                    ext: {
                        "user": { "id": "test" }
                    },
                    tags: [{ "device.id": "AABA40BC-EB0D-44A7-96F5-ED2103E47AE9" }],
                    data: {
                        "custom data": {
                            "data1": "value1"
                        }
                    },
                    baseType: "PageviewData",
                    baseData: { name: "Test Page" }
                };

                appInsightsCore.track(bareItem);
            }
        });

        this.testCase({
            name: "Channels work even if no extensions are present",
            test: () => {
                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1030;
                const appInsightsCore = new AppInsightsCore();
                const channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");
                appInsightsCore.initialize(
                    {
                        instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41", channels: [[channelPlugin]]
                    }, []);
                const event: ITelemetryItem = { name: 'test' };
                appInsightsCore.track(event);
                const evt = channelSpy.args[0][0];
                Assert.ok(evt.name === "test");
            }
        });

        this.testCase({
            name: "ApplicationInsightsCore: Track queue event when not all extensions are initialized",
            test: () => {
                const trackPlugin = new TrackPlugin();
                const channelPlugin = new ChannelPlugin();
                channelPlugin.priority = 1001;
                const appInsightsCore = new AppInsightsCore();
                const channelSpy = this.sandbox.stub(channelPlugin, "processTelemetry");
                appInsightsCore.initialize(
                    { instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41" },
                    [trackPlugin, channelPlugin]);
                Assert.ok(channelSpy.calledOnce, "Channel process incorrect number of times");
                Assert.ok(channelSpy.args[0][0].name == "TestEvent1", "Incorrect event");
                Assert.ok(appInsightsCore.eventCnt() == 0, "Event queue wrong number of events");
            }
        });

        this.testCase({
            name: "ApplicationInsightsCore: Validate JS name normalization",
            test: () => {
                Assert.equal("Hello", normalizeJsName("Hello"));
                Assert.equal("Hello_World", normalizeJsName("Hello.World"));
                Assert.equal("_Hello_World", normalizeJsName("@Hello.World"));
                Assert.equal("_Hello_World", normalizeJsName("#Hello.World"));
                Assert.equal("_Hello_World", normalizeJsName(".Hello#World"));
                Assert.equal("_Hello_World_", normalizeJsName(".Hello(World)"));
                Assert.equal("_Hello_World_", normalizeJsName(".Hello&World%"));
                Assert.equal("_Hello_World_", normalizeJsName("!Hello=World+"));
                Assert.equal("_Hello_World_", normalizeJsName("~Hello[World]"));
                Assert.equal("_Hello_World_", normalizeJsName(":Hello{World}"));
                Assert.equal("_Hello_World_", normalizeJsName("\'Hello\'World;"));
                Assert.equal("_Hello_World_", normalizeJsName("\"Hello\\World\""));
                Assert.equal("_Hello_World_", normalizeJsName("|Hello<World>"));
                Assert.equal("_Hello_World_", normalizeJsName("?Hello,World-"));
            }
        });


        this.testCase({
            name: 'newId tests length',
            test: () => {
                _checkNewId(5, CoreUtils.newId(5), "Test the previous length");
                _checkNewId(10, CoreUtils.newId(10), "Test the double the previous length");
                _checkNewId(22, CoreUtils.newId(), "Test new default length");
                _checkNewId(99, CoreUtils.newId(99), "Test 99 character == 74.25 bytes");
                _checkNewId(200, CoreUtils.newId(200), "Test 200 character == 150 bytes");

                // Check the id is not zero filled ("A") based on the an int32 === 5 base64 bytes (plus 2 bits)
                let newId = CoreUtils.newId();
                Assert.notEqual("AAAAAAAAAAAAAAAA", newId.substring(0, 16), "Make sure that [" + newId + "] value is not zero filled (generally -- it is randomly possible)")
                Assert.notEqual("AAAAAAAAAAAAAAAA", newId.substring(5), "Make sure that [" + newId + "] value is not zero filled (generally -- it is randomly possible)")
            }
        });

        this.testCase({
            name: 'newId check randomness',
            test: () => {
                let map = {};

                // Check that mwcRandom is bing called (relies on the mwc implementation from the default seed)
                mwcRandomSeed(1);
                Assert.notEqual(722346555, random32(), "Make sure that the mwcRandom was not being called - step 1");
                Assert.notEqual(3284929732, random32(), "Make sure that the mwcRandom was not being called - step2");

                // cause auto seeding again
                mwcRandomSeed();

                for (let lp = 0; lp < 10000; lp ++) {
                    let newId = CoreUtils.newId();
                    if (map[newId]) {
                        Assert.ok(false, "[" + newId + "] was duplicated...")
                    }

                    map[newId] = true;
                }

                mwcRandomSeed(1);
                Assert.notEqual(722346555, random32(), "Make sure that the mwcRandom was not being called");
            }
        });

        this.testCase({
            name: 'newId check randomness -- emulating IE',
            test: () => {
                let map = {};

                // Enumlate IE
                this.setUserAgent("Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0)");
                this.setCrypto(null);
                
                // Check that mwcRandom is bing called (relies on the mwc implementation from the default seed)
                mwcRandomSeed(1);
                Assert.equal(722346555, random32(), "Make sure that the mwcRandom was being called - step 1");
                Assert.equal(3284929732, random32(), "Make sure that the mwcRandom was being called - step2");

                // cause auto seeding again
                mwcRandomSeed();
                Assert.notEqual(722346555, random32(), "Make sure that the mwcRandom was being called - step 3");

                for (let lp = 0; lp < 10000; lp ++) {
                    let newId = CoreUtils.newId();
                    if (map[newId]) {
                        Assert.ok(false, "[" + newId + "] was duplicated...")
                    }

                    map[newId] = true;
                }

                // Reset the seed and re-check the expected result
                mwcRandomSeed(1);
                Assert.equal(722346555, random32(), "Make sure that the mwcRandom was not being called - step 4");
            }
        });

        this.testCase({
            name: 'Test CoreUtils.randomValue() randomness and distribution',
            test: () => {
                let numBuckets = 100;
                let buckets: number[] = _createBuckets(100);
                let runs = 1000000;

                for (let lp = 0; lp < runs; lp++) {
                    const bucket = CoreUtils.randomValue(numBuckets-1);
                    buckets[bucket] ++;
                }

                let min = 10;
                let max = -1;
                let mode = 0;
            
                for (let lp = 0; lp < numBuckets; lp++) {
                    buckets[lp] /= runs;
                    mode += buckets[lp];
                    min = Math.min(min, buckets[lp]);
                    max = Math.max(max, buckets[lp]);

                    if (buckets[lp] === 0) {
                        Assert.ok(false, 'Bucket: ' + lp + ' is empty!');
                    }
                }

                Assert.equal(undefined, buckets[numBuckets], 'Make sure that we only allocated the correct number of buckets');
            
                const totalVariance = mode / numBuckets;

                let perfectDist = 1 / numBuckets;
                let testDist = perfectDist * 1.5;

                Assert.ok(min > 0 && min <= testDist, min + ': Make sure that we have a good minimum distribution, perfect distribution is (1/bucketCount) = ' + perfectDist);
                Assert.ok(max > 0 && max <= testDist, max + ': Make sure that we have a good maximum distribution, perfect distribution is (1/bucketCount) = ' + perfectDist);
                Assert.ok(totalVariance > 0 && totalVariance <= testDist, totalVariance + ': Check the average distribution perfect distribution is (1/bucketCount) = ' + perfectDist);
            }
        });

        this.testCase({
            name: 'Test CoreUtils.random32() randomness and distribution',
            test: () => {
                let numBuckets = 100;
                let buckets: number[] = _createBuckets(100);
                let runs = 1000000;

                for (let lp = 0; lp < runs; lp++) {
                    // Need to use floor otherwise the bucket is defined as a float as the index
                    const bucket = Math.floor((CoreUtils.random32() / MaxInt32) * numBuckets);
                    buckets[bucket] ++;
                }

                let min = 10;
                let max = -1;
                let mode = 0;
            
                for (let lp = 0; lp < numBuckets; lp++) {
                    buckets[lp] /= runs;
                    mode += buckets[lp];
                    min = Math.min(min, buckets[lp]);
                    max = Math.max(max, buckets[lp]);

                    if (buckets[lp] === 0) {
                        Assert.ok(false, 'Bucket: ' + lp + ' is empty!');
                    }
                }

                Assert.equal(undefined, buckets[numBuckets], 'Make sure that we only allocated the correct number of buckets');
            
                const totalVariance = mode / numBuckets;

                let perfectDist = 1 / numBuckets;
                let testDist = perfectDist * 1.5;

                Assert.ok(min > 0 && min <= testDist, min + ': Make sure that we have a good minimum distribution, perfect distribution is (1/bucketCount) = ' + perfectDist);
                Assert.ok(max > 0 && max <= testDist, max + ': Make sure that we have a good maximum distribution, perfect distribution is (1/bucketCount) = ' + perfectDist);
                Assert.ok(totalVariance > 0 && totalVariance <= testDist, totalVariance + ': Check the average distribution perfect distribution is (1/bucketCount) = ' + perfectDist);
            }
        });

        this.testCase({
            name: 'Test CoreUtils.mwcRandom32() randomness and distribution',
            test: () => {
                let numBuckets = 100;
                let buckets: number[] = _createBuckets(100);
                let runs = 1000000;

                for (let lp = 0; lp < runs; lp++) {
                    // Need to use floor otherwise the bucket is defined as a float as the index
                    const bucket = Math.floor((CoreUtils.mwcRandom32() / MaxInt32) * numBuckets);
                    buckets[bucket] ++;
                }

                let min = 10;
                let max = -1;
                let mode = 0;
            
                for (let lp = 0; lp < numBuckets; lp++) {
                    buckets[lp] /= runs;
                    mode += buckets[lp];
                    min = Math.min(min, buckets[lp]);
                    max = Math.max(max, buckets[lp]);

                    if (buckets[lp] === 0) {
                        Assert.ok(false, 'Bucket: ' + lp + ' is empty!');
                    }
                }
            
                Assert.equal(undefined, buckets[numBuckets], 'Make sure that we only allocated the correct number of buckets');

                const totalVariance = mode / numBuckets;

                let perfectDist = 1 / numBuckets;
                let testDist = perfectDist * 1.5;

                Assert.ok(min > 0 && min <= testDist, min + ': Make sure that we have a good minimum distribution, perfect distribution is (1/bucketCount) = ' + perfectDist);
                Assert.ok(max > 0 && max <= testDist, max + ': Make sure that we have a good maximum distribution, perfect distribution is (1/bucketCount) = ' + perfectDist);
                Assert.ok(totalVariance > 0 && totalVariance <= testDist, totalVariance + ': Check the average distribution perfect distribution is (1/bucketCount) = ' + perfectDist);
            }
        });

        function _createBuckets(num: number) {
            // Using helper function as TypeScript 2.5.3 is complaining about new Array<number>(100).fill(0);
            let buckets: number[] = [];
            for (let lp = 0; lp < num; lp++) {
                buckets[lp] = 0;
            }

            return buckets;
        }

        function _checkNewId(idLen: number, newId: string, message: string) {
            Assert.equal(idLen, newId.length, "[" + newId + "] - " + message);
        }
    }
}

class TestSamplingPlugin implements ITelemetryPlugin {
    public processTelemetry: (env: ITelemetryItem) => void;
    public initialize: (config: IConfiguration) => void;
    public identifier: string = "AzureSamplingPlugin";
    public setNextPlugin: (next: ITelemetryPlugin) => void;
    public priority: number = 5;
    public version = "1.0.31-Beta";
    public nexttPlugin: ITelemetryPlugin;
    private samplingPercentage;
    private _validateItem = false;

    constructor(validateItem: boolean = false) {
        this.processTelemetry = this._processTelemetry.bind(this);
        this.initialize = this._start.bind(this);
        this.setNextPlugin = this._setNextPlugin.bind(this);
        this._validateItem = validateItem;
    }

    private _processTelemetry(env: ITelemetryItem) {
        if (!env) {
            throw Error("Invalid telemetry object");
        }

        if (this._validateItem) {
            Assert.ok(env.baseData);
            Assert.ok(env.baseType);
            Assert.ok(env.data);
            Assert.ok(env.ext);
            Assert.ok(env.tags);
        }
    }

    private _start(config: IConfiguration) {
        if (!config) {
            throw Error("required configuration missing");
        }

        const pluginConfig = config.extensions ? config.extensions[this.identifier] : null;
        this.samplingPercentage = pluginConfig ? pluginConfig.samplingPercentage : 100;
    }

    private _setNextPlugin(next: ITelemetryPlugin): void {
        this.nexttPlugin = next;
    }
}

class ChannelPlugin implements IChannelControls {
    public _nextPlugin: ITelemetryPlugin;
    public isFlushInvoked = false;
    public isUnloadInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;
    public version: string = "1.0.33-Beta";

    public processTelemetry;

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

    onunloadFlush(async?: boolean) {
        this.isUnloadInvoked = true;
    }

    setNextPlugin(next: ITelemetryPlugin) {
        this._nextPlugin = next;
    }

    public initialize = (config: IConfiguration) => {
    }

    public _processTelemetry(env: ITelemetryItem) {
    }
}

class TestPlugin implements IPlugin {
    public identifier: string = "TestPlugin";
    public version: string = "1.0.31-Beta";

    private _config: IConfiguration;

    public initialize(config: IConfiguration) {
        this._config = config;
        // do custom one time initialization
    }
}

class TrackPlugin implements IPlugin {
    public identifier: string = "TrackPlugin";
    public version: string = "1.0.31-Beta";
    public priority = 2;
    public _nextPlugin: ITelemetryPlugin;
    public isInitialized: any;
    private _config: IConfiguration;

    public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) {
        this._config = config;
        core.track({ name: 'TestEvent1' });

    }

    public setNextPlugin(next: ITelemetryPlugin) {
        this._nextPlugin = next;
    }

    public processTelemetry(evt: ITelemetryItem) {
        this._nextPlugin.processTelemetry(evt);
    }
}
