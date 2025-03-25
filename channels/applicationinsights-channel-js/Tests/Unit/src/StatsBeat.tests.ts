import { AITestClass } from "@microsoft/ai-test-framework";
import { AppInsightsCore } from "@microsoft/applicationinsights-core-js";
import { Sender } from "../../../src/Sender";

export class StatsbeatTests extends AITestClass {
    private _core: AppInsightsCore;
    private _sender: Sender;

    public testInitialize() {
        this._core = new AppInsightsCore();
        this._sender = new Sender();
    }

    public testFinishedCleanup() {
        if (this._sender && this._sender.isInitialized()) {
            this._sender.pause();
            this._sender._buffer.clear();
            this._sender.teardown();
        }
        this._sender = null;
        this._core = null;

    }

    public registerTests() {
        this.testCase({
            name: "Statsbeat initializes when disableStatsBeat is false",
            test: () => {
                let config = {
                    disableStatsBeat: false,
                    instrumentationKey: "Test-iKey"
                };

                // Initialize core with the configuration
                this._core.initialize(config, [this._sender]);

                // Get Statsbeat from core
                const statsbeat = this._core.getStatsBeat();

                // Assert that Statsbeat is initialized
                QUnit.assert.ok(statsbeat, "Statsbeat is initialized");
                QUnit.assert.ok(statsbeat.isInitialized(), "Statsbeat is marked as initialized");
            }
        });

        this.testCase({
            name: "Statsbeat dynamically updates when disableStatsBeat changes",
            useFakeTimers: true,
            test: () => {
                let config = {
                    disableStatsBeat: true,
                    instrumentationKey: "Test-iKey"
                };
    
                // Initialize core with the configuration
                this._core.initialize(config, [this._sender]);
    
                // Initially, Statsbeat should be null
                let statsbeat = this._core.getStatsBeat();
                QUnit.assert.ok(!statsbeat, "Statsbeat is null when disableStatsBeat is true");
    
                // Dynamically enable Statsbeat
                this._core.config.disableStatsBeat = false;
                this.clock.tick(1); // Simulate time passing for dynamic config update
    
                statsbeat = this._core.getStatsBeat();
                QUnit.assert.ok(statsbeat, "Statsbeat is initialized after enabling disableStatsBeat");
                QUnit.assert.ok(statsbeat.isInitialized(), "Statsbeat is marked as initialized after enabling disableStatsBeat");
    
                // Dynamically disable Statsbeat again
                this._core.config.disableStatsBeat = true;
                this.clock.tick(1); // Simulate time passing for dynamic config update
    
                statsbeat = this._core.getStatsBeat();
                QUnit.assert.ok(!statsbeat, "Statsbeat is null after disabling disableStatsBeat again");
            }
        });
    }
}