/// <reference path="../../../JavaScriptSDK/Context/User.ts" />
/// <reference path="../../TestFramework/Common.ts" />
/// <reference path="../Util.tests.ts"/>

class UserContextTests extends TestClass {

    constructor() {
        super("UserContext");
    }

    /** Method called before the start of each test method */
    public testInitialize() {
    }

    /** Method called after each test method has completed */
    public testCleanup() {
    }

    public registerTests() {

        this.testCase({
            name: "Types: user context initializes from cookie when possible",
            test: () => {
                // setup
                var id = "userId";
                var cookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "getCookie", () => id + "||||");

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig());

                // verify
                Assert.equal(id, user.id, "user id was set from cookie");

            }
        });

        this.testCase({
            name: "ai_user cookie is set with acq date and year expiration",
            test: () => {
                // setup
                var id = "userId";
                var actualCookieName: string;
                var actualCookieValue: string;
                var newIdStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "newId", () => "newId");
                var getCookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "getCookie", () => "");
                var setCookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "setCookie", (cookieName, cookieValue) => {
                    actualCookieName = cookieName;
                    actualCookieValue = cookieValue;
                });

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig());

                // verify
                Assert.equal("ai_user", actualCookieName, "ai_user cookie is set");
                var cookieValueParts = actualCookieValue.split(';');

                Assert.equal(2, cookieValueParts.length, "ai_user cookie value should have actual value and expiration");
                Assert.equal(2, cookieValueParts[0].split('|').length, "ai_user cookie value before expiration should include user id and acq date");
                Assert.equal("newId", cookieValueParts[0].split('|')[0], "First part of ai_user cookie value should be new user id guid");
                Assert.equal(new Date().toString(), (new Date(cookieValueParts[0].split('|')[1])).toString(), "Second part of ai_user cookie should be parsable as date");

                var expiration = cookieValueParts[1];
                Assert.equal(true, expiration.substr(0, "expires=".length) === "expires=", "ai_user cookie expiration part should start with expires=");
                var expirationDate = new Date(expiration.substr("expires=".length));
                Assert.equal(true, expirationDate > (new Date), "ai_user cookie expiration should be in the future");
            }
        });

        this.testCase({
            name: "ai_user cookie is set with acq date and year expiration",
            test: () => {
                // setup
                var id = "userId"
                var actualCookieName: string;
                var actualCookieValue: string;
                var newIdStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "newId", () => "newId");
                var getCookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "getCookie", () => "");
                var setCookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "setCookie", (cookieName, cookieValue) => {
                    actualCookieName = cookieName;
                    actualCookieValue = cookieValue;
                });

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig());

                // verify
                Assert.equal("ai_user", actualCookieName, "ai_user cookie is set");
                var cookieValueParts = actualCookieValue.split(';');

                Assert.equal(2, cookieValueParts.length, "ai_user cookie value should have actual value and expiration");
                Assert.equal(2, cookieValueParts[0].split('|').length, "ai_user cookie value before expiration should include user id and acq date");
                Assert.equal("newId", cookieValueParts[0].split('|')[0], "First part of ai_user cookie value should be new user id guid");
                Assert.equal(new Date().toString(), (new Date(cookieValueParts[0].split('|')[1])).toString(), "Second part of ai_user cookie should be parsable as date");

                var expiration = cookieValueParts[1];
                Assert.equal(true, expiration.substr(0, "expires=".length) === "expires=", "ai_user cookie expiration part should start with expires=");
                var expirationDate = new Date(expiration.substr("expires=".length));
                Assert.equal(true, expirationDate > (new Date), "ai_user cookie expiration should be in the future");
            }
        });

        this.testCase({
            name: "Ctor: auth and account id initialize from cookie",
            test: () => {
                // setup
                var authId = "bla@bla.com";
                var accountId = "Contoso";

                var cookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "getCookie", () => authId + "|" + accountId);

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig()
                );

                // verify
                Assert.equal(authId, user.authenticatedId, "user auth id was set from cookie");
                Assert.equal(accountId, user.accountId, "user account id was not set from cookie");
            }
        });

        this.testCase({
            name: "Ctor: auth id initializes from cookie (without account id)",
            test: () => {
                // setup
                var authId = "bla@bla.com";
                var cookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "getCookie", () => authId);

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig());

                // verify
                Assert.equal(authId, user.authenticatedId, "user auth id was set from cookie");
            }
        });

        this.testCase({
            name: "Ctor: auth user context handles empty cookie",
            test: () => {
                // setup
                var cookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "getCookie", () => "");

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig());

                // verify
                Assert.equal(undefined, user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, user.accountId, "user account id was not set");
            }
        });

        this.testCase({
            name: "Ctor: auth user context handles empty cookie with accountId backward compatibility",
            test: () => {
                // setup
                var config = this.getEmptyConfig();
                config.accountId = () => "account17";

                var cookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "getCookie", () => null);

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(config);

                // verify
                Assert.equal(config.accountId(), user.accountId, "user account id was set from back compat");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: auth id and account id is set (not in the cookie)",
            test: () => {
                // setup
                var authAndAccountId = ['bla@bla.com', 'contoso'];
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig());
                var cookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "setCookie");

                // act
                user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1]);

                // verify
                Assert.equal('bla@bla.com', user.authenticatedId, "user auth id was not set");
                Assert.equal('contoso', user.accountId, "user account id was not set");
                Assert.equal(cookieStub.notCalled, true, "cookie was not set");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: auth user set in cookie without account id",
            test: () => {
                // setup
                var authAndAccountId = ["bla@bla.com"];
                var cookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "setCookie");
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig());

                // act
                user.setAuthenticatedUserContext(authAndAccountId[0], null, true);

                // verify
                Assert.equal(authAndAccountId[0], user.authenticatedId, "user auth id was set");
                Assert.equal(cookieStub.calledWithExactly('ai_authUser', encodeURI(authAndAccountId.join('|')), null), true, "user auth id and account id cookie was set");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: auth user and account id set in cookie ",
            test: () => {
                // setup
                var authAndAccountId = ['bla@bla.com', 'contoso'];
                var cookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "setCookie");
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig());

                // act
                user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1], true);

                // verify
                Assert.equal(authAndAccountId[0], user.authenticatedId, "user auth id was set");
                Assert.equal(cookieStub.calledWithExactly('ai_authUser', encodeURI(authAndAccountId.join('|')), null), true, "user auth id cookie was set");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles only auth user id correctly",
            test: () => {
                // setup
                var authAndAccountId = ['bla@bla.com'];
                var cookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "setCookie");
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig());

                // act
                user.setAuthenticatedUserContext(authAndAccountId[0], null, true);

                // verify
                Assert.equal(authAndAccountId[0], user.authenticatedId, "user auth id was set");
                Assert.equal(null, user.accountId, "user account id was not set");
                Assert.equal(cookieStub.calledWithExactly('ai_authUser', encodeURI(authAndAccountId[0]), null), true, "user auth id cookie was set");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles null correctly",
            test: () => {
                // setup
                var cookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "setCookie");
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig());
                var loggingStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");
                cookieStub.reset();
                loggingStub.reset();

                // act
                user.setAuthenticatedUserContext(null);

                // verify
                Assert.equal(undefined, user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, user.accountId, "user account id was not set");
                Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                Assert.equal(loggingStub.calledOnce, true, "Warning was logged");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles undefined correctly",
            test: () => {
                // setup
                var cookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "setCookie");
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig());
                var loggingStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");
                cookieStub.reset();
                loggingStub.reset();

                // act
                user.setAuthenticatedUserContext(undefined, undefined);

                // verify
                Assert.equal(undefined, user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, user.accountId, "user account id was not set");
                Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                Assert.equal(loggingStub.calledOnce, true, "Warning was logged");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles only accountID correctly",
            test: () => {
                // setup
                var cookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "setCookie");
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig());
                var loggingStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");
                cookieStub.reset();
                loggingStub.reset();

                // act
                user.setAuthenticatedUserContext(undefined, '1234');

                // verify
                Assert.equal(undefined, user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, user.accountId, "user account id was not set");
                Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                Assert.equal(loggingStub.calledOnce, true, "Warning was logged");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles authId special characters correctly",
            test: () => {
                // setup
                var authAndAccountId = ['my|||special;id', '1234'];
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig());
                var cookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "setCookie");
                var loggingStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");

                // act
                user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1], true);

                // verify
                Assert.equal(undefined, user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, user.accountId, "user account id was not set");
                Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                Assert.equal(loggingStub.calledOnce, true, "Warning was logged");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles accountId special characters correctly",
            test: () => {
                // setup
                var authAndAccountId = ['myid', '1234 5678'];
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig());
                user.clearAuthenticatedUserContext();
                var cookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "setCookie");
                var loggingStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");

                // act
                user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1]);

                // verify
                Assert.equal(undefined, user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, user.accountId, "user account id was not set");
                Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                Assert.equal(loggingStub.calledOnce, true, "Warning was logged");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles non-ascii unicode characters correctly",
            test: () => {
                // setup
                var authAndAccountId = ["\u05D0", "\u05D1"]; // Hebrew characters
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig());
                var cookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "setCookie");
                var loggingStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");

                // act
                user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1], true);

                // verify
                Assert.equal(authAndAccountId[0], user.authenticatedId, "user auth id was set");
                Assert.equal(authAndAccountId[1], user.accountId, "user account id was set");
                Assert.equal(cookieStub.calledWithExactly('ai_authUser', encodeURI(authAndAccountId.join('|')), null), true, "user auth id cookie was set");
                Assert.equal(loggingStub.notCalled, true, "No warnings");
            }
        });

        this.testCase({
            name: "clearAuthenticatedUserContext: auth user and account cleared in context and cookie ",
            test: () => {
                // setup
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig());
                user.setAuthenticatedUserContext("bla", "123");
                var cookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "deleteCookie");

                // act
                user.clearAuthenticatedUserContext();

                // verify
                Assert.equal(undefined, user.authenticatedId, "user auth id was cleared");
                Assert.equal(undefined, user.accountId, "user account id was cleared");
                Assert.equal(cookieStub.calledWithExactly('ai_authUser'), true, "cookie was deleted");
            }
        });

        this.testCase({
            name: "clearAuthenticatedUserContext: works correctly when auth id and account id were never set",
            test: () => {
                // setup
                var user = new Microsoft.ApplicationInsights.Context.User(this.getEmptyConfig());
                var cookieStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "deleteCookie");

                // act
                user.clearAuthenticatedUserContext();

                // verify
                Assert.equal(undefined, user.authenticatedId, "user auth id was cleared");
                Assert.equal(undefined, user.accountId, "user account id was cleared");
                Assert.equal(cookieStub.calledWithExactly('ai_authUser'), true, "cookie was deleted");
            }
        });
    }

    private getEmptyConfig(): Microsoft.ApplicationInsights.ITelemetryConfig {
        return {
            instrumentationKey: () => null,
            accountId: () => null,
            sessionRenewalMs: () => null,
            sessionExpirationMs: () => null,
            sampleRate: () => null,
            endpointUrl: () => null,
            cookieDomain: () => null,
            emitLineDelimitedJson: () => null,
            maxBatchSizeInBytes: () => null,
            maxBatchInterval: () => null,
            disableTelemetry: () => null,
            enableSessionStorageBuffer: () => null,
            isRetryDisabled: () => null,
            isBeaconApiDisabled: () => null,
            sdkExtension: () => null,
            isBrowserLinkTrackingEnabled: () => null,
            appId: () => null,
        };
    }
}
new UserContextTests().registerTests();
