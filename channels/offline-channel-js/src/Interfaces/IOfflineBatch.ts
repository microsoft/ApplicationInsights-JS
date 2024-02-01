// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOfflineListener } from "@microsoft/applicationinsights-common";
import {
    IPayloadData, IProcessTelemetryUnloadContext, ITelemetryUnloadState, IXHROverride
} from "@microsoft/applicationinsights-core-js";
import { IPromise } from "@nevware21/ts-async";

// NOTE: Most interfaces here should be moved to core eventually.
// TODO: move interfaces to core
//TODO: add doc

export interface IOfflineDetectorCfg {
    autoStop: boolean; //default trues
    pollingInterval: number; //default 5min
    pollingUrl: string;
}

export interface IOfflineDetector {
    startPolling(): boolean;
    stopPolling(): boolean;
    getOfflineListener(): IOfflineListener;
}


export declare type createDefaultOfflineDetector = (cfg?: IOfflineDetectorCfg) => IOfflineDetector;
    
export declare type createNoopOfflineDetector = (cfg?: IOfflineDetectorCfg) => IOfflineDetector;
    

export const enum eStorageType {
    Unknown = 0,
    LocalStorage = 1,
    SessionStorage = 2,
    IndexDb = 3
}
 
export const enum eBatchSendStatus {
    Complete = 1,
    Retry = 2,
    Drop = 3,
    Failure = 4
 }
 

export const enum eBatchStoreStatus {
    Success = 1,
    Failure = 2,
    Drop = 3
 }
 
export interface IOfflineBatchHandlerCfg {
    batchMaxSize?: number; // default 10000
    storageType?: eStorageType; // default local storage
    offineDetector?: IOfflineDetector; // default no-op detector
    autoClean?: Boolean;
    maxRetryCnt?: number; // Max count for retry default 5
 }
 
export interface IOfflineBatchResponse {
     state: eBatchSendStatus,
     data?: any;
 }
 
export interface IOfflineBatchStoreResponse {
     // Identifies if the batch was stored successfully or not
    state: eBatchStoreStatus;
    item?: any;
 }
 
export interface IOfflineBatchCleanResponse {
 batchCnt: number;
}

 
export declare type OfflineBatchSendCallback = (response: IOfflineBatchResponse) => void;

export declare type OfflineBatchStoreCallback = (response: IOfflineBatchStoreResponse) => void;

export declare type OfflineBatchCallback = (response: IOfflineBatchResponse) => void;


export interface IOfflineBatchHandler {
    storeBatch(batch: IPayloadData, cb?: OfflineBatchStoreCallback, sync?: boolean): undefined | IOfflineBatchStoreResponse | IPromise<IOfflineBatchStoreResponse>;
    sendNextBatch(cb?: OfflineBatchCallback, sync?: boolean, xhrOverride?: IXHROverride, cnt?: number): undefined | IOfflineBatchResponse | IPromise<IOfflineBatchResponse>;
    hasStoredBatch(callback?: (hasBatches: boolean) => void): undefined | boolean | IPromise<boolean>;
    cleanStorage(cb?:(res: IOfflineBatchCleanResponse) => void ): undefined | IOfflineBatchCleanResponse | IPromise<IOfflineBatchCleanResponse>;
    teardown(unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState): void
}

//export declare type createOfflineBatchHandler = (storageType: eStorageType, cfg?: IOfflineBatchHandlerCfg) => IOfflineBatchHandler;
