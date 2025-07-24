import { AITestClass } from "@microsoft/ai-test-framework";
import { IKillSwitch, createKillSwitch } from '../../../src/KillSwitch';

export class KillSwitchTest extends AITestClass {

    public testInitialize() {
    }

    public registerTests() {
        this.testCase({
            name: 'check basic kill switch',
            test: () => {
                let killSwitch = createKillSwitch();

                QUnit.assert.equal(killSwitch.isTenantKilled("test-tenant"), false, "tenant should not be listed");

                let theRequest = killSwitch.setKillSwitchTenants("tenant1", "1000");
                QUnit.assert.equal(theRequest.length, 0);

                QUnit.assert.equal(killSwitch.isTenantKilled("test-tenant"), false, "tenant should not be listed");
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant1"), true, "tenant1 should be listed");

                theRequest = killSwitch.setKillSwitchTenants("tenant2", "1000");
                QUnit.assert.equal(theRequest.length, 0);

                QUnit.assert.equal(killSwitch.isTenantKilled("test-tenant"), false, "tenant should not be listed");
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant1"), true, "tenant1 should be listed");
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant2"), true, "tenant2 should be listed");
            }
        });

        this.testCase({
            name: 'check basic kill switch with expiry',
            useFakeTimers: true,
            test: () => {
                let killSwitch = createKillSwitch();

                let theRequest = killSwitch.setKillSwitchTenants("tenant1", "1");
                QUnit.assert.equal(theRequest.length, 0);

                QUnit.assert.equal(killSwitch.isTenantKilled("tenant1"), true, "tenant1 should be listed");

                theRequest = killSwitch.setKillSwitchTenants("tenant2", "2");
                QUnit.assert.equal(theRequest.length, 0);

                this.clock.tick(999);
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant1"), true, "tenant1 should be listed");
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant2"), true, "tenant2 should be listed");

                this.clock.tick(1);
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant1"), false, "tenant1 should be listed");
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant2"), true, "tenant2 should be listed");

                this.clock.tick(1000);
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant1"), false, "tenant1 should be listed");
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant2"), false, "tenant2 should be listed");
            }
        });

        this.testCase({
            name: 'check kill switch for this request only',
            test: () => {
                let killSwitch = createKillSwitch();

                QUnit.assert.equal(killSwitch.isTenantKilled("test-tenant"), false, "tenant should not be listed");

                let theRequest = killSwitch.setKillSwitchTenants("tenant1", "this-request-only");
                QUnit.assert.equal(theRequest.length, 1);
                QUnit.assert.equal(theRequest[0], "tenant1");

                QUnit.assert.equal(killSwitch.isTenantKilled("test-tenant"), false, "tenant should not be listed");
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant1"), false, "tenant should not be listed");
            }
        });

        this.testCase({
            name: 'check multiple tenants kill switch',
            test: () => {
                let killSwitch = createKillSwitch();

                QUnit.assert.equal(killSwitch.isTenantKilled("test-tenant"), false, "tenant should not be listed");

                let theRequest = killSwitch.setKillSwitchTenants("tenant1,tenant2", "1000");
                QUnit.assert.equal(theRequest.length, 0);

                QUnit.assert.equal(killSwitch.isTenantKilled("test-tenant"), false, "tenant should not be listed");
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant1"), true, "tenant1 should be listed");
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant2"), true, "tenant2 should be listed");
            }
        });

        this.testCase({
            name: 'check multiple tenants kill switch with expiry',
            useFakeTimers: true,
            test: () => {
                let killSwitch = createKillSwitch();

                let theRequest = killSwitch.setKillSwitchTenants("tenant1,tenant2", "1");
                QUnit.assert.equal(theRequest.length, 0);

                QUnit.assert.equal(killSwitch.isTenantKilled("tenant1"), true, "tenant1 should be listed");
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant2"), true, "tenant2 should be listed");
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant3"), false, "tenant3 should not be listed");

                theRequest = killSwitch.setKillSwitchTenants("tenant3", "3");
                QUnit.assert.equal(theRequest.length, 0);

                this.clock.tick(999);
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant1"), true, "tenant1 should be listed");
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant2"), true, "tenant2 should be listed");
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant3"), true, "tenant3 should be listed");

                this.clock.tick(1);
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant1"), false, "tenant1 should not be listed");
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant2"), false, "tenant2 should not be listed");
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant3"), true, "tenant3 should be listed");

                this.clock.tick(2000);
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant1"), false, "tenant1 should not be listed");
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant2"), false, "tenant2 should not be listed");
                QUnit.assert.equal(killSwitch.isTenantKilled("tenant3"), false, "tenant3 should not be listed");
            }
        });

        this.testCase({
            name: 'check whitespace kill switch',
            test: () => {
                let killSwitch = createKillSwitch();

                let tenant1Checks: string[] = [
                    "tenant1",
                    "tenant1 ",
                    " tenant1",
                    " tenant1 ",
                    "tenant1\r",
                    "tenant1\n",
                    "tenant1\r\n",
                    "\rtenant1",
                    "\r\ntenant1",
                    "\rtenant1\r\n",
                    "\r\ntenant1\r\n"
                ];

                let tenant2Checks: string[] = [
                    "tenant2",
                    "tenant2 ",
                    " tenant2",
                    " tenant2 ",
                    "tenant2\r",
                    "tenant2\n",
                    "tenant2\r\n",
                    "\rtenant2",
                    "\r\ntenant2",
                    "\rtenant2\r\n",
                    "\r\ntenant2\r\n"
                ];

                tenant1Checks.forEach((tenant1) => {
                    let killSwitch = createKillSwitch();
                    let theRequest = killSwitch.setKillSwitchTenants(tenant1, "1000");
                    QUnit.assert.equal(theRequest.length, 0);
    
                    tenant2Checks.forEach((tenant2) => {
                        theRequest = killSwitch.setKillSwitchTenants(tenant2, "1000");
                        QUnit.assert.equal(theRequest.length, 0);
        
                        tenant1Checks.forEach((value) => {
                            QUnit.assert.equal(killSwitch.isTenantKilled(value), true, "tenant1 should be listed from [" + tenant1 + "] with [" + value + "]");
                        });
        
                        tenant2Checks.forEach((value) => {
                            QUnit.assert.equal(killSwitch.isTenantKilled(value), true, "tenant2 should be listed from [" + tenant2 + "] with [" + value + "]");
                        });
                    });
                });
            }
        });

        this.testCase({
            name: 'check whitespace kill switch for this request only',
            test: () => {
                let tenant1Values: string[] = [
                    "tenant1 ", " tenant1", " tenant1 ", "a, tenant1\n,b", "\rtenant1\r", " tenant1\n,", "\n tenant1 ,a"
                ];

                tenant1Values.forEach((value) => {
                    let killSwitch = createKillSwitch();

                    let theRequest = killSwitch.setKillSwitchTenants(value, "this-request-only");
                    let found = false;
                    theRequest.forEach((tenant) => {
                        if (tenant === "tenant1") {
                            found = true;
                        }
                    });

                    QUnit.assert.equal(found, true, "Expected tenant1 in [" + value + "]");
                });
            }
        });
    }
}
