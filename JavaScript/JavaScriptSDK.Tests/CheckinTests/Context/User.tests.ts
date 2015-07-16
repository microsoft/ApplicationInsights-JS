/// <reference path="../../../JavaScriptSDK/context/user.ts" />
/// <reference path="../../testframework/common.ts" />
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
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "getCookie", () => id + "||||");

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // verify
                Assert.equal(id, user.id, "user id was set from cookie");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "ai_user cookie is set with acq date and year expiration",
            test: () => {
                // setup
                var id = "userId";
                var actualCookieName: string;
                var actualCookieValue: string;
                var newGuidStub = sinon.stub(Microsoft.ApplicationInsights.Util, "newGuid",() => "newGuid");
                var getCookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "getCookie",() => "");
                var setCookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "setCookie",(cookieName, cookieValue) => {
                    actualCookieName = cookieName;
                    actualCookieValue = cookieValue;
                });

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // verify
                Assert.equal("ai_user", actualCookieName, "ai_user cookie is set");
                var cookieValueParts = actualCookieValue.split(';');

                Assert.equal(2, cookieValueParts.length, "ai_user cookie value should have actual value and expiration");
                Assert.equal(2, cookieValueParts[0].split('|').length, "ai_user cookie value before expiration should include user id and acq date");
                Assert.equal("newGuid", cookieValueParts[0].split('|')[0], "First part of ai_user cookie value should be new user id guid");
                Assert.equal(new Date().toString(),(new Date(cookieValueParts[0].split('|')[1])).toString(), "Second part of ai_user cookie should be parsable as date");

                var expiration = cookieValueParts[1];
                Assert.equal(true, expiration.substr(0, "expires=".length)==="expires=", "ai_user cookie expiration part should start with expires=");
                var expirationDate = new Date(expiration.substr("expires=".length));
                Assert.equal(true, expirationDate > (new Date), "ai_user cookie expiration should be in the future");

                // cleanup
                getCookieStub.restore();
                setCookieStub.restore();
                newGuidStub.restore();
            }
        });

        this.testCase({
            name: "ai_user cookie is set with acq date and year expiration",
            test: () => {
                // setup
                var id = "userId"
                var actualCookieName: string;
                var actualCookieValue: string;
                var newGuidStub = sinon.stub(Microsoft.ApplicationInsights.Util, "newGuid",() => "newGuid");
                var getCookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "getCookie",() => "");
                var setCookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "setCookie",(cookieName, cookieValue) => {
                    actualCookieName = cookieName;
                    actualCookieValue = cookieValue;
                });

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // verify
                Assert.equal("ai_user", actualCookieName, "ai_user cookie is set");
                var cookieValueParts = actualCookieValue.split(';');

                Assert.equal(2, cookieValueParts.length, "ai_user cookie value should have actual value and expiration");
                Assert.equal(2, cookieValueParts[0].split('|').length, "ai_user cookie value before expiration should include user id and acq date");
                Assert.equal("newGuid", cookieValueParts[0].split('|')[0], "First part of ai_user cookie value should be new user id guid");
                Assert.equal(new Date().toString(),(new Date(cookieValueParts[0].split('|')[1])).toString(), "Second part of ai_user cookie should be parsable as date");

                var expiration = cookieValueParts[1];
                Assert.equal(true, expiration.substr(0, "expires=".length)==="expires=", "ai_user cookie expiration part should start with expires=");
                var expirationDate = new Date(expiration.substr("expires=".length));
                Assert.equal(true, expirationDate > (new Date), "ai_user cookie expiration should be in the future");

                // cleanup
                getCookieStub.restore();
                setCookieStub.restore();
                newGuidStub.restore();
            }
        });

        this.testCase({
            name: "Ctor: auth and account id initialize from cookie",
            test: () => {
                // setup
                var authId = "bla@bla.com";
                var accountId = "Contoso";

                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "getCookie",() => authId + "|" + accountId);

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // verify
                Assert.equal(authId, user.getAuthId(), "user auth id was set from cookie");
                Assert.equal(accountId, user.accountId, "user account id was not set from cookie");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "Ctor: auth id initializes from cookie (without account id)",
            test: () => {
                // setup
                var authId = "bla@bla.com";
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "getCookie",() => authId);

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // verify
                Assert.equal(authId, user.getAuthId(), "user auth id was set from cookie");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "Ctor: auth user context handles empty cookie",
            test: () => {
                // setup
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "getCookie",() => "");

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // verify
                Assert.equal(undefined, user.getAuthId(), "user auth id was not set");
                Assert.equal(undefined, user.accountId, "user account id was not set");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "Ctor: auth user context handles empty cookie with accountId backward compatibility",
            test: () => {
                // setup
                var accountIdBackCompat = "account17";
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "getCookie",() => null);

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(accountIdBackCompat);

                // verify
                Assert.equal(accountIdBackCompat, user.accountId, "user account id was set from back compat");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: auth user set in cookie without account id",
            test: () => {
                // setup
                var authAndAccountId = ["bla@bla.com"];
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "setCookie");
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // act
                user.setAuthenticatedUserContext(authAndAccountId[0]);

                // verify
                Assert.equal(authAndAccountId[0], user.getAuthId(), "user auth id was set");
                Assert.equal(cookieStub.calledWithExactly('ai_authUser', encodeURI(authAndAccountId.join('|'))), true, "user auth id nad account id cookie was set");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: auth user and account id set in cookie ",
            test: () => {
                // setup
                var authAndAccountId = ['bla@bla.com', 'contoso'];
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "setCookie");
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // act
                user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1]);

                // verify
                Assert.equal(authAndAccountId[0], user.getAuthId(), "user auth id was set");
                Assert.equal(cookieStub.calledWithExactly('ai_authUser', encodeURI(authAndAccountId.join('|'))), true, "user auth id cookie was set");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles empty account id correctly",
            test: () => {
                // setup
                var authAndAccountId = ['bla@bla.com'];
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "setCookie");
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // act
                user.setAuthenticatedUserContext(authAndAccountId[0]);

                // verify
                Assert.equal(authAndAccountId[0], user.getAuthId(), "user auth id was set");
                Assert.equal(null, user.accountId, "user account id was not set");
                Assert.equal(cookieStub.calledWithExactly('ai_authUser', encodeURI(authAndAccountId[0])), true, "user auth id cookie was set");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles nulls correctly",
            test: () => {
                // setup
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "setCookie");
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // act
                user.setAuthenticatedUserContext(null);

                // verify
                Assert.equal(undefined, user.getAuthId(), "user auth id was not set");
                Assert.equal(undefined, user.accountId, "user account id was not set");
                Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles authId special characters correctly",
            test: () => {
                // setup
                var authAndAccountId = ['my|||special;id', '1234'];
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "setCookie");

                // act
                user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1]);

                // verify
                Assert.equal(undefined, user.getAuthId(), "user auth id was not set");
                Assert.equal(undefined, user.accountId, "user account id was not set");
                Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles accountId special characters correctly",
            test: () => {
                // setup
                var authAndAccountId = ['myid', '1234 5678'];
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);
                user.clearAuthenticatedUserContext();
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "setCookie");

                // act
                user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1]);

                // verify
                Assert.equal(undefined, user.getAuthId(), "user auth id was not set");
                Assert.equal(undefined, user.accountId, "user account id was not set");
                Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles unicode characters correctly",
            test: () => {
                // setup
                var authAndAccountId = ['שלום', 'להתראות'];
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "setCookie");

                // act
                user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1]);

                // verify
                Assert.equal(authAndAccountId[0], user.getAuthId(), "user auth id was set");
                Assert.equal(authAndAccountId[1], user.accountId, "user account id was set");
                Assert.equal(cookieStub.calledWithExactly('ai_authUser', encodeURI(authAndAccountId.join('|'))), true, "user auth id cookie was set");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "clearAuthenticatedUserContext: auth user and account cleared in context and cookie ",
            test: () => {
                // setup
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);
                user.setAuthenticatedUserContext("bla", "123");
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "deleteCookie");

                // act
                user.clearAuthenticatedUserContext();

                // verify
                Assert.equal(undefined, user.getAuthId(), "user auth id was cleared");
                Assert.equal(undefined, user.accountId, "user account id was cleared");
                Assert.equal(cookieStub.calledWithExactly('ai_authUser'), true, "cookie was deleted");
                cookieStub.restore();
            }
        });
    }
}
new UserContextTests().registerTests();
