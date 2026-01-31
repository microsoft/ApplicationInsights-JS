/**
 * @copyright Microsoft 2020
 */

import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { IConfig, utlCanUseLocalStorage } from "@microsoft/applicationinsights-core-js";
import { ITelemetryItem, AppInsightsCore, IPlugin, IConfiguration, DiagnosticLogger, hasDocument, isFunction, IAppInsightsCore } from '@microsoft/applicationinsights-core-js';
import { ClickAnalyticsPlugin, BehaviorMapValidator, BehaviorValueValidator, BehaviorEnumValidator } from '../../../src/ClickAnalyticsPlugin';
import { PageAction } from "../../../src/events/PageAction";
import { DomContentHandler } from '../../../src/handlers/DomContentHandler';
import { IClickAnalyticsConfiguration, IPageActionOverrideValues } from '../../../src/Interfaces/Datamodel';
import { sanitizeUrl } from "../../../src/DataCollector";
import { DEFAULT_AI_BLOB_ATTRIBUTE_TAG, DEFAULT_DATA_PREFIX, DEFAULT_DONOT_TRACK_TAG } from "../../../src/common/Utils";
import { PropertiesPlugin } from "@microsoft/applicationinsights-properties-js";
import { strContains } from "@nevware21/ts-utils";

export class ClickEventTest extends AITestClass {
    public testInitialize() {
        if (utlCanUseLocalStorage()) {
            window.localStorage.clear();
        }
    }

    public testCleanup() {
        if (utlCanUseLocalStorage()) {
            window.localStorage.clear();
        }
    }

    public registerTests() {

        this.testCase({
            name: "clickPlugin: config can be set from roots dynamically",
            useFakeTimers: true,
            test: () => {
                const dataTagsDefault = {
                    useDefaultContentNameOrId: false,
                    aiBlobAttributeTag: DEFAULT_AI_BLOB_ATTRIBUTE_TAG,
                    customDataPrefix: DEFAULT_DATA_PREFIX,
                    captureAllMetaDataContent: false,
                    dntDataTag: DEFAULT_DONOT_TRACK_TAG,
                    metaDataPrefix: "",
                    parentDataTag: ""
                };
                const coreDataDefault = {
                    referrerUri: hasDocument() ? document.referrer : "",
                    requestUri: "",
                    pageName: "",
                    pageType: ""
                };

                const defaultElementTypes = "A,BUTTON,AREA,INPUT"; 

                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const id = clickAnalyticsPlugin.identifier;
               
                core.initialize({
                    instrumentationKey: "testIkey",
                    extensionConfig : {
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                core.config.extensionConfig =  core.config.extensionConfig?  core.config.extensionConfig : {};
                let extConfig = core.config.extensionConfig[id];
                Assert.ok(extConfig, "default config should not be null");

                //check defaults
                Assert.equal(extConfig.autoCapture,true, "autoCapture should be true by default");
                Assert.deepEqual(extConfig.pageTags, {}, "pageTags should be {} by default");
                Assert.equal(extConfig.defaultRightClickBhvr, "", "defaultRightClickBhvr should be '' by default");
                Assert.equal(extConfig.dropInvalidEvents, false, "dropInvalidEvents should be false by default");
                Assert.equal(extConfig.urlCollectHash, false, "urlCollectHash should be false by default");
                Assert.equal(extConfig.urlCollectQuery, false, "urlCollectQuery should be false by default");
                Assert.deepEqual(extConfig.dataTags, dataTagsDefault, "udataTags should be set by default");
                Assert.deepEqual(extConfig.coreData, coreDataDefault, "udataTags should be set by default");
                Assert.deepEqual(extConfig.trackElementTypes, defaultElementTypes, "trackElementTypes should be set by default");

                Assert.ok(extConfig.callback, "callback should be set by default");
                let callbacks = extConfig.callback;
                let pageActionPageTags = callbacks.pageActionPageTags;
                let pageName = callbacks.pageName;
                let contentName = callbacks.contentName;
                Assert.equal(pageName, null, "pageName should be set by default");
                Assert.equal(pageActionPageTags, null, "pageActionPageTags should be set by default");
                Assert.equal(contentName, null, "contentName should be set by default");
                
                Assert.ok(extConfig.behaviorValidator,"behaviorValidator should be set by default");
                let bhvVal = extConfig.behaviorValidator;
                Assert.equal(bhvVal(), "", "behaviorValidator should return ''");
                Assert.equal(bhvVal(1), 1, "behaviorValidator should return key");

                //config(non-Object) changes
                let config = {
                    urlCollectHash: true,
                    urlCollectQuery: true,
                    dropInvalidEvents: true,
                    autoCapture: true,
                    defaultRightClickBhvr: "click"
                }
                core.config.extensionConfig[id] = config;
                this.clock.tick(1);
                extConfig = core.config.extensionConfig[id];
                Assert.equal(extConfig.urlCollectHash, true, "urlCollectHash should be updated");
                Assert.equal(extConfig.urlCollectQuery, true, "urlCollectQuery should be updated");
                Assert.equal(extConfig.dropInvalidEvents, true, "dropInvalidEvents should be updated");
                Assert.equal(extConfig.autoCapture, true, "autoCapture should be updated");
                Assert.equal(extConfig.defaultRightClickBhvr, "click", "defaultRightClickBhvrshould be updated");

                
                //config(object) changes
                let dataTags = {
                    useDefaultContentNameOrId: true
                };
                core.config.extensionConfig[id].dataTags = dataTags;
                this.clock.tick(1);
                extConfig = core.config.extensionConfig[id];
                let expectedDataTags ={...dataTagsDefault};
                expectedDataTags.useDefaultContentNameOrId = true;
                Assert.deepEqual(extConfig.dataTags, expectedDataTags, "dataTags should be updated");
                 
                let dataTags1 = {
                    dntDataTag: "dnt",
                    captureAllMetaDataContent: true,
                    customDataPrefix: "wrongtage"
                };
                core.config.extensionConfig[id].dataTags = dataTags1;
                this.clock.tick(1);
                let extConfig1 = core.config.extensionConfig[id];
                let expectedDataTags1 = {...dataTagsDefault};
                expectedDataTags1.dntDataTag = "dnt";
                expectedDataTags1.captureAllMetaDataContent = true;
                Assert.deepEqual(extConfig1.dataTags, expectedDataTags1, "dataTags should be updated with correct prefixName");

                let coreData = {
                    referrerUri: "url",
                    pageName: "name"
                }
                core.config.extensionConfig[id].coreData =coreData;
                this.clock.tick(1);
                extConfig = core.config.extensionConfig[id];
                let expectedCoreData = {
                    referrerUri: "url",
                    requestUri: "",
                    pageName: "name",
                    pageType: ""
                };
                Assert.deepEqual(extConfig.coreData, expectedCoreData, "coreData should be updated");
           
                let pageTags = {
                    tag1: "tag1",
                    tag2: true,
                    tag3: 1,
                    tag4: {tag: "val1"},
                    tag5: ["val1","val2"]
                }
                core.config.extensionConfig[id].pageTags = pageTags;
                this.clock.tick(1);
                extConfig = core.config.extensionConfig[id];
                Assert.deepEqual(extConfig.pageTags, pageTags, "PageTags should be updated");
            }
        });

        this.testCase({
            name: "autoCapture: click events are automatically captured and tracked",
            useFakeTimers: true,
            test: () => {
                const config = {
                    coreData: {},
                    autoCapture: true,
                    dataTags: {
                        useDefaultContentNameOrId: true,
                        metaDataPrefix: "ha-",
                        customDataPrefix: "data-ha-",
                        aiBlobAttributeTag: "blob"
                    }
                } as IClickAnalyticsConfiguration;
                let clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                let core = new AppInsightsCore();
                let channel = new ChannelPlugin();
                core.initialize({
                    instrumentationKey: "testIkey",
                    extensionConfig: {
                        [clickAnalyticsPlugin.identifier]: config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, "track");

                let element = document.createElement("button");
                element.setAttribute("id", "testAutoCaptureBtn");
                element.setAttribute("data-ha-aN", "autoCaptureArea");
                document.body.appendChild(element);

                const mouseDownEvent = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
                element.dispatchEvent(mouseDownEvent);
            
                this.clock.tick(500);

                Assert.equal(true, spy.called, "track should be called on click event");
                let calledEvent: ITelemetryItem = spy.getCall(0).args[0];
                Assert.equal("testAutoCaptureBtn", calledEvent.baseData["name"]);

                // Clean up
                document.body.removeChild(element);
            }
        });

        this.testCase({
            name: "autoCapture: click events are automatically captured and tracked with customized config",
            useFakeTimers: true,
            test: () => {
                const config = {
                    coreData: {},
                    autoCapture: true,
                    dataTags: {
                        useDefaultContentNameOrId: true,
                        metaDataPrefix: "ha-",
                        customDataPrefix: "data-ha-",
                        aiBlobAttributeTag: "blob"
                    },
                    trackElementTypes: "A"
                } as IClickAnalyticsConfiguration;
                let clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                let core = new AppInsightsCore();
                let channel = new ChannelPlugin();
                core.initialize({
                    instrumentationKey: "testIkey",
                    extensionConfig: {
                        [clickAnalyticsPlugin.identifier]: config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, "track");

                let element = document.createElement("a");
                element.setAttribute("id", "testAutoCaptureA");
                element.setAttribute("data-ha-aN", "autoCaptureArea");
                document.body.appendChild(element);

                let elementNotToTrack = document.createElement("button");
                elementNotToTrack.setAttribute("id", "testAutoCaptureBtn");
                elementNotToTrack.setAttribute("data-ha-aN", "autoCaptureArea");
                document.body.appendChild(elementNotToTrack);

                let mouseDownEvent = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
                element.dispatchEvent(mouseDownEvent);

                let mouseDownEventNotToTrack = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
                elementNotToTrack.dispatchEvent(mouseDownEventNotToTrack);
            
                this.clock.tick(500);

                Assert.equal(true, spy.called, "track should be called on click event");
                let calledEvent: ITelemetryItem = spy.getCall(0).args[0];
                Assert.equal("testAutoCaptureA", calledEvent.baseData["name"]);

                // Clean up
                document.body.removeChild(element);
                document.body.removeChild(elementNotToTrack);
            }
        });

        this.testCase({
            name: "trackPageView properties are correctly assigned (Empty)",
            test: () => {
                let config = {
                    coreData: {},
                    callback: {
                        pageActionPageTags: () => ({ key2: "value2" })
                    },
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        metaDataPrefix:"ha-",
                        customDataPrefix: "data-ha-",
                        aiBlobAttributeTag: "blob",
                        parentDataTag: "parent",
                        dntDataTag: "donotTrack"
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
               
                core.initialize({
                    instrumentationKey: "testIkey",
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]

                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler,  extConfig.callback?.pageActionPageTags, {}, traceLogger );
               
                
                clickAnalyticsPlugin.trackPageAction()
                const element = document.createElement("a");
                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, "track");
                // clickAnalyticsPlugin.capturePageAction(element, {} as IOverrideValues, {}, false);
                pageAction.capturePageAction(element);
                Assert.equal(true, spy.called);
                let calledEvent: ITelemetryItem = spy.getCall(0).args[0];
                Assert.notEqual(-1, calledEvent.data["uri"].indexOf("Tests.html"));
                Assert.equal(undefined, calledEvent.data["behavior"]);
                Assert.equal(undefined, calledEvent.data["actionType"]);
                Assert.equal("[{}]", calledEvent.data["content"]);
                Assert.equal(false, isNaN(calledEvent.data["timeToAction"] as number));
                Assert.equal("value2", calledEvent.data["properties"]["pageTags"].key2);
            }

        });

        this.testCase({
            name: "PageAction properties are correctly assigned (Empty)",
            test: () => {
                let config = {
                    coreData: {},
                    callback: {
                        pageActionPageTags: () => ({ key2: "value2" })
                    },
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        metaDataPrefix:"ha-",
                        customDataPrefix: "data-ha-",
                        aiBlobAttributeTag: "blob",
                        parentDataTag: "parent",
                        dntDataTag: "donotTrack"
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const properties = new PropertiesPlugin();
               
                core.initialize({
                    instrumentationKey: "testIkey",
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel, properties]);
                this.onDone(() => {
                    core.unload(false);
                });

                let sdkVersion = properties.context.internal.sdkVersion;
                Assert.ok(strContains(sdkVersion, "_ClickPlugin"), sdkVersion);
                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]

                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler,  extConfig.callback?.pageActionPageTags, {}, traceLogger );

                const element = document.createElement("a");
                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, "track");
                // clickAnalyticsPlugin.capturePageAction(element, {} as IOverrideValues, {}, false);
                pageAction.capturePageAction(element);
                Assert.equal(true, spy.called);
                let calledEvent: ITelemetryItem = spy.getCall(0).args[0];
                Assert.notEqual(-1, calledEvent.data["uri"].indexOf("Tests.html"));
                Assert.equal(undefined, calledEvent.data["behavior"]);
                Assert.equal(undefined, calledEvent.data["actionType"]);
                Assert.equal("[{}]", calledEvent.data["content"]);
                Assert.equal(false, isNaN(calledEvent.data["timeToAction"] as number));
                Assert.equal("value2", calledEvent.data["properties"]["pageTags"].key2);
            }

        });

        this.testCase({
            name: "PageAction properties are correctly assigned (Overrides)",
            useFakeTimers: true,
            test: () => {
                const overrides: IPageActionOverrideValues = {
                    actionType: "overrideActionType",
                    contentTags: { 'testTag': 'testValue' },
                    refUri: "overrideReferrerUri",
                    behavior: 2
                };
                const config = {
                    coreData: {},
                    autoCapture: false,
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );

                const element = document.createElement('a');
                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                this.clock.tick(500);
                // clickAnalyticsPlugin.capturePageAction(element, overrides, { customProperty: { customNextedProperty: "test" } });
                pageAction.capturePageAction(element, overrides, { customProperty: { customNextedProperty: "test" } });
                Assert.equal(true, spy.called);
                var calledEvent: ITelemetryItem = spy.getCall(0).args[0];
                Assert.equal("overrideActionType", calledEvent.data["actionType"]);
                Assert.equal('[{"testTag":"testValue"}]', calledEvent.data["content"]);
                Assert.equal(2, calledEvent.data["behavior"]);
                Assert.equal("overrideReferrerUri", calledEvent.data["refUri"]);
                Assert.equal("test", calledEvent.data["customProperty"]["customNextedProperty"]);
            }

        });

        this.testCase({
            name: "PageAction properties are correctly assigned (Populated)",
            useFakeTimers: true,
            test: () => {
                const contentNameFn = () => "testContentName";
                const config = {
                    callback: {
                        contentName: contentNameFn
                    },
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier];
                Assert.ok(extConfig, "Make sure it is not null/undefined");
                const behaviorValidator = extConfig.behaviorValidator;
                Assert.ok(isFunction(behaviorValidator), "Make sure we have a function")
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );
                

                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("id","testId");
                element.setAttribute("data-ha-aN", "testAn");
                element.setAttribute("data-ha-sN", "testsN");
                element.setAttribute("data-ha-cS", "testcS");
                element.setAttribute("data-ha-tN", "testtN");
                element.setAttribute("data-ha-pid", "testpid");
                element.setAttribute("data-ha-cT", "testcT");
                ((element) as HTMLBaseElement).href = "testClickTarget";

                var expectedContent = JSON.stringify([{
                    an: "testAn",
                    sn: "testsN",
                    cs: "testcS",
                    tn: "testtN",
                    pid: "testpid",
                    ct: "testcT",
                    contentName: "testContentName"
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent: ITelemetryItem = spy.getCall(0).args[0];
                Assert.equal("testId", calledEvent.baseData["name"]);
                Assert.equal(expectedContent, calledEvent.data["content"]);

                // Check the "merged" config
                Assert.deepEqual({                // Check the "merged" config
                    autoCapture: true,
                    callback: {
                        contentName: contentNameFn,
                        pageActionPageTags: null,
                        pageName: null
                    },
                    coreData: {
                        referrerUri: document.referrer,
                        requestUri: "",
                        pageName: "",
                        pageType: ""
                    },
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob',
                        captureAllMetaDataContent: false,
                        dntDataTag: DEFAULT_DONOT_TRACK_TAG,
                        parentDataTag: ""                        
                    },
                    pageTags: {},
                    behaviorValidator: behaviorValidator,
                    defaultRightClickBhvr: "",
                    dropInvalidEvents : false,
                    urlCollectHash: false,
                    urlCollectQuery: false,
                    trackElementTypes: "A,BUTTON,AREA,INPUT"
                }, core.config.extensionConfig[clickAnalyticsPlugin.identifier]);

            }
        });
        this.testCase({
            name: "trackElementTypes: validate empty string, string with spaces, lowercase, and dynamic changes",
            useFakeTimers: true,
            test: () => {
                const config = {
                    trackElementTypes: "A,BUTTON,AREA,INPUT"
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig: {
                        [clickAnalyticsPlugin.identifier]: config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });
        
                let currentConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier].trackElementTypes;
                // Validate default value
                Assert.equal("A,BUTTON,AREA,INPUT", currentConfig, "Default trackElementTypes should be 'A,BUTTON,AREA,INPUT'");
        
                // Test empty string
                core.config["extensionConfig"][clickAnalyticsPlugin.identifier].trackElementTypes = null;
                this.clock.tick(1);
                currentConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier].trackElementTypes;
                Assert.equal("A,BUTTON,AREA,INPUT", currentConfig, "default value would be applied");
        
                // Test dynamic change
                core.config["extensionConfig"][clickAnalyticsPlugin.identifier].trackElementTypes = "A,BUTTON,AREA,INPUT,TEST";
                this.clock.tick(1);
                currentConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier].trackElementTypes;
                Assert.equal("A,BUTTON,AREA,INPUT,TEST", currentConfig, "spaces and lowercase string will be converted to uppercase and trimmed");
            }
        });

        this.testCase({
            name: "PageAction properties are correctly assigned (Populated) with useDefaultContentNameOrId flag false",
            useFakeTimers: true,
            test: () => {
                const config = {
                    callback: {
                        contentName: () => "testContentName"
                    },
                    dataTags : {
                        useDefaultContentNameOrId : false,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier];
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );

                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("id","testId")
                element.setAttribute("data-ha-aN", "testAn");
                element.setAttribute("data-ha-sN", "testsN");
                element.setAttribute("data-ha-cS", "testcS");
                element.setAttribute("data-ha-tN", "testtN");
                element.setAttribute("data-ha-pid", "testpid");
                element.setAttribute("data-ha-cT", "testcT");
                ((element) as HTMLBaseElement).href = "testClickTarget";

                var expectedContent = JSON.stringify([{
                    an: "testAn",
                    sn: "testsN",
                    cs: "testcS",
                    tn: "testtN",
                    pid: "testpid",
                    ct: "testcT",
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent: ITelemetryItem = spy.getCall(0).args[0];
                Assert.equal("not_specified", calledEvent.baseData["name"]);
                Assert.equal(expectedContent, calledEvent.data["content"]);
            }
        });

        // pageAction - clicked element has no tags, capture the id of the html element
        this.testCase({
            name: "PageAction properties are correctly populated when parent element has data tags",
            useFakeTimers: true,
            test: () => {
                const config = {
                    callback: {
                        contentName: () => "testContentName"
                    },
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);

                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });
                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );


                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("id", "testId")
                const parentElement = document.createElement('div');
                parentElement.setAttribute("data-ha-id", "testParentId");
                parentElement.setAttribute("data-ha-name", "testParentName");
                parentElement.appendChild(element);
                ((element) as HTMLBaseElement).href = "testClickTarget";
                var expectedContent = JSON.stringify([{
                    contentName: "testContentName",
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent = spy.getCall(0).args[0];
                Assert.equal("testId", calledEvent.baseData["name"]);
                Assert.equal("not_specified", calledEvent.data["parentId"]);
                Assert.equal(expectedContent, calledEvent.data["content"]);
            }
        });


        // pageAction - clicked element has no tags on current element, capture the id of the html element and parentId of the parent
        this.testCase({
            name: "PageAction - clicked element has no tags on current element, capture the id of the html element and parentId of the parent",
            useFakeTimers: true,
            test: () => {
                const config = {
                    callback: {
                        contentName: () => "testContentName"                  
                    },
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob',
                        parentDataTag:'parentgroup'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );


                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("id", "testId")
                const parentElement = document.createElement('div');
                parentElement.setAttribute("data-ha-id", "testParentId");
                parentElement.setAttribute("data-ha-name", "testParentName");
                parentElement.setAttribute("data-ha-parentgroup", "testParentGroup");
                parentElement.appendChild(element);
                ((element) as HTMLBaseElement).href = "testClickTarget";
                var expectedContent = JSON.stringify([{
                    contentName: "testContentName",
                    name: "testParentName"
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent = spy.getCall(0).args[0];
                Assert.equal("testId", calledEvent.baseData["name"]);
                Assert.equal("testParentId", calledEvent.data["parentId"]);
                Assert.equal(expectedContent, calledEvent.data["content"]);
            }
        });

        // pageAction - clicked element has no tags on current element, capture the id of the html element and html id of the parent
        this.testCase({
            name: "PageAction - clicked element has no tags on current element, capture the id of the html element and html id of the parent",
            useFakeTimers: true,
            test: () => {
                const config = {
                    callback: {
                        contentName: () => "testContentName"                  
                    },
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob',
                        parentDataTag:'parentgroup'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
               
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );


                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("id", "testId")
                const parentElement = document.createElement('div');
                parentElement.setAttribute("id","testParentId")
                parentElement.setAttribute("data-ha-name", "testParentName");
                parentElement.setAttribute("data-ha-parentgroup", "testParentGroup");
                parentElement.appendChild(element);
                ((element) as HTMLBaseElement).href = "testClickTarget";
                var expectedContent = JSON.stringify([{
                    contentName: "testContentName",
                    name: "testParentName"
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent = spy.getCall(0).args[0];
                Assert.equal("testId", calledEvent.baseData["name"]);
                Assert.equal("testParentId", calledEvent.data["parentId"]);
                Assert.equal(expectedContent, calledEvent.data["content"]);
            }
        });

        // pageAction - clicked element has no tags, no html id capture the content name of html element should be event name
        this.testCase({
            name: "PageAction name populated from contentname",
            useFakeTimers: true,
            test: () => {
                const config = {
                    callback: {
                        contentName: () => "testContentName"                  
                    },
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );


                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                const parentElement = document.createElement('div');
                parentElement.setAttribute("data-ha-id", "testParentId");
                parentElement.setAttribute("data-ha-name", "testParentName");
                parentElement.appendChild(element);
                ((element) as HTMLBaseElement).href = "testClickTarget";
                var expectedContent = JSON.stringify([{
                    contentName: "testContentName",
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent = spy.getCall(0).args[0];
                Assert.equal("testContentName", calledEvent.baseData["name"]);
                Assert.equal(expectedContent, calledEvent.data["content"]);
            }
        });
        
        // Parent element has no tags, continue walk up the DOM to find grand parent element's info
        this.testCase({
            name: "PageAction: element and its upper element does not have any tags, so grand parent element is recognize as under one area, no parent info is populated.",
            useFakeTimers: true,
            test: () => {
                const config = {
                    callback: {
                        contentName: () => "testContentName"                  
                    },
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        customDataPrefix: 'data-ha-',
                        parentDataTag:'parentgroup'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );


                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("id", "testId")
                const parentElement = document.createElement('div');
                parentElement.setAttribute("id", "testParentId");
                parentElement.appendChild(element);
                const grandParentElement = document.createElement('div');
                grandParentElement.setAttribute("data-ha-parentgroup", "group1");
                grandParentElement.setAttribute("data-ha-id", "testGrandParentId");
                grandParentElement.setAttribute("data-ha-name", "testGrandParentName");
                grandParentElement.appendChild(parentElement);

                ((element) as HTMLBaseElement).href = "testClickTarget";
                var expectedContent = JSON.stringify([{
                    contentName: "testContentName",
                    name: "testGrandParentName",
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent = spy.getCall(0).args[0];
                Assert.equal("testId", calledEvent.baseData["name"]);
                Assert.equal("testGrandParentId", calledEvent.data["parentId"]);
                Assert.equal(expectedContent, calledEvent.data["content"]);
            }
        });

        // no data tags found, do not populate any data except the id
        this.testCase({
            name: "PageAction: no parentId or parentName data is found",
            useFakeTimers: true,
            test: () => {
                const config = {
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        customDataPrefix: 'data-ha-',
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );


                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("id", "testId")
                const parentElement = document.createElement('div');
                parentElement.setAttribute("id", "testParentId");
                parentElement.appendChild(element);
                const grandParentElement = document.createElement('div');
                grandParentElement.setAttribute("id", "testGrandParentId");
                grandParentElement.appendChild(parentElement);

                ((element) as HTMLBaseElement).href = "testClickTarget";

                var expectedContent = JSON.stringify([{
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent = spy.getCall(0).args[0];
                Assert.equal("testId", calledEvent.baseData["name"]);
                Assert.equal("not_specified", calledEvent.data["parentId"]);
                Assert.equal(expectedContent, calledEvent.data["content"]);
            }
        });

        // element use data-ha-blob
        this.testCase({
            name: "Element uses data* blob ",
            useFakeTimers: true,
            test: () => {
                const config = {
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob'
                    },
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );


                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("data-ha-id", "testId");
                element.setAttribute("data-ha-blob", '{"id":"parentTestId","aN":"areaTestName","sN":"slotTestName","cN":"contentTestName", "pI":"parentIdSelfDefined", "pN":"parentNameSelfDefined"}');
                ((element) as HTMLBaseElement).href = "testClickTarget";
                var expectedContent = JSON.stringify([{
                    aN: "areaTestName",
                    sN: "slotTestName",
                    cN: "contentTestName",
                    pI: "parentIdSelfDefined",
                    pN: "parentNameSelfDefined"
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent = spy.getCall(0).args[0];
                Assert.equal("parentTestId", calledEvent.baseData["name"]);
                Assert.equal(expectedContent, calledEvent.data["content"]);
            }
        });

        // parent element use data-ha-blob
        this.testCase({
            name: "Parent Element uses data* blob ",
            useFakeTimers: true,
            test: () => {
                const config = {
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob',
                        parentDataTag:'parentgroup'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );


                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');  
                const parentElement = document.createElement('div');
                parentElement.setAttribute("id", "testParentId");
                parentElement.setAttribute("data-ha-parentgroup", "group1");
                parentElement.setAttribute("data-ha-blob", '{"id":"parentTestId","aN":"areaTestName","sN":"slotTestName","cN":"contentTestName", "pI":"parentIdSelfDefined", "pN":"parentNameSelfDefined"}');
                parentElement.appendChild(element);
                ((element) as HTMLBaseElement).href = "testClickTarget";
                var expectedContent = JSON.stringify([{
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent = spy.getCall(0).args[0];
                Assert.equal("not_specified", calledEvent.baseData["name"]);
                Assert.equal("parentTestId", calledEvent.data["parentId"]);
                Assert.equal(expectedContent, calledEvent.data["content"]);
            }
        });

         // parent element use data-ha-parent, donot populate data from grandparent
        this.testCase({
            name: "Parent element use data-ha-parent, donot populate data from grandparent",
            useFakeTimers: true,
            test: () => {
                const config = {
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        customDataPrefix: 'data-ha-',
                        parentDataTag: 'parent'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );


                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("data-ha-id", "testId");
                const parentElement = document.createElement('div');
                parentElement.setAttribute("data-ha-parentid", "testParentId");
                parentElement.setAttribute("data-ha-name", "testParentName");
                parentElement.appendChild(element);
                const grandParentElement = document.createElement('div');
                grandParentElement.setAttribute("data-ha-grandparent-id", "testGrandParentId");
                grandParentElement.setAttribute("data-ha-grandparent-name", "testGrandParentName");
                grandParentElement.appendChild(parentElement);

                ((element) as HTMLBaseElement).href = "testClickTarget";
                var expectedContent = JSON.stringify([{
                    name: "testParentName",
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent = spy.getCall(0).args[0];
                Assert.equal("testId", calledEvent.baseData["name"]);
                Assert.equal("testParentId", calledEvent.data["parentId"]);
                Assert.equal(expectedContent, calledEvent.data["content"]);
            }
        });

        this.testCase({
            name: "PageAction Behaviours test default value",
            useFakeTimers: true,
            test: () => {
                const config = {
                    callback: {
                        contentName: () => "testContentName"                  
                    },
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );


                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("id","testId")
                element.setAttribute("data-ha-aN", "testAn");
                element.setAttribute("data-ha-bhvr", "testBehavior");
                ((element) as HTMLBaseElement).href = "testClickTarget";

                var expectedContent = JSON.stringify([{
                    an: "testAn",
                    contentName: "testContentName"
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent: ITelemetryItem = spy.getCall(0).args[0];
                Assert.equal(expectedContent, calledEvent.data["content"]);
                Assert.equal("testBehavior",calledEvent.data["behavior"]);
            }
        });

        this.testCase({
            name: "PageAction Behaviours test empty default value",
            useFakeTimers: true,
            test: () => {
                const config = {
                    callback: {
                        contentName: () => "testContentName"                  
                    },
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );


                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("id","testId")
                element.setAttribute("data-ha-aN", "testAn");
                ((element) as HTMLBaseElement).href = "testClickTarget";

                var expectedContent = JSON.stringify([{
                    an: "testAn",
                    contentName: "testContentName"
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent: ITelemetryItem = spy.getCall(0).args[0];
                Assert.equal(expectedContent, calledEvent.data["content"]);
                Assert.equal(undefined, calledEvent.data["behavior"]);
            }
        });

        this.testCase({
            name: "PageAction Behaviours test default BehaviorMapValidator",
            useFakeTimers: true,
            test: () => {
                const behaviorMap = {
                    BEHAVIOR1:"behavior1_Value",
                    BEHAVIOR2:"behavior2_Value",
                }
                const config = {
                    callback: {
                        contentName: () => "testContentName"                  
                    },
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob'
                    },
                    behaviorValidator : BehaviorMapValidator(behaviorMap)
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });
                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );


                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("id","testId")
                element.setAttribute("data-ha-aN", "testAn");
                element.setAttribute("data-ha-bhvr", "BEHAVIOR1");
                ((element) as HTMLBaseElement).href = "testClickTarget";

                var expectedContent = JSON.stringify([{
                    an: "testAn",
                    contentName: "testContentName",
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent: ITelemetryItem = spy.getCall(0).args[0];
                Assert.equal(expectedContent, calledEvent.data["content"]);
                Assert.equal("behavior1_Value",calledEvent.data["behavior"]);
            }
        });

        this.testCase({
            name: "PageAction Behaviours test default BehaviorValueValidator",
            useFakeTimers: true,
            test: () => {
                const behaviorArray = [
                    "BEHAVIOR1",
                    "BEHAVIOR2"
                ]
                const config = {
                    callback: {
                        contentName: () => "testContentName"                  
                    },
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob'
                    },
                    behaviorValidator : BehaviorValueValidator(behaviorArray)
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );


                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("id","testId")
                element.setAttribute("data-ha-aN", "testAn");
                element.setAttribute("data-ha-bhvr", "BEHAVIOR1");
                ((element) as HTMLBaseElement).href = "testClickTarget";

                var expectedContent = JSON.stringify([{
                    an: "testAn",
                    contentName: "testContentName",
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent: ITelemetryItem = spy.getCall(0).args[0];
                Assert.equal(expectedContent, calledEvent.data["content"]);
                Assert.equal("BEHAVIOR1",calledEvent.data["behavior"]);
            }
        });

        this.testCase({
            name: "PageAction Behaviours test default BehaviorEnumValidator",
            useFakeTimers: true,
            test: () => {
                const behaviorEnum = {
                    NAVIGATIONBACK: 1,
                    NAVIGATION: 2,          
                    NAVIGATIONFORWARD: 3
                };
                const config = {
                    callback: {
                        contentName: () => "testContentName"                  
                    },
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob'
                    },
                    behaviorValidator : BehaviorEnumValidator(behaviorEnum)
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );


                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("id","testId")
                element.setAttribute("data-ha-aN", "testAn");
                element.setAttribute("data-ha-bhvr", "NAVIGATION");
                ((element) as HTMLBaseElement).href = "testClickTarget";

                var expectedContent = JSON.stringify([{
                    an: "testAn",
                    contentName: "testContentName"
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent: ITelemetryItem = spy.getCall(0).args[0];
                Assert.equal(expectedContent, calledEvent.data["content"]);
                Assert.equal(2,calledEvent.data["behavior"]);
            }
        });

        this.testCase({
            name: "PageAction not called on undefined event and disableUndefinedEventsTracking is set to true",
            useFakeTimers: true,
            test: () => {
                const config = {
                    callback: {
                        contentName: () => "testContentName"                  
                    },
                    dataTags : {
                        useDefaultContentNameOrId : false,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob'
                    },
                    dropInvalidEvents:true
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);

                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

                core.config["extensionConfig"] =  core.config["extensionConfig"]?  core.config["extensionConfig"] : {};
                let extConfig = core.config["extensionConfig"][clickAnalyticsPlugin.identifier]
                const contentHandler = new DomContentHandler(extConfig, traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, extConfig, contentHandler, null, {}, traceLogger );


                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("id","testId");
                ((element) as HTMLBaseElement).href = "testClickTarget";
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(false, spy.called);
            }
        });

        this.testCase({
            name: "Test sanitizeUrl",
            test: () => {
                let fakeLocation1 = null;
                let fakeLocation2 = {
                    protocol:"https:",
                    hostname:"www.test.com",
                    host:"www.test.com",
                    port:"3000",
                    pathname:"/path",
                    hash:"#test",
                    search:"?q=search&rlz=1C1CHBF"
                } as any;
                let fakeLocation3 = {
                    protocol:"https:",
                    host:"www.test.com",
                    port:"",
                    pathname:"",
                    hash:"",
                    search:"?q=search&rlz=1C1CHBF"
                } as any;

                const config1 = {
                    urlCollectHash: true,
                    urlCollectQuery: true
                };
                const config2 = {
                    urlCollectHash: false,
                    urlCollectQuery: false
                };
                const config3 = {
                    urlCollectHash:false,
                    urlCollectQuery: true
                };

                
                let url1 = sanitizeUrl(config1, fakeLocation1);
                Assert.equal(null, url1);

                let url2 = sanitizeUrl(config2, fakeLocation2);
                Assert.equal("https://www.test.com:3000/path", url2);

                let url3 = sanitizeUrl(config1,fakeLocation2);
                Assert.equal("https://www.test.com:3000/path#test?q=search&rlz=1C1CHBF", url3);

                let url4 = sanitizeUrl(config3, fakeLocation3);
                Assert.equal("https://www.test.com?q=search&rlz=1C1CHBF", url4);

                let url5 = sanitizeUrl(config1, fakeLocation3);
                Assert.equal("https://www.test.com?q=search&rlz=1C1CHBF", url5);
            }
        });

        this.testCase({
            name: "Check sdkVersion length limitation",
            test: () => {
                let config = {
                    coreData: {},
                    callback: {
                        pageActionPageTags: () => ({ key2: "value2" })
                    },
                    dataTags : {
                        useDefaultContentNameOrId : true,
                        metaDataPrefix:"ha-",
                        customDataPrefix: "data-ha-",
                        aiBlobAttributeTag: "blob",
                        parentDataTag: "parent",
                        dntDataTag: "donotTrack"
                    }
                };
                let prevVersion = ClickAnalyticsPlugin.Version
                try {
                    ClickAnalyticsPlugin.Version = "9.9.9-nightly3.2305-999.reallylongversionthatshouldgettruncated";

                    const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                    const core = new AppInsightsCore();
                    const channel = new ChannelPlugin();
                    const properties = new PropertiesPlugin();
                   
                    core.initialize({
                        instrumentationKey: "testIkey",
                        extensionConfig : {
                            [clickAnalyticsPlugin.identifier] : config
                        }
                    } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel, properties]);
                    this.onDone(() => {
                        core.unload(false);
                    });
    
                    let sdkVersion = properties.context.internal.sdkVersion;
                    Assert.ok(strContains(sdkVersion, "_ClickPlugin"), sdkVersion);
                    Assert.equal(64, sdkVersion.length);
    
                } finally {
                    ClickAnalyticsPlugin.Version = prevVersion;
                }
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

    public processTelemetry(env: ITelemetryItem) {}

    setNextPlugin(next: any) {
        // no next setup
    }

    public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) {
    }

    private _processTelemetry(env: ITelemetryItem) {

    }
}
