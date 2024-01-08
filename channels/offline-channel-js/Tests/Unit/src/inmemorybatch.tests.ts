import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import {IPostTransmissionTelemetryItem} from "../../../src/Interfaces/IInMemoryBatch";
import { InMemoryBatch } from "../../../src/InMemoryBatch";
import { DiagnosticLogger, IDiagnosticLogger } from "@microsoft/applicationinsights-core-js";

export class OfflineInMemoryBatchTests extends AITestClass {
    private _logger: IDiagnosticLogger;

    public testInitialize() {
        super.testInitialize();
        this._logger = new DiagnosticLogger();
        
    }

    public testCleanup() {
        super.testCleanup();
        this._logger = null as any;
       
    }

    public registerTests() {

        this.testCase({
            name: "Init: Init should contain expected events",
            test: () => {
                let endpoint = "testEndpoint";
                let inMemoBatch = new InMemoryBatch(this._logger, endpoint);
                let evts = inMemoBatch.getItems();
                Assert.deepEqual(evts, [], "should have no events");
                let isSent = inMemoBatch["_getDbgPlgTargets"]()[0];
                Assert.ok(!isSent, "error message should not be sent");

                let mockEvt = mockPostTransmissionTelemetryItem();
                let evtArr = [mockEvt, mockEvt, mockEvt, mockEvt, mockEvt, mockEvt];
                inMemoBatch = new InMemoryBatch(this._logger, endpoint, evtArr);
                evts = inMemoBatch.getItems();
                Assert.deepEqual(evts.length, 6, "should have 6 events");
            }
            
        });


        this.testCase({
            name: "Add Event: Add Event with expected event limit ",
            test: () => {
                let endpoint = "testEndpoint";
                let inMemoBatch = new InMemoryBatch(this._logger, endpoint, undefined, 2);
                let evts = inMemoBatch.getItems();
                Assert.deepEqual(evts, [], "should have no events");

                let mockEvt = mockPostTransmissionTelemetryItem();
                inMemoBatch.addEvent(mockEvt);
                inMemoBatch.addEvent(mockEvt);

                evts = inMemoBatch.getItems();
                Assert.deepEqual(evts.length, 2, "should have 2 events");
               
                inMemoBatch.addEvent(mockEvt);

               
                let isSent = inMemoBatch["_getDbgPlgTargets"]()[0];
                Assert.ok(isSent, "error message should be sent");
                

                evts = inMemoBatch.getItems();
                Assert.deepEqual(evts.length, 2, "should have 2 events test1");

                inMemoBatch.clear();
                isSent = inMemoBatch["_getDbgPlgTargets"]()[0];
                Assert.ok(!isSent, "error message should be reset");
                evts = inMemoBatch.getItems();
                Assert.deepEqual(evts.length, 0, "should clear events");

            }
            
        });
       
    }
}

function mockPostTransmissionTelemetryItem(): IPostTransmissionTelemetryItem {
    let evt = {
        ver: "testVer",
        name:"testName",
        time: "testTime",
        iKey:"testKey",
        sendAttempt: 1,
        baseData: {pro1: "prop1"}

    } as IPostTransmissionTelemetryItem;
    return evt;
}