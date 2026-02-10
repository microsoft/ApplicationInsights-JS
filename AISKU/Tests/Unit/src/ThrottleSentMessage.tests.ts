import { AppInsightsSku } from "../../../src/AISku";
import { ApplicationInsightsContainer } from "../../../src/ApplicationInsightsContainer";
import { IApplicationInsights } from "../../../src/IApplicationInsights";
import { Snippet } from "../../../src/Snippet";
import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { IConfig, IConfiguration, LoggingSeverity, _eInternalMessageId, IThrottleInterval, IThrottleLimit, IThrottleMgrConfig } from "@microsoft/otel-core-js";
import { SinonSpy } from "sinon";
import { createSnippetV5 } from "./testSnippetV5";
import { FeatureOptInMode, newId } from "@microsoft/otel-core-js";
import { createSnippetV6 } from "./testSnippetV6";
const ApplicationInsights = AppInsightsSku;

const TestInstrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';

const tconfig = {
    disabled: false,
    limit: {
        samplingRate: 1000000,
        maxSendNumber:100
    } as IThrottleLimit,
    interval: {
        monthInterval: 1,
        daysOfMonth: [1], // must add here
        dayInterval: undefined
    } as IThrottleInterval
} as IThrottleMgrConfig;

export class ThrottleSentMessage extends AITestClass {
    private _ai: IApplicationInsights;
    private getAi: ApplicationInsights;
    private _config: IConfiguration | IConfig;
    private _logger;

    constructor() {
        super("ThrottleSentMessage");
    }

    public _getTestConfig() {
        let config: IConfiguration & IConfig = {
            instrumentationKey: TestInstrumentationKey,
            disableAjaxTracking: false,
            disableFetchTracking: false,
            enableRequestHeaderTracking: true,
            enableResponseHeaderTracking: true,
            maxBatchInterval: 2500,
            disableExceptionTracking: false,
            enableCorsCorrelation: true,
            samplingPercentage: 50,
            convertUndefined: "test-value",
            disablePageUnloadEvents: [ "beforeunload" ],
            extensionConfig: {
                ["AppInsightsCfgSyncPlugin"]: {
                    cfgUrl: ""
                }
            }
        };
        return config;
    }

    public testInitialize() {
        try {
            if (window.localStorage){
                window.localStorage.clear();
            }
            this.useFakeServer = false;
            this._config = this._getTestConfig();

            const init = new ApplicationInsights({
                config: this._config
            });
          
            this._ai = init.loadAppInsights();
            this.getAi = init;

            let core = this._ai['core'];
            this._logger = core.logger;
        } catch (e) {
            console.error('Failed to initialize');
        }
    }

    public testFinishedCleanup(): void {
        if (this._ai && this._ai.unload) {
            // force unload
            this._ai.unload(false);
        }
        if (window.localStorage){
            window.localStorage.clear();
        }
    }

    public registerTests() {
        this.cdnDeprecatedMessageTests();
        this.ikeyMessageTests();
        this.snippetVerMessageTests();
    }

    public cdnDeprecatedMessageTests(): void {
        this.testCase({
            name: "ThrottleSentMessage: Message is sent when az416426 is used",
            useFakeTimers: true,
            test: () => {
                Assert.ok(this._ai, 'ApplicationInsights SDK exists');
                Assert.ok(this._ai.appInsights, 'App Analytics exists');
                Assert.equal(true, this._ai.appInsights.isInitialized(), 'App Analytics is initialized');

                Assert.ok(this._ai.appInsights.core, 'Core exists');
                Assert.equal(true, this._ai.appInsights.core.isInitialized(),
                    'Core is initialized');
                let loggingSpy = this.sandbox.stub(this._logger, 'throwInternal');

                let config = this.getAi.config;

                config.throttleMgrCfg= {[_eInternalMessageId.CdnDeprecation]:tconfig};
                config.featureOptIn = {["CdnUsage"]: {mode: FeatureOptInMode.enable}};
                this.clock.tick(12); // wait enough time for negative test
                Assert.equal(loggingSpy.callCount, 0);
                // first enable featureOptin, then enable throttleMsg
                config.featureOptIn = {["CdnUsage"]: {mode: FeatureOptInMode.enable},["iKeyUsage"]: {mode: FeatureOptInMode.enable}};
                config.throttleMgrCfg= {[_eInternalMessageId.CdnDeprecation]:tconfig, [_eInternalMessageId.DefaultThrottleMsgKey]:tconfig};
                this._ai.context.internal.sdkSrc = "az416426";
                this.clock.tick(1);
                Assert.equal(loggingSpy.called, 1);
                Assert.equal(_eInternalMessageId.CdnDeprecation, loggingSpy.args[0][1]);
                let message= loggingSpy.args[0][2];
                Assert.ok(message.includes("Cdn"));
            }
        });
        this.testCase({
        name: "ThrottleSentMessage: Message will not be sent again when other config change",
        useFakeTimers: true,
            test: () => {
                Assert.ok(this._ai, 'ApplicationInsights SDK exists');
                Assert.ok(this._ai.appInsights, 'App Analytics exists');
                Assert.equal(true, this._ai.appInsights.isInitialized(), 'App Analytics is initialized');

                Assert.ok(this._ai.appInsights.core, 'Core exists');
                Assert.equal(true, this._ai.appInsights.core.isInitialized(),
                    'Core is initialized');
                let loggingSpy = this.sandbox.stub(this._logger, 'throwInternal');

                let config = this.getAi.config;

                config.throttleMgrCfg= {[_eInternalMessageId.CdnDeprecation]:tconfig, [_eInternalMessageId.DefaultThrottleMsgKey]:tconfig};
                config.featureOptIn = {["CdnUsage"]: {mode: FeatureOptInMode.enable},["iKeyUsage"]: {mode: FeatureOptInMode.enable}};
                this._ai.context.internal.sdkSrc = "az416426";
                this.clock.tick(1);
                Assert.equal(loggingSpy.called, 1);
                console.log("is called", loggingSpy.callCount);
                Assert.equal(_eInternalMessageId.CdnDeprecation, loggingSpy.args[0][1]);
                let message= loggingSpy.args[0][2];
                Assert.ok(message.includes("Cdn"));
                
                config.instrumentationKey = "newinstrumentkey";
                this.clock.tick(1);
                Assert.equal(loggingSpy.called, 1);

            }
        });
    }

    public ikeyMessageTests(): void {
        this.testCase({
            name: "ThrottleSentMessage: Message is sent when user use connection string",
            useFakeTimers: true,
            test: () => {
                Assert.ok(this._ai, 'ApplicationInsights SDK exists');
                Assert.ok(this._ai.appInsights, 'App Analytics exists');
                Assert.equal(true, this._ai.appInsights.isInitialized(), 'App Analytics is initialized');

                Assert.ok(this._ai.appInsights.core, 'Core exists');
                Assert.equal(true, this._ai.appInsights.core.isInitialized(),
                    'Core is initialized');
                let loggingSpy = this.sandbox.stub(this._logger, 'throwInternal');

                let config = this.getAi.config;

                // test throttleCfg has controll on message sending

                config.throttleMgrCfg= {[_eInternalMessageId.InstrumentationKeyDeprecation]:tconfig, [_eInternalMessageId.DefaultThrottleMsgKey]:tconfig};
                this.clock.tick(1);
                // TODO: the sequence of these two changes cannot be reversed 
                config.featureOptIn = {["iKeyUsage"]: {mode: FeatureOptInMode.enable}};
                this.clock.tick(1);

                Assert.equal(loggingSpy.called, 1);
                Assert.equal(_eInternalMessageId.InstrumentationKeyDeprecation, loggingSpy.args[0][1]);
                let message= loggingSpy.args[0][2];
                Assert.ok(message.includes("Instrumentation key"));
            }
        });
        this.testCase({
            name: "ThrottleSentMessage: Message will not be sent when user turn off message",
            useFakeTimers: true,
            test: () => {
                let loggingSpy = this.sandbox.stub(this._logger, 'throwInternal');
                let config = this._getTestConfig();
                config.throttleMgrCfg= {[_eInternalMessageId.InstrumentationKeyDeprecation]:tconfig, [_eInternalMessageId.DefaultThrottleMsgKey]:tconfig};
                config.featureOptIn = {["iKeyUsage"]: {mode: FeatureOptInMode.disable}}
                let init = new ApplicationInsights({
                    config: config
                });
              
                let ai = init.loadAppInsights();
                Assert.equal(true, ai.appInsights.core.isInitialized(),'Core is initialized');
                this.clock.tick(12); // wait enough time for negative test
                Assert.equal(loggingSpy.callCount, 0);

                ai.unload(false);
            }
        });
    }
    public snippetVerMessageTests(){
        this.testCase({
            name: "ThrottleSentMessage: Message will be sent for ver 5 snippet",
            useFakeTimers: true,
            test: () => {
                    let pieceConfig = this._getTestConfig()
                    let myconfig = {src:"", cfg:pieceConfig};
                    let snippet = this._initializeSnippet(createSnippetV5(myconfig));

                    let getcore = snippet['core'];
                    let getcoreLogger = getcore.logger;

                    let loggingSpy = this.sandbox.stub(getcoreLogger, 'throwInternal');

// notice: if featureOptIn does not exist before, the onconfigchange would not be called
                    Assert.equal(true, snippet.appInsights.isInitialized(), "isInitialized");
                    snippet.config.throttleMgrCfg= {[_eInternalMessageId.SdkLdrUpdate]:tconfig, [_eInternalMessageId.DefaultThrottleMsgKey]:tconfig};
                    snippet.config.featureOptIn = {["SdkLoaderVer"]: {mode: FeatureOptInMode.enable}}
                    this.clock.tick(1);
                    Assert.equal(loggingSpy.called, 1);
                    Assert.equal(_eInternalMessageId.SdkLdrUpdate, loggingSpy.args[0][1]);
            }
        });

        this.testCase({
            name: "ThrottleSentMessage: Message will not be sent for ver 6 snippet",
            useFakeTimers: true,
            test: () => {
                    let pieceConfig = this._getTestConfig()
                    let myconfig = {src:"", cfg:pieceConfig};
                    let snippet = this._initializeSnippet(createSnippetV6(myconfig));

                    let getcore = snippet['core'];
                    let getcoreLogger = getcore.logger;
                    let loggingSpy = this.sandbox.stub(getcoreLogger, 'throwInternal');

                    Assert.equal(true, snippet.appInsights.isInitialized(), "isInitialized");
                    snippet.config.throttleMgrCfg= {[_eInternalMessageId.SdkLdrUpdate]:tconfig, [_eInternalMessageId.DefaultThrottleMsgKey]:tconfig};
                    snippet.config.featureOptIn = {["SdkLoaderVer"]: {mode: FeatureOptInMode.enable}}
                    this.clock.tick(12); // wait enough time for negative test
                    Assert.equal(loggingSpy.callCount, 0);
            }
        });

    }

    
    private _initializeSnippet(snippet: Snippet): ApplicationInsights {
        try {
            //this.useFakeServer = false;

            // Call the initialization
            ((ApplicationInsightsContainer.getAppInsights(snippet, snippet.version)) as IApplicationInsights);

            // Setup Sinon stuff
            const appInsights: AppInsightsSku = (snippet as any).appInsights;
            this.onDone(() => {
                if (snippet) {
                    if (snippet["unload"]) {
                        snippet["unload"](false);
                    } else if (snippet["appInsightsNew"]) {
                        snippet["appInsightsNew"].unload(false);
                    }
                }
            });

            Assert.ok(appInsights, "The App insights instance should be populated");
            Assert.ok(appInsights.core, "The Core exists");
            Assert.equal(appInsights.core, (snippet as any).core, "The core instances should match");

            Assert.equal(true, (appInsights as any).isInitialized(), 'App Analytics is initialized');
            Assert.equal(true, appInsights.core.isInitialized(), 'Core is initialized');

       

        } catch (e) {
            console.error('Failed to initialize');
            Assert.ok(false, e);
        }

        // Note: Explicitly returning the original snippet as this should have been updated!
        return snippet as any;
    }
}