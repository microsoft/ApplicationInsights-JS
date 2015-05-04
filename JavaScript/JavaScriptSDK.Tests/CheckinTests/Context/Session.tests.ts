/// <reference path="../../../JavaScriptSDK/context/session.ts" />
/// <reference path="../../testframework/common.ts" />
/// <reference path="../Util.tests.ts"/>

class SessionContextTests extends TestClass {

    private originalDocument;
    private results: any[];

    /** Method called before the start of each test method */
    public testInitialize() {
        this.results = [];
    }

    /** Method called after each test method has completed */
    public testCleanup() {
        this.results = [];
    }

    public registerTests() {

        this.testCase({
            name: "SessionContext: session manager does not initialize automatic session in constructor",
            test: () => {
                // no cookie, isNew should be true
                Microsoft.ApplicationInsights.Util["document"] = <any>{
                    cookie: ""
                };

                var sessionManager = new Microsoft.ApplicationInsights.Context._SessionManager(null, () => { });
                Assert.ok(!sessionManager.automaticSession.isFirst, "isFirst");
                Assert.ok(!sessionManager.automaticSession.id, "id");
                Assert.ok(!sessionManager.automaticSession.acquisitionDate, "acquisitionDate");
                Assert.ok(!sessionManager.automaticSession.renewalDate, "renewalDate");
            }
        });

        this.testCase({
            name: "SessionContext: session manager updates isFirst field correctly",
            test: () => {
                // no cookie, isNew should be true
                Microsoft.ApplicationInsights.Util["document"] = <any>{
                    cookie: ""
                };

                var sessionManager = new Microsoft.ApplicationInsights.Context._SessionManager(null, () => { });
                
                // after first update, should be true
                this.clock.tick(10);
                sessionManager.update();
                Assert.ok(sessionManager.automaticSession.isFirst, "isFirst should be true after 1st update");

                // after second update also true
                sessionManager.update();
                Assert.ok(sessionManager.automaticSession.isFirst, "isFirst should be true after 2st update");

                // after renewal, should be false
                this.clock.tick(Microsoft.ApplicationInsights.Context._SessionManager.renewalSpan + 1);
                sessionManager.update();
                Assert.ok(!sessionManager.automaticSession.isFirst, "isFirst should be false after renewal");
            }
        });

        this.testCase({
            name: "SessionContext: when sessionmanager initailzes it sets isFirst to false if cookie is present",
            test: () => {
                // no cookie, isNew should be true
                Microsoft.ApplicationInsights.Util["document"] = <any>{
                    cookie: ""
                };

                this.clock.tick(10);
                var sessionManager1 = new Microsoft.ApplicationInsights.Context._SessionManager(null, () => { });
                sessionManager1.update();
                this.clock.tick(Microsoft.ApplicationInsights.Context._SessionManager.renewalSpan + 1);
                
                // Creating one more instance immulate that browser was closed
                var sessionManager2 = new Microsoft.ApplicationInsights.Context._SessionManager(null, () => { });
                sessionManager2.update();
                Assert.ok(!sessionManager2.automaticSession.isFirst, "isFirst should be false because it is same browser/user");
            }
        });

        this.testCase({
            name: "ai_session cookie has correct structure",
            test: () => {
                // setup
                var actualCookieName: string;
                var actualCookieValue: string;
                var newGuidStub = sinon.stub(Microsoft.ApplicationInsights.Util, "newGuid", () => "newGuid");
                var getCookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "getCookie", () => "");
                var setCookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "setCookie", (cookieName, cookieValue) => {
                    actualCookieName = cookieName;
                    actualCookieValue = cookieValue;
                });

                // act
                var sessionManager = new Microsoft.ApplicationInsights.Context._SessionManager(null, () => { });
                sessionManager.update();

                // verify
                Assert.equal("ai_session", actualCookieName, "ai_session cookie is set");
                var cookieValueParts = actualCookieValue.split(';');

                Assert.equal(2, cookieValueParts.length, "Cookie value should have actual value and expiration");
                Assert.equal(3, cookieValueParts[0].split('|').length, "Cookie value before expiration should include user id, acq date and renew date");
                Assert.equal("newGuid", cookieValueParts[0].split('|')[0], "First part of cookie value should be new user id guid");
                
                // Having expiration 1 year allows to set sesion.IsFirst only when we generated cookie for the first time for a given browser
                var expiration = cookieValueParts[1];
                Assert.equal(true, expiration.substr(0, "expires=".length) === "expires=", "Cookie expiration part should start with expires=");
                var expirationDate = new Date(expiration.substr("expires=".length));
                Assert.equal(365, expirationDate.getTime() / 1000 / 60 / 60 / 24, "cookie expiration should be in the 1 year");

                // cleanup
                getCookieStub.restore();
                setCookieStub.restore();
                newGuidStub.restore();
            }
        });

        this.testCase({
            name: "SessionContext: session manager sets the isFirst to false if cookie was present",
            test: () => {
                // no cookie, isNew should be true
                Microsoft.ApplicationInsights.Util["document"] = <any>{
                    cookie: ""
                };

                var testGuid = "00000000-0000-0000-0000-000000000000";
                var acquisitionDate = Microsoft.ApplicationInsights.Util.toISOStringForIE8(new Date());
                var renewalDate = Microsoft.ApplicationInsights.Util.toISOStringForIE8(new Date());

                this.setFakeCookie(testGuid, acquisitionDate, renewalDate);

                var sessionManager = new Microsoft.ApplicationInsights.Context._SessionManager(null, () => { });
                sessionManager.update();
                Assert.ok(!sessionManager.automaticSession.isFirst, "isFirst is false when an existing session was set");

                this.restoreFakeCookie();
            }
        });

        this.testCase({
            name: "SessionContext: session start is generated without cookies",
            test: () => {
                // no cookie, isNew should be true
                Microsoft.ApplicationInsights.Util["document"] = <any>{
                    cookie: ""
                };

                var sessionManager = new Microsoft.ApplicationInsights.Context._SessionManager(null, (t) => { this.results.push(t); });
                sessionManager.update();

                Assert.equal(AI.SessionState.Start, this.results[0], "session start generated");
            }
        });

        this.testCase({
            name: "SessionContext: session start and end are generated after timeout expired",
            test: () => {
                // setup
                var testGuid = "00000000-0000-0000-0000-000000000000";
                var delta = (Microsoft.ApplicationInsights.Context._SessionManager.renewalSpan + 1);
                this.clock.tick(delta); // safari crashes without this
                var cookieTime = +new Date - delta;
                var acquisitionDate = Microsoft.ApplicationInsights.Util.toISOStringForIE8(new Date(cookieTime));
                var renewalDate = Microsoft.ApplicationInsights.Util.toISOStringForIE8(new Date(cookieTime));

                this.setFakeCookie(testGuid, acquisitionDate, renewalDate);

                // act
                var sessionManager = new Microsoft.ApplicationInsights.Context._SessionManager(null, (t) => { this.results.push(t); });
                sessionManager.update();

                // verify
                Assert.equal(2, this.results.length);
                Assert.equal(AI.SessionState.End, this.results[0], "session end generated");
                Assert.equal(AI.SessionState.Start, this.results[1], "session start generated");

                this.restoreFakeCookie();
            }
        });

        this.testCase({
            name: "SessionContext: session manager renews when acquisition date has expired",
            test: () => {
                // setup
                var testGuid = "00000000-0000-0000-0000-000000000000";
                var delta = (Microsoft.ApplicationInsights.Context._SessionManager.acquisitionSpan + 1);
                this.clock.tick(delta); // safari crashes without this
                var cookieTime = +new Date - delta;
                var acquisitionDate = Microsoft.ApplicationInsights.Util.toISOStringForIE8(new Date(cookieTime));
                var renewalDate = Microsoft.ApplicationInsights.Util.toISOStringForIE8(new Date());

                this.setFakeCookie(testGuid, acquisitionDate, renewalDate);

                // act
                var sessionManager = new Microsoft.ApplicationInsights.Context._SessionManager(null, (t) => { this.results.push(t); });
                sessionManager.update();

                // verify
                Assert.equal(2, this.results.length);
                Assert.equal(AI.SessionState.End, this.results[0], "session end generated");
                Assert.equal(AI.SessionState.Start, this.results[1], "session start generated");

                this.restoreFakeCookie();
            }
        });

        this.testCase({
            name: "SessionContext: session manager honors session from the cookie",
            test: () => {
                // setup
                var testGuid = "00000000-0000-0000-0000-000000000000";
                var acquisitionDate = Microsoft.ApplicationInsights.Util.toISOStringForIE8(new Date());
                var renewalDate = Microsoft.ApplicationInsights.Util.toISOStringForIE8(new Date());

                this.setFakeCookie(testGuid, acquisitionDate, renewalDate);

                // act
                var sessionManager = new Microsoft.ApplicationInsights.Context._SessionManager(null, () => { });
                sessionManager.update();

                // verify
                Assert.equal(testGuid, sessionManager.automaticSession.id, "cookie session id was used");
                Assert.equal(+new Date(acquisitionDate), sessionManager.automaticSession.acquisitionDate, "cookie acquisitionDate was used");
                Assert.equal(+new Date(renewalDate), sessionManager.automaticSession.renewalDate, "cookie renewalDate was used");

                this.restoreFakeCookie();
            }
        });

        this.testCase({
            name: "SessionContext: session manager renews when renewal date has expired",
            test: () => {
                // setup
                var testGuid = "00000000-0000-0000-0000-000000000000";
                var delta = (Microsoft.ApplicationInsights.Context._SessionManager.renewalSpan + 1);
                this.clock.tick(delta); // safari crashes without this
                var cookieTime = +new Date - delta;
                var acquisitionDate = Microsoft.ApplicationInsights.Util.toISOStringForIE8(new Date(cookieTime));
                var renewalDate = Microsoft.ApplicationInsights.Util.toISOStringForIE8(new Date(cookieTime));

                this.setFakeCookie(testGuid, acquisitionDate, renewalDate);

                // act
                var sessionManager = new Microsoft.ApplicationInsights.Context._SessionManager(null, (t) => { this.results.push(t); });
                sessionManager.update();

                // verify
                Assert.notEqual(testGuid, sessionManager.automaticSession.id, "cookie session id was renewed");
                Assert.equal(delta, sessionManager.automaticSession.acquisitionDate, "cookie acquisitionDate was updated");
                Assert.equal(delta, sessionManager.automaticSession.renewalDate, "cookie renewalDate was updated");
                Assert.equal(2, this.results.length);
                Assert.equal(AI.SessionState.End, this.results[0], "session end generated");
                Assert.equal(AI.SessionState.Start, this.results[1], "session start generated");

                this.restoreFakeCookie();
            }
        });

        this.testCase({
            name: "SessionContext: session manager renews when acquisition date has expired",
            test: () => {
                // setup
                var testGuid = "00000000-0000-0000-0000-000000000000";
                var delta = (Microsoft.ApplicationInsights.Context._SessionManager.acquisitionSpan + 1);
                this.clock.tick(delta); // safari crashes without this
                var cookieTime = +new Date - delta;
                var acquisitionDate = Microsoft.ApplicationInsights.Util.toISOStringForIE8(new Date(cookieTime));
                var renewalDate = Microsoft.ApplicationInsights.Util.toISOStringForIE8(new Date());

                this.setFakeCookie(testGuid, acquisitionDate, renewalDate);

                // act
                var sessionManager = new Microsoft.ApplicationInsights.Context._SessionManager(null, () => { });
                sessionManager.update();

                // verify
                Assert.notEqual(testGuid, sessionManager.automaticSession.id, "cookie session id was renewed");
                Assert.equal(delta, sessionManager.automaticSession.acquisitionDate, "cookie acquisitionDate was updated");
                Assert.equal(delta, sessionManager.automaticSession.renewalDate, "cookie renewalDate was updated");

                this.restoreFakeCookie();
            }
        });

        this.testCase({
            name: "SessionContext: session manager updates renewal date when updated",
            test: () => {
                // setup
                var testGuid = "00000000-0000-0000-0000-000000000000";
                var acquisitionDate = Microsoft.ApplicationInsights.Util.toISOStringForIE8(new Date());
                var renewalDate = Microsoft.ApplicationInsights.Util.toISOStringForIE8(new Date());

                this.setFakeCookie(testGuid, acquisitionDate, renewalDate);

                // act
                var sessionManager = new Microsoft.ApplicationInsights.Context._SessionManager(null, () => { });
                this.clock.tick(10);
                sessionManager.update();

                // verify
                Assert.equal(testGuid, sessionManager.automaticSession.id, "cookie session id was not renewed");
                Assert.equal(0, sessionManager.automaticSession.acquisitionDate, "cookie acquisitionDate was updated");
                Assert.equal(10, sessionManager.automaticSession.renewalDate, "cookie renewalDate was updated");

                this.restoreFakeCookie();
            }
        });

        this.testCase({
            name: "SessionContext: config overrides work",
            test: () => {
                // setup
                var sessionRenewalMs = 5;
                var sessionExpirationMs = 10;
                var config: Microsoft.ApplicationInsights.Context.ISessionConfig = {
                    sessionRenewalMs: () => sessionRenewalMs,
                    sessionExpirationMs: () => sessionExpirationMs
                };

                // act
                var sessionManager = new Microsoft.ApplicationInsights.Context._SessionManager(config, () => { });

                // verify
                Assert.equal(sessionRenewalMs, sessionManager.config.sessionRenewalMs(), "config sessionRenewalMs is set correctly");
                Assert.equal(sessionExpirationMs, sessionManager.config.sessionExpirationMs(), "config sessionExpirationMs is set correctly");

                // act
                sessionRenewalMs = 6;
                sessionExpirationMs = 11;

                // verify
                Assert.equal(sessionRenewalMs, sessionManager.config.sessionRenewalMs(), "config sessionRenewalMs is updated correctly");
                Assert.equal(sessionExpirationMs, sessionManager.config.sessionExpirationMs(), "config sessionExpirationMs is updated correctly");
            }
        });
    }

    private setFakeCookie(id, acqDate, renewalDate) {
        this.originalDocument = Microsoft.ApplicationInsights.Util["document"];
        Microsoft.ApplicationInsights.Util["document"] = <any>{
            cookie: "ai_user=foo; ai_session=" + [id, acqDate, renewalDate].join("|")
        };
    }

    private restoreFakeCookie() {
        Microsoft.ApplicationInsights.Util["document"] = this.originalDocument;
    }
}
new SessionContextTests().registerTests();
