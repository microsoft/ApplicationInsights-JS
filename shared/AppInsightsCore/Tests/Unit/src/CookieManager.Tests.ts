import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { AppInsightsCore, createCookieMgr, IAppInsightsCore, IConfiguration, ICookieMgrConfig, IPlugin, ITelemetryItem, newId, objExtend } from "../../../src/applicationinsights-core-js"
import { _eInternalMessageId } from "@microsoft/applicationinsights-common";

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
                let cookieValue = this._testCookies[newKey];
                Assert.ok(cookieValue.indexOf(newValue + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue.indexOf("domain=MyDomain.com") !== -1, "Cookie should include domain");
                Assert.ok(cookieValue.indexOf("path=/") !== -1, "Cookie should include path");

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
                let cookieValue = this._testCookies[newKey];
                Assert.ok(cookieValue.indexOf(newValue + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue.indexOf("path=/subfield") !== -1, "Cookie should include path");
                Assert.ok(cookieValue.indexOf("expires=Thu, 12 Feb 2190 00:00:00 GMT") !== -1, "Cookie should include expires");

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
                let cookieValue = this._testCookies[newKey];
                Assert.ok(cookieValue.indexOf(newValue + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue.indexOf("path=/subfield") !== -1, "Cookie should include path");
                Assert.ok(cookieValue.indexOf("max-age=42") !== -1, "Cookie should include max-age");

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
                let cookieValue = this._testCookies[newKey];
                Assert.ok(cookieValue.indexOf(newValue + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue.indexOf("expires=Thu, 12 Feb 1970 00:00:00 GMT") !== -1, "Cookie should include expires");
                Assert.ok(cookieValue.indexOf("path=/") !== -1, "Cookie should include path");
                if (!this.isEmulatingIe) {
                    Assert.ok(cookieValue.indexOf("max-age=" + maxAge) !== -1, "Cookie should include max-age for non-IE browsers");
                }

                // With existing max-age
                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);

                manager.set(newKey, newValue + "; expires=Thu, 12 Feb 2170 00:00:00 GMT", maxAge);
                Assert.equal(newValue, manager.get(newKey));
                let cookieValue2 = this._testCookies[newKey];
                Assert.ok(cookieValue2.indexOf(newValue + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue2.indexOf("expires=Thu, 12 Feb 2170 00:00:00 GMT") !== -1, "Cookie should include expires");
                Assert.ok(cookieValue2.indexOf("path=/") !== -1, "Cookie should include path");
                if (!this.isEmulatingIe) {
                    Assert.ok(cookieValue2.indexOf("max-age=" + maxAge) !== -1, "Cookie should include max-age for non-IE browsers");
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
                
                // With caching enabled, set should return true and value should be cached
                let setResult = manager.set(newKey, newValue);
                Assert.equal(true, setResult, "Set should return true when caching");
                Assert.equal(newValue, manager.get(newKey), "Should return cached value when disabled");

                // Delete should also be cached
                let delResult = manager.del(newKey);
                Assert.equal(true, delResult, "Delete should return true when caching");
                Assert.equal("", manager.get(newKey), "Should return empty string after cached delete");
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
                
                // With caching enabled, set should cache the value
                let setResult = manager.set(newKey, newValue);
                Assert.equal(true, setResult, "Set should return true when caching");
                Assert.equal(newValue, manager.get(newKey), "Should return cached value when disabled");

                // Delete should also be cached
                let delResult = manager.del(newKey);
                Assert.equal(true, delResult, "Delete should return true when caching");
                Assert.equal("", manager.get(newKey), "Should return empty string after cached delete");

                // Check the "merged" config
                Assert.deepEqual({
                    domain: undefined,
                    path: undefined,
                    enabled: undefined,
                    ignoreCookies: undefined,
                    blockedCookies: undefined,
                    disableCookieDefer: false,
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
                
                // With caching enabled, set should cache the value
                let setResult = manager.set(newKey, newValue);
                Assert.equal(true, setResult, "Set should return true when caching");
                Assert.equal(newValue, manager.get(newKey), "Should return cached value when disabled");

                // Delete should also be cached
                let delResult = manager.del(newKey);
                Assert.equal(true, delResult, "Delete should return true when caching");
                Assert.equal("", manager.get(newKey), "Should return empty string after cached delete");

                // Check the "merged" config
                Assert.deepEqual({
                    domain: undefined,
                    path: undefined,
                    enabled: undefined,
                    ignoreCookies: undefined,
                    blockedCookies: undefined,
                    disableCookieDefer: false,
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
                
                // With caching enabled, set should cache the value
                let setResult = manager.set(newKey, newValue);
                Assert.equal(true, setResult, "Set should return true when caching");
                Assert.equal(newValue, manager.get(newKey), "Should return cached value when disabled");

                // Delete should also be cached
                let delResult = manager.del(newKey);
                Assert.equal(true, delResult, "Delete should return true when caching");
                Assert.equal("", manager.get(newKey), "Should return empty string after cached delete");
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
                
                // With caching enabled, set should cache the value
                let setResult = manager.set(newKey, newValue);
                Assert.equal(true, setResult, "Set should return true when caching");
                Assert.equal(newValue, manager.get(newKey), "Should return cached value when disabled");

                // Delete should also be cached
                let delResult = manager.del(newKey);
                Assert.equal(true, delResult, "Delete should return true when caching");
                Assert.equal("", manager.get(newKey), "Should return empty string after cached delete");
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
                    disableCookieDefer: false,
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
                let cookieValue = this._testCookies[newKey];
                Assert.ok(cookieValue.indexOf(newValue + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue.indexOf("domain=MyDomain.com") !== -1, "Cookie should include domain");
                Assert.ok(cookieValue.indexOf("path=/") !== -1, "Cookie should include path");

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
                    disableCookieDefer: false,
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
                let cookieValue = this._testCookies[newKey];
                Assert.ok(cookieValue.indexOf(newValue + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue.indexOf("domain=MyDomain.com") !== -1, "Cookie should include domain");
                Assert.ok(cookieValue.indexOf("path=/") !== -1, "Cookie should include path");

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
                    disableCookieDefer: false,
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
                let cookieValue = this._testCookies[newKey];
                Assert.ok(cookieValue.indexOf(newValue + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue.indexOf("domain=MyDomain.com") !== -1, "Cookie should include domain");
                Assert.ok(cookieValue.indexOf("path=/") !== -1, "Cookie should include path");

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
                    disableCookieDefer: false,
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
                let cookieValue = this._testCookies[newKey];
                Assert.ok(cookieValue.indexOf(newValue + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue.indexOf("domain=MyDomain.com") !== -1, "Cookie should include domain");
                Assert.ok(cookieValue.indexOf("path=/") !== -1, "Cookie should include path");

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
                let cookieValue = this._testCookies[newKey];
                Assert.ok(cookieValue.indexOf(newValue + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue.indexOf("domain=MyDomain.com") !== -1, "Cookie should include domain");
                Assert.ok(cookieValue.indexOf("path=/") !== -1, "Cookie should include path");

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
                let cookieValue2 = this._testCookies[newKey2];
                Assert.ok(cookieValue2.indexOf(newValue2 + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue2.indexOf("domain=MyDomain.com") !== -1, "Cookie should include domain");
                Assert.ok(cookieValue2.indexOf("path=/") !== -1, "Cookie should include path");

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
                let cookieValue3 = this._testCookies[newKey3];
                Assert.ok(cookieValue3.indexOf(newValue3 + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue3.indexOf("domain=MyDomain3.com") !== -1, "Cookie should include domain");
                Assert.ok(cookieValue3.indexOf("path=/") !== -1, "Cookie should include path");

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
                let cookieValue4 = this._testCookies[newKey4];
                Assert.ok(cookieValue4.indexOf(newValue4 + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue4.indexOf("domain=CfgCookieDomain.com") !== -1, "Cookie should include domain");
                Assert.ok(cookieValue4.indexOf("path=/") !== -1, "Cookie should include path");

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
                    disableCookieDefer: false,
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
                let cookieValue = this._testCookies[newKey];
                Assert.ok(cookieValue.indexOf(newValue + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue.indexOf("domain=MyDomain.com") !== -1, "Cookie should include domain");
                Assert.ok(cookieValue.indexOf("path=/") !== -1, "Cookie should include path");

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
                let cookieValue2 = this._testCookies[newKey2];
                Assert.ok(cookieValue2.indexOf(newValue2 + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue2.indexOf("domain=MyDomain.com") !== -1, "Cookie should include domain");
                Assert.ok(cookieValue2.indexOf("path=/") !== -1, "Cookie should include path");

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
                let cookieValue3 = this._testCookies[newKey3];
                Assert.ok(cookieValue3.indexOf(newValue3 + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue3.indexOf("domain=MyDomain3.com") !== -1, "Cookie should include domain");
                Assert.ok(cookieValue3.indexOf("path=/") !== -1, "Cookie should include path");

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
                let cookieValue4 = this._testCookies[newKey4];
                Assert.ok(cookieValue4.indexOf(newValue4 + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue4.indexOf("domain=CfgCookieDomain.com") !== -1, "Cookie should include domain");
                Assert.ok(cookieValue4.indexOf("path=/") !== -1, "Cookie should include path");

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
                    disableCookieDefer: false,
                    getCookie: core.config.cookieCfg?.getCookie,
                    setCookie: core.config.cookieCfg?.setCookie,
                    delCookie: core.config.cookieCfg?.delCookie
                }, core.config.cookieCfg);
            }
        });

        this.testCase({
            name: "CookieManager: Write cookies after being enabled - basic functionality",
            useFakeTimers: true,
            test: () => {
                let manager = createCookieMgr(this._config);

                // Start with cookies disabled
                manager.setEnabled(false);
                this.clock.tick(1);
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
                this.clock.tick(1);
                Assert.equal(true, manager.isEnabled(), "Cookies should be enabled");
                
                // Cookie should now be in actual storage
                Assert.equal(newValue + "; path=/", this._testCookies[newKey], "Cookie should be flushed to actual storage");
                
                // Get should still return the value
                Assert.equal(newValue, manager.get(newKey), "Should return value from actual storage");
            }
        });

        this.testCase({
            name: "CookieManager: Write cookies after being enabled - multiple cookies",
            useFakeTimers: true,
            test: () => {
                let manager = createCookieMgr(this._config);

                // Start with cookies disabled
                manager.setEnabled(false);
                this.clock.tick(1);

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
                this.clock.tick(1);
                
                // All cookies should now be in actual storage
                cookies.forEach(cookie => {
                    Assert.equal(cookie.value + "; path=/", this._testCookies[cookie.key], "Cookie should be flushed to actual storage");
                    Assert.equal(cookie.value, manager.get(cookie.key), "Should return value from actual storage");
                });
            }
        });

        this.testCase({
            name: "CookieManager: Write cookies after being enabled - with maxAge and domain",
            useFakeTimers: true,
            test: () => {
                this._cookieMgrCfg.domain = "test.com";
                let manager = createCookieMgr(this._config);

                // Start with cookies disabled
                manager.setEnabled(false);
                this.clock.tick(1);

                let newKey = "test." + newId();
                let newValue = newId();
                let maxAge = 3600; // 1 hour
                
                // Set a cookie with maxAge while disabled
                let result = manager.set(newKey, newValue, maxAge);
                Assert.equal(true, result, "Set should return true even when disabled");
                Assert.equal(newValue, manager.get(newKey), "Should return cached value");

                // Enable cookies
                manager.setEnabled(true);
                this.clock.tick(1);
                
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
            useFakeTimers: true,
            test: () => {
                let manager = createCookieMgr(this._config);

                // Start with cookies disabled
                manager.setEnabled(false);
                this.clock.tick(1);

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
                this.clock.tick(1);
                
                Assert.equal(newValue2 + "; path=/", this._testCookies[newKey], "Cookie should have the latest value");
                Assert.equal(newValue2, manager.get(newKey), "Should return latest value from storage");
            }
        });

        this.testCase({
            name: "CookieManager: Write cookies after being enabled - delete cached cookies",
            useFakeTimers: true,
            test: () => {
                let manager = createCookieMgr(this._config);

                // Start with cookies disabled
                manager.setEnabled(false);
                this.clock.tick(1);

                let newKey = "test." + newId();
                let newValue = newId();
                
                // Set a cookie while disabled
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey), "Should return cached value");
                
                // Delete the cached cookie
                let delResult = manager.del(newKey);
                Assert.equal(true, delResult, "Delete should return true");
                Assert.equal("", manager.get(newKey), "Should return empty string after delete");

                // Enable cookies - nothing should be flushed since the cookie was deleted
                manager.setEnabled(true);
                this.clock.tick(1);
                
                Assert.equal(undefined, this._testCookies[newKey], "Cookie should not be in storage");
                Assert.equal("", manager.get(newKey), "Should still return empty string");
            }
        });

        this.testCase({
            name: "CookieManager: Delete operation is cached when cookies disabled and applied when enabled",
            useFakeTimers: true,
            test: () => {
                let manager = createCookieMgr(this._config);

                let newKey = "test." + newId();
                let newValue = newId();
                
                // Start with cookies enabled and set a cookie
                manager.setEnabled(true);
                this.clock.tick(1);
                manager.set(newKey, newValue);
                Assert.equal(newValue + "; path=/", this._testCookies[newKey], "Cookie should be in storage");
                Assert.equal(newValue, manager.get(newKey), "Should return cookie value");
                
                // Disable cookies and delete the cookie
                manager.setEnabled(false);
                this.clock.tick(1);
                let delResult = manager.del(newKey);
                Assert.equal(true, delResult, "Delete should return true when cached");
                
                // Cookie still exists in storage but deletion is cached
                Assert.equal(newValue + "; path=/", this._testCookies[newKey], "Cookie should still be in storage while disabled");
                
                // Validate that cookie exists before deletion is applied
                Assert.ok(this._testCookies[newKey], "Cookie should exist before deletion is applied");
                
                // Enable cookies - cached deletion should be applied
                manager.setEnabled(true);
                this.clock.tick(1);
                
                // Check that the deletion was applied - cookie should be undefined after deletion
                let cookieValue = this._testCookies[newKey];
                Assert.equal(undefined, cookieValue, "Delete operation should have been applied - cookie should be undefined");
                Assert.equal("", manager.get(newKey), "Should return empty string after deletion is applied");
            }
        });

        this.testCase({
            name: "CookieManager: Write cookies after being enabled - ignore blocked cookies",
            useFakeTimers: true,
            test: () => {
                let cookieCfg: ICookieMgrConfig = objExtend(true, {}, this._cookieMgrCfg);
                cookieCfg.blockedCookies = ["blockedCookie"];
                
                let manager = createCookieMgr({
                    cookieCfg: cookieCfg
                });

                // Start with cookies disabled
                manager.setEnabled(false);
                this.clock.tick(1);

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
                this.clock.tick(1);
                
                Assert.equal(undefined, this._testCookies[blockedKey], "Blocked cookie should not be in storage");
                Assert.equal(newValue + "; path=/", this._testCookies[allowedKey], "Allowed cookie should be in storage");
            }
        });

        this.testCase({
            name: "CookieManager: Write cookies after being enabled - handle ignored cookies",
            useFakeTimers: true,
            test: () => {
                let cookieCfg: ICookieMgrConfig = objExtend(true, {}, this._cookieMgrCfg);
                cookieCfg.ignoreCookies = ["ignoredCookie"];
                
                let manager = createCookieMgr({
                    cookieCfg: cookieCfg
                });

                // Start with cookies disabled
                manager.setEnabled(false);
                this.clock.tick(1);

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
                this.clock.tick(1);
                
                Assert.equal(undefined, this._testCookies[ignoredKey], "Ignored cookie should not be in storage");
                Assert.equal(newValue + "; path=/", this._testCookies[allowedKey], "Allowed cookie should be in storage");
            }
        });

        this.testCase({
            name: "CookieManager: Write cookies after being enabled - multiple enable/disable cycles",
            useFakeTimers: true,
            test: () => {
                let manager = createCookieMgr(this._config);

                let newKey1 = "test1." + newId();
                let newKey2 = "test2." + newId();
                let newValue1 = newId();
                let newValue2 = newId();

                // First cycle: disable, set, enable
                manager.setEnabled(false);
                this.clock.tick(1);
                manager.set(newKey1, newValue1);
                Assert.equal(newValue1, manager.get(newKey1), "Should return cached value");
                
                manager.setEnabled(true);
                this.clock.tick(1);
                Assert.equal(newValue1 + "; path=/", this._testCookies[newKey1], "First cookie should be flushed");

                // Second cycle: disable again, set different cookie, enable
                manager.setEnabled(false);
                this.clock.tick(1);
                manager.set(newKey2, newValue2);
                Assert.equal(newValue2, manager.get(newKey2), "Should return second cached value");
                Assert.equal("", manager.get(newKey1), "Should return empty string - cookies disabled, can't access storage and no cached value");
                
                manager.setEnabled(true);
                this.clock.tick(1);
                Assert.equal(newValue2 + "; path=/", this._testCookies[newKey2], "Second cookie should be flushed");
                Assert.equal(newValue1 + "; path=/", this._testCookies[newKey1], "First cookie should still be in storage");
            }
        });

        this.testCase({
            name: "CookieManager: Write cookies after being enabled - unload clears cache",
            useFakeTimers: true,
            test: () => {
                let manager = createCookieMgr(this._config);

                // Start with cookies disabled and set some cached cookies
                manager.setEnabled(false);
                this.clock.tick(1);
                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey), "Should return cached value");

                // Unload the manager
                manager.unload && manager.unload();

                // Enable cookies - nothing should be flushed since cache was cleared
                manager.setEnabled(true);
                this.clock.tick(1);
                Assert.equal(undefined, this._testCookies[newKey], "Cookie should not be in storage after unload");
                Assert.equal("", manager.get(newKey), "Should return empty string after unload");
            }
        });

        this.testCase({
            name: "CookieManager: Dynamic config change to enable cookies should flush cached values",
            useFakeTimers: true,
            test: () => {
                // Create a dynamic config that can be updated
                let configValues = {
                    cookieCfg: objExtend({}, this._cookieMgrCfg, {
                        enabled: false
                    })
                };
                let manager = createCookieMgr(configValues);

                let newKey = "test." + newId();
                let newValue = newId();

                // Set a cookie while disabled - should be cached
                let result = manager.set(newKey, newValue);
                Assert.equal(true, result, "Set should return true even when disabled (cached)");
                Assert.equal(undefined, this._testCookies[newKey], "Cookie should not be in storage when disabled");

                // Get should return the cached value
                Assert.equal(newValue, manager.get(newKey), "Should return cached value when disabled");

                // Enable cookies via dynamic config change - should flush cached values
                configValues.cookieCfg.enabled = true;
                this.clock.tick(1);

                // Verify the cookie was flushed to actual storage
                Assert.equal(newValue + "; path=/", this._testCookies[newKey], "Cookie should be flushed to actual storage via config change");
                Assert.equal(newValue, manager.get(newKey), "Should still return the value after enabling");
            }
        });

        this.testCase({
            name: "CookieManager: Dynamic config change to enable cookies with multiple cached values",
            useFakeTimers: true,
            test: () => {
                // Create a dynamic config that can be updated
                let configValues = {
                    cookieCfg: objExtend({}, this._cookieMgrCfg, {
                        enabled: false
                    })
                };
                let manager = createCookieMgr(configValues);

                let cookies = [
                    { key: "test1." + newId(), value: newId() },
                    { key: "test2." + newId(), value: newId() },
                    { key: "test3." + newId(), value: newId() }
                ];

                // Set multiple cookies while disabled - should be cached
                cookies.forEach(cookie => {
                    let result = manager.set(cookie.key, cookie.value);
                    Assert.equal(true, result, "Set should return true even when disabled (cached)");
                    Assert.equal(undefined, this._testCookies[cookie.key], "Cookie should not be in storage when disabled");
                    Assert.equal(cookie.value, manager.get(cookie.key), "Should return cached value");
                });

                // Enable cookies via dynamic config change - should flush all cached values
                configValues.cookieCfg.enabled = true;
                this.clock.tick(1);

                cookies.forEach(cookie => {
                    Assert.equal(cookie.value + "; path=/", this._testCookies[cookie.key], "Cookie should be flushed to actual storage via config change");
                    Assert.equal(cookie.value, manager.get(cookie.key), "Should still return the value after enabling");
                });
            }
        });

        this.testCase({
            name: "CookieManager: Dynamic config change with maxAge parameter should preserve options",
            useFakeTimers: true,
            test: () => {
                // Create a dynamic config that can be updated
                let configValues = {
                    cookieCfg: objExtend({}, this._cookieMgrCfg, {
                        enabled: false
                    })
                };
                let manager = createCookieMgr(configValues);

                let newKey = "test." + newId();
                let newValue = newId();
                let maxAge = 3600; // 1 hour

                // Set a cookie with maxAge while disabled - should be cached
                let result = manager.set(newKey, newValue, maxAge);
                Assert.equal(true, result, "Set should return true even when disabled (cached)");
                Assert.equal(undefined, this._testCookies[newKey], "Cookie should not be in storage when disabled");
                Assert.equal(newValue, manager.get(newKey), "Should return cached value");

                // Enable cookies via dynamic config change - should flush cached value with maxAge
                configValues.cookieCfg.enabled = true;
                this.clock.tick(1);

                // Cookie should be flushed with the maxAge parameter
                let cookieValue = this._testCookies[newKey];
                Assert.ok(cookieValue, "Cookie should be flushed to storage");
                Assert.ok(cookieValue.indexOf(newValue + ";") === 0, "Cookie should start with value");
                Assert.ok(cookieValue.indexOf("path=/") !== -1, "Cookie should include path");
                Assert.ok(cookieValue.indexOf("expires=") !== -1, "Cookie should include expires");
                
                if (!this.isEmulatingIe) {
                    Assert.ok(cookieValue.indexOf("max-age=" + maxAge) !== -1, "Cookie should include max-age for non-IE browsers");
                }
            }
        });

        this.testCase({
            name: "CookieManager: Dynamic config change from legacy disableCookiesUsage should flush cached values",
            useFakeTimers: true,
            test: () => {
                // Create a dynamic config that can be updated
                let configValues = {
                    disableCookiesUsage: true,
                    cookieCfg: this._cookieMgrCfg
                };
                let manager = createCookieMgr(configValues);

                let newKey = "test." + newId();
                let newValue = newId();

                // Set a cookie while disabled - should be cached
                let result = manager.set(newKey, newValue);
                Assert.equal(true, result, "Set should return true even when disabled (cached)");
                Assert.equal(undefined, this._testCookies[newKey], "Cookie should not be in storage when disabled");

                // Get should return the cached value
                Assert.equal(newValue, manager.get(newKey), "Should return cached value when disabled");

                // Enable cookies via dynamic config change - should flush cached values
                configValues.disableCookiesUsage = false;
                this.clock.tick(1);

                // Verify the cookie was flushed to actual storage
                Assert.equal(newValue + "; path=/", this._testCookies[newKey], "Cookie should be flushed to actual storage via legacy config change");
                Assert.equal(newValue, manager.get(newKey), "Should still return the value after enabling");
            }
        });

        this.testCase({
            name: "CookieManager: Multiple enable/disable cycles via config change work correctly",
            useFakeTimers: true,
            test: () => {
                // Create a dynamic config that can be updated
                let configValues = {
                    cookieCfg: objExtend({}, this._cookieMgrCfg, {
                        enabled: false
                    })
                };
                let manager = createCookieMgr(configValues);

                let newKey1 = "test1." + newId();
                let newValue1 = newId();

                // First cycle: disable -> cache -> enable -> flush
                manager.set(newKey1, newValue1);
                Assert.equal(newValue1, manager.get(newKey1), "Should return cached value");

                configValues.cookieCfg.enabled = true;
                this.clock.tick(1); // Allow dynamic config change to propagate
                Assert.equal(newValue1 + "; path=/", this._testCookies[newKey1], "First cookie should be flushed");

                // Second cycle: disable -> cache -> enable -> flush
                configValues.cookieCfg.enabled = false;
                this.clock.tick(1); // Allow dynamic config change to propagate
                let newKey2 = "test2." + newId();
                let newValue2 = newId();

                manager.set(newKey2, newValue2);
                Assert.equal(newValue2, manager.get(newKey2), "Should return second cached value");

                configValues.cookieCfg.enabled = true;
                this.clock.tick(1);
                Assert.equal(newValue2 + "; path=/", this._testCookies[newKey2], "Second cookie should be flushed");
            }
        });

        this.testCase({
            name: "CookieManager: Deletion operation cached and applied via dynamic config change",
            useFakeTimers: true,
            test: () => {
                // Create a dynamic config that can be updated
                let configValues = {
                    cookieCfg: objExtend({}, this._cookieMgrCfg, {
                        enabled: true
                    })
                };
                let manager = createCookieMgr(configValues);

                let newKey = "test." + newId();
                let newValue = newId();
                
                // Set a cookie while enabled
                manager.set(newKey, newValue);
                Assert.equal(newValue + "; path=/", this._testCookies[newKey], "Cookie should be in storage");
                
                // Disable cookies via config and delete the cookie
                configValues.cookieCfg.enabled = false;
                this.clock.tick(1); // Allow dynamic config change to propagate
                let delResult = manager.del(newKey);
                Assert.equal(true, delResult, "Delete should return true when cached");
                
                // Cookie still exists in storage but deletion is cached
                Assert.equal(newValue + "; path=/", this._testCookies[newKey], "Cookie should still be in storage while disabled");
                
                // Validate that cookie exists before deletion is applied  
                Assert.ok(this._testCookies[newKey], "Cookie should exist before deletion is applied");
                
                // Enable cookies via dynamic config change - cached deletion should be applied
                configValues.cookieCfg.enabled = true;
                this.clock.tick(1);
                
                // Check that the deletion was applied - cookie should be undefined after deletion
                let cookieValue = this._testCookies[newKey];
                Assert.equal(undefined, cookieValue, "Delete operation should have been applied - cookie should be undefined");
                Assert.equal("", manager.get(newKey), "Should return empty string after deletion is applied");
            }
        });

        this.testCase({
            name: "CookieManager: disableCookieDefer=true reverts to previous behavior - set returns false when disabled",
            test: () => {
                let config: IConfiguration = {
                    cookieCfg: {
                        enabled: false,
                        disableCookieDefer: true
                    }
                };

                let manager = createCookieMgr(config);
                Assert.equal(false, manager.isEnabled(), "Cookie manager should be disabled");
                
                // Test that set returns false (previous behavior)
                Assert.equal(false, manager.set("test", "value"), "set() should return false when disabled and caching disabled");
                
                // Test that get returns empty string (previous behavior)
                Assert.equal("", manager.get("test"), "get() should return empty string when disabled and caching disabled");
                
                // Test that del returns false (previous behavior)
                Assert.equal(false, manager.del("test"), "del() should return false when disabled and caching disabled");
            }
        });

        this.testCase({
            name: "CookieManager: disableCookieDefer=true with cookie functions that throw",
            test: () => {
                let setCookieCalled = 0;
                let getCookieCalled = 0;
                let delCookieCalled = 0;

                let config: IConfiguration = {
                    cookieCfg: {
                        enabled: false,
                        disableCookieDefer: true,
                        getCookie: (name: string) => {
                            getCookieCalled++;
                            throw "Should not be called - get";
                        },
                        setCookie: (name: string, value: string) => {
                            setCookieCalled++;
                            throw "Should not be called - set";
                        },
                        delCookie: (name: string, value: string) => {
                            delCookieCalled++;
                            throw "Should not be called - del";
                        }
                    }
                };

                let manager = createCookieMgr(config);
                
                // Cookies are disabled with caching disabled, so no cookie functions should be called
                manager.set("test", "value");
                manager.get("test");
                manager.del("test");
                
                Assert.equal(0, setCookieCalled, "setCookie should not be called when disabled");
                Assert.equal(0, getCookieCalled, "getCookie should not be called when disabled");
                Assert.equal(0, delCookieCalled, "delCookie should not be called when disabled");
            }
        });

        this.testCase({
            name: "CookieManager: disableCookieDefer=true prevents flushing when cookies are enabled",
            useFakeTimers: true,
            test: () => {
                let setCookieCalled = 0;
                let delCookieCalled = 0;

                let config: IConfiguration = {
                    cookieCfg: {
                        enabled: false,
                        disableCookieDefer: true,
                        setCookie: (name: string, value: string) => {
                            setCookieCalled++;
                            this._testCookies[name] = value;
                        },
                        delCookie: (name: string, value: string) => {
                            delCookieCalled++;
                            this._testCookies[name] = value;
                        }
                    }
                };

                let manager = createCookieMgr(config);
                
                // Try to set/del cookies while disabled
                manager.set("test1", "value1");
                manager.set("test2", "value2");
                manager.del("test3");
                
                Assert.equal(0, setCookieCalled, "setCookie should not be called when disabled");
                Assert.equal(0, delCookieCalled, "delCookie should not be called when disabled");
                
                // Enable cookies
                manager.setEnabled(true);
                this.clock.tick(1); // Allow async config changes
                
                // Cookie functions should still not be called because no caching occurred
                Assert.equal(0, setCookieCalled, "setCookie should not be called after enabling when caching was disabled");
                Assert.equal(0, delCookieCalled, "delCookie should not be called after enabling when caching was disabled");
                
                // Values should not be available
                Assert.equal("", manager.get("test1"), "Should return empty string for uncached value");
                Assert.equal("", manager.get("test2"), "Should return empty string for uncached value");
            }
        });

        this.testCase({
            name: "CookieManager: disableCookieDefer=true via dynamic config change",
            useFakeTimers: true,
            test: () => {
                let setCookieCalled = 0;

                let config: IConfiguration = {
                    cookieCfg: {
                        enabled: false,
                        disableCookieDefer: false, // Start with caching enabled
                        getCookie: (name: string) => {
                            let theValue = this._testCookies[name] || "";
                            return theValue.split(";")[0];
                        },
                        setCookie: (name: string, value: string) => {
                            setCookieCalled++;
                            this._testCookies[name] = value;
                        }
                    }
                };

                let manager = createCookieMgr(config);
                
                // Set a cookie while caching is enabled
                Assert.equal(true, manager.set("test", "value"), "set() should return true when caching is enabled");
                Assert.equal("value", manager.get("test"), "get() should return cached value");
                
                // Dynamically disable caching - this should drop all pending cookies
                config.cookieCfg.disableCookieDefer = true;
                this.clock.tick(1); // Allow async config changes
                
                // Now set should return false and get should return empty
                Assert.equal(false, manager.set("test2", "value2"), "set() should return false after disabling caching");
                Assert.equal("", manager.get("test2"), "get() should return empty string for uncached value");
                
                // Previously cached value should be gone when disableCookieDefer is set to true
                Assert.equal("", manager.get("test"), "get() should return empty string - cached cookies dropped when disableCookieDefer=true");
                
                // Enable cookies - no cookies should be flushed since cache was cleared
                manager.setEnabled(true);
                this.clock.tick(1); // Allow async config changes
                
                Assert.equal(0, setCookieCalled, "No cookies should be flushed since cache was cleared");
                Assert.equal("", manager.get("test"), "Should return empty string since no cookies were flushed");
                Assert.equal("", manager.get("test2"), "Non-cached value should remain empty");
            }
        });

        this.testCase({
            name: "CookieManager: disableCookieDefer=false (default) enables caching behavior",
            useFakeTimers: true,
            test: () => {
                let setCookieCalled = 0;

                let config: IConfiguration = {
                    cookieCfg: {
                        enabled: false,
                        // disableCookieDefer not specified, should default to false
                        getCookie: (name: string) => {
                            let theValue = this._testCookies[name] || "";
                            return theValue.split(";")[0];
                        },
                        setCookie: (name: string, value: string) => {
                            setCookieCalled++;
                            this._testCookies[name] = value;
                        }
                    }
                };

                let manager = createCookieMgr(config);
                
                // Should cache by default
                Assert.equal(true, manager.set("test", "value"), "set() should return true when caching is enabled by default");
                Assert.equal("value", manager.get("test"), "get() should return cached value");
                
                // Enable cookies and verify flushing occurs
                manager.setEnabled(true);
                this.clock.tick(1); // Allow async config changes
                
                Assert.equal(1, setCookieCalled, "Cached cookie should be flushed when enabled");
                Assert.equal("value", manager.get("test"), "Flushed value should be available");
            }
        });

        this.testCase({
            name: "CookieManager: disableCookieDefer respects blocked and ignored cookies",
            useFakeTimers: true,
            test: () => {
                let setCookieCalled = 0;

                let config: IConfiguration = {
                    cookieCfg: {
                        enabled: false,
                        disableCookieDefer: false,
                        blockedCookies: ["blocked"],
                        ignoreCookies: ["ignored"],
                        getCookie: (name: string) => {
                            let theValue = this._testCookies[name] || "";
                            return theValue.split(";")[0];
                        },
                        setCookie: (name: string, value: string) => {
                            setCookieCalled++;
                            this._testCookies[name] = value;
                        }
                    }
                };

                let manager = createCookieMgr(config);
                
                // Normal cookie should be cached
                Assert.equal(true, manager.set("normal", "value"), "Normal cookie should be cached");
                
                // Blocked cookie should not be cached
                Assert.equal(false, manager.set("blocked", "value"), "Blocked cookie should not be cached");
                
                // Ignored cookie should not be cached (get returns empty)
                Assert.equal(false, manager.set("ignored", "value"), "Ignored cookie should not be cached");
                Assert.equal("", manager.get("ignored"), "Ignored cookie get should return empty");
                
                // When disableCookieDefer=true, cached cookies should be dropped
                config.cookieCfg.disableCookieDefer = true;
                this.clock.tick(1); // Allow config change
                
                Assert.equal(false, manager.set("normal2", "value"), "Normal cookie should not be cached when disabled");
                Assert.equal(false, manager.set("blocked2", "value"), "Blocked cookie should not be cached when disabled");
                Assert.equal("", manager.get("ignored2"), "Ignored cookie get should return empty when disabled");
                
                // Previously cached normal cookie should be gone
                Assert.equal("", manager.get("normal"), "Previously cached cookie should be gone when disableCookieDefer=true");
                
                // Enable cookies - no cookies should be flushed since cache was cleared
                manager.setEnabled(true);
                this.clock.tick(1); // Allow async config changes
                
                Assert.equal(0, setCookieCalled, "No cookies should be flushed since cache was cleared");
                Assert.equal("", manager.get("normal"), "No cached value should be available");
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
