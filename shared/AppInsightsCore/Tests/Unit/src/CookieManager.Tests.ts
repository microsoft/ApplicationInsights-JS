import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { AppInsightsCore, createCookieMgr, IAppInsightsCore, IConfiguration, ICookieMgrConfig, IPlugin, ITelemetryItem, newId, objExtend } from "../../../src/applicationinsights-core-js"
import { _eInternalMessageId } from "../../../src/JavaScriptSDK.Enums/LoggingEnums";
import { _InternalLogMessage } from "../../../src/JavaScriptSDK/DiagnosticLogger";

export class CookieManagerTests extends AITestClass {
    private _cookieMgrCfg: ICookieMgrConfig;
    private _config: IConfiguration;
    private _testCookies;

    constructor(emulateIe: boolean) {
        super("CookieManagerTests", emulateIe);
    }

    public testInitialize() {
        let _self = this;
        super.testInitialize();
        _self._testCookies = {};
        _self._cookieMgrCfg = {
            getCookie: (name) => {
                let theValue = _self._testCookies[name] || "";
                return theValue.split(";")[0];
            },
            setCookie: (name, value) => {
                _self._testCookies[name] = value;
            },
            delCookie: (name) => {
                delete _self._testCookies[name]
            }
        }
        _self._config = {
            cookieCfg: _self._cookieMgrCfg
        };
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "CookieManager: Initialization",
            test: () => {
                let manager = createCookieMgr();

                Assert.equal("", manager.get("Test"), "Getting a non existent cookie returns empty string");

                manager = createCookieMgr(null);
                Assert.equal("", manager.get("Test"), "Getting a non existent cookie returns empty string");

                manager = createCookieMgr(undefined);
                Assert.equal("", manager.get("Test"), "Getting a non existent cookie returns empty string");

                manager = createCookieMgr({});
                Assert.equal("", manager.get("Test"), "Getting a non existent cookie returns empty string");

                manager = createCookieMgr({
                    cookieCfg: null
                });
                Assert.equal("", manager.get("Test"), "Getting a non existent cookie returns empty string");

                manager = createCookieMgr({
                    cookieCfg: undefined
                });
                Assert.equal("", manager.get("Test"), "Getting a non existent cookie returns empty string");

                manager = createCookieMgr({
                    cookieCfg: {}
                });
                Assert.equal("", manager.get("Test"), "Getting a non existent cookie returns empty string");
            }
        });

        this.testCase({
            name: "CookieManager: Session get set delete",
            test: () => {
                let manager = createCookieMgr(this._config);

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; path=/", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);

                manager.set(newKey, newValue + "; path=/my-path");
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; path=/my-path", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });        

        this.testCase({
            name: "CookieManager: Session get set delete with configured path",
            test: () => {
                this._cookieMgrCfg.path = "/sub-path";
                let manager = createCookieMgr(this._config);

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; path=/sub-path", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);

                manager.set(newKey, newValue + "; path=/my-path");
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; path=/my-path", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });        

        this.testCase({
            name: "CookieManager: Session get set delete with configured domain",
            test: () => {
                this._cookieMgrCfg.domain = "MyDomain.com";
                let manager = createCookieMgr(this._config);

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; domain=MyDomain.com; path=/", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });        

        this.testCase({
            name: "CookieManager: Encoded expiry value for get set delete",
            test: () => {
                let manager = createCookieMgr(this._config);

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue + "; path=/subfield; expires=Thu, 12 Feb 2190 00:00:00 GMT");
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; path=/subfield; expires=Thu, 12 Feb 2190 00:00:00 GMT", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });        

        this.testCase({
            name: "CookieManager: Encoded max-age for get set delete",
            test: () => {
                let manager = createCookieMgr(this._config);

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue + "; path=/subfield; max-age=42");
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; path=/subfield; max-age=42", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });        

        this.testCase({
            name: "CookieManager: Test with setting max-age",
            useFakeTimers: true,
            test: () => {
                let manager = createCookieMgr(this._config);

                let newKey = "test." + newId();
                let newValue = newId();
                let maxAge = 42 * 24 * 60 * 60;
                manager.set(newKey, newValue, maxAge);
                Assert.equal(newValue, manager.get(newKey));
                if (this.isEmulatingIe) {
                    Assert.equal(newValue + "; expires=Thu, 12 Feb 1970 00:00:00 GMT; path=/", this._testCookies[newKey]);
                } else {
                    Assert.equal(newValue + "; expires=Thu, 12 Feb 1970 00:00:00 GMT; max-age=" + maxAge + "; path=/", this._testCookies[newKey]);
                }

                // With existing max-age
                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);

                manager.set(newKey, newValue + "; expires=Thu, 12 Feb 2170 00:00:00 GMT", maxAge);
                Assert.equal(newValue, manager.get(newKey));
                if (this.isEmulatingIe) {
                    Assert.equal(newValue + "; expires=Thu, 12 Feb 2170 00:00:00 GMT; path=/", this._testCookies[newKey]);
                } else {
                    Assert.equal(newValue + "; expires=Thu, 12 Feb 2170 00:00:00 GMT; max-age=" + maxAge + "; path=/", this._testCookies[newKey]);
                }

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });

        this.testCase({
            name: "CookieManager: Set as Disabled",
            test: () => {
                let manager = createCookieMgr({
                    cookieCfg: {
                        enabled: false,
                        getCookie: () => { throw "Should not be called" },
                        setCookie: () => { throw "Should not be called" },
                        delCookie: () => { throw "Should not be called" }
                    }
                });

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal("", manager.get(newKey));

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
            }
        });

        this.testCase({
            name: "CookieManager: disable cookies using the legacy setting",
            test: () => {

                let core = new AppInsightsCore();
                let neverCalled = () => { throw "Should not be called" };

                core.initialize({
                    instrumentationKey: "testiKey",
                    isCookieUseDisabled: true,
                    cookieCfg: {
                        getCookie: neverCalled,
                        setCookie: neverCalled,
                        delCookie: neverCalled
                    }
                } as any, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();
                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal("", manager.get(newKey));

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));

                // Check the "merged" config
                Assert.deepEqual({
                    domain: undefined,
                    path: undefined,
                    enabled: undefined,
                    ignoreCookies: undefined,
                    blockedCookies: undefined,
                    getCookie: neverCalled,
                    setCookie: neverCalled,
                    delCookie: neverCalled
                }, core.config.cookieCfg);
            }
        });        

        this.testCase({
            name: "CookieManager: disable cookies using legacy and new setting both enabled",
            test: () => {

                let core = new AppInsightsCore();
                let neverCalled = () => { throw "Should not be called" };

                core.initialize({
                    instrumentationKey: "testiKey",
                    isCookieUseDisabled: true,
                    disableCookiesUsage: true,
                    cookieCfg: {
                        getCookie: neverCalled,
                        setCookie: neverCalled,
                        delCookie: neverCalled
                    }
                } as any, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();
                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal("", manager.get(newKey));

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));

                // Check the "merged" config
                Assert.deepEqual({
                    domain: undefined,
                    path: undefined,
                    enabled: undefined,
                    ignoreCookies: undefined,
                    blockedCookies: undefined,
                    getCookie: neverCalled,
                    setCookie: neverCalled,
                    delCookie: neverCalled
                }, core.config.cookieCfg);
            }
        });        

        this.testCase({
            name: "CookieManager: disable cookies using legacy disabled and new setting enabled",
            test: () => {

                let core = new AppInsightsCore();
                let neverCalled = () => { throw "Should not be called" };

                core.initialize({
                    instrumentationKey: "testiKey",
                    isCookieUseDisabled: false,
                    disableCookiesUsage: true,
                    cookieCfg: {
                        getCookie: neverCalled,
                        setCookie: neverCalled,
                        delCookie: neverCalled
                    }
                } as any, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();
                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal("", manager.get(newKey));

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
            }
        });        

        this.testCase({
            name: "CookieManager: disable cookies using disableCookiesUsage",
            test: () => {

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    disableCookiesUsage: true,
                    cookieCfg: {
                        getCookie: () => { throw "Should not be called" },
                        setCookie: () => { throw "Should not be called" },
                        delCookie: () => { throw "Should not be called" }
                    }
                }, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();
                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal("", manager.get(newKey));

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
            }
        });

        this.testCase({
            name: "CookieManager: set cookie path at the root config setting",
            test: () => {

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    cookiePath: "/sub-path",
                    cookieCfg: this._cookieMgrCfg
                }, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; path=/sub-path", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);

                manager.set(newKey, newValue + "; path=/my-path");
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; path=/my-path", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);

                // Check the "merged" config
                Assert.deepEqual({
                    domain: undefined,
                    path: "/sub-path",
                    enabled: undefined,
                    ignoreCookies: undefined,
                    blockedCookies: undefined,
                    getCookie: core.config.cookieCfg?.getCookie,
                    setCookie: core.config.cookieCfg?.setCookie,
                    delCookie: core.config.cookieCfg?.delCookie
                }, core.config.cookieCfg);
            }
        });

        this.testCase({
            name: "CookieManager: set cookie domain at the root config setting",
            test: () => {

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    cookieDomain: "MyDomain.com",
                    cookieCfg: this._cookieMgrCfg
                }, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; domain=MyDomain.com; path=/", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);

                // Check the "merged" config
                Assert.deepEqual({
                    domain: "MyDomain.com",
                    path: undefined,
                    enabled: undefined,
                    ignoreCookies: undefined,
                    blockedCookies: undefined,
                    getCookie: core.config.cookieCfg?.getCookie,
                    setCookie: core.config.cookieCfg?.setCookie,
                    delCookie: core.config.cookieCfg?.delCookie
                }, core.config.cookieCfg);
            }
        });

        this.testCase({
            name: "CookieManager: validate ignore Cookies empty setting",
            test: () => {

                let cookieCfg: ICookieMgrConfig = objExtend(true, {}, this._cookieMgrCfg);
                cookieCfg.ignoreCookies = [];

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    cookieDomain: "MyDomain.com",
                    cookieCfg: cookieCfg
                }, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; domain=MyDomain.com; path=/", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);

                // Check the "merged" config
                Assert.deepEqual({
                    domain: "MyDomain.com",
                    path: undefined,
                    enabled: undefined,
                    ignoreCookies: [],
                    blockedCookies: undefined,
                    getCookie: core.config.cookieCfg?.getCookie,
                    setCookie: core.config.cookieCfg?.setCookie,
                    delCookie: core.config.cookieCfg?.delCookie
                }, core.config.cookieCfg);
            }
        });

        this.testCase({
            name: "CookieManager: validate ignore Cookies with a single cookie",
            test: () => {

                let cookieCfg: ICookieMgrConfig = objExtend(true, {}, this._cookieMgrCfg);
                cookieCfg.ignoreCookies = [ "testCookie" ];

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    cookieDomain: "MyDomain.com",
                    cookieCfg: cookieCfg
                }, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();

                this._testCookies["testCookie"] = "test value";
                Assert.equal("", manager.get("testCookie"), "Check that it can't read the cookie value");

                manager.set("testCookie", "new value");
                Assert.equal("test value", this._testCookies["testCookie"], "The value was not overwritten");

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; domain=MyDomain.com; path=/", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);

                // Check the "merged" config
                Assert.deepEqual({
                    domain: "MyDomain.com",
                    path: undefined,
                    enabled: undefined,
                    ignoreCookies: [ "testCookie" ],
                    blockedCookies: undefined,
                    getCookie: core.config.cookieCfg?.getCookie,
                    setCookie: core.config.cookieCfg?.setCookie,
                    delCookie: core.config.cookieCfg?.delCookie
                }, core.config.cookieCfg);

            }
        });

        this.testCase({
            name: "CookieManager: validate blocked Cookies with a single cookie",
            test: () => {

                let cookieCfg: ICookieMgrConfig = objExtend(true, {}, this._cookieMgrCfg);
                cookieCfg.blockedCookies = [ "testCookie" ];

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    cookieDomain: "MyDomain.com",
                    cookieCfg: cookieCfg
                }, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();

                this._testCookies["testCookie"] = "test value";
                Assert.equal("test value", manager.get("testCookie"), "Check that it can't read the cookie value");

                manager.set("testCookie", "new value");
                Assert.equal("test value", this._testCookies["testCookie"], "The value was not overwritten");

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; domain=MyDomain.com; path=/", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });        

        this.testCase({
            name: "CookieManager: set cookie domain on the core config and update using updateCfg()",
            test: () => {

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    cookieDomain: "MyDomain.com",
                    cookieCfg: this._cookieMgrCfg
                }, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; domain=MyDomain.com; path=/", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);

                // Update the root cookie Domain using the core update function while there is a cookieCfg.domain
                // The cookieCfg.domain overrides the root domain
                core.updateCfg({
                    cookieDomain: "MyDomain2.com"
                });

                let newKey2 = "test2." + newId();
                let newValue2 = newId();
                manager.set(newKey2, newValue2);
                Assert.equal(newValue2, manager.get(newKey2));
                Assert.equal(newValue2 + "; domain=MyDomain.com; path=/", this._testCookies[newKey2]);

                manager.del(newKey2);
                Assert.equal("", manager.get(newKey2));
                Assert.equal(undefined, this._testCookies[newKey2]);

                // Update the cookie Domain using the core update function without a cookieCfg.domain
                core.config.cookieCfg!.domain = undefined;

                core.updateCfg({
                    cookieDomain: "MyDomain3.com"
                });

                let newKey3 = "test3." + newId();
                let newValue3 = newId();
                manager.set(newKey3, newValue3);
                Assert.equal(newValue3, manager.get(newKey3));
                Assert.equal(newValue3 + "; domain=MyDomain3.com; path=/", this._testCookies[newKey3]);

                manager.del(newKey3);
                Assert.equal("", manager.get(newKey3));
                Assert.equal(undefined, this._testCookies[newKey3]);

                // Set the "domain" from the cookieMgr config -- this should override the domain used
                core.config.cookieCfg!.domain = "CfgCookieDomain.com";

                // Update the cookie Domain using the core update function, this will also cause the notifications to occur synchronously
                core.updateCfg({
                    cookieDomain: "RootDomain3.com"
                });

                let newKey4 = "test3." + newId();
                let newValue4 = newId();
                manager.set(newKey4, newValue4);
                Assert.equal(newValue4, manager.get(newKey4));
                Assert.equal(newValue4 + "; domain=CfgCookieDomain.com; path=/", this._testCookies[newKey4]);

                manager.del(newKey4);
                Assert.equal("", manager.get(newKey4));
                Assert.equal(undefined, this._testCookies[newKey4]);

                // Check the "merged" config
                Assert.deepEqual({
                    domain: "CfgCookieDomain.com",
                    path: undefined,
                    enabled: undefined,
                    ignoreCookies: undefined,
                    blockedCookies: undefined,
                    getCookie: core.config.cookieCfg?.getCookie,
                    setCookie: core.config.cookieCfg?.setCookie,
                    delCookie: core.config.cookieCfg?.delCookie
                }, core.config.cookieCfg);
            }
        });        

        this.testCase({
            name: "CookieManager: set cookie domain at the root config using updateCfg()",
            test: () => {

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    cookieDomain: "MyDomain.com",
                    cookieCfg: this._cookieMgrCfg
                }, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; domain=MyDomain.com; path=/", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);

                // Update the root cookie Domain using the core update function while there is a cookieCfg.domain
                // The cookieCfg.domain overrides the root domain
                core.updateCfg({
                    cookieDomain: "MyDomain2.com"
                });

                let newKey2 = "test2." + newId();
                let newValue2 = newId();
                manager.set(newKey2, newValue2);
                Assert.equal(newValue2, manager.get(newKey2));
                Assert.equal(newValue2 + "; domain=MyDomain.com; path=/", this._testCookies[newKey2]);

                manager.del(newKey2);
                Assert.equal("", manager.get(newKey2));
                Assert.equal(undefined, this._testCookies[newKey2]);

                core.updateCfg({
                    cookieDomain: "MyDomain3.com",
                    cookieCfg: {
                        // Update the cookie Domain using the core update function without a cookieCfg.domain
                        domain: undefined
                    }
                });

                let newKey3 = "test3." + newId();
                let newValue3 = newId();
                manager.set(newKey3, newValue3);
                Assert.equal(newValue3, manager.get(newKey3));
                Assert.equal(newValue3 + "; domain=MyDomain3.com; path=/", this._testCookies[newKey3]);

                manager.del(newKey3);
                Assert.equal("", manager.get(newKey3));
                Assert.equal(undefined, this._testCookies[newKey3]);

                // Update the cookie Domain using the core update function, this will also cause the notifications to occur synchronously
                core.updateCfg({
                    cookieDomain: "RootDomain3.com",
                    cookieCfg: {
                        // Set the "domain" from the cookieMgr config -- this should override the domain used
                        domain: "CfgCookieDomain.com"
                    }
                });

                let newKey4 = "test3." + newId();
                let newValue4 = newId();
                manager.set(newKey4, newValue4);
                Assert.equal(newValue4, manager.get(newKey4));
                Assert.equal(newValue4 + "; domain=CfgCookieDomain.com; path=/", this._testCookies[newKey4]);

                manager.del(newKey4);
                Assert.equal("", manager.get(newKey4));
                Assert.equal(undefined, this._testCookies[newKey4]);

                // Check the "merged" config
                Assert.deepEqual({                // Check the "merged" config
                    domain: "CfgCookieDomain.com",
                    path: undefined,
                    enabled: undefined,
                    ignoreCookies: undefined,
                    blockedCookies: undefined,
                    getCookie: core.config.cookieCfg?.getCookie,
                    setCookie: core.config.cookieCfg?.setCookie,
                    delCookie: core.config.cookieCfg?.delCookie
                }, core.config.cookieCfg);
            }
        });

        this.testCase({
            name: "CookieManager: Write cookies after being enabled - basic functionality",
            test: () => {
                let manager = createCookieMgr(this._config);

                // Start with cookies disabled
                manager.setEnabled(false);
                Assert.equal(false, manager.isEnabled(), "Cookies should be disabled");

                let newKey = "test." + newId();
                let newValue = newId();
                
                // Set a cookie while disabled - should be cached
                let result = manager.set(newKey, newValue);
                Assert.equal(true, result, "Set should return true even when disabled (cached)");
                
                // Get should return the cached value
                Assert.equal(newValue, manager.get(newKey), "Should return cached value when disabled");
                
                // Cookie should not be in actual storage
                Assert.equal(undefined, this._testCookies[newKey], "Cookie should not be in actual storage yet");

                // Enable cookies - should flush cached values
                manager.setEnabled(true);
                Assert.equal(true, manager.isEnabled(), "Cookies should be enabled");
                
                // Cookie should now be in actual storage
                Assert.equal(newValue + "; path=/", this._testCookies[newKey], "Cookie should be flushed to actual storage");
                
                // Get should still return the value
                Assert.equal(newValue, manager.get(newKey), "Should return value from actual storage");
            }
        });

        this.testCase({
            name: "CookieManager: Write cookies after being enabled - multiple cookies",
            test: () => {
                let manager = createCookieMgr(this._config);

                // Start with cookies disabled
                manager.setEnabled(false);

                let cookies = [
                    { key: "test1." + newId(), value: newId() },
                    { key: "test2." + newId(), value: newId() },
                    { key: "test3." + newId(), value: newId() }
                ];
                
                // Set multiple cookies while disabled
                cookies.forEach(cookie => {
                    let result = manager.set(cookie.key, cookie.value);
                    Assert.equal(true, result, "Set should return true even when disabled");
                    Assert.equal(cookie.value, manager.get(cookie.key), "Should return cached value");
                    Assert.equal(undefined, this._testCookies[cookie.key], "Cookie should not be in actual storage yet");
                });

                // Enable cookies - should flush all cached values
                manager.setEnabled(true);
                
                // All cookies should now be in actual storage
                cookies.forEach(cookie => {
                    Assert.equal(cookie.value + "; path=/", this._testCookies[cookie.key], "Cookie should be flushed to actual storage");
                    Assert.equal(cookie.value, manager.get(cookie.key), "Should return value from actual storage");
                });
            }
        });

        this.testCase({
            name: "CookieManager: Write cookies after being enabled - with maxAge and domain",
            test: () => {
                this._cookieMgrCfg.domain = "test.com";
                let manager = createCookieMgr(this._config);

                // Start with cookies disabled
                manager.setEnabled(false);

                let newKey = "test." + newId();
                let newValue = newId();
                let maxAge = 3600; // 1 hour
                
                // Set a cookie with maxAge while disabled
                let result = manager.set(newKey, newValue, maxAge);
                Assert.equal(true, result, "Set should return true even when disabled");
                Assert.equal(newValue, manager.get(newKey), "Should return cached value");

                // Enable cookies
                manager.setEnabled(true);
                
                // Cookie should be flushed with the maxAge parameter
                let actualCookieValue = this._testCookies[newKey];
                Assert.ok(actualCookieValue, "Cookie should exist in storage");
                Assert.ok(actualCookieValue.indexOf(newValue) === 0, "Cookie should start with the value");
                Assert.ok(actualCookieValue.indexOf("domain=test.com") > -1, "Cookie should have domain");
                Assert.ok(actualCookieValue.indexOf("path=/") > -1, "Cookie should have path");
            }
        });

        this.testCase({
            name: "CookieManager: Write cookies after being enabled - overwrite cached values",
            test: () => {
                let manager = createCookieMgr(this._config);

                // Start with cookies disabled
                manager.setEnabled(false);

                let newKey = "test." + newId();
                let newValue1 = newId();
                let newValue2 = newId();
                
                // Set a cookie while disabled
                manager.set(newKey, newValue1);
                Assert.equal(newValue1, manager.get(newKey), "Should return first cached value");
                
                // Overwrite with new value while still disabled
                manager.set(newKey, newValue2);
                Assert.equal(newValue2, manager.get(newKey), "Should return updated cached value");

                // Enable cookies - should flush the latest value
                manager.setEnabled(true);
                
                Assert.equal(newValue2 + "; path=/", this._testCookies[newKey], "Cookie should have the latest value");
                Assert.equal(newValue2, manager.get(newKey), "Should return latest value from storage");
            }
        });

        this.testCase({
            name: "CookieManager: Write cookies after being enabled - delete cached cookies",
            test: () => {
                let manager = createCookieMgr(this._config);

                // Start with cookies disabled
                manager.setEnabled(false);

                let newKey = "test." + newId();
                let newValue = newId();
                
                // Set a cookie while disabled
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey), "Should return cached value");
                
                // Delete the cached cookie
                let delResult = manager.del(newKey);
                Assert.equal(true, delResult, "Delete should return true");
                Assert.equal("", manager.get(newKey), "Should return empty string after delete");

                // Enable cookies - nothing should be flushed
                manager.setEnabled(true);
                
                Assert.equal(undefined, this._testCookies[newKey], "Cookie should not be in storage");
                Assert.equal("", manager.get(newKey), "Should still return empty string");
            }
        });

        this.testCase({
            name: "CookieManager: Write cookies after being enabled - ignore blocked cookies",
            test: () => {
                let cookieCfg: ICookieMgrConfig = objExtend(true, {}, this._cookieMgrCfg);
                cookieCfg.blockedCookies = ["blockedCookie"];
                
                let manager = createCookieMgr({
                    cookieCfg: cookieCfg
                });

                // Start with cookies disabled
                manager.setEnabled(false);

                let blockedKey = "blockedCookie";
                let allowedKey = "allowedCookie";
                let newValue = newId();
                
                // Try to set blocked cookie while disabled - should not be cached
                let blockedResult = manager.set(blockedKey, newValue);
                Assert.equal(false, blockedResult, "Setting blocked cookie should return false");
                Assert.equal("", manager.get(blockedKey), "Should not return cached value for blocked cookie");
                
                // Set allowed cookie while disabled - should be cached
                let allowedResult = manager.set(allowedKey, newValue);
                Assert.equal(true, allowedResult, "Setting allowed cookie should return true");
                Assert.equal(newValue, manager.get(allowedKey), "Should return cached value for allowed cookie");

                // Enable cookies - only allowed cookie should be flushed
                manager.setEnabled(true);
                
                Assert.equal(undefined, this._testCookies[blockedKey], "Blocked cookie should not be in storage");
                Assert.equal(newValue + "; path=/", this._testCookies[allowedKey], "Allowed cookie should be in storage");
            }
        });

        this.testCase({
            name: "CookieManager: Write cookies after being enabled - handle ignored cookies",
            test: () => {
                let cookieCfg: ICookieMgrConfig = objExtend(true, {}, this._cookieMgrCfg);
                cookieCfg.ignoreCookies = ["ignoredCookie"];
                
                let manager = createCookieMgr({
                    cookieCfg: cookieCfg
                });

                // Start with cookies disabled
                manager.setEnabled(false);

                let ignoredKey = "ignoredCookie";
                let allowedKey = "allowedCookie";
                let newValue = newId();
                
                // Try to set ignored cookie while disabled - should not be cached
                let ignoredResult = manager.set(ignoredKey, newValue);
                Assert.equal(false, ignoredResult, "Setting ignored cookie should return false");
                Assert.equal("", manager.get(ignoredKey), "Should not return cached value for ignored cookie");
                
                // Set allowed cookie while disabled - should be cached
                let allowedResult = manager.set(allowedKey, newValue);
                Assert.equal(true, allowedResult, "Setting allowed cookie should return true");
                Assert.equal(newValue, manager.get(allowedKey), "Should return cached value for allowed cookie");

                // Enable cookies - only allowed cookie should be flushed
                manager.setEnabled(true);
                
                Assert.equal(undefined, this._testCookies[ignoredKey], "Ignored cookie should not be in storage");
                Assert.equal(newValue + "; path=/", this._testCookies[allowedKey], "Allowed cookie should be in storage");
            }
        });

        this.testCase({
            name: "CookieManager: Write cookies after being enabled - multiple enable/disable cycles",
            test: () => {
                let manager = createCookieMgr(this._config);

                let newKey1 = "test1." + newId();
                let newKey2 = "test2." + newId();
                let newValue1 = newId();
                let newValue2 = newId();

                // First cycle: disable, set, enable
                manager.setEnabled(false);
                manager.set(newKey1, newValue1);
                Assert.equal(newValue1, manager.get(newKey1), "Should return cached value");
                
                manager.setEnabled(true);
                Assert.equal(newValue1 + "; path=/", this._testCookies[newKey1], "First cookie should be flushed");

                // Second cycle: disable again, set different cookie, enable
                manager.setEnabled(false);
                manager.set(newKey2, newValue2);
                Assert.equal(newValue2, manager.get(newKey2), "Should return second cached value");
                Assert.equal(newValue1, manager.get(newKey1), "Should still return first value from storage");
                
                manager.setEnabled(true);
                Assert.equal(newValue2 + "; path=/", this._testCookies[newKey2], "Second cookie should be flushed");
                Assert.equal(newValue1 + "; path=/", this._testCookies[newKey1], "First cookie should still be in storage");
            }
        });

        this.testCase({
            name: "CookieManager: Write cookies after being enabled - unload clears cache",
            test: () => {
                let manager = createCookieMgr(this._config);

                // Start with cookies disabled and set some cached cookies
                manager.setEnabled(false);
                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey), "Should return cached value");

                // Unload the manager
                manager.unload && manager.unload();

                // Enable cookies - nothing should be flushed since cache was cleared
                manager.setEnabled(true);
                Assert.equal(undefined, this._testCookies[newKey], "Cookie should not be in storage after unload");
                Assert.equal("", manager.get(newKey), "Should return empty string after unload");
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
  
    public processTelemetry(env: ITelemetryItem) { }
  
    setNextPlugin(next: any) {
      // no next setup
    }
  
    public initialize = (config: IConfiguration, core: IAppInsightsCore, plugin: IPlugin[]) => {
    }
  
    private _processTelemetry(env: ITelemetryItem) {
  
    }
  }