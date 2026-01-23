import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { SinonStub } from 'sinon';
import { AppInsightsCore, DiagnosticLogger, createCookieMgr, newId, dateNow, createDynamicConfig } from "@microsoft/otel-core-js";
import PropertiesPlugin from "../../../src/PropertiesPlugin";
import { _SessionManager } from "../../../src/Context/Session";

export class SessionManagerTests extends AITestClass {
    private properties: PropertiesPlugin;
    private core: AppInsightsCore;
    private _cookies: { [name: string ]: string } = {};

    constructor(emulateIe: boolean) {
        super("SessionManagerTests", emulateIe);
    }

    public testInitialize() {
        let _self = this;
        _self._cookies = {};
        _self.core = new AppInsightsCore();
        _self.core.logger = new DiagnosticLogger();
        _self.core.setCookieMgr(createCookieMgr({
            cookieCfg: {
                setCookie: (name: string, value: string) => _self._setCookie(name, value),
                getCookie: (name: string) => _self._getCookie(name),
                delCookie: (name: string) => _self._delCookie(name)
            }
        }, _self.core.logger))
        _self.properties = new PropertiesPlugin();
    }

    public testCleanup() {
        this.core = null;
        this.properties = null;
    }

    public registerTests() {
        this.addSessionManagerTests();
    }

    private _setCookie(name: string, value: string) {
        this._cookies[name] = value;
    }

    private _getCookie(name: string) {
        let cookieValue = this._cookies[name] || "";
        // Remove any cookie attributes added to the cookie
        return cookieValue.split(";")[0];
    }
    
    private _delCookie(name: string) {
        if (this._cookies.hasOwnProperty(name)) {
            delete this._cookies[name];
        }
    }

    private _getNewId(idLength?: number) {
        return newId(idLength);
    }

    private addSessionManagerTests() {

        this.testCase({
            name: 'Session uses name prefix for cookie storage',
            test: () => {

                var sessionPrefix = newId();
                var config = createDynamicConfig({
                    namePrefix: sessionPrefix,
                    sessionExpirationMs: undefined,
                    sessionRenewalMs: undefined,
                    cookieDomain: undefined
                }).cfg;
                // Setup
                let cookie = "";
                const cookieStub: SinonStub = this.sandbox.stub(this.core.getCookieMgr(), 'set').callsFake((cookieName, value, maxAge, domain, path) => {
                    cookie = cookieName;
                });

                // Act
                const sessionManager = new _SessionManager(config, this.core);
                sessionManager.update();

                // Test
                Assert.ok(cookieStub.called, 'cookie set');
                Assert.equal('ai_session' + sessionPrefix, cookie, 'Correct cookie name when name prefix is provided - [' + cookie + ']');
            }
        });

        this.testCase({
            name: 'Session uses sessionCookiePostfix over namePrefix for cookie storage if both are configured.',
            test: () => {

                var sessionPrefix = newId();
                var config = createDynamicConfig({
                    namePrefix: sessionPrefix,
                    sessionCookiePostfix: "testSessionCookieNamePostfix",
                    sessionExpirationMs: undefined,
                    sessionRenewalMs: undefined,
                    cookieDomain: undefined

                }).cfg;

                // Setup
                let cookie = "";
                const cookieStub: SinonStub = this.sandbox.stub(this.core.getCookieMgr(), 'set').callsFake((cookieName, value, maxAge, domain, path) => {
                    cookie = cookieName;
                });

                // Act
                const sessionManager = new _SessionManager(config, this.core);
                sessionManager.update();

                // Test
                Assert.ok(cookieStub.called, 'cookie set');
                Assert.equal('ai_session' + 'testSessionCookieNamePostfix', cookie, 'Correct cookie name when session cookie postfix is provided - [' + cookie + ']');
            }
        });

        this.testCase({
            name: 'Validate Session default re-hydration within expiry period',
            useFakeTimers: true,
            test: () => {
                var sessionPrefix = newId();
                var config = createDynamicConfig({
                    namePrefix: sessionPrefix,
                    sessionExpirationMs: 30 * 60 * 1000,
                    sessionRenewalMs: 24 * 60 * 60 * 1000,
                    cookieDomain: undefined
                }).cfg;

                // Simulate 100ms as when zero the cookie values are deemed to be invalid
                this.clock.tick(100);

                // Initial Session
                const sessionManager = new _SessionManager(config, this.core);
                sessionManager.update();
                let aiSessionValue = this._cookies['ai_session' + sessionPrefix];

                // Simulate 100ms
                this.clock.tick(100);

                const revisitSession = new _SessionManager(config, this.core);
                revisitSession.update();

                Assert.notEqual(aiSessionValue, this._cookies['ai_session' + sessionPrefix], "The cookie value should have been updated, by the 2nd update");
                Assert.equal(sessionManager.automaticSession.id, revisitSession.automaticSession.id, "Validate session id is the same");
            }
        });

        this.testCase({
            name: 'Validate Session expiration period event when accessed',
            useFakeTimers: true,
            test: () => {
                var sessionPrefix = newId();
                var config = createDynamicConfig({
                    namePrefix: sessionPrefix,
                    sessionExpirationMs: 5000,
                    sessionRenewalMs: 24 * 60 * 60 * 1000,
                    cookieDomain: undefined
                }).cfg;

                // Simulate 100ms as when zero the cookie values are deemed to be invalid
                this.clock.tick(100);

                // Initial Session
                const sessionManager = new _SessionManager(config, this.core);
                sessionManager.update();
                let aiSessionValue = this._cookies['ai_session' + sessionPrefix];

                // Simulate 2 seconds
                for (let lp = 0; lp < 20; lp++) {
                    // Simulate 100ms
                    this.clock.tick(100);

                    const revisitSession = new _SessionManager(config, this.core);
                    revisitSession.update();

                    Assert.notEqual(aiSessionValue, this._cookies['ai_session' + sessionPrefix], "The cookie value should have been updated, by the " + lp + " loop");
                    Assert.equal(sessionManager.automaticSession.id, revisitSession.automaticSession.id, "Validate session id is the same - " + lp);
                }


                // Simulate another 2 seconds
                this.clock.tick(2000);
                let revisitSession = new _SessionManager(config, this.core);
                revisitSession.update();

                Assert.notEqual(aiSessionValue, this._cookies['ai_session' + sessionPrefix], "The cookie value should have been updated, after 4 seconds");
                Assert.equal(sessionManager.automaticSession.id, revisitSession.automaticSession.id, "Validate session id is the same after 4 seconds");

                // Simulate 999ms
                this.clock.tick(999);
                revisitSession = new _SessionManager(config, this.core);
                revisitSession.update();

                Assert.notEqual(aiSessionValue, this._cookies['ai_session' + sessionPrefix], "The cookie value should have been updated, after 4.999 seconds");
                Assert.equal(sessionManager.automaticSession.id, revisitSession.automaticSession.id, "Validate session id is the same after 4.999 seconds");

                // Now simulate going beyond the expiry period
                this.clock.tick(2);
                revisitSession = new _SessionManager(config, this.core);
                revisitSession.update();

                Assert.notEqual(aiSessionValue, this._cookies['ai_session' + sessionPrefix], "The cookie value should have been updated after waiting 5 seconds");
                Assert.notEqual(sessionManager.automaticSession.id, revisitSession.automaticSession.id, "Validate session id have now changed after 5 seconds");
            }
        });

        this.testCase({
            name: 'Validate Session renew period event when accessed',
            useFakeTimers: true,
            test: () => {
                var sessionPrefix = newId();
                var config = createDynamicConfig({
                    namePrefix: sessionPrefix,
                    sessionExpirationMs: 86400000,
                    sessionRenewalMs: 5000,
                    cookieDomain: undefined
                }).cfg;

                // Simulate 100ms as when zero the cookie values are deemed to be invalid
                this.clock.tick(100);

                // Initial Session
                const sessionManager = new _SessionManager(config, this.core);
                sessionManager.update();
                let aiSessionValue = this._cookies['ai_session' + sessionPrefix];

                // Simulate 10 seconds
                for (let lp = 0; lp < 100; lp++) {
                    // Simulate 100ms
                    this.clock.tick(100);

                    const revisitSession = new _SessionManager(config, this.core);
                    revisitSession.update();

                    Assert.notEqual(aiSessionValue, this._cookies['ai_session' + sessionPrefix], "The cookie value should have been updated, by the " + lp + " loop");
                    Assert.equal(sessionManager.automaticSession.id, revisitSession.automaticSession.id, "Validate session id is the same - " + lp);
                }

                // Simulate another 2 seconds
                this.clock.tick(2000);
                let revisitSession = new _SessionManager(config, this.core);
                revisitSession.update();

                Assert.notEqual(aiSessionValue, this._cookies['ai_session' + sessionPrefix], "The cookie value should have been updated, after " + dateNow());
                Assert.equal(sessionManager.automaticSession.id, revisitSession.automaticSession.id, "Validate session id is the same after " + dateNow());

                // Simulate another 2 seconds (This still should not expire the cookie value as it was last accessed only 2 seconds ago)
                this.clock.tick(2000);
                revisitSession = new _SessionManager(config, this.core);
                revisitSession.update();

                Assert.notEqual(aiSessionValue, this._cookies['ai_session' + sessionPrefix], "The cookie value should have been updated " + dateNow());
                Assert.equal(sessionManager.automaticSession.id, revisitSession.automaticSession.id, "Validate session id is the same after " + dateNow());

                // Now simulate going beyond the expiry period
                this.clock.tick(5001);
                revisitSession = new _SessionManager(config, this.core);
                revisitSession.update();

                Assert.notEqual(aiSessionValue, this._cookies['ai_session' + sessionPrefix], "The cookie value should have been updated after waiting " + dateNow());
                Assert.notEqual(sessionManager.automaticSession.id, revisitSession.automaticSession.id, "Validate session id have now changed after " + dateNow());
            }
        });

        this.testCase({
            name: 'Validate Session default re-hydration from storage',
            useFakeTimers: true,
            test: () => {
                var sessionPrefix = newId();
                var config = createDynamicConfig({
                    namePrefix: sessionPrefix,
                    sessionExpirationMs: 30 * 60 * 1000,
                    sessionRenewalMs: 24 * 60 * 60 * 1000,
                    cookieDomain: undefined
                }).cfg;

                // Simulate 100ms as when zero the cookie values are deemed to be invalid
                this.clock.tick(100);

                // Initial Session
                const sessionManager = new _SessionManager(config, this.core);
                sessionManager.update();
                let aiSessionValue = this._cookies['ai_session' + sessionPrefix];

                // Simulate 100ms
                this.clock.tick(100);

                // remove the cookie
                delete this._cookies['ai_session' + sessionPrefix];

                let revisitSession = new _SessionManager(config, this.core);
                revisitSession.update();

                Assert.notEqual(aiSessionValue, this._cookies['ai_session' + sessionPrefix], "The cookie value should have been updated, by the 2nd update");
                Assert.notEqual(sessionManager.automaticSession.id, revisitSession.automaticSession.id, "Validate session id's are not the same");

                // Backup the data to storage
                sessionManager.backup();

                // remove the cookie again so this time it should restore from storage
                delete this._cookies['ai_session' + sessionPrefix];
                
                revisitSession = new _SessionManager(config, this.core);
                revisitSession.update();

                Assert.notEqual(aiSessionValue, this._cookies['ai_session' + sessionPrefix], "The cookie value should have been updated, by the 2nd update");
                Assert.equal(sessionManager.automaticSession.id, revisitSession.automaticSession.id, "Validate session id is the same");
            }
        });

        this.testCase({
            name: 'Validate Session expiration period event when accessed from storage',
            useFakeTimers: true,
            test: () => {
                var sessionPrefix = newId();
                var config = createDynamicConfig({
                    namePrefix: sessionPrefix,
                    sessionExpirationMs: 5000,
                    sessionRenewalMs: 24 * 60 * 60 * 1000,
                    cookieDomain: undefined
                }).cfg;

                // Simulate 100ms as when zero the cookie values are deemed to be invalid
                this.clock.tick(100);

                // Initial Session
                const sessionManager = new _SessionManager(config, this.core);
                sessionManager.update();
                let aiSessionValue = this._cookies['ai_session' + sessionPrefix];

                // Backup the data to storage
                sessionManager.backup();

                // Simulate 2 seconds
                for (let lp = 0; lp < 20; lp++) {
                    // remove the cookie again so this time it should restore from storage
                    delete this._cookies['ai_session' + sessionPrefix];

                    // Simulate 100ms
                    this.clock.tick(100);

                    const revisitSession = new _SessionManager(config, this.core);
                    revisitSession.update();

                    Assert.notEqual(aiSessionValue, this._cookies['ai_session' + sessionPrefix], "The cookie value should have been updated, by the " + lp + " loop");
                    Assert.equal(sessionManager.automaticSession.id, revisitSession.automaticSession.id, "Validate session id is the same - " + lp);
                }

                // remove the cookie again so this time it should restore from storage
                delete this._cookies['ai_session' + sessionPrefix];

                // Simulate another 2.999 seconds
                this.clock.tick(2999);
                let revisitSession = new _SessionManager(config, this.core);
                revisitSession.update();

                Assert.notEqual(aiSessionValue, this._cookies['ai_session' + sessionPrefix], "The cookie value should have been updated, after 4.999 seconds");
                Assert.equal(sessionManager.automaticSession.id, revisitSession.automaticSession.id, "Validate session id is the same after 4.999 seconds");

                // remove the cookie again so this time it should restore from storage
                delete this._cookies['ai_session' + sessionPrefix];

                // Now simulate going beyond the expiry period
                this.clock.tick(2);
                revisitSession = new _SessionManager(config, this.core);
                revisitSession.update();

                Assert.notEqual(aiSessionValue, this._cookies['ai_session' + sessionPrefix], "The cookie value should have been updated after waiting 5 seconds");
                Assert.notEqual(sessionManager.automaticSession.id, revisitSession.automaticSession.id, "Validate session id have now changed after 5 seconds");
            }
        });
    }
}
