import { OfflineIndexedDBTests } from "./IndexedDB.tests";
import { OfflineWebProviderTests } from "./webprovider.tests";
import { OfflineDbProviderTests } from "./dbprovider.tests"
import { OfflineInMemoryBatchTests } from "./inmemorybatch.tests";
import { OfflineBatchHandlerTests } from "./offlinebatchhandler.tests";
import { ChannelTests } from "./channel.tests";
import { Offlinetimer } from "./offlinetimer.tests";
import { GlobalTestHooks } from "./GlobalTestHooks.Test";

export function runTests() {
    new GlobalTestHooks().registerTests();
    new OfflineIndexedDBTests().registerTests();
    new OfflineWebProviderTests().registerTests();
    new OfflineDbProviderTests().registerTests();
    new OfflineInMemoryBatchTests().registerTests();
    new OfflineBatchHandlerTests().registerTests();
    new ChannelTests().registerTests();
    new Offlinetimer().registerTests();
}