/**
 * @copyright Microsoft 2020
 */

 import { Assert, AITestClass } from "@microsoft/ai-test-framework";
 import { Util, IConfig } from "@microsoft/applicationinsights-common";
import { ITelemetryItem, AppInsightsCore, IPlugin, IConfiguration, DiagnosticLogger, IAppInsightsCore} from '@microsoft/applicationinsights-core-js';
import { ClickAnalyticsPlugin, BehaviorMapValidator, BehaviorValueValidator, BehaviorEnumValidator } from '../../../src/ClickAnalyticsPlugin';
import { PageAction } from "../../../src/events/PageAction";
import { DomContentHandler } from '../../../src/handlers/DomContentHandler';
import { IPageActionOverrideValues } from '../../../src/Interfaces/Datamodel'
import { mergeConfig } from "../../../src/common/Utils";
import { sanitizeUrl } from "../../../src/DataCollector";
import { PropertiesPlugin } from "@microsoft/applicationinsights-properties-js";




export class ClickEventTest extends AITestClass {
    public testInitialize() {
        if (Util.canUseLocalStorage()) {
            window.localStorage.clear();
        }
    }

    public testCleanup() {
        if (Util.canUseLocalStorage()) {
            window.localStorage.clear();
        }
    }

    public registerTests() {
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
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob',
                        parentDataTag: 'parent',
                        dntDataTag: 'donotTrack'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const properties = new PropertiesPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, config.callback.pageActionPageTags, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel, properties]);
                this.onDone(() => {
                    core.unload(false);
                });

                let sdkVersion = properties.context.internal.sdkVersion;
                Assert.ok(sdkVersion.indexOf("_ClickPlugin") !== -1, sdkVersion);

                const element = document.createElement("a");
                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, "track");
                // clickAnalyticsPlugin.capturePageAction(element, {} as IOverrideValues, {}, false);
                pageAction.capturePageAction(element);
                Assert.equal(true, spy.called);
                let calledEvent: ITelemetryItem = spy.getCall(0).args[0];
                Assert.notEqual(-1, calledEvent.data["uri"].indexOf("Tests.html"),);
                Assert.equal(undefined, calledEvent.data["behavior"],);
                Assert.equal(undefined, calledEvent.data["actionType"],);
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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                    contentName: "testContentName",
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent: ITelemetryItem = spy.getCall(0).args[0];
                Assert.equal("testId", calledEvent.baseData["name"]);
                Assert.equal(expectedContent, calledEvent.data["content"]);
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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                const contentHandler = new DomContentHandler(mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                this.onDone(() => {
                    core.unload(false);
                });

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
                    Assert.ok(sdkVersion.indexOf("_ClickPlugin") !== -1, sdkVersion);
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
