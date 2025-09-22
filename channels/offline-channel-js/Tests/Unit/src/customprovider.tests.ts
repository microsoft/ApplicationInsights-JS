import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import dynamicProto from "@microsoft/dynamicproto-js";
import { AppInsightsCore, arrForEach, createDynamicConfig, getJSON, IConfiguration, IProcessTelemetryContext, newGuid, objForEachKey } from "@microsoft/applicationinsights-core-js";
import { OfflineBatchHandler } from "../../../src/OfflineBatchHandler";
import { ILocalStorageProviderContext, IOfflineChannelConfiguration, IOfflineProvider, eStorageProviders } from "../../../src/Interfaces/IOfflineProvider";
import { getTimeId } from "../../../src/Helpers/Utils";
import { DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, IConfig } from "@microsoft/applicationinsights-common";
import { mockTelemetryItem, TestChannel } from "./TestHelper";
import { OfflineChannel } from "../../../src/OfflineChannel";


export class OfflineCustomProviderTests extends AITestClass {
    private syncStorage: any;
    private core: AppInsightsCore;
    private coreConfig: IConfig & IConfiguration;
  

    public testInitialize() {
        super.testInitialize();
        this.syncStorage = {};
        let channel = new TestChannel();
        this.coreConfig = {
            instrumentationKey: "testIkey",
            endpointUrl: "https://testurl.com"
        };
        this.core = new AppInsightsCore();
        this.core.initialize(this.coreConfig, [channel]);
    }

    public testCleanup() {
        super.testCleanup();
        AITestClass.orgLocalStorage.clear();
        this.onDone(() => {
            this.core.unload();
        });
        this.core = null as any;
        this.coreConfig = null as any;
        this.syncStorage = null;
    }

    public registerTests() {

        this.testCase({
            name: "OfflineChannel: should initialize successfully with custom provider",
            useFakeTimers: true,
            test: () => {
                // Arrange
                let mockCustomProvider = this._createMockProvider(true, true, true);
                let channel = new OfflineChannel();
                let sendChannel = new TestChannel();
                let core = new AppInsightsCore();
                
                this.coreConfig.extensionConfig = {
                    ["OfflineChannel"]: {
                        customProvider: mockCustomProvider,
                        providers: [eStorageProviders.LocalStorage],
                        inMemoMaxTime: 2000
                    } as IOfflineChannelConfiguration
                };

                core.initialize(this.coreConfig, [sendChannel, channel]);

                // Act
                this.clock.tick(1);

                let offlineListener = channel.getOfflineListener();
               
                offlineListener && offlineListener.setOnlineState(2); // Set offline
                
                
                
                let evt = mockTelemetryItem();
                channel.processTelemetry(evt);
                
                this.clock.tick(2100); // Wait for storage
                
                // Verify event was stored using custom provider
                Assert.ok(this.syncStorage, "Custom provider should have used syncStorage");
                let storageKeys = Object.keys(this.syncStorage);
                Assert.ok(storageKeys.length > 0, "Should have stored data in custom provider");
                
                channel.teardown();
                core.unload();
            }
        });

        this.testCase({
            name: "initProvider: with custom provider(supports sync) and unload(supports sync) provider provided",
            test: () => {
                // Arrange
                let mockCustomProvider = this._createMockProvider(true, true);
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg as IOfflineChannelConfiguration;
                storageConfig.customProvider = mockCustomProvider;
                storageConfig.customUnloadProvider = mockCustomProvider;
                let providerContext = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint:DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH
                }
                let handler = new OfflineBatchHandler();

                // Act
                let initialized = handler.initialize(providerContext);

                // Assert
                Assert.ok(initialized, "Handler should be initialized");
                let targets = handler["_getDbgPlgTargets"]();
                Assert.equal(targets[0], mockCustomProvider, "Custom provider should be used as main provider");
                Assert.equal(targets[2], mockCustomProvider, "Custom provider should be used as unload provider when it supports sync");
            }
        });


        this.testCase({
            name: "initProvider: with custom provider(supports sync) and no unload provider provided",
            test: () => {
                // Arrange
                let mockCustomProvider = this._createMockProvider(true, true);
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg as IOfflineChannelConfiguration;
                storageConfig.customProvider = mockCustomProvider;
                // No customUnloadProvider specified
                let providerContext = {
                    itemCtx: itemCtx,
                    storageConfig: storageConfig,
                    endpoint: DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH
                };
                let handler = new OfflineBatchHandler();

                // Act
                let initialized = handler.initialize(providerContext);

                // Assert
                Assert.ok(initialized, "Handler should be initialized");
                let targets = handler["_getDbgPlgTargets"]();
                Assert.equal(targets[0], mockCustomProvider, "Custom provider should be used as main provider");
                Assert.equal(targets[2], mockCustomProvider, "Custom provider should be used as unload provider when it supports sync and no unload provider specified");
            }
        });

        this.testCase({
            name: "initProvider: with custom provider(no sync support) and custom unload provider(supports sync)",
            test: () => {
                // Arrange
                let mockMainProvider = this._createMockProvider(true, false); // No sync support
                let mockUnloadProvider = this._createMockProvider(true, true); // Supports sync
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg as IOfflineChannelConfiguration;
                storageConfig.customProvider = mockMainProvider;
                storageConfig.customUnloadProvider = mockUnloadProvider;
                let providerContext = {
                    itemCtx: itemCtx,
                    storageConfig: storageConfig,
                    endpoint: DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH
                };
                let handler = new OfflineBatchHandler();

                // Act
                let initialized = handler.initialize(providerContext);

                // Assert
                Assert.ok(initialized, "Handler should be initialized");
                let targets = handler["_getDbgPlgTargets"]();
                Assert.equal(targets[0], mockMainProvider, "Custom provider should be used as main provider");
                Assert.equal(targets[2], mockUnloadProvider, "Custom unload provider should be used as unload provider");
                Assert.notEqual(targets[0], targets[2], "Main and unload providers should be different");
            }
        });

        this.testCase({
            name: "initProvider: with custom provider(no sync support) and no unload provider provided",
            test: () => {
                // Arrange
                let mockCustomProvider = this._createMockProvider(true, false); // No sync support
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg as IOfflineChannelConfiguration;
                storageConfig.customProvider = mockCustomProvider;
                storageConfig.providers = [eStorageProviders.LocalStorage]; // Fallback for unload
                // No customUnloadProvider specified
                let providerContext = {
                    itemCtx: itemCtx,
                    storageConfig: storageConfig,
                    endpoint: DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH
                };
                let handler = new OfflineBatchHandler();

                // Act
                let initialized = handler.initialize(providerContext);

                // Assert
                Assert.ok(initialized, "Handler should be initialized");
                let targets = handler["_getDbgPlgTargets"]();
                Assert.equal(targets[0], mockCustomProvider, "Custom provider should be used as main provider");
                Assert.notEqual(targets[2], mockCustomProvider, "Should not use custom provider as unload provider when it doesn't support sync");
                Assert.ok(targets[2], "Should have fallback unload provider");
            }
        });

        this.testCase({
            name: "initProvider: with custom provider initialization failure and fallback providers",
            test: () => {
                // Arrange
                let mockCustomProvider = this._createMockProvider(false, true); // Fails initialization
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg as IOfflineChannelConfiguration;
                storageConfig.customProvider = mockCustomProvider;
                storageConfig.providers = [eStorageProviders.LocalStorage];
                let providerContext = {
                    itemCtx: itemCtx,
                    storageConfig: storageConfig,
                    endpoint: DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH
                };
                let handler = new OfflineBatchHandler();

                // Act
                let initialized = handler.initialize(providerContext);

                // Assert
                Assert.ok(initialized, "Handler should be initialized with fallback provider");
                let targets = handler["_getDbgPlgTargets"]();
                Assert.notEqual(targets[0], mockCustomProvider, "Should not use failed custom provider");
                Assert.ok(targets[0], "Should have fallback main provider");
            }
        });


        this.testCase({
            name: "initProvider: with custom provider and storage operations",
            test: () => {
                // Arrange
                let mockCustomProvider = this._createMockProvider(true, true, true); // Full provider
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg as IOfflineChannelConfiguration;
                storageConfig.customProvider = mockCustomProvider;
                let providerContext = {
                    itemCtx: itemCtx,
                    storageConfig: storageConfig,
                    endpoint: DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH
                };
                let handler = new OfflineBatchHandler();

                // Act
                let initialized = handler.initialize(providerContext);

                // Assert - Test basic operations
                Assert.ok(initialized, "Handler should be initialized");
                let targets = handler["_getDbgPlgTargets"]();
                Assert.equal(targets[0], mockCustomProvider, "Should use custom provider");

                // Test storage operations

                let testEvent  = {
                    urlString: "testcustomprovider",
                    data: '[{"name":"test1","prop":{"prop1":"prop1"}},{"name":"test1","prop":{"prop1":"prop1"}}]',
                    headers: {
                        "header1": "header1val",
                        "header2": "header2val"
                    },
                    disableXhrSync: false,
                    disableFetchKeepAlive: false,
                    sendReason: 1,
                    id: newGuid(),
                    iKey: "testIKey",
                    criticalCnt: 1
                }
                let addResult = mockCustomProvider.addEvent("testKey", testEvent, itemCtx);
                Assert.ok(addResult, "Should successfully add event to custom provider");

                let retrievedEvents = mockCustomProvider.getAllEvents() as any;
                Assert.ok(retrievedEvents && retrievedEvents.length > 0, "Should retrieve stored events from custom provider");

                let batchEvents = mockCustomProvider.getNextBatch();
                Assert.ok(batchEvents, "Should get next batch from custom provider");

                let removeResult = mockCustomProvider.removeEvents([testEvent]);
                Assert.ok(removeResult, "Should remove events from custom provider");
            }
        });

        

    
    }

    private _createMockProvider(shouldInitialize: boolean, supportsSyncRequests: boolean, full?: boolean): IOfflineProvider {
        let mockProvider = new MockNoopProvider(shouldInitialize, supportsSyncRequests);
        if (!!full) {
            mockProvider = new MockFullStorageProvider(this.syncStorage);
        }
        return mockProvider;
    }

}

// Mock Storage Provider for testing - mimics WebStorageProvider but uses syncStorage instead of browser storage

class MockFullStorageProvider implements IOfflineProvider {
    public id: string;

    /**
     * Creates a MockStorageProvider using syncStorage for testing
     * @param syncStorage - The sync storage object to use for storing data
     * @param id - Optional identifier for the provider
     */
    constructor(syncStorage: any, id?: string) {
        dynamicProto(MockFullStorageProvider, this, (_this) => {
            let _storage: any = null;
            let _storageKeyPrefix: string = "AIOffline";
            let _maxStorageSizeInBytes: number = 5000000;
            let _storageKey: string;
            let _endpoint: string ;
            let _maxStorageTime: number = 604800000; // 7 days

            _this.id = id || "mock-provider";

            // Use the provided syncStorage instead of browser storage
            _storage = syncStorage;

            _this["_getDbgPlgTargets"] = () => {
                return [_storageKey, _maxStorageSizeInBytes, _maxStorageTime];
            };

            _this.initialize = (providerContext: ILocalStorageProviderContext, endpointUrl?: string) => {
                if (!_storage) {
                    return false;
                }

                let storageConfig = providerContext.storageConfig;
                _endpoint = endpointUrl || providerContext.endpoint || "test-endpoint";

                _maxStorageSizeInBytes = storageConfig.maxStorageSizeInBytes || 5000000;
                _maxStorageTime = storageConfig.inStorageMaxTime || 604800000;
                _storageKeyPrefix = storageConfig.storageKeyPrefix || "AIOffline";
                _storageKey = _storageKeyPrefix + "_1_" + _endpoint;

                return true;
            };

            /**
             * Identifies whether this storage provider support synchronous requests
             */
            _this.supportsSyncRequests = () => {
                return true;
            };

            /**
             * Get all of the currently cached events from the storage mechanism
             */
            _this.getAllEvents = (cnt?: number) => {
                try {
                    if (!_storage) {
                        return null;
                    }
                    return _getEvts(cnt);
                } catch (e) {
                    return null;
                }
            };

            /**
             * Get Next cached event from the storage mechanism
             */
            _this.getNextBatch = () => {
                try {
                    if (!_storage) {
                        return null;
                    }
                    // set ordered to true, to make sure to get earliest events first
                    return _getEvts(1);
                } catch (e) {
                    return null;
                }
            };

            function _getEvts(cnt?: number) {
                let allItems:any[] = [];
                let theStore = _fetchStoredDb(_storageKey).db;
                if (theStore) {
                    let events = theStore.evts;
                    objForEachKey(events, (evt) => {
                        if (evt) {
                            allItems.push(evt);
                        }
                        if (cnt && allItems && allItems.length === cnt) {
                            return;
                        }

                    });
                }
                return allItems;
            }

            /**
             * Stores the value into the storage using the specified key.
             * @param key - The key value to use for the value
             * @param evt - The actual event of the request
             * @param itemCtx - This is the context for the current request
             */
            _this.addEvent = (key: string, evt: any, itemCtx: IProcessTelemetryContext) => {
                try {
                    let theStore = _fetchStoredDb(_storageKey);
                    evt.id = evt.id || getTimeId();
                    evt.criticalCnt = evt.criticalCnt || 0;
                    let events = theStore.db.evts;
                    let id = evt.id;

                    events[id] = evt;
                    if (_updateStoredDb(theStore)) {
                        // Database successfully updated
                        return evt;
                    }

                    return null;
                    
                } catch (e) {
                    return null;
                }
            };

            /**
             * Removes the value associated with the provided key
             * @param evts - The events to be removed
             */
            _this.removeEvents = (evts: any[]) => {
                try {
                    let theStore = _fetchStoredDb(_storageKey, false);
                    let currentDb = theStore.db;
                    if (currentDb) {
                        let events = currentDb.evts;
                        try {
                            arrForEach(events, (evt) => {
                                delete events[evt.id];

                            });
                            // Update takes care of removing the DB if it's completely empty now
                            if (_updateStoredDb(theStore)) {
                                return evts;
                            }
                        } catch (e) {
                            // Storage corrupted
                        }

                        // failure here so try and remove db to unblock following events
                        evts = _clearDatabase(theStore.key);
                    }

                    return evts;
                } catch (e) {
                    return evts || [];
                }
            };

            /**
             * Removes all entries from the storage provider for the current endpoint and returns them as part of the response, if there are any.
             */
            _this.clear = () => {
                try {
                    let removedItems: any[] = [];
                    let theStore = _fetchStoredDb(_storageKey, false);
                    let storedDb = theStore.db;
                    if (storedDb) {
                        let events = storedDb.evts;
                        objForEachKey(events, (key) => {
                            let evt = events[key];
                            if (evt) {
                                delete events[evt.id];
                                removedItems.push(evt);
                            }

                        });
                        _updateStoredDb(theStore);
                    }

                    return removedItems;
                } catch (e) {
                    return [];
                }
            };

            _this.clean = () => {
                let storeDetails = _fetchStoredDb(_storageKey, false);
                let currentDb = storeDetails.db;
                if (currentDb) {
                    try {
                        syncStorage = {};
                        return true;
                    } catch (e) {
                        // should not throw errors here
                        // because we don't want to block following process
                    }
                    return false;
                }
            };

            /**
             * Shuts-down the telemetry plugin. This is usually called when telemetry is shut down.
             * This attempts to update the lastAccessTime for any storedDb
             */
            _this.teardown = () => {
                try {
                    let theStore = _fetchStoredDb(_storageKey, false);
                    let storedDb = theStore.db;
                    if (storedDb) {
                        // reset the last access time
                        storedDb.lastAccessTime = 0;
                        _updateStoredDb(theStore, false);
                    }
                } catch (e) {
                    // Add diagnostic logging
                }
            };

            /**
             * @ignore
             * Creates a new json store with the StorageJSON (may be null), a null db value indicates that the store
             * associated with the key is empty and should be removed.
             * @param dbKey - The key to associate with the database
             * @param db - The database
             */
            function _newStore(dbKey: string, db: any) {
                return {
                    key: dbKey,
                    db: db
                };
            }

            function _fetchStoredDb(dbKey: string, returnDefault?: boolean) {
                let dbToStore;
                if (_storage) {
                    let previousDb = _storage[dbKey];

                    if (previousDb) {
                        try {
                            dbToStore = getJSON().parse(previousDb);
                        } catch (e) {
                            // storage corrupted
                            delete _storage[dbKey];
                        }
                    }

                    if (returnDefault !== false && !dbToStore) {
                        // Create and return a default empty database
                        dbToStore = {
                            evts: {},
                            lastAccessTime: 0
                        };
                    }
                }

                return _newStore(dbKey, dbToStore);
            }

            function _updateStoredDb(jsonStore: any, updateLastAccessTime?: boolean) {
                let dbToStore = jsonStore.db;
                if (dbToStore) {
                    if (updateLastAccessTime !== false) {
                        // Update the last access time
                        dbToStore.lastAccessTime = (new Date()).getTime();
                    }
                }

                try {
                    let jsonString = getJSON().stringify(dbToStore);
                    if (jsonString.length > _maxStorageSizeInBytes) {
                        // We can't store the database as it would exceed the configured max size
                        return false;
                    }

                    _storage && (_storage[jsonStore.key] = jsonString);
                } catch (e) {
                    // catch exception due to trying to store or clear JSON
                    // We could not store the database
                    return false;
                }

                return true;
            }

            function _clearDatabase(dbKey: string) {
                let removedItems: any[] = [];
                let storeDetails = _fetchStoredDb(dbKey, false);
                let currentDb = storeDetails.db;
                if (currentDb) {
                    try {
                        let events = currentDb.evts;
                        objForEachKey(events, (key) => {
                            let evt = events[key];
                            if (evt) {
                                removedItems.push(evt);
                            }

                        });
                    } catch (e) {
                        // catch exception due to trying to store or clear JSON
                    }

                    // Remove the entire stored database
                    _storage && delete _storage[storeDetails.key];
                }

                return removedItems;
            }

        });
    }

    /**
     * Initializes the provider using the config
     * @param providerContext - The provider context that should be used to initialize the provider
     * @returns True if the provider is initialized and available for use otherwise false
     */
    public initialize(providerContext: ILocalStorageProviderContext): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * Identifies whether this storage provider support synchronous requests
     */
    public supportsSyncRequests(): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * Get all of the currently cached events from the storage mechanism
     */
    public getAllEvents(cnt?: number): any {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Get the Next one cached batch from the storage mechanism
     */
    public getNextBatch(): any {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Stores the value into the storage using the specified key.
     * @param key - The key value to use for the value
     * @param evt - The actual event of the request
     * @param itemCtx - This is the context for the current request
     */
    public addEvent(key: string, evt: any, itemCtx: IProcessTelemetryContext): any {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Removes the value associated with the provided key
     * @param evts - The events to be removed
     */
    public removeEvents(evts: any[]): any {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Removes all entries from the storage provider, if there are any.
     */
    public clear(): any {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Removes all entries with storage time longer than inStorageMaxTime from the storage provider
     */
    public clean(): any {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Shuts-down the telemetry plugin. This is usually called when telemetry is shut down.
     */
    public teardown(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}




/**
 * Mock Storage Provider for testing - mimics WebStorageProvider but uses syncStorage instead of browser storage
 */
export class MockNoopProvider implements IOfflineProvider {
    public id: string;

    /**
     * Creates a MockStorageProvider using syncStorage for testing
     * @param syncStorage - The sync storage object to use for storing data
     * @param id - Optional identifier for the provider
     */
    constructor(shouldInitialize: boolean, supportsSyncRequests: boolean) {
        dynamicProto(MockNoopProvider, this, (_this) => {

            _this.id = "mock-syncnoop-provider";

            _this.initialize = (providerContext: ILocalStorageProviderContext, endpointUrl?: string) => {
                return shouldInitialize;
            };

            _this.supportsSyncRequests = () => {
                return supportsSyncRequests;
            };

            _this.getAllEvents = (cnt?: number) => {
                return null;
            };

            _this.getNextBatch = () => {
                return null;
            };

            _this.removeEvents = (evts: any[]) => {
                return [];
            };

            _this.clear = () => {
                return [];
                
            };

            _this.clean = () => {
                return false;
            };

        
            _this.teardown = () => {
                // tear down no op
            };

        });
    }

    /**
     * Initializes the provider using the config
     * @param providerContext - The provider context that should be used to initialize the provider
     * @returns True if the provider is initialized and available for use otherwise false
     */
    public initialize(providerContext: ILocalStorageProviderContext): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * Identifies whether this storage provider support synchronous requests
     */
    public supportsSyncRequests(): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * Get all of the currently cached events from the storage mechanism
     */
    public getAllEvents(cnt?: number): any {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Get the Next one cached batch from the storage mechanism
     */
    public getNextBatch(): any {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Stores the value into the storage using the specified key.
     * @param key - The key value to use for the value
     * @param evt - The actual event of the request
     * @param itemCtx - This is the context for the current request
     */
    public addEvent(key: string, evt: any, itemCtx: IProcessTelemetryContext): any {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Removes the value associated with the provided key
     * @param evts - The events to be removed
     */
    public removeEvents(evts: any[]): any {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Removes all entries from the storage provider, if there are any.
     */
    public clear(): any {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Removes all entries with storage time longer than inStorageMaxTime from the storage provider
     */
    public clean(): any {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Shuts-down the telemetry plugin. This is usually called when telemetry is shut down.
     */
    public teardown(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}

