import { IPayloadData, IProcessTelemetryContext } from "@microsoft/applicationinsights-core-js";
import { IPromise } from "@nevware21/ts-async";
import { ISenderConfig } from "./ISender";

/**
 * Identifies the Storage Providers used by the LocalStorageChannel
 */
export enum eStorageProviders {
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

/**
 * The ILocalStorageConfiguration interface holds the configuration details passed to LocalStorage plugin.
 */
export interface ILocalStorageConfiguration {
    /**
     * [Optional] The max size in bytes that should be used in (window||globalThis||self).localstorage for storing events(up to 5 Mb).
     * If not passed, we will use up to 5 Mb.
     */
    maxStorageSizeInBytes?: number;

    /**
     * [Optional] The storage key that should be used when storing events in (window||globalThis||self).localStorage.
     */
    storageKeyPrefix?: string;

    /**
     * [Optional] Identifies the minimum level that will be cached in the local storage channel, any events that do not
     * meet this persistence level will only be cached in memory in the output (Post) channel. Valid values of this
     * setting are defined by the EventPersistence enum, currently Normal (1) and Critical (2) with the default
     * value being Normal (1) which means all events.
     */
    minPersistenceLevel?: number;

    /**
     * [Optional] Identifies the StorageProviders that should be used by the system if available, the first available
     * provider will be used. Valid available values are defined by the StorageProviders enum. Only the first 5 entries
     * are processed, so if this value contains more than 5 elements they will be ignored.
     * Default Order is [StorageProviders.LocalStorage, StorageProviders.IndexedDB]
     */
    providers?: number[] | eStorageProviders[];

    /**
     * [Optional] The IndexedDb database name that should be used when storing events using (window||globalThis||self).indexedDb.
     */
    indexedDbName?: string;

    /**
     * [Optional] Identifies the maximum number of events to store in memory before sending to persistent storage.
     * If not provided, default is 5Mb/ 5000000 bytes
     */
    eventsLimitInMem?: number;
    /**
     * [Optional] Identifies if should clean the previous events when opeining a new storage.
     * If not provided, default is false
     */
    autoClean?: boolean;
    // /**
    //  * [Optional] Identifies max size for sendng payload each time.
    //  * If not provided, default is 5Mb/ 5000000 bytes
    //  */
    // maxSentInBytes?: number;

    inMemoMaxTime?: number;
    inStorageMaxTime?: number;
    maxRetry?: number;
    // TODO: figure out offline sender config
    // if "channel" is provided, we looking for plugin(id).cfg
    // if not, we set default to sender/post(assume it is passed in)
    senderId?: string;
    maxBatchsize?: number;
    // if not defined, will use the value from online sender
    senderCfg?: IOfflineSenderConfig;
    maxSentBatchInterval?: number;
    EventsToDropPerTime?: number; //default 10
    maxCriticalEvtsDropCnt?: number; //default 2
}

export interface IOfflineSenderConfig extends ISenderConfig {
    retryCodes?: number[];
    primaryOnlineChannelId?: string;
}


export interface IStorageJSON {
    
    /**
     * The timestamp at which the storage was last accessed.
     */
    lastAccessTime?: number;
    evts?: { [id: string]: IStorageTelemetryItem }; // id is the timestamp value
}


/**
 * The EventPersistence contains a set of values that specify the event's persistence.
 */
export declare const enum eEventPersistenceValue {
    /**
     * Normal persistence.
     */
    Normal = 1,
    /**
     * Critical persistence.
     */
    Critical = 2
}

export interface IStorageTelemetryItem extends IPayloadData {
    /**
     * The storage id of the telemetry item that has been attempted to be sent.
     */
    id?: string;
    iKey?: string;
    sync?: boolean;
    criticalCnt?: number;
    isArr?: boolean;
    attempCnt?: number;
}


export interface IInternalPayloadData extends IPayloadData {
    /**
     * The storage id of the telemetry item that has been attempted to be sent.
     */
    id?: string;
    persistence?: number | eEventPersistenceValue;
    iKey?: string;
    attempt?: number;
    isArr?: boolean;
    criticalCnt?: number;
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
    storageConfig: ILocalStorageConfiguration;

    /**
     * Identifies the unique identifier to be used for this provider instance, when not provided a new Guid will be generated for this instance.
     * This value must be unique across all instances to avoid polluting events between browser / tabs instances as they may share the same persistent storage.
     * The primary use case for setting this value is for unit testing.
     */
    id?: string;
    endpoint?: string;
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
     * @return Either the added element (for synchronous operation) or a Promise for an asynchronous processing
     */
    addEvent(key: string, evt: IStorageTelemetryItem, itemCtx: IProcessTelemetryContext): IStorageTelemetryItem | IPromise<IStorageTelemetryItem> | null;

    /**
     * Get Next batch from the storage
     */
     getNextBatch(): IStorageTelemetryItem[] | IPromise< IStorageTelemetryItem[]> | null;

     /**
     * Get all stored batches from the storage.
     * @param cnt batch numbers if it is defined, it will returns given number of batches.
     * if cnt is not defined, it will only return all availble batch
     */
     getAllEvents(cnt?: number): IStorageTelemetryItem[] | IPromise< IStorageTelemetryItem[]> | null;
   
    /**
     * Removes the value associated with the provided key
     * @param evts - The events to be removed
     * @return Either the removed item array (for synchronous operation) or a Promise for an asynchronous processing
     */
    removeEvents(evts: IStorageTelemetryItem[]): IStorageTelemetryItem[] | IPromise<IStorageTelemetryItem[]> | null;

    /**
     * Removes all entries from the storage provider, if there are any.
     * @return Either the removed item array (for synchronous operation) or a Promise for an asynchronous processing
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
