// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { EventPersistence } from "@microsoft/applicationinsights-common";
import {
    INotificationManager, IPayloadData, IProcessTelemetryContext, IXHROverride, createEnumStyle
} from "@microsoft/applicationinsights-core-js";
import { IPromise } from "@nevware21/ts-async";

/**
 * Identifies the Storage Providers used by the LocalStorageChannel
 */
export const enum eStorageProviders {
    /**
     * Identifies that the provider that uses (window||globalThis||self).localStorage
     */
    LocalStorage = 1,

    /**
     * Identifies that the provider that uses (window||globalThis||self).sessionStorage
     */
    SessionStorage = 2,

    /**
     * Identifies that the provider that uses (window||globalThis||self).indexedDB
     */
    IndexedDb = 3
}

export const StorageProviders = createEnumStyle<typeof eStorageProviders>({
    LocalStorage: eStorageProviders.LocalStorage,
    SessionStorage: eStorageProviders.SessionStorage,
    IndexedDb: eStorageProviders.IndexedDb
});
export type StorageProviders = number | eStorageProviders;

/**
 * The IOfflineChannelConfiguration interface defines the configuration options for offline channel,
 * supports offline events storage, retrieval and re-sending.
 */
export interface IOfflineChannelConfiguration {
    /**
     * [Optional] The max size in bytes that should be used for storing events(default up to 5 Mb) in local/session storage.
     * The maximum size in bytes that should be used for storing events in storage If not specified, the system will use up to 5 MB
     * @default 5000000
     */
    maxStorageSizeInBytes?: number;

    /**
     * [Optional] The storage key prefix that should be used when storing events in persistent storage.
     * @default AIOffline
     */
    storageKeyPrefix?: string;

    /**
     * [Optional] Identifies the minimum level that will be cached in the offline channel. Valid values of this
     * setting are defined by the EventPersistence enum, currently Normal (1) and Critical (2) with the default
     * value being Normal (1), which means all events without a persistence level set or with invalid persistence level will be marked as Normal(1) events.
     * @default 1
     */
    minPersistenceLevel?: number | EventPersistence;

    /**
     * [Optional] Identifies the StorageProviders that should be used by the system if available, the first available
     * provider will be used. Valid available values are defined by the eStorageProviders enum. Only the first 5 entries
     * are processed, so if this value contains more than 5 elements they will be ignored.
     * Note: LocalStorage will be used to save unload events even if it is not in the providers list
     * Default order is [StorageProviders.LocalStorage, StorageProviders.IndexedDB]
     */
    providers?: number[] | eStorageProviders[];

    /**
     * [Optional] The IndexedDb database name that should be used when storing events using (window||globalThis||self).indexedDb.
     */
    indexedDbName?: string;

    /**
     * [Optional] Identifies the maximum number of events to store in each memory batch before sending to persistent storage.
     * For versions > 3.3.2, new config  splitEvts is added
     * If splitEvts is set true, eventsLimitInMem will be applied to each persistent level batch
     */
    eventsLimitInMem?: number;

    /**
     * [Optional] Identifies if events that have existed in storage longer than the maximum allowed time (configured in inStorageMaxTime) should be cleaned after connection with storage.
     * If not provided, default is false
     */
    autoClean?: boolean;

    /**
     * [Optional] Identifies the maximum time in ms that items should be in memory before being saved into storage.

     * @default 15000
     */
    inMemoMaxTime?: number;

    /**
     * [Optional] Identifies the maximum time in ms that items should be in persistent storage.
     * default: 10080000 (around 2.8 hours) for versions <= 3.3.0
     * default: 604800000 (around 7days) for versions > 3.3.0
     */
    inStorageMaxTime?: number;

    /**
     * [Optional] Identifies the maximum retry times for an event batch.
     * default: 1
     */
    maxRetry?: number;

    /**
     * Identifies online channel IDs in order. The first available one will be used.
     * default is [AppInsightsChannelPlugin, PostChannel]
     */
    primaryOnlineChannelId?: string[];

    /**
     * Identifies the maximum size per batch in bytes that is saved in persistent storage.
     * default 63000
     */
    maxBatchsize?: number;

    /**
     * Identifies offline sender properties. If not defined, settings will be the same as the online channel configured in primaryOnlineChannelId.
     */
    senderCfg?: IOfflineSenderConfig;

    /**
     * Identifies the interval time in ms that previously stored offline event batches should be sent under online status.
     * default 15000
     */
    maxSentBatchInterval?: number;

    /**
     * Identifies the maximum event batch count when cleaning or releasing space for persistent storage per time.
     * default 10
     */
    EventsToDropPerTime?: number;

    /**
     * Identifies the maximum critical events count for an event batch to be able to drop when releasing space for persistent storage per time.
     * default 2
     */
    maxCriticalEvtsDropCnt?: number;

    /**
    * Identifies overridden for the Instrumentation key when the offline channel calls processTelemetry.
    */
    overrideInstrumentationKey?: string;

    /**
     * Identifies when saving events into the persistent storage, events will be batched and saved separately based on persistence level
     * this is useful to help reduce the loss of critical events during cleaning process
     * but it will result in more frequest storage implementations.
     * If it is set to false, all events will be saved into single in memory batch
     * Default: false
     */
    splitEvts?: boolean;

    //TODO: add do sampling
   
}

export interface IOfflineSenderConfig {

    /**
     * Identifies status codes for re-sending event batches
     * Default: [401, 403, 408, 429, 500, 502, 503, 504]
     */
    retryCodes?: number[];

    /**
     * [Optional] Either an array or single value identifying the requested TransportType type(s) that should be used for sending events
     * If not defined, the same transports will be used in the channel with the primaryOnlineChannelId
     */
    transports?: number | number[];

    /**
     * [Optional] The HTTP override that should be used to send requests, as an IXHROverride object.
     */
    httpXHROverride?: IXHROverride;

    /**
     * Identifies if provided httpXhrOverride will always be used
     * default false
     */
    alwaysUseXhrOverride?: boolean;
}

/**
 * An internal interface which defines web provider Storage JSON details
 */
export interface IStorageJSON {
    
    /**
     * The timestamp at which the storage was last accessed.
     */
    lastAccessTime?: number;
    evts?: { [id: string]: IStorageTelemetryItem }; // id is the timestamp value
}

/**
 * An internal interface which defines a common storage item
 */
export interface IStorageTelemetryItem extends IPayloadData {
    id?: string;
    iKey?: string;
    sync?: boolean;
    criticalCnt?: number;
    isArr?: boolean;
    attempCnt?: number;
}


/**
 * An internal interface which defines a common provider context that is used to pass multiple values when initializing provider instances
 */
export interface ILocalStorageProviderContext {
    /**
     * Identifies the context for the current event
     */
    itemCtx?: IProcessTelemetryContext;

    /**
     * Identifies the local storage config that should be used to initialize the provider
     */
    storageConfig: IOfflineChannelConfiguration;

    /**
     * Identifies the unique identifier to be used for this provider instance, when not provided a new Guid will be generated for this instance.
     * This value must be unique across all instances to avoid polluting events between browser / tabs instances as they may share the same persistent storage.
     * The primary use case for setting this value is for unit testing.
     */
    id?: string;

    /**
     * Identifies endpoint url.
     */
    endpoint?: string;

    /**
     * Identifies Notification Manager
     */
    notificationMgr?: INotificationManager;
}

/*
 * An internal interface to provide access to different local storage options
 */
export interface IOfflineProvider {
    /**
     * Initializes the provider using the config
     * @param providerContext The provider context that should be used to initialize the provider
     * @returns True if the provider is initialized and available for use otherwise false
     */
    initialize(providerContext: ILocalStorageProviderContext): boolean;

    /**
     * Identifies whether this storage provider support synchronious requests
    */
    supportsSyncRequests(): boolean;

    /**
     * Stores the value into the storage using the specified key.
     * @param key - The key value to use for the value
     * @param evt - The actual event of the request
     * @param itemCtx - This is the context for the current request, ITelemetryPlugin instances
     * can optionally use this to access the current core instance or define / pass additional information
     * to later plugins (vs appending items to the telemetry item)
     * @returns Either the added element (for synchronous operation) or a Promise for an asynchronous processing
     */
    addEvent(key: string, evt: IStorageTelemetryItem, itemCtx: IProcessTelemetryContext): IStorageTelemetryItem | IPromise<IStorageTelemetryItem> | null;

    /**
     * Get Next batch from the storage
     */
     getNextBatch(): IStorageTelemetryItem[] | IPromise< IStorageTelemetryItem[]> | null;

     /**
     * Get all stored batches from the storage.
     * @param cnt batch numbers if it is defined, it will returns given number of batches.
     * if cnt is not defined, it will return all available batches
     */
     getAllEvents(cnt?: number): IStorageTelemetryItem[] | IPromise< IStorageTelemetryItem[]> | null;
   
    /**
     * Removes the value associated with the provided key
     * @param evts - The events to be removed
     * @returns Either the removed item array (for synchronous operation) or a Promise for an asynchronous processing
     */
    removeEvents(evts: IStorageTelemetryItem[]): IStorageTelemetryItem[] | IPromise<IStorageTelemetryItem[]> | null;

    /**
     * Removes all entries from the storage provider, if there are any.
     * @returns Either the removed item array (for synchronous operation) or a Promise for an asynchronous processing
     */
    clear(): IStorageTelemetryItem[] | IPromise<IStorageTelemetryItem[]> | null;

    /**
     * Removes all entries with stroage time longer than inStorageMaxTime from the storage provider
     */
    clean(disable?: boolean): boolean | IPromise<boolean>;

    /**
     * Shuts-down the telemetry plugin. This is usually called when telemetry is shut down.
     */
    teardown(): void;
}
